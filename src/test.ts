import { retrieveAllImages } from "./index";
import path from "path";

function test() {
  retrieveAllImages('https://edition.cnn.com',  path.join(__dirname, "..", "output-images"));
}

test();
