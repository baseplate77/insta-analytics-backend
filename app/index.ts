import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import delay from "./utils/delay";
import { getReaLBrowser, puppeteerManager } from "./utils/browerSetup";
import { addMockImage } from "./utils/imageBlocker";
import cors from "cors";
import fs from "fs";
// @ts-ignore
import import_ from "@brillout/import";
import xlsx from "xlsx";
import tpuch from "touch";

import axios from "axios";
import { getProfileData } from "./utils/get_profile_data";
import path from "path";
import touch from "touch";
import { amdin } from "./utils/firebase";
// @ts-ignore
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.get("/proxy-image/:url", async (req, res) => {
  try {
    const encodedUrl = req.params.url;
    const imageUrl = decodeURIComponent(encodedUrl);

    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    res.set("Content-Type", "image/jpeg");
    res.send(response.data);
  } catch (error) {
    res.status(500).send("Error fetching image");
  }
});

const requestQueue: (() => Promise<void>)[] = [];
let isProcessing = false;

const processQueue = async () => {
  if (isProcessing || requestQueue.length === 0) return;
  isProcessing = true;
  const nextRequest = requestQueue.shift();
  if (nextRequest) await nextRequest();
  isProcessing = false;
  processQueue();
};

app.post(
  "/generate-follower-count-report",
  async (req: Request, res: Response) => {
    const { docUrl } = req.body;

    try {
      // Fetch the XLSX file from the URL
      const response = await axios.get(docUrl, { responseType: "arraybuffer" });
      const data = new Uint8Array(response.data);
      const workbook = xlsx.read(data, { type: "array" });

      // Assuming the first sheet is the one you want to read
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert sheet to JSON
      const rows: any[] = xlsx.utils.sheet_to_json(sheet, { header: 1 });

      let userIdRowIndex = rows[0].findIndex(
        (d: string) => d.toLowerCase() === "user id"
      );
      // Print columns and rows

      console.log("userIdRowIndex", userIdRowIndex);

      let headerRow = rows.shift();

      let userID = rows.map((d: string[]) => d[userIdRowIndex]);
      userID = userID.slice(0, 20);
      // rows.forEach((row, rowIndex) => {
      //   console.log(`Row ${rowIndex}:`, row);
      // });

      // let promises = userID.map(async (userId) => {
      //   await getProfileData(userId);
      // });

      let followerData: any[] = [];
      let batchSize = 10;
      for (let i = 0; i < userID.length; i += batchSize) {
        console.log("iii :", i);
        let tempUserId = [...userID];

        let userIds = tempUserId.splice(i, i + batchSize);
        let promises = userIds.map(async (userId) => {
          console.log("userIds length :", userID.length, tempUserId.length);
          return await getProfileData(userId, (data: any) => {
            followerData.push(data.followers);
          });
        });

        await Promise.all(promises);
        // const batch = promises.slice(i, i + batchSize); // Get a batch of promises
        // const batchResults = await Promise.all(batch.map((fn: any) => fn())); // Wait for the batch to resolve
        // results.push(...batchResults); // Store the results
      }

      // const workbook = xlsx.utils.book_new();

      const workbook2 = xlsx.utils.book_new();

      const xlsxData = [[...headerRow, "Follower Count", "End Goal"]];

      for (let i = 0; i < rows.length; i++) {
        let row = rows[i];
        xlsxData.push([...row, followerData[i], 3]);
      }

      const worksheet = xlsx.utils.aoa_to_sheet(xlsxData);
      xlsx.utils.book_append_sheet(workbook2, worksheet, "Report");
      const fileName = `Report-${new Date()
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-")}.xlsx`;
      const filePath = path.join(__dirname, fileName);

      // if (!fs.existsSync(filePath)) {
      // await touch(filePath, { force: true }, (err) => {
      //   console.log("error in creating file :", err);
      // });
      // }
      console.log("dir :", filePath);

      // fs.closeSync(fs.openSync(filePath, "w"));

      xlsx.writeFile(workbook2, filePath);
      const bucket = amdin.storage().bucket();
      await bucket.upload(filePath, {
        destination: `reports/${fileName}`,
        metadata: {
          contentType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });

      // await processInBatches(promises, 2);
      // while (promises.length > 0) {
      //   // Take the first two promises from the list
      //   const pair = promises.splice(0, 2);

      //   // Process the pair in parallel
      //   const pairResults = await Promise.all(pair.map((p: any) => p()));
      // }

      res.send({ success: true, followerData, userID });
    } catch (error) {
      console.error("Error reading XLSX file:", error);
      res.status(500).send("Error reading XLSX file");
    }
  }
);

app.get("/profile-report", async (req: Request, res: Response) => {
  requestQueue.push(async () => {
    const { username } = req.query;
    console.log("username :", username);

    // res.send(sampleResponse);
    // return;

    try {
      const { page } = await getReaLBrowser();
      // let { connect } = await import_("puppeteer-real-browser");
      // const { page, browser } = await connect({
      //   headless: "auto",
      //   args: [],
      //   customConfig: {},
      //   skipTarget: [],
      //   fingerprint: false,
      //   turnstile: true,
      //   connectOption: {
      //     executablePath: "/usr/bin/google-chrome",
      //   },
      // });
      let profileData: any = undefined;
      let followingData: any = undefined;
      // Visit the URL
      try {
        page.on("response", async (response: any) => {
          const url = response.url() as string;
          const status = response.status();
          const headers = response.headers();
          const type = response.request().resourceType();
          // console.log(url, type);
          // Only log API responses (JSON responses typically)
          const followingDataAPI =
            "https://api.notjustanalytics.com/profile/ig/history/";
          const profileDetailAPI = `https://api.notjustanalytics.com/profile/ig/analyze/${username}`;
          if (
            response.request().resourceType() === "xhr" ||
            response.request().resourceType() === "fetch"
          ) {
            console.log(`URL: ${url}`);
            console.log(`Status: ${status}`);
            console.log("Type:", type);

            try {
              if (url.includes(profileDetailAPI)) {
                if (status === 404) {
                  throw "profile not found ";
                }
                let data = await response.json(); // Attempt to parse the response as JSON
                profileData = data;
              } else if (url.includes(followingDataAPI)) {
                if (status === 404) {
                  throw "profile not found ";
                }
                let data = await response.json(); // Attempt to parse the response as JSON
                followingData = data;
              }

              if (profileData !== undefined && followingData !== undefined) {
                await delay(1000);
                await page.close();
              }
            } catch (err) {
              console.log("Response Body is not JSON.");
              await delay(1000);
              console.log("isclosed :", page.isClosed());

              if (!page.isClosed()) {
                await page.close();
              }
            }
          }
        });
        try {
          await page.goto(
            `https://app.notjustanalytics.com/analysis/${username}`,
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
        if (followingData === undefined && profileData === undefined) {
          throw "profile not found";
        }
        res.send({ followingData, profileData, success: true });
      }
    } catch (error) {
      console.log("error :", error);
      res.send({ followingData: {}, profileData: {}, success: false });
    }
  });

  processQueue();
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

const server = app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});

// Set server timeout to 5 minutes (300000 milliseconds)
server.timeout = 300000;
