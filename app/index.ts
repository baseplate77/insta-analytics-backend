import express, { Express, raw, Request, Response } from "express";
import dotenv from "dotenv";
import delay from "./utils/delay";
import {
  getReaLBrowser,
  globalBrowser,
  puppeteerManager,
} from "./utils/browerSetup";
import { addMockImage } from "./utils/imageBlocker";
import cors from "cors";
import fs from "fs";
// @ts-ignore
import xlsx from "xlsx";

import axios from "axios";
import path from "path";
import { amdin } from "./utils/firebase";
import { sendMail } from "./utils/resend";
import { SENDER_EMAIL } from "./constants";

// @ts-ignore
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

if (process.env.NODE_ENV === "development") {
  app.use(cors());
}
app.use(express.json());

app.get("/webhook-ig", async (req: Request, res: Response) => {
  let mode = req.query["hub.mode"];
  let challenge = req.query["hub.challenge"];
  let verifyToken = req.query["hub.verify_token"];

  console.log(
    "instagram verification api  mode :",
    mode,
    "challenge :",
    challenge
  );
  if (mode === "subscribe") {
    console.log("Webhook verified");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

app.post("/webhook-ig", async (req: Request, res: Response) => {
  let body = req.body;
  console.log("Webhook event received:", req.body);
  console.log("changes :", body["entry"][0]["changes"][0]);

  res.sendStatus(200);
});

app.get("/test-api", async (req: Request, res: Response) => {
  const headers = {
    accept: "application/json, text/plain, */*",
    "accept-encoding": "gzip, deflate, br, zstd",
    "accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
    authorization: "Bearer",
    "content-type": "application/json",
    cookie:
      "_pubCommonId=2328c0ff-c43b-4430-ba9c-331f269903b3; _pubCommonId_last=Mon%2C%2012%20Aug%202024%2017%3A25%3A46%20GMT; _ga=GA1.1.1328866123.1723568330; _fbp=fb.1.1723799379166.99011540766315669; euconsent-v2=CQEKnMAQEKnMAFgAGAENBDFsAP_gAAAAABCYKYtV_G__bXlr8X736ftkeY1f9_h77sQxBhfJk-4FzLvW_JwX32EzNA36tqYKmRIAu3bBIQNlGJDUTVCgaogVrzDMak2coTtKJ6BkiFMRe2dYCF5vmwtj-QKY5vr_91d52R-t7dr83dzyz4Vnv3a9_-a1WJCdA5-tDfv_bROb-9IO9_x8v4v8_N_rE2_eT1l_tevp7D9-ctv7_XX-9_fff79Pn_-uB_--CmMAAAoJABgACCmIaADAAEFMREAGAAIKYioAMAAQUxGQAYAAgpiOgAwABBTEhABgACCmJKADAAEFMSkAGAAIKYloAMAAQUxA.f_wAAAAAAAAA; pubtech-cmp-pcstring=0-XXX; customerly_jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2N1c3RvbWVybHkuaW8iLCJqdGkiOiI2NzM2NTdkYS03NTA2LTExZWYtYTRiOC0wMjQyMGEwMDA0ODMiLCJpYXQiOjE3MjY1ODU1ODMuMzY0MzgyLCJuYmYiOjE3MjY1ODU1ODMuMzY0Mzg4LCJleHAiOjI3MDQ4MDYzODMuMzY0MzkxLCJ0eXBlIjoxLCJhcHAiOiJlZmRjYjBkMCIsImlkIjpudWxsfQ.KuXJzcHo9Coi7d26Ck9on1BIE1QXedpy6UlLVUhT-0M; _ga_0J1FMG9L1D=GS1.1.1726593606.42.0.1726593606.60.0.0; ph_phc_THFAwcb3R4ZOve3H57FOVcLSadC7Rotm5U9xodePfG9_posthog=%7B%22distinct_id%22%3A%220191479e-9ba9-7dc6-b046-2f91e7434af1%22%2C%22%24sesid%22%3A%5B1726593606789%2C%22019200ff-a481-7d5d-b605-ba4662855feb%22%2C1726593606785%5D%7D",
    origin: "https://app.notjustanalytics.com",
    priority: "u=1, i",
    referer: "https://app.notjustanalytics.com/",
    "sec-ch-ua": '"Not;A=Brand";v="24", "Chromium";v="128"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "macOS",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "x-api-key": "gToDzXoUj64ro1FlXfAdy16yBvPTIGm84yXfl8f9",
  };

  const payload = {
    context: {
      client: {
        clientName: "WEB",
        clientVersion: "2.20210909.07.00",
      },
    },
    target: {
      videoId: "VIDEO_ID", // The video ID you want to interact with
    },
  };
  const url =
    "https://api.notjustanalytics.com/profile/ig/analyze/flutteruidev";

  try {
    const response = await axios({
      method: "POST",
      url: url,
      headers: {
        Accept: "application/json, text/plain, */*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
        Authorization: "Bearer YOUR_VALID_ACCESS_TOKEN", // Replace with the actual token
        Cookie:
          "_pubCommonId=2328c0ff-c43b-4430-ba9c-331f269903b3; _pubCommonId_last=Mon%2C%2012%20Aug%202024%2017%3A25%3A46%20GMT; _ga=GA1.1.1328866123.1723568330; _fbp=fb.1.1723799379166.99011540766315669; euconsent-v2=CQEKnMAQEKnMAFgAGAENBDFsAP_gAAAAABCYKYtV_G__bXlr8X736ftkeY1f9_h77sQxBhfJk-4FzLvW_JwX32EzNA36tqYKmRIAu3bBIQNlGJDUTVCgaogVrzDMak2coTtKJ6BkiFMRe2dYCF5vmwtj-QKY5vr_91d52R-t7dr83dzyz4Vnv3a9_-a1WJCdA5-tDfv_bROb-9IO9_x8v4v8_N_rE2_eT1l_tevp7D9-ctv7_XX-9_fff79Pn_-uB_--CmMAAAoJABgACCmIaADAAEFMREAGAAIKYioAMAAQUxGQAYAAgpiOgAwABBTEhABgACCmJKADAAEFMSkAGAAIKYloAMAAQUxA.f_wAAAAAAAAA; pubtech-cmp-pcstring=0-XXX; customerly_jwt=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2N1c3RvbWVybHkuaW8iLCJqdGkiOiI2NzM2NTdkYS03NTA2LTExZWYtYTRiOC0wMjQyMGEwMDA0ODMiLCJpYXQiOjE3MjY1ODU1ODMuMzY0MzgyLCJuYmYiOjE3MjY1ODU1ODMuMzY0Mzg4LCJleHAiOjI3MDQ4MDYzODMuMzY0MzkxLCJ0eXBlIjoxLCJhcHAiOiJlZmRjYjBkMCIsImlkIjpudWxsfQ.KuXJzcHo9Coi7d26Ck9on1BIE1QXedpy6UlLVUhT-0M; _ga_0J1FMG9L1D=GS1.1.1726593606.42.0.1726593606.60.0.0; ph_phc_THFAwcb3R4ZOve3H57FOVcLSadC7Rotm5U9xodePfG9_posthog=%7B%22distinct_id%22%3A%220191479e-9ba9-7dc6-b046-2f91e7434af1%22%2C%22%24sesid%22%3A%5B1726593606789%2C%22019200ff-a481-7d5d-b605-ba4662855feb%22%2C1726593606785%5D%7D",
        Dnt: "1",
        Origin: "https://app.notjustanalytics.com",
        Referer: "https://app.notjustanalytics.com/",
        "Sec-Ch-Ua": '"Not;A=Brand";v="24", "Chromium";v="128"',
        "Sec-Ch-Ua-Mobile": "?0",
        "Sec-Ch-Ua-Platform": '"macOS"',
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "same-site",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        "X-Api-Key": "gToDzXoUj64ro1FlXfAdy16yBvPTIGm84yXfl8f9",
      },
      data: {
        cf_turnstile_response:
          "0.ZIyCFkPWWEMKoGE4J_y1uulBgTRubcb-kLLK1ASTcuk3UxzEqhgIrafjHK897dKRtfQur-SJxcj_gICMh_rWEdlxyLbHHtxdMOZDskoupfbubz7imXr8cNWEa17kaSG9_WoWBrJKo0Dit3gMjfHwKfknS6e3JD7DYLFl7nutTSg4wMiLh6Iwn5pa6z9F50DjcdpdziqB5JlTcoO_PCGEy65SblZRsxQ345fw5P8yafiO_mL-nLg4ze3PahCMc8v29K_wv79N39Txj44Lk1GrvkXqiAI2RwjYTVocuQRkcySJ7OeYQC95Ol60JFoXnJ8OdOWIc8QIseUDbArxkfSpenrabgdToxIL0AFFboZHdu85k4M32VoVInL_wpf7xLoATvOOI2BarozXbNDpiWCuvH3TiRFU0QTlcclaK1EbPzJ_mQv4viAfSbZ96GyuryTo6h1A5MolHHmwjHzT2qGKfqwYlIU8unKhEC0NeUTeEhPuoPX5-OR7eVacCdIhTsH9FmXTctgMdM4k6P8cXv6tVk3fZlI8aFi1Pmieg0UOUFR_IEozpyuSLS_PPXIJbrJDbXHV3Gs_4Y3i8nYzdJ7PKxk6WebgA7TBSL1K2U5rxmUmnzDUD3diXHTTVz75B7vpNo4_XlCn5EF5wVxYc3tKnVxZf0GinvL6MpXa7bLFLgs8Z7kK51TfCmXd5ogQy31D1xclitlNM_F1jIq2JN7QjwGyNh-LBqE_BymAd0CvW6rgocTsKePlX_Lcmz026dOp.IXcFRDb-ennuUv3Ash60gQ.415c4cca0e59cf1dac72c5d3bf16aa188ec4108e3d06f7487139c6afab34d232",
        html: "",
        timezone: "Asia/Calcutta",
      },
    });

    // Output the response data
    console.log("Response Data:", response.data);
  } catch (error) {
    console.error("Error making POST request:", error);
  }
});

app.get("/timeout-error", async (req: Request, res: Response) => {
  let { time } = req.query;
  await delay(parseInt(time as string) ?? 1000);
  res.send("sucess");
});

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
    console.log("error in proxy image :", error);

    res.status(500).send(`Error fetching image , ${error}`);
  }
});

