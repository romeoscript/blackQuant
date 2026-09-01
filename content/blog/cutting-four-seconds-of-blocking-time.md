---
title: Cutting Four Seconds of Blocking Time Off a Landing Page
excerpt: Our marketing page scored 51 on PageSpeed. The fixes were not micro-optimisations — they were four places where work was being done that nobody could see.
category: Engineering
author: romeo
date: 2026-06-23
tags: [Performance, Next.js, WebGL]
---

Our landing page scored 51. Four seconds of main-thread blocking and a 10 MB
payload, on a page whose job is to load fast enough that a stranger stays.

None of the fixes were clever. Every one was the same discovery in a different
costume: **work that produced nothing anybody could see.**

## The globe was tessellating invisible geometry

The hero renders a rotating globe with country outlines. It was built with
`polygonsData`, which generates cap and side solids for every landmass.

Both colours were fully transparent.

So the renderer was triangulating every country in the world into 3D solids, per
frame, to draw nothing. The visible output was a 1px coastline stroke — which a
paths layer draws directly:

```ts
// Before: solids for 200-odd countries, both faces transparent.
globe.polygonsData(countries);

// After: 126 plain lines, the same visible stroke.
globe.pathsData(coastlines);
```

Same picture. A fraction of the geometry.

## The map data was compiled as JavaScript

The world atlas was a TopoJSON file, imported as an ES module:

```ts
import world from "world-atlas/countries-110m.json";
```

That looks like loading data. It is not. A JSON import goes through the module
pipeline, so 163 KB of coordinates was parsed as *JavaScript* — which is far
slower than `JSON.parse` — and landed in a JS chunk that had to be compiled
before anything else ran.

Worse, `h3-js` was then pulled in purely to *validate* that each polygon could
be hex-binned, duplicating work the globe library already does internally.

Both moved to a build step. The page now fetches a static, pre-quantised JSON
(76 KB gzipped) and neither library ships at all.

## The entrance animation could freeze at zero

`animateIn` tweens the globe up from scale 0. The tween only advances while the
render loop runs, and the render loop was gated on visibility.

So a globe that was off-screen at init — or in a background tab — stayed at
scale 0. Permanently. Not slow: invisible. The container already had an opacity
transition doing the real entrance, so the tween was deleted.

That one had been shipping for weeks. Performance work found it because
performance work is mostly *reading what actually executes*.

## The font chain blocked the hero text

`globals.css` opened with:

```css
@import url("https://api.fontshare.com/v2/css?f[]=satoshi@700,500,400");
```

That is a render-blocking stylesheet, which requests a second stylesheet, which
requests the font files — three sequential round trips to a third party in front
of the largest text on the page. Self-hosting through `next/font/local`
collapsed it to zero.

## What it added up to

| Metric | Before | After |
| --- | --- | --- |
| Total blocking time | 4,060 ms | 300 ms |
| Payload | 10 MB | 1.1 MB |
| Render-blocking third parties | 1 | 0 |

The 10 MB included 5.5 MB of screenshots left over from a starter template that
no route referenced.

## The pattern

Looking back, none of these were performance problems in the usual sense. They
were correctness problems that happened to cost time:

- Geometry generated for invisible surfaces
- Data parsed by the wrong parser
- An animation that could never complete
- A font chain in front of the text it styles

The lesson we took: before optimising how fast something runs, check whether
anyone can see it. A surprising amount of the answer is no.

One postscript, in the interest of honesty. That same commit re-encoded four
background videos and the message claims it produced 720p. It produced 360p —
which we only noticed months later when someone said the clips looked blurry.
They were, and the commit message had been telling us why the whole time.
