# use-element-in-view

A simple React hook to track whether an element is visible in the viewport with the Intersection Observer.
This API provides a native way to asynchronously observe changes in the intersection of a target element with an ancestor element or with a top-level document's viewport.

Browser support for the Intersection Observer is incredibly wide, you can view the full list [here](https://caniuse.com/intersectionobserver). However, if you need to support older browsers, you can add a polyfill from [here](https://www.npmjs.com/package/intersection-observer).

## Install

💡 Note: Since this module uses React Hooks, you'll need to have version >=16.8.0 of react and react-dom installed in your project

```sh
npm install use-element-in-view --save-dev
# or
yarn add use-element-in-view --dev
```

## Quick Start

```jsx
import React from 'react';
import { useElementInView } from 'use-element-in-view';

function App() {
    const { inView, assignRef } = useElementInView();

    return <div ref={assignRef}>In View? {inView}</div>;
}
```

## Using your own ref.

```jsx
import React, { useRef } from 'react';
import { useElementInView } from 'use-element-in-view';

function App() {
    const ref = useRef < HTMLDivElement > null;
    const { inView } = useElementInView({ ref });

    return <div ref={ref}>In View? {inView}</div>;
}
```

You can view more examples on CodeSandbox (**coming soon**).

## API

### `useElementInView(options)`

```ts
function useElementInView<T extends HTMLElement = HTMLElement>(
    options?: IElementInViewOptions<T> = {}
): IElementInViewResult<T>;
```

#### Arguments: `IElementInViewOptions<T>`

-   Note, all arguments are optional. The properties `root`, `rootMargin` and `threshold` are specific to the native Intersection Observer API and are forwarded along, more information can be found [here](https://developer.mozilla.org/en-US/docs/Web/API/IntersectionObserver)

| Argument              | Type                                         | Default value | Description                                                                                                                                                                                                                                                                                                         |
| --------------------- | -------------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ref                   | `T \| RefObject<T> \| null`                  | `null`        | Pass in your own ref instead of using the ref callback provided. This can be useful if you already have a ref inside your component you want to observe.                                                                                                                                                            |
| defaultInView         | `boolean`                                    | `false`       | Set the default value for the inView property.                                                                                                                                                                                                                                                                      |
| disconnectOnceVisible | `boolean`                                    | `false`       | Will disconnect the observer once the observed element has entered the viewport. A use-case for this is for lazy-loading images.                                                                                                                                                                                    |
| onChange              | `(entry: IntersectionObserverEntry) => void` | `undefined`   | Provide a callback that receives the full `IntersectionObserverEntry` as an argument that fires on each change of element intersection.                                                                                                                                                                             |
| root                  | `Element \| null`                            | `null`        | The `Element` or `Document` whose bounds are used as the bounding box when testing for intersection. If no root value was passed to the constructor or its value is null, the top-level document's viewport is used                                                                                                 |
| rootMargin            | `string`                                     | `'0px'`       | A string which specifies a set of offsets to add to the root's bounding box when calculating intersections, effectively shrinking or growing the root for calculation purposes. The syntax is approximately the same as that for the CSS `margin` property. The default is `"0px 0px 0px 0px"`.                     |
| threshold             | `number \| number[]`                         | `0`           | A list of thresholds, sorted in increasing numeric order, where each threshold is a ratio of intersection area to bounding box area of an observed target. Notifications for a target are generated when any of the thresholds are crossed for that target. If no value was passed to the constructor, `0` is used. |

#### Returns: `IElementInViewResult<T>`

| Argument   | Type                                     | Description                                                                                                                                         |
| ---------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| inView     | `boolean`                                | Value representing if the observed element is visible in the viewport or not.                                                                       |
| entry      | `IntersectionObserverEntry \| undefined` | The full entry (`IntersectionObserverEntry`) returned from the Intersection Observer callback when invoked.                                         |
| assignRef  | `RefCallback<T>`                         | A callback ref to be assigned to your element. Note, if you do not pass in your own ref, this **must** be added to the element you wish to observe. |
| disconnect | `() => void`                             | Function that will disconnect the current observer instance shall you need to trigger this yourself.                                                |

## Contributing

You can report bugs and issues [here](https://github.com/joshuaaron/use-element-in-view/issues/new).

Pull-requests are more than welcome if you feel like you can improve or fix something 💥

## License

MIT
