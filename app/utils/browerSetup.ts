import vanillaPuppeteer, {
  Browser,
  DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
} from "puppeteer";
import { addExtra } from "puppeteer-extra";
import Stealth from "puppeteer-extra-plugin-stealth";
import Recaptcha from "puppeteer-extra-plugin-recaptcha";
// let browser: Browser = undefined;

class GlobalBroswer {
  private static _instance: GlobalBroswer;
  browser?: Browser;

  constructor() {
    // this.initBrower();
  }
  initBrower = async () => {
    if (this.browser !== undefined) return this.browser;
    const puppeteer = addExtra(vanillaPuppeteer);
    puppeteer.use(Stealth());
    puppeteer.use(Recaptcha());
    // puppeteer.use(
    //   AdblockerPlugin({
    //     // blockTrackers: true,
    //     interceptResolutionPriority: DEFAULT_INTERCEPT_RESOLUTION_PRIORITY,
    //   })
    // );
    this.browser = await puppeteer.launch({
      executablePath: "/usr/bin/google-chrome",
      ignoreHTTPSErrors: true,

      protocolTimeout: 0,
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
