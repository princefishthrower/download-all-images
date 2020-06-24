# retrieve-all-images

A function that retrieves all images for a given a webpage and outputs them, named as they are on the webpage, to the provided folder path. Note that the url should NOT include a trailing slash, as this can cause problems with how `srcset` paths are determined, if they are provided as a relative path on the desired retrieval page.

## TypeScript Usage:

```typescript
import { retrieveAllImages } from 'retrieve-all-images';
import path from 'path';

// retrieves all images present on CNN homepage to folder in project root folder under output-images/
async function test() {
    retrieveAllImages('https://edition.cnn.com', path.join(__dirname, 'output-images'));
}

test();
```

