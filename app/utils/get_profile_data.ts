import { getReaLBrowser } from "./browerSetup";
import delay from "./delay";

export const getProfileData = async (userId: string, cb: any) => {
  const { page, browser } = await getReaLBrowser();
  let profileData: any;
  try {
    page.on("response", async (response: any) => {
      const url = response.url() as string;
      const status = response.status();
      // const headers = response.headers();
      const type = response.request().resourceType();
      // console.log(url, type);
      // Only log API responses (JSON responses typically)
      // const followingDataAPI =
      //   "https://api.notjustanalytics.com/profile/ig/history/";
      const profileDetailAPI = `https://api.notjustanalytics.com/profile/ig/analyze/${userId}`;
      if (
        response.request().resourceType() === "xhr" ||
        response.request().resourceType() === "fetch"
      ) {
        try {
          if (url.includes(profileDetailAPI)) {
            console.log(`URL: ${url}`);
            console.log(`Status: ${status}`);
            console.log("Type:", type);
            if (status === 404) {
              throw "profile not found ";
            }
            let data = await response.json(); // Attempt to parse the response as JSON
            profileData = data;
          }

          if (profileData !== undefined) {
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
    } catch (error) {
      console.log("error in page navigation");
    } finally {
      if (profileData === undefined) {
        console.log("profile data not define");

        throw "profile not found";
      }
      await browser.close();
      cb(profileData);
      console.log(userId, profileData.followers);
      await delay(1000);
    }
    console.log("Page loaded successfully");
  } catch (error) {
    console.error("Failed to load the page:", error);
  }

  return profileData;
};
