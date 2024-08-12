import { Page } from "puppeteer";
import fs from "fs";
import path from "path";

export const mockPng = fs
  .readFileSync(path.join(__dirname, "..", "..", "mock.png"))
  .toString("base64");

export const addMockImage = async (page: Page, username: string) => {
  await page.setRequestInterception(true);
  page.on("request", async (request) => {
    const resourceType = request.resourceType();
    if (["font"].includes(resourceType)) {
      request.abort(); // Block unnecessary requests
    } else if (resourceType === "image") {
      // Redirect the image request to the mock image

      try {
        const imageUrl = request.url();

        // Get the alt attribute of the image element
        const imageAlt = await page.evaluate((url) => {
          //   let i = document.querySelectorAll("img");
          //   const img = document.querySelector(
          //     "div > div > span > img"
          //   ) as HTMLElementTagNameMap["img"];
          const img = Array.from(document.querySelectorAll("img")).find(
            (img) => img.src === url
          );
          return img ? img.alt : null;
        }, imageUrl);

        if (
          imageAlt &&
          imageAlt
            .toLowerCase()
            .includes(`${username.replace(/\s+/g, "")}`.toLowerCase()) &&
          imageAlt.toLowerCase().includes("profile picture".toLowerCase())
        ) {
          // Allow profile image to load
          request.continue();
        } else {
          // Replace other images (e.g., post images) with the mock image
          request.respond({
            status: 200,
            contentType: "image/png",
            body: Buffer.from(
              `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAn8B9aLiPo4AAAAASUVORK5CYII=`
            ),
          });
        }
      } catch (error) {
        // If there's an error, continue the request as normal
        request.continue();
      }

      // request.respond({
      //   status: 200,
      //   contentType: "image/png",
      //   body: mockPng, // 1x1 pixel transparent image
      // });
    } else {
      // Allow other requests to proceed as normal
      request.continue();
    }
  });
};
