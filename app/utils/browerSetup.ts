import vanillaPuppeteer, {
  Browser,
  DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
  Page,
} from "puppeteer";
import { addExtra } from "puppeteer-extra";
import Stealth from "puppeteer-extra-plugin-stealth";
import Recaptcha from "puppeteer-extra-plugin-recaptcha";
import { proxyList } from "../constants";

// let browser: Browser = undefined;

class PuppeteerManager {
  browser?: Browser | null = null;
  pageCount = 0;
  constructor() {
    this.browser = null;
    this.pageCount = 0;
  }
  async getBrowser() {
    if (!this.browser) {
      console.log("Launching new browser instance...");
      const puppeteer = addExtra(vanillaPuppeteer);
      puppeteer.use(Stealth());
      // puppeteer.use(Recaptcha());
      // puppeteer.use(
      //   AdblockerPlugin({
      //     // blockTrackers: true,
      //     interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
      //   })
      // );
      const randomProxy =
        proxyList[Math.floor(Math.random() * proxyList.length)];
      this.browser = await puppeteer.launch({
        // executablePath: "/usr/bin/google-chrome",
        ignoreHTTPSErrors: true,
        protocolTimeout: 0,
        timeout: 0,
        // targetFilter: (target) => {
        //   if (target.type() === "page") return true;

        //   // try {
        //   //   if (turnstile === true && target._getTargetInfo().type == "iframe")
        //   //     return false;
        //   // } catch (err) {}

        //   // if (global_target_status === false) return true;

        //   var response = false;
        //   // try {
        //   //   response = !!target.url();
        //   //   if (
        //   //     [].find((item) =>
        //   //       String(target.url()).indexOf(String(item) > -1)
        //   //     )
        //   //   ) {
        //   //     response = true;
        //   //   }
        //   // } catch (err) {}
        //   return response;
        // },
        // headless: true,
        headless: false,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        // args: [
        //   "--disable-gpu",
        //   "--disable-setuid-sandbox",
        //   "--no-first-run",
        //   "--no-sandbox",
        //   "--no-zygote",
        //   "--deterministic-fetch",
        //   "--disable-features=IsolateOrigins",
        //   "--disable-site-isolation-trials",
        //   "--window-size=1920,1080",
        //   "--auto-open-devtools-for-tabs",

        //   // `--proxy-server=${randomProxy}`,

        //   // "--disable-gpu",
        //   // "--disable-dev-shm-usage",
        //   // "--disable-setuid-sandbox",
        //   // "--no-sandbox",
        // ],
      });
    } else {
      console.log("Reusing existing browser instance...");
    }
    return this.browser;
  }

  // Create a new page in the existing browser
  async createPage() {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    this.pageCount += 1;
    console.log(`Page created. Current page count: ${this.pageCount}`);
    return page;
  }

  // Close the page and check if the browser should be closed
  async closePage(page: Page) {
    if (!page) return;
    await page.close();
    this.pageCount -= 1;
    console.log(`Page closed. Current page count: ${this.pageCount}`);

    if (this.pageCount === 0 && this.browser) {
      console.log("Closing browser as there are no more pages...");
      await this.browser.close();
      this.browser = null;
    }
  }
}

class GlobalBroswer {
  private static _instance: GlobalBroswer;
  browser?: Browser;

  constructor() {
    // this.initBrower();
  }
  initBrower = async () => {
    const puppeteer = addExtra(vanillaPuppeteer);
    puppeteer.use(Stealth());
    puppeteer.use(Recaptcha());
    // puppeteer.use(
    //   AdblockerPlugin({
    //     // blockTrackers: true,
    //     interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
    //   })
    // );
    const randomProxy = proxyList[Math.floor(Math.random() * proxyList.length)];

    // console.log("random proxy :", randomProxy);

    this.browser = await puppeteer.launch({
      // executablePath: "/usr/bin/google-chrome",
      ignoreHTTPSErrors: true,
      targetFilter: (target) => !!target.url(),

      protocolTimeout: 0,
      timeout: 0,
      // headless: true,
      headless: false,
      args: [
        "--disable-gpu",
        "--disable-setuid-sandbox",
        "--no-first-run",
        "--no-sandbox",
        "--no-zygote",
        "--deterministic-fetch",
        "--disable-features=IsolateOrigins",
        "--disable-site-isolation-trials",
        "--disable-blink-features=AutomationControlled",

        // `--proxy-server=${randomProxy}`,

        // "--disable-gpu",
        // "--disable-dev-shm-usage",
        // "--disable-setuid-sandbox",
        // "--no-sandbox",
      ],
    });

    console.log("Browser has been started");

    return this.browser;
  };

  static getInstance() {
    return this._instance || (this._instance = new this());
  }
  async getBrowser() {
    if (this.browser !== undefined) return this.browser;
  }
}

export const globalBrowser = GlobalBroswer.getInstance();

export const puppeteerManager = new PuppeteerManager();
