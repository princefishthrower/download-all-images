import { retrieveAllImages } from "./index";
import path from "path";

async function test() {
  const retrievedImageInfos = await retrieveAllImages(
    "https://edition.cnn.com",
    path.join(__dirname, "..", "output-images")
  );
  console.log(
    "Done with image retrieval. Retrieved image data: " +
      JSON.stringify(retrievedImageInfos)
  );
}

test();
