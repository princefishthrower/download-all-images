# retrieve-all-images

A function that retrieves all images for a given a webpage and outputs them, named as they are on the webpage, to the provided folder path.

## TypeScript Usage:

```typescript
import { retrieveAllImages } from 'retrieve-all-images';
import path from 'path';

// retrieves all images present on google homepage to folder in project route output-images/
async function test() {
    retrieveAllImages('https://google.com', path.join(__dirname, 'output-images'));
}

test();
```

