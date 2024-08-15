import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import delay from "./utils/delay";
import { globalBrowser, puppeteerManager } from "./utils/browerSetup";
import { addMockImage } from "./utils/imageBlocker";
import fs from "fs";
import path from "path";
import cors from "cors";
import userAgents from "user-agents";
// @ts-ignore
import import_ from "@brillout/import";

import { json } from "stream/consumers";
import { Page } from "puppeteer";
// @ts-ignore
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(cors());

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});
app.get("/insta-login", async (req: Request, res: Response) => {
  const browser = await globalBrowser.initBrower();

  let page = await browser!.newPage();
  await page.goto("https://www.instagram.com/", {
    waitUntil: ["load", "networkidle0"],
  });
  // Load cookies from the file
  if (fs.existsSync(path.join(__dirname, "cookies.json"))) {
    const cookies = JSON.parse(
      fs.readFileSync(path.join(__dirname, "cookies.json"), "utf-8")
    );
    await page.setCookie(...cookies);

    // Refresh the page or navigate to ensure cookies are applied
    await page.goto("https://www.instagram.com/", {
      waitUntil: "networkidle2",
    });

    // Verify successful login
    try {
      await page.waitForSelector('a[href="/accounts/edit/"]', {
        timeout: 10000,
      });
      console.log("Logged in with saved cookies!");
    } catch (error) {
      console.log("Failed to login with cookies. Possible need to re-login.");
    }
  } else {
    console.log("No cookies file found. Please login first to save cookies.");
  }

  // login using password
  await page.type('input[name="username"]', process.env.INSTAGRAM_USER!, {
    delay: 100,
  });
  await page.type('input[name="password"]', process.env.INSTAGRAM_PASSWORD!, {
    delay: 100,
  });
  await delay(1000);
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: "networkidle2" });
  try {
    console.log("Login successful!");
    await delay(10000);
    console.log("saving the cookies");

    // await page.waitForSelector('a[href="/accouconsole.log("password :", );nts/edit/"]', { timeout: 10000 });

    // Save cookies to a file or database
    const cookies = await page.cookies();
    console.log("cookie :", cookies);

    fs.writeFileSync(
      path.join(__dirname, "cookies2.json"),
      JSON.stringify(cookies)
    );
    console.log("Cookies saved!");
  } catch (error) {
    console.log("Login failed or additional steps required.", error);
  }

  await page.click("#loginForm > div > div:nth-child(3) > button");

  await page.close();
  await browser!.close();
  res.send("complete");
});

app.get("/testing-njl", async (req: Request, res: Response) => {
  try {
    // connect;
    let { connect } = await import_("puppeteer-real-browser");
    const { page, browser } = await connect({
      headless: "auto",

      args: [],
      customConfig: {},
      skipTarget: [],
      fingerprint: false,
      turnstile: true,
      connectOption: {
        executablePath: "/usr/bin/google-chrome",
      },
    });
    let resposneBody = {};
    // Visit the URL
    try {
      page.on("response", async (response: any) => {
        const url = response.url();
        const status = response.status();
        const headers = response.headers();
        const type = response.request().resourceType();
        // console.log(url, type);
        // Only log API responses (JSON responses typically)
        if (
          (response.request().resourceType() === "xhr" ||
            response.request().resourceType() === "fetch") &&
          url ===
            "https://api.notjustanalytics.com/profile/ig/analyze/flutteruidev"
        ) {
          console.log(`URL: ${url}`);
          console.log(`Status: ${status}`);
          console.log("Type:", type);

          try {
            resposneBody = await response.json(); // Attempt to parse the response as JSON

            await delay(1000);
            await page.close();
          } catch (err) {
            console.log("Response Body is not JSON.");
          }
        }
      });
      try {
        await page.goto(
          "https://app.notjustanalytics.com/analysis/flutteruidev",
          {
            waitUntil: ["domcontentloaded", "networkidle2"], // Wait until the network is idle
            timeout: 60000, // Set a timeout
          }
        );
      } catch (error) {
        console.log("error in page navigation");
      }
      console.log("Page loaded successfully");
    } catch (error) {
      console.error("Failed to load the page:", error);
    } finally {
      let pages = (await browser.pages()) as Page[];
      console.log("pages :", pages);
      let pagesPromise = pages.map((p) => p.close());
      await Promise.all(pagesPromise);
      await browser.close();
      res.send({ resposneBody, success: true });
    }
  } catch (error) {
    console.log("error :", error);
    res.send({ resposneBody: {}, success: false });
  }
});

app.get("/get-profile-details", async (req: Request, res: Response) => {
  let { username } = req.query;
  let baseUrl = `https://www.instagram.com/${username}`;

  // const browser = await globalBrowser.initBrower();
  let post_info = [];
  let post_count, follower_count, following_count, profile_pic;
  // let page = await browser!.newPage();
  let page = await puppeteerManager.createPage();
  console.log("page count :", puppeteerManager.pageCount);

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
      for (let i = 1; i <= 4; i++) {
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

    res.send({
      follower_count,
      post_count,
      following_count,
      post_info,
      profile_pic,
      success: true,
    });
  } catch (error) {
    console.log("error in scrapyting profile info : ", error);

    // let ss = await page.screenshot();
    // res.contentType("image/jpeg");

    res.send({
      follower_count,
      post_count,
      following_count,
      post_info,
      profile_pic,
      success: false,
    });
  } finally {
    console.log("close broswer");
    puppeteerManager.closePage(page);
    // await page.close();
    // await browser!.close();
  }
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
