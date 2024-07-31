import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import delay from "./utils/delay";
import { globalBrowser } from "./utils/browerSetup";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.get("/insta-login", async (req: Request, res: Response) => {
  const browser = await globalBrowser.initBrower();

  let page = await browser!.newPage();
  await page.goto("https://www.instagram.com/", {
    waitUntil: ["load", "networkidle0"],
  });

  await page.type('input[name="username"]', "hii there", { delay: 50 });
  await page.type('input[name="password"]', "paswword", { delay: 50 });
  await page.click("#loginForm > div > div:nth-child(3) > button");

  await page.close();
  await browser!.close();
  res.send("complete");
});

app.get("/get-profile-details", async (req: Request, res: Response) => {
  let { username } = req.query;
  let baseUrl = `https://www.instagram.com/${username}/?__a=1`;

  const browser = await globalBrowser.initBrower();
  let page = await browser!.newPage();
  await page.goto(baseUrl, {
    waitUntil: ["load", "networkidle0"],
  });

  try {

      throw "error"
    // post
    let post_info = [];
    for (let i = 2; i <= 4; i++) {
      let s = await page.$(
        ` div.x9f619.xjbqb8w.x78zum5.x168nmei.x13lgxp2.x5pf9jr.xo71vjh.x1n2onr6.x1plvlek.xryxfnj.x1iyjqo2.x2lwn1j.xeuugli.xdt5ytf.xqjyukv.x1qjc9v5.x1oa3qoh.x1nhvcw1 > article > div > div > div:nth-child(${i})`
      );
  
      let aTags = await s?.$$("a");
  
      for (let j = 0; j < aTags!.length; j++) {
        let atag = aTags![j];
        await atag.hover();
        let comment_count = await atag.$eval(
          "a > div.x1ey2m1c.x78zum5.xds687c.xdt5ytf.xl56j7k.x10l6tqk.x17qophe.x13vifvy > ul > li:nth-child(2) > span.x1lliihq.x1plvlek.xryxfnj.x1n2onr6.x193iq5w.xeuugli.x1fj9vlw.x13faqbe.x1vvkbs.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.x1i0vuye.xl565be.x1xlr1w8.x9bdzbf.x10wh9bi.x1wdrske.x8viiok.x18hxmgj > span",
          (el) => el.innerHTML
        );
        let like_count = await atag.$eval(
          "a > div.x1ey2m1c.x78zum5.xds687c.xdt5ytf.xl56j7k.x10l6tqk.x17qophe.x13vifvy > ul > li:nth-child(1) > span.x1lliihq.x1plvlek.xryxfnj.x1n2onr6.x193iq5w.xeuugli.x1fj9vlw.x13faqbe.x1vvkbs.x1s928wv.xhkezso.x1gmr53x.x1cpjm7i.x1fgarty.x1943h6x.x1i0vuye.xl565be.x1xlr1w8.x9bdzbf.x10wh9bi.x1wdrske.x8viiok.x18hxmgj > span",
          (el) => el.innerHTML
        );
        post_info.push([{ comment_count, like_count }]);
        await delay(500);
      }
    }
  
    let post_count = await page.$eval(
      "div:nth-child(3) > ul > li:nth-child(1) > div > button > span > span",
      (el) => el.innerHTML
    );
    let follower_count = await page.$eval(
      " div:nth-child(3) > ul > li:nth-child(2) > div > button > span > span",
      (el) => el.innerHTML
    );
    let following_count = await page.$eval(
      "div:nth-child(3) > ul > li:nth-child(3) > div > button > span > span",
      (el) => el.innerHTML
    );
  
  
    res.send({ follower_count, post_count, following_count, post_info });
  } catch(error) {
    console.log("error in scrapyting profile info : ",error);
 let ss = await page.screenshot() ;
 res.contentType('image/jpeg');

 res.send(ss)
    
  }finally {

    await page.close();
    await browser!.close();
  }

});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
