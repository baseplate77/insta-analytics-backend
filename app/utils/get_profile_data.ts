import { getReaLBrowser } from "./browerSetup";
import delay from "./delay";

export const getProfileData = async (userId: string, cb: any) => {
  const { page, browser } = await getReaLBrowser();
  let profileData: any;

  const handleResponse = async (response: any) => {
    const url = response.url() as string;
    const status = response.status();
    const type = response.request().resourceType();
    const profileDetailAPI = `https://api.notjustanalytics.com/profile/ig/analyze/${userId}`;

    if (type === "xhr" || type === "fetch") {
      try {
        if (url.includes(profileDetailAPI)) {
          console.log(`URL: ${url}`);
          console.log(`Status: ${status}`);
          console.log("Type:", type);

          if (status === 404) {
            throw new Error("profile not found");
          }

          profileData = await response.json();
          await delay(1000);
          await page.close();
        }
      } catch (err) {
        console.log("Response Body is not JSON.");
        if (!page.isClosed()) {
          await delay(1000);
          await page.close();
        }
      }
    }
  };

  try {
    page.on("response", handleResponse);

    try {
      await page.goto(`https://app.notjustanalytics.com/analysis/${userId}`, {
        waitUntil: ["domcontentloaded", "networkidle2"],
        timeout: 90000,
      });
    } catch (error) {
      console.log("Error in page navigation:", error);
    }

    console.log("Page loaded successfully");
  } catch (error) {
    console.error("Failed to load the page:", error);
  } finally {
    if (profileData === undefined) {
      console.log("Profile data not defined");
      throw new Error("profile not found");
    }

    await browser.close();
    cb(profileData);
    console.log(userId, profileData.followers);
    await delay(1000);
  }

  return profileData;
};
