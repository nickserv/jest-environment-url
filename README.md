# `jest-environment-url`

Load a URL into JSDOM for testing

## Installation

```sh
npm install --save-dev jest-environment-url
```

```sh
yarn add --dev jest-environment-url
```

## Configuration

### JSON

```json
"testEnvironment": "jest-environment-url",
"testEnvironmentOptions": {
  "url": "https://example.com/"
}
```

### DocBlock

```js
/**
 * @jest-environment url
 * @jest-environment-options {"url": "https://example.com/"}
 */
```

## [Example](test.ts)

## Inspiration

Based on [`jest-environment-jsdom`](https://github.com/facebook/jest/tree/main/packages/jest-environment-jsdom) (© Facebook with [MIT license](https://choosealicense.com/licenses/mit/))
