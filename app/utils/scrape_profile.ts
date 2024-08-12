import { globalBrowser } from "./browerSetup";
import delay from "./delay";
import { addMockImage } from "./imageBlocker";

export const scrapeProfile = async (username: string) => {
  let baseUrl = `https://www.instagram.com/${username}`;

  const browser = await globalBrowser.initBrower();
  let post_info = [];
  let post_count, follower_count, following_count, profile_pic;
  let page = await browser!.newPage();

  await addMockImage(page, username as string);
  await page.authenticate({
    username: process.env.PROXY_USERNAME as string,
    password: process.env.PROXY_PASSWORD as string,
  });
  await page.goto(baseUrl, {
    // waitUntil: ["load", "networkidle0"],
    timeout: 90000,
  });
  const commentSelector =
    "div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1n2onr6.x1plvlek.xryxfnj.x1iyjqo2.x2lwn1j.xeuugli.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > article > div > div";

  const follower_count_selector =
    "ul > li:nth-child(2) > div > button > span > span";
  await page.waitForSelector(commentSelector, { visible: true });
  await page.waitForSelector(follower_count_selector, { visible: true });
  // await delay(1000000);
  try {
    // post
    try {
      for (let i = 2; i <= 4; i++) {
        let s = await page.$(`${commentSelector} > div:nth-child(${i})`);

        let aTags = await s?.$$("a");

        for (let j = 0; j < aTags!.length; j++) {
          let atag = aTags![j];
          await atag.hover();
          let comment_count = await atag.$eval(
            // "a > div.x1ey2m1c.x78zum5.xds687c.xdt5ytf.xl56j7k.x10l6tqk.x17qophe.x13vifvy > ul > li:nth-child(2) > span.x1lliihq.x1plvlek.xryxfnj.x1n2onr6.x193iq5w.xeuugli.x1fj9vlw.x13faqbe.x1vvkbs.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.x1i0vuye.xl565be.x1xlr1w8.x9bdzbf.x10wh9bi.x1wdrske.x8viiok.x18hxmgj > span",
            `a > div > ul > li:nth-child(2) > span > span`,
            (el) => el.innerHTML
          );
          let like_count = await atag.$eval(
            // "a > div.x1ey2m1c.x78zum5.xds687c.xdt5ytf.xl56j7k.x10l6tqk.x17qophe.x13vifvy > ul > li:nth-child(1) > span.x1lliihq.x1plvlek.xryxfnj.x1n2onr6.x193iq5w.xeuugli.x1fj9vlw.x13faqbe.x1vvkbs.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.x1i0vuye.xl565be.x1xlr1w8.x9bdzbf.x10wh9bi.x1wdrske.x8viiok.x18hxmgj > span",
            `a > div > ul > li:nth-child(1) > span > span`,

            (el) => el.innerHTML
          );

          console.log("commentCouint :", comment_count, like_count);

          post_info.push({ comment_count, like_count });
          const randomDelay = (Math.floor(Math.random() * 10) + 1) * 100;
          await delay(randomDelay);
        }
      }
    } catch (error) {
      console.log("faild to cathc the post :", error);
    }

    post_count = await page.$eval(
      "ul > li:nth-child(1) > div > button > span > span",
      (el) => el.innerHTML
    );
    await delay(500);
    follower_count = await page.$eval(
      "ul > li:nth-child(2) > div > button > span > span",
      (el) => el.innerHTML
    );
    await delay(500);
    following_count = await page.$eval(
      "ul > li:nth-child(3) > div > button > span > span",
      (el) => el.innerHTML
    );

    profile_pic = await page.$eval("div > div > span > img", (el) => el.src);

    return {
      follower_count,
      post_count,
      following_count,
      post_info,
      profile_pic,
      success: true,
    };
  } catch (error) {
    console.log("error in scrapyting profile info : ", error);

    // let ss = await page.screenshot();
    // res.contentType("image/jpeg");

    return {
      follower_count,
      post_count,
      following_count,
      post_info,
      profile_pic,
      success: false,
    };
  } finally {
    console.log("close broswer");

    await page.close();
    await browser!.close();
  }
};
