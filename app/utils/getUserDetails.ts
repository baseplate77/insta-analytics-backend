import { Browser } from "puppeteer";
import { blockResourceRequest } from "./block_request";
import delay from "./delay";

const getUserDetails = async (accountLink: string, browser: Browser) => {
  let profileData: any;

  let page = await browser.newPage();
  await blockResourceRequest(page);
  try {
    let attempts = 0;
    let url: string;

    while (attempts < 3) {
      page.on("response", async (response: any) => {
        const url = response.url() as string;

        if (
          (response.request().resourceType() === "xhr" ||
            response.request().resourceType() === "fetch") &&
          url.includes("ww.instagram.com/graphql/query") &&
          profileData === undefined
        ) {
          let data = await response.json();
          // console.log("data :", data);

          if (
            data["data"] !== undefined &&
            data["data"]["user"] !== undefined
          ) {
            profileData = data["data"]["user"];
          }
        }
      });

      //   let [account] = await accountModel.aggregate([
      //     { $match: { isCookieValid: true } },
      //     { $sample: { size: 1 } },
      //   ]);

      //   let cookie = account.cookie;

      //   await page.setCookie(...cookie);

      await page.goto(accountLink, {
        waitUntil: ["load", "networkidle2"],
        timeout: 60000,
      });

      await page.content();
      // await page.waitForNavigation({ timeout: 10_000 });

      url = page.url();

      if (!(url.includes("/suspend") || url === "https://www.instagram.com/")) {
        break;
      }

      console.log(
        `Attempt ${attempts + 1}: URL contains 'suspend'. Retrying...`
      );
      await delay(2342);
      await page.close();
      page = await browser.newPage();
      await blockResourceRequest(page);
      attempts++;
    }

    if (page.url().includes("/suspend")) {
      console.log(
        "URL still contains 'suspend' after 3 attempts. Returning null."
      );
      throw "fail to fetch account details";
    }

    await new Promise<void>((resolve, reject) => {
      const checkProfileData = setInterval(() => {
        console.log("waiting for profile data :");

        if (profileData !== undefined) {
          clearInterval(checkProfileData);
          resolve();
        }
      }, 1000);

      setTimeout(() => {
        clearInterval(checkProfileData);
        reject(new Error("Timeout: Profile data not received within 1 minute"));
      }, 30000);
    });
  } catch (error) {
    console.log("error in getting user details :", error);
  } finally {
    await page.close();
  }

  return profileData ?? {};
};

export default getUserDetails;
