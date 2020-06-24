import fs from "fs";
import path from "path";
import https from "https";
import puppeteer from "puppeteer";
import ISrcSet from "./interfaces/ISrcSet";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(() => resolve(), ms));
}

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

export async function retrieveAllImages(url: string, outputFolder: string) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // go to desired url
  await page.goto(url, { waitUntil: "networkidle0" });

  // set viewport to machine
  await page.setViewport({ width: 0, height: 0 });

  // scroll to bottom of page smoothly
  await page.evaluate(
    "window.scrollTo({top: document.body.scrollHeight, left: 0, behavior: 'smooth'})"
  );

  // wait for any lazyloaded / API images etc to load
  await wait(5000);

  const images = await page.evaluate((url) => {
    return Array.from(document.images, (e) => {
      // preferred image is the largest from the source set, so we try that
      if (e.srcset) {
        const srcSetList = e.srcset.split(",");
        const sortedSrcSet: Array<ISrcSet> = srcSetList
          .filter((srcSet) => {
            // remove any leading and trailing space
            srcSet = srcSet.trim();

            // split at space
            const content = srcSet.split(" ");
            return content.length === 2;
          })
          .map((srcSet) => {
            // clean up and create an array of objects with src / size info
            srcSet = srcSet.trim();
            const content = srcSet.split(" ");
            let src = content[0];

            // some srcset only have the relative path - we need the full image path in order to retrieve
            if (!src.startsWith("http")) {
              src = url + src;
            }

            // they may also have parameters - remove them
            const regex = /([^\?]+)(\?.*)?/;
            const matches = src.match(regex);
            if (matches && matches.length === 3) {
              src = matches[1];
            }

            // for the size, remove the 'w' and cast to integer
            const size = parseInt(content[1].replace("w", ""));

            return {
              src,
              size,
            };
          })
          .sort((a: ISrcSet, b: ISrcSet) => {
            // sort by largest size images first
            return b.size - a.size;
          });

        if (sortedSrcSet.length > 0) {
          return sortedSrcSet[0].src;
        }
      }
      // they may also have parameters - remove them
      const regex = /([^\?]+)(\?.*)?/;
      const matches = e.src.match(regex);
      // alert(e.src + " " + JSON.stringify(matches));
      if (matches && matches.length === 3) {
        // alert('match yo');
        return matches[1];
      }
      return e.src;
    });
  }, url);

  for (let i = 0; i < images.length; i++) {
    const basename = path.basename(images[i]);
    await download(images[i], path.join(outputFolder, basename));
  }

  await browser.close();
}
