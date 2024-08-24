import puppeteer from "puppeteer";
import { getReaLBrowser } from "./browerSetup";
import delay from "./delay";
import { response } from "express";

export const getProfileData = async (userId: string, cb: any) => {
  const { page, browser } = await getReaLBrowser();

  const profileDetailAPI = `https://api.notjustanalytics.com/profile/ig/analyze/${userId}`;

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
      const profileDetailAPI = `https://api.notjustanalytics.com/profile/ig/analyze/${userId}`;
      if (
        response.request().resourceType() === "xhr" ||
        response.request().resourceType() === "fetch"
      ) {
        try {
          if (url.includes(profileDetailAPI)) {
            if (status === 404) {
              throw "profile not found ";
            }
            console.log(`URL: ${url}`);
            console.log(`Status: ${status}`);
            console.log("Type:", type);
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
      await page.goto(`https://app.notjustanalytics.com/analysis/${userId}`, {
        waitUntil: ["domcontentloaded", "networkidle2"], // Wait until the network is idle
        timeout: 60000, // Set a timeout
      });
      await page.waitForRequest((response: any) => {
        let r = response.url().includes(profileDetailAPI);
        // console.log("response :", r, "url :", response.url());

        return r;
      });
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
    cb(profileData);
    console.log(userId, profileData);
    // res.send({ followingData, profileData, success: true });
  }

  // const handleResponse = async (response: any) => {
  //   const url = response.url() as string;
  //   const status = response.status();
  //   const type = response.request().resourceType();

  //   if (type === "xhr" || type === "fetch") {
  //     try {
  //       if (url.includes(profileDetailAPI)) {
  //         console.log(`URL: ${url}`);
  //         console.log(`Status: ${status}`);
  //         console.log("Type:", type);

  //         if (status === 404) {
  //           throw new Error("profile not found");
  //         }

  //         profileData = await response.json();
  //         await delay(1000);
  //         await page.close();
  //       }
  //     } catch (err) {
  //       console.log("Response Body is not JSON.");
  //       if (!page.isClosed()) {
  //         await delay(1000);
  //         await page.close();
  //       }
  //     }
  //   }
  // };

  // try {
  //   page.on("response", handleResponse);

  //   try {
  //     await page.goto(`https://app.notjustanalytics.com/analysis/${userId}`, {
  //       waitUntil: ["domcontentloaded", "networkidle2"], // Wait until the network is idle
  //       timeout: 60000, // Set a timeout
  //     });
  //     console.log("page got call complete");

  //     // await page.waitForRequest((response: any) => {
  //     //   let r = response.url().includes(profileDetailAPI);
  //     //   // console.log("response :", r, "url :", response.url());

  //     //   return r;
  //     // });
  //     // await delay(5000);
  //   } catch (error) {
  //     console.log("Error in page navigation:");
  //   }

  //   // const browser = puppeteer.launch();
  //   // let page = await (await browser).newPage();

  //   // await page.waitForRequest((response: any) => {
  //   //   let r = response.url().includes(profileDetailAPI);
  //   //   console.log("response :", r, "url :", response.url());

  //   //   return r;
  //   // });

  //   console.log("Page loaded successfully :");
  // } catch (error) {
  //   console.error("Failed to load the page:", error);
  // } finally {
  //   if (profileData === undefined) {
  //     console.log("Profile data not defined", userId);
  //     // throw new Error("profile not found");
  //   }

  //   // await browser.close();
  //   cb(profileData);
  //   console.log(userId, profileData);
  //   await delay(1000);
  // }

  return profileData;
};
