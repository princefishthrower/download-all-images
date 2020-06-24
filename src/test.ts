import { retrieveAllImages } from "./index";
import path from "path";

function test() {
  retrieveAllImages('https://google.com',  path.join(__dirname, "..", "output-images"));
}

test();