app.get("/api-proxy", async (req, res) => {
  const { serId } = req.query;

  try {
    const serverUrl = decodeURIComponent(serId as string);

    // Add domain and prefix if not present
    const baseUrl = `http://localhost:${port}`;
    const fullUrl = serverUrl.startsWith("http")
      ? serverUrl
      : `${baseUrl}${serverUrl.startsWith("/") ? "" : "/"}${serverUrl}`;

    console.log("serverurl: ", serverUrl);
    const response = await axios.get(fullUrl);
    res.send(response.data);
  } catch (error) {
    console.log("errir :", error);
    res.status(500).send(error);
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

// processing one follower report at a time
function getFileNameFromUrl(url: string) {
  // Decode the URL to handle any encoded characters
  const decodedUrl = decodeURIComponent(url);

  // Use the path module to extract the file name
  const fileName = path.basename(decodedUrl.split("?")[0]);

  return fileName;
}
app.post(
  "/generate-follower-count-report",
  async (req: Request, res: Response) => {
    const { docUrl } = req.body;
    const startTime = Date.now();
    const fileName = getFileNameFromUrl(docUrl);
    console.log("fileName", fileName);

    try {
      const cacheFilePath = path.join(__dirname, `${fileName}_cache.json`);
      let cachedData: { [key: string]: number } = {};

      // Load cache if exists
      if (fs.existsSync(cacheFilePath)) {
        cachedData = JSON.parse(fs.readFileSync(cacheFilePath, "utf-8"));
        console.log("Loaded cache data");
      }
      const response = await axios.get(docUrl, {
        responseType: "arraybuffer",
      });

      const data = new Uint8Array(response.data);
      const workbook = xlsx.read(data, { type: "array" });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = xlsx.utils.sheet_to_json(sheet, { header: 1 });
      console.log("rows", rows);

      const userIdRowIndex = rows[0].findIndex((d: string) =>
        d.toLowerCase().trim().includes("user")
      );

      const endGoalIndex = rows[0].findIndex((d: string) =>
        d.toLowerCase().trim().includes("end")
      );
      console.log("userIdRowIndex", userIdRowIndex, endGoalIndex);

      const headerRow = rows.shift();
      let userID = rows.map((d: string[]) => d[userIdRowIndex]);

      const BATCH_SIZE = 5000000;
      const totalBatches = Math.ceil(userID.length / BATCH_SIZE);
      userID = userID.filter((id) => id != null && id != undefined);
      // userID = userID.slice(40, 50);

      let batchSize = 2;
      console.log("user :", userID);
      // process started
      res.send({ success: true });
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const startIndex = batchIndex * BATCH_SIZE;
        const endIndex = Math.min((batchIndex + 1) * BATCH_SIZE, userID.length);
        const batchUserIDs = userID.slice(startIndex, endIndex);
        const batchRows = rows.slice(startIndex, endIndex);
        let followerData: any[] = new Array(userID.length).fill(0);

        requestQueue.push(async () => {
          // Process batch of users
          for (let i = 0; i < batchUserIDs.length; i += batchSize) {
            try {
              let tempUserId = [...batchUserIDs];
              let userIds = tempUserId.splice(i, batchSize);
              console.log("userList :", userIds);

              let promises = userIds.map(async (username, index) => {
                let currentIndex = startIndex + i + index; // Adjust index for the current batch
                console.log("current Index :", currentIndex);
                // Check cache first
                if (cachedData[username]) {
                  console.log(`Using cached data for ${username}`);
                  followerData[currentIndex] = cachedData[username];
                  return;
                }
                // Rest of the existing code for processing individual users
                const profileDetailAPI = `https://api.notjustanalytics.com/profile/ig/analyze/${username.replace(
                  /\s+/g,
                  ""
                )}`;
                const instgramUrl = `https://www.instagram.com/${username.replace(
                  /\s+/g,
                  ""
                )}`;
                let profileData: any = undefined;

                // let browser = await globalBrowser.initBrower();
                // try {
                //   let profileUrl = `https://www.instagram.com/${username}/`;
                //   console.log("profile :", profileUrl);

                //   profileData = await getUserDetails(profileUrl, browser);

                //   followerData[currentIndex] = profileData["follower_count"];
                //   console.log("follower data :", followerData);
                // } catch (error) {
                //   console.log("error getting profile data :", error);
                // } finally {
                //   await browser.close();
                //   await delay(2000);
                // }

                const { page, browser } = await getReaLBrowser();
                // const browser = await globalBrowser.initBrower();
                // const page = await browser!.newPage();

                page.on("response", async (response: any) => {
                  const url = response.url() as string;
                  const status = response.status();

                  try {
                    if (
                      ["xhr", "fetch"].includes(
                        response.request().resourceType()
                      )
                    ) {
                      if (url.includes(profileDetailAPI)) {
                        if (status === 404) throw "profile not found";
                        console.log(`URL: ${url}`);
                        console.log(`Status: ${status}`);

                        const data = await response.json();
                        profileData = data;
                        followerData[currentIndex] = profileData.followers;
                        console.log("follower :", profileData.followers);
                        // Update cache
                        cachedData[username] = profileData.followers;
                        fs.writeFileSync(
                          cacheFilePath,
                          JSON.stringify(cachedData, null, 2)
                        );
                        throw "found account";
                        // await page.close();
                        // await browser.close();

                        // // remove for production
                        // if (profileData !== undefined) {
                        //   await delay(1000);
                        //   await page.close();
                        // }
                      }
                    }
                  } catch (error) {
                    if (error !== "found account") {
                      console.log("profile data not found, setting it to 0");
                      profileData = { followers: -1 };
                      followerData[currentIndex] = -1;
                    }
                    await delay(
                      Math.floor(Math.random() * (3000 - 500 + 1)) + 500
                    );
                    if (!page.isClosed()) {
                      await page.close();
                    }

                    await browser.close();
                  }
                });

                try {
                  await page.goto(
                    // instgramUrl,
                    `https://app.notjustanalytics.com/analysis/${username.replace(
                      /\s+/g,
                      ""
                    )}`,
                    {
                      waitUntil: ["networkidle2"],
                      timeout: 60_000,
                    }
                  );

                  console.log("Page loaded successfully");
                } catch (error) {
                  console.log("error in page navigation");
                } finally {
                  try {
                    await new Promise<void>((resolve, reject) => {
                      const checkProfileData = setInterval(() => {
                        console.log("waiting for profile data :", username);

                        if (profileData !== undefined) {
                          clearInterval(checkProfileData);
                          resolve();
                        }
                      }, 1000); //

                      // Break out of the loop after 1 minute
                      setTimeout(() => {
                        clearInterval(checkProfileData);
                        reject(
                          new Error(
                            "Timeout: Profile data not received within 1 minute"
                          )
                        );
                      }, 10000);
                    });
                  } catch (error) {
                    console.log("error :", error);
                  } finally {
                    console.log("isClose :", page.isClosed());
                    if (!page.isClosed()) {
                      await page.close();
                      await browser!.close();
                      await delay(5000);
                    }
                  }
                }

                if (profileData === undefined) throw "profile not found";
              });

              await Promise.all([...promises]);
            } catch (error) {
              console.log("error in browser :", error);
            }
          }
          // console.log(`Completed batch ${batchIndex + 1}/${totalBatches}`);
          const workbook2 = xlsx.utils.book_new();
          const xlsxData = [[...headerRow, "Followers", "Difference"]];

          // Only process rows for the current batch
          for (let i = 0; i < batchRows.length; i++) {
            let row = batchRows[i];
            let endGoal = row[endGoalIndex] ?? 0;
            xlsxData.push([
              ...row,
              followerData[startIndex + i],
              endGoal - followerData[startIndex + i],
            ]);
          }

          const worksheet = xlsx.utils.aoa_to_sheet(xlsxData);
          xlsx.utils.book_append_sheet(
            workbook2,
            worksheet,
            `Report_Batch_${batchIndex + 1}`
          );
          const batchFileName = `batch_${batchIndex + 1}_${fileName}`;
          const filePath = path.join(__dirname, batchFileName);

          // ... rest of the existing code for saving and uploading the file ...
          xlsx.writeFile(workbook2, filePath);
          const bucket = amdin.storage().bucket();
          await bucket.upload(filePath, {
            destination: `reports/${
              batchFileName.endsWith(".xlsx")
                ? batchFileName
                : batchFileName + ".xlsx"
            }`,
            metadata: {
              contentType:
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            },
          });

          const file = bucket.file(`reports/${batchFileName}`);
          const [url] = await file.getSignedUrl({
            action: "read",
            expires: "03-01-2500",
          });
          const executionTimeMs = Date.now() - startTime;
          const executionTimeMinutes =
            Math.round((executionTimeMs / 60000) * 100) / 100;
          await sendMail(
            SENDER_EMAIL,
            `Report Batch ${batchIndex + 1}`,
            `
            <div>
              <p>Report link for batch ${batchIndex + 1}/${totalBatches}</p>
              <p>Execution Time: ${executionTimeMinutes} minutes</p>
              <a href="${url}">${batchFileName}</a>
            </div>
            `
          );

          fs.unlinkSync(filePath);
          fs.unlinkSync(cacheFilePath);
        });
      }
      // res.send({ followerData, success: true });
    } catch (error) {
      console.error("Error reading XLSX file:", error);
      // res.status(500).send("Error reading XLSX file");
    }

    processQueue();
  }
);

app.get("/test-reconnect", async (req: Request, res: Response) => {
  console.log("started");
  const startTime = Date.now();

  const options1 = {
    method: "POST",
    url: "https://production-sfo.browserless.io/chrome/bql",
    params: {
      token: process.env.BROWSERLESS_TOKEN!,
    },
    headers: {
      "Content-Type": "application/json",
    },
    data: {
      query:
        'mutation captureNotJustAnalyticsData {\n  reject(type: [image, media, font, stylesheet]) {\n    enabled\n    time\n  }\n  openPage: goto(\n    url: "https://app.notjustanalytics.com/analysis/flutteruidev"\n    waitUntil: domContentLoaded\n    timeout: 65000\n  ) {\n    status\n  }\n  # waitForRequest(url: "*analyze*", method: POST) {\n  #   time\n  #   url\n  # }\n  request(url: "*profile/ig/analyze*", method: POST, type: xhr, operator: and, wait: true) {\n    url\n    type\n    method\n  }\n  # waitForResponse(url: "*analyze*") {\n  #   time\n  #   url\n  #   status\n  # }\n\t\twaitForTimeout(time:2000) {\n\t\ttime\n\t\t}\n   analyzeResponse: response(\n    url: "*profile/ig/analyze*"\n    # status:[201] \n    method: POST\n    operator: and\n    wait: true\n  ) {\n    url\n    status\n    body\n  }\n  analyzeFollower: response(\n    url: "*ig/history*"\n    method: GET\n    type: xhr\n    operator: and\n    wait: true\n  ) {\n    url\n    status\n    body\n  }\n \n}',
      operationName: "captureNotJustAnalyticsData",
    },
  };

  const { data: data1 } = await axios.request(options1);
  console.log(data1);
  let browserWSEndpoint = data1.data.reconnect.browserWSEndpoint;
  let browserQLEndpoint = data1.data.reconnect.browserQLEndpoint;
  let devtoolsFrontendUrl = data1.data.reconnect.devtoolsFrontendUrl;
  console.log(browserWSEndpoint, browserQLEndpoint);
  console.log(devtoolsFrontendUrl);
  const endTime = Date.now();
  const executionTimeMs = endTime - startTime;
  const executionTimeSeconds = Math.round((executionTimeMs / 1000) * 100) / 100;
  let profileData, followerData;

  try {
    const rawBody = data1.data.analyzeResponse[0].body;
    // Handle escaped JSON string by first replacing escaped quotes
    console.log("rawbody ", typeof rawBody);

    profileData = JSON.parse(rawBody);
  } catch (err) {
    console.error("Error parsing profile data:", err);
    profileData = {};
  }

  try {
    followerData = JSON.parse(data1.data.analyzeFollower[0].body);
  } catch (err) {
    console.error("Error parsing follower data:", err);
    followerData = {};
  }

  res.send({
    data: { profileData, followerData },
    startTime,
    endTime,
    executionTimeSeconds,
  });
  // const browser = await puppeteer.connect({
  //   browserWSEndpoint,
  // });

  // const pages = await browser.pages();
  // const page = pages[0];
  // if (!page) {
  //   console.log("page not found");
  // }
  // let profileData: any;
  // page.on("response", async (response: any) => {
  //   const url = response.url() as string;
  //   const status = response.status();
  //   const headers = response.headers();
  //   const type = response.request().resourceType();
  //   // console.log(url, type);
  //   // Only log API responses (JSON responses typically)
  //   const followingDataAPI =
  //     "https://api.notjustanalytics.com/profile/ig/history/";
  //   const profileDetailAPI = `https://api.notjustanalytics.com/profile/ig/analyze/${"flutteruidev"}`;
  //   if (
  //     response.request().resourceType() === "xhr" ||
  //     response.request().resourceType() === "fetch"
  //   ) {
  //     console.log(`URL: ${url}`);
  //     console.log(`Status: ${status}`);
  //     console.log("Type:", type);

  //     try {
  //       if (url.includes(profileDetailAPI)) {
  //         if (status === 404) {
  //           throw "profile not found ";
  //         }
  //         let data = await response.json(); // Attempt to parse the response as JSON
  //         profileData = data;
  //         console.log(
  //           "\n\n\n\n\n\n\n\n\n\nprofile data found :",
  //           url,
  //           "\n\n\n\n\n\n\n\n"
  //         );
  //       } else if (url.includes(followingDataAPI)) {
  //         if (status === 404) {
  //           throw "profile not found ";
  //         }
  //         let data = await response.json(); // Attempt to parse the response as JSON
  //         console.log("\n\n\n\n\n\nhistory data foind", url, "\n\n\n\n\n\n");
  //       }
  //     } catch (err) {
  //       console.log("Response Body is not JSON.");
  //       await delay(1000);
  //       console.log("isclosed :", page.isClosed());

  //       if (!page.isClosed()) {
  //         await page.close();
  //       }
  //     }
  //   }
  // });

  // try {
  //   try {
  //     const timeout = 30000; // 30 seconds timeout
  //     const checkInterval = 1000; // Check every 1 second
  //     let elapsedTime = 0;

  //     await new Promise<void>((resolve, reject) => {
  //       const checkProfileData = setInterval(() => {
  //         if (profileData !== undefined) {
  //           clearInterval(checkProfileData);
  //           resolve();
  //           return;
  //         }

  //         elapsedTime += checkInterval;
  //         if (elapsedTime >= timeout) {
  //           clearInterval(checkProfileData);
  //           reject(new Error("Profile data not found after 30 seconds"));
  //         }
  //       }, checkInterval);
  //     });

  //     if (profileData === undefined) {
  //       res
  //         .status(404)
  //         .send({ error: "Profile data not found", success: false });
  //       return;
  //     }

  //     res.send(profileData);
  //   } catch (error) {
  //     console.log("Error checking profile data:", error);
  //     res.status(404).send({ error: "Profile data not found", success: false });
  //   }
  //   res.send(profileData);
  // } catch (error) {
  //   console.log("Profile data not found:", error);
  //   res.send({ error: "Profile not found", success: false });
  // } finally {
  //   if (!page.isClosed()) {
  //     await page.close();
  //   }
  //   await browser.disconnect();
  //   console.log("Browser closed");
  // }
  // const options = {
  //   method: "POST",
  //   url: browserQLEndpoint,
  //   params: {
  //     token: "S4DVGumASoee6g0aa437042abb6523b4050eb52768",
  //     humanlike: true,
  //   },
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   data: {
  //     query:
  //       'mutation captureNotJustAnalyticsData {\n  reject(type: [image, media, font, stylesheet]) {\n    enabled\n    time\n  }\n  openPage: goto(\n    url: "https://app.notjustanalytics.com/analysis/flutteruidev"\n    waitUntil: firstContentfulPaint\n    timeout: 65000\n  ) {\n    status\n  }\n  if(selector: ".cf-browser-verification") {\n    verify(type: cloudflare) {\n      solved\n    }\n  }\n  captureAPI: response(\n    url: "*api.notjustanalytics.com/profile/ig/analyze/*"\n    type: xhr\n    status: [201]\n    wait: true\n  ) {\n    url\n    body\n    status\n  }\n}',
  //     operationName: "captureNotJustAnalyticsData",
  //   },
  // };

  // const { data } = await axios.request(options);
});

app.get("/profile-report2", async (req: Request, res: Response) => {
  try {
    const { username } = req.query;
    console.log("started");
    const startTime = Date.now();
    const url = `https://app.notjustanalytics.com/analysis/${username}`;
    const query = `mutation captureNotJustAnalyticsData {\n  reject(type: [image, media, font, stylesheet]) {\n    enabled\n    time\n  }\n  openPage: goto(\n    url: ${JSON.stringify(url)} \n    waitUntil: domContentLoaded\n   ) {\n    status\n  }\n  request(\n    url: "*profile/ig/analyze*"\n    method: POST\n    type: xhr\n    operator: and\n    wait: true\n    timeout: 10000\n  ) {\n    url\n    type\n    method\n  }\n  waitForTimeout(time: 5000) {\n    time\n  }\n  analyzeResponse: response(\n    url: "*profile/ig/analyze*"\n    method: POST\n    operator: and\n    wait: true\n    timeout: 10000\n  ) {\n    url\n    status\n    body\n  }\n  analyzeFollower: response(\n    url: "*ig/history*"\n    method: GET\n    type: xhr\n    operator: and\n    wait: true\n    timeout: 5000\n  ) {\n    url\n    status\n    body\n  }\n}`;

    const options1 = {
      method: "POST",
      url: "https://production-sfo.browserless.io/chrome/bql",
      params: {
        token: process.env.BROWSERLESS_TOKEN!,
      },
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        query: query,
        operationName: "captureNotJustAnalyticsData",
      },
    };

    const { data } = await axios.request(options1);

    const endTime = Date.now();
    const executionTimeMs = endTime - startTime;
    const executionTimeSeconds =
      Math.round((executionTimeMs / 1000) * 100) / 100;
    let profileData, followingData;

    try {
      const rawBody = data.data.analyzeResponse[0].body;

      profileData = JSON.parse(rawBody);
      if (profileData["statusCode"] === 404) {
        profileData = {};
      }
    } catch (err) {
      console.error("Error parsing profile data:", err);
      profileData = {};
    }

    try {
      followingData = JSON.parse(data.data.analyzeFollower[0].body);
    } catch (err) {
      console.error("Error parsing follower data:", err);
      followingData = {};
    }
    console.log(`Data sent in ${executionTimeSeconds} seconds`);

    res.send({
      profileData,
      followingData,
      success: true,
      executionTimeSeconds,
    });
  } catch (error) {
    console.log("error in profile report :", error);
    res.status(500).send({
      profileData: {},
      followerData: {},
      success: false,
      error: error,
    });
  }
});

app.get("/profile-report", async (req: Request, res: Response) => {
  requestQueue.push(async () => {
    const { username } = req.query;
    console.log("username :", username);
    // res.send(sampleResponse);
    // return;
    const { page, browser } = await getReaLBrowser();

    try {
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
        await new Promise<void>((resolve, reject) => {
          const checkProfileData = setInterval(() => {
            console.log("waiting for profile data :", username);

            if (profileData !== undefined && followingData !== undefined) {
              clearInterval(checkProfileData);
              resolve();
            }
          }, 1000); //

          // Break out of the loop after 1 minute
          setTimeout(() => {
            clearInterval(checkProfileData);
            reject(
              new Error("Timeout: Profile data not received within 1 minute")
            );
          }, 60000);
        });

        res.send({ followingData, profileData, success: true });
      }
    } catch (error) {
      console.log("error :", error);
      res.send({ followingData: {}, profileData: {}, success: false });
    } finally {
      if (!page.isClosed()) {
        await page.close();
      }
      await browser.close();

      console.log("browser close");
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
