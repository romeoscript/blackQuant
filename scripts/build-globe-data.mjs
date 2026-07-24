/**
 * Precomputes the hero globe's geometry into a single static JSON asset.
 *
 * Doing this at build time keeps three things off the client:
 *   - `world-atlas` topojson imported as an ES module (~163 KB of JSON parsed
 *     as *JavaScript*, which is far slower than JSON.parse and lands in a JS
 *     chunk that must be compiled)
 *   - `topojson-client` (the mesh/feature decoder)
 *   - `h3-js`, which the runtime only pulled in to *validate* that every
 *     country polygon could be hex-binned — work three-globe then repeated
 *
 * Coastlines are emitted as bare [lat, lng] rings rather than GeoJSON polygons.
 * The globe draws them with a transparent cap and side, so feeding them to
 * three-globe's `polygonsData` tessellated the whole landmass into solids that
 * are never visible; a paths layer renders the same 1px stroke as plain lines.
 *
 * Output: public/globe-data.json  ({ countries: Feature[], coastlines: Ring[] })
 * Run via `npm run build:globe` (wired into `prebuild`).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import * as topojson from "topojson-client";
import { polygonToCells } from "h3-js";

const require = createRequire(import.meta.url);

/** Must match `hexPolygonResolution` in components/landing/globe.tsx. */
const HEX_RES = 2;
/** ~1 km at the equator — far finer than a 110m-resolution source needs. */
const PRECISION = 2;

const round = (n) => Math.round(n * 10 ** PRECISION) / 10 ** PRECISION;

/** Recursively round every coordinate pair in a GeoJSON coordinate tree. */
function quantize(coords) {
  if (typeof coords[0] === "number") return [round(coords[0]), round(coords[1])];
  return coords.map(quantize);
}

/** Strip properties/ids — the globe only ever reads geometry. */
function slim(feature) {
  return {
    type: "Feature",
    geometry: {
      type: feature.geometry.type,
      coordinates: quantize(feature.geometry.coordinates),
    },
  };
}

const countriesTopo = require("world-atlas/countries-110m.json");
const landTopo = require("world-atlas/land-110m.json");

const allCountries = topojson.feature(
  countriesTopo,
  countriesTopo.objects.countries,
).features;

// Drop any polygon h3 can't bin so a single bad country never throws at runtime.
const countries = allCountries.filter((f) => {
  const g = f.geometry;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  try {
    for (const poly of polys) polygonToCells(poly, HEX_RES, true);
    return true;
  } catch {
    return false;
  }
});

// Flatten land polygons into individual [lat, lng] rings for the paths layer.
const land = topojson.feature(landTopo, landTopo.objects.land).features;
const coastlines = [];
for (const f of land) {
  const g = f.geometry;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  for (const poly of polys) {
    for (const ring of poly) {
      // GeoJSON is [lng, lat]; three-globe's path accessors read [lat, lng].
      coastlines.push(ring.map(([lng, lat]) => [round(lat), round(lng)]));
    }
  }
}

const out = {
  countries: countries.map(slim),
  coastlines,
};

mkdirSync("public", { recursive: true });
const json = JSON.stringify(out);
writeFileSync("public/globe-data.json", json);

console.log(
  `globe-data.json: ${countries.length}/${allCountries.length} countries, ` +
    `${coastlines.length} coastline rings, ${(json.length / 1024).toFixed(0)} KB`,
);
