import path from "path";
import fs from "fs";
import { Page } from "puppeteer";

const blocked_domains = ["googlesyndication.com", "adservice.google.com"];

const mockPng = fs
  .readFileSync(path.join(__dirname, "..", "..", "mock.png"))
  .toString("base64");

export const blockResourceRequest = async (page: Page) => {
  let client = await page.createCDPSession();

  await client.send("Network.setBlockedURLs", {
    urls: blocked_domains,
  });

  await client.send("Fetch.enable", {
    patterns: [
      {
        resourceType: "Image",
        requestStage: "Request",
      },
    ],
  });

  client.on("Fetch.requestPaused", async (e) => {
    client.send("Fetch.fulfillRequest", {
      requestId: e.requestId,
      responseCode: 200,
      body: mockPng,
    });
  });

  await Promise.all([
    client.send("Console.disable"),
    client.send("ServiceWorker.disable"),
    client.send("CSS.disable"),
    client.send("Network.setBypassServiceWorker", { bypass: true }),
    client.send("Page.setBypassCSP", { enabled: true }),
  ]);
};
