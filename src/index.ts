import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import puppeteer from "puppeteer";
import ISrcSet from "./interfaces/ISrcSet";
import validUrl from "valid-url";
// const validUrl = require('valid-url');

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(() => resolve(), ms));
}

async function download(url: string, outputFolder: string): Promise<boolean> {
  if (!validUrl.isWebUri(url)) {
    console.log("Invalid URL. Skipping this image.");
    return new Promise((resolve) => {
      return resolve(true);
    });
  }
  const basename = path.basename(url);
  const destination = path.join(outputFolder, basename);
  try {
    return new Promise((resolve) => {
      const file = fs.createWriteStream(destination);
      if (url.startsWith("https://")) {
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
      } else if (url.startsWith("http://")) {
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
      } else if (url.startsWith("data:image")) {
        // if it is base64 - try to capture two regex groups: file type, and base64 data
        const regex = /data:image\/(.*);base64,(.*)/;
        const matches = url.match(regex);
        if (matches && matches.length === 3) {
          const fileType = matches[1];
          const base64Data = matches[2].replace(/\+/g, " ");
          const buffer = Buffer.from(base64Data, "base64");
          const fileName =
            base64Data.slice(0, 5) + base64Data.slice(-5) + "." + fileType;
          fs.writeFile(path.join(outputFolder, fileName), buffer, function (
            err
          ) {
            console.log(err);
            return resolve(false);
          });
          return resolve(true);
        }
      } else {
        // last try is with https
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
      }
    });
  } catch (error) {
    console.error(error);
    console.log("Skipping this image.");
    return new Promise((resolve) => {
      return resolve(true);
    });
  }
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

  const imageInfos = await page.evaluate(() => {
    return Array.from(document.images, (e) => {
      return {
        src: e.src,
        srcset: e.srcset ?? "",
      };
    });
  });

  const srcs = imageInfos.map((imageInfo) => {
    // preferred image is the largest image available from the source set, so we try that
    if (imageInfo.srcset !== "") {
      const srcSetList = imageInfo.srcset.split(",");
      const sortedSrcSet: Array<ISrcSet> = srcSetList
        .filter((srcSet: string) => {
          
          // remove any leading and trailing space
          srcSet = srcSet.trim();

          // split at space
          const content = srcSet.split(" ");
          return content.length === 2;
        })
        .map((srcSet: string) => {
          

          // clean up and create an array of objects with src / size info
          srcSet = srcSet.trim();
          const content = srcSet.split(" ");
          let src = content[0];
          src = src.trim();

          // for the size, remove the 'w' and cast to integer
          const size = parseInt(content[1].replace("w", ""));

          // some srcset also have a weird starting double slash: '//'
          if (src.startsWith("//")) {
            src = src.replace("//", "https://");
          }

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

          if (validUrl.isWebUri(src)) {
            return {
              src,
              size,
            };
          } else {
            // not valid http or https uri
            return {
              src: `https://place-hold.it/${size}x${size}?text=Invalid src url ${src}`,
              size,
            };
          }
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
    const matches = imageInfo.src.match(regex);
    if (matches && matches.length === 3) {
      if (validUrl.isWebUri(matches[1])) {
        return matches[1];
      } else {
        return `https://place-hold.it/${250}x${250}?text=Invalid src url ${
          matches[1]
        }`;
      }
    }
    if (validUrl.isWebUri(imageInfo.src)) {
      return imageInfo.src;
    } else {
      return `https://place-hold.it/${250}x${250}?text=Invalid src url ${
        imageInfo.src
      }`;
    }
  });

  for (let i = 0; i < srcs.length; i++) {
    await download(srcs[i], outputFolder);
  }

  await browser.close();
}
