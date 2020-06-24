import fs from "fs";
import path from "path";
import https from "https";
import puppeteer from "puppeteer";

async function download(url: string, destination: string): Promise<boolean> {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(destination);

    https
      .get(url, (response) => {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
        });
        return resolve(true);
      })
      .on("error", (error) => {
        console.log(error);
        return resolve(false);
      });
  });
}

async function autoScroll(page: any) {
  // await page.evaluate(`async () => {
  //   await new Promise((resolve, reject) => {
  //     var totalHeight = 0;
  //     var distance = 100;
  //     var timer = setInterval(() => {
  //       console.log('scrolling...');
  //       var scrollHeight = document.body.scrollHeight;
  //       window.scrollBy(0, distance);
  //       totalHeight += distance;

  //       if (totalHeight >= scrollHeight) {
  //         clearInterval(timer);
  //         resolve();
  //       }
  //     }, 100);
  //   });
  // }`);
  await page.evaluate(() => {
    window.scrollBy(0, window.innerHeight);
    window.scrollBy(0, window.innerHeight);
    window.scrollBy(0, window.innerHeight);
    window.scrollBy(0, window.innerHeight);
    window.scrollBy(0, window.innerHeight);
  });
}

export async function retrieveAllImages(url: string, outputFolder: string) {
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle0" });
  // await page.waitForNavigation({
  //   waitUntil: 'networkidle0',
  // });
  // await page.setViewport({ width: 750, height: 750 });
  page.setViewport({ width: 0, height: 0 });

  await autoScroll(page);

  // TODO: this should be extended to include srcset and other possible ways of including an image
  const images = await page.evaluate(() =>
    Array.from(document.images, (e) => e.src)
  );

  for (let i = 0; i < images.length; i++) {
    const basename = path.basename(images[i]);
    await download(images[i], path.join(outputFolder, basename));
  }

  await browser.close();
}
