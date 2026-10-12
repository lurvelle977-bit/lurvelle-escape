import { MAP_SCALE, MAP_TRANSLATE } from "../data/portugalMap";

// Mercator projection for the mobile SVG map (matches the stored country outlines)
export function projectToMobileMap(lon: number, lat: number): [number, number] {
  const rad = Math.PI / 180;
  const x = MAP_SCALE * lon * rad + MAP_TRANSLATE[0];
  const y = -MAP_SCALE * Math.log(Math.tan(Math.PI / 4 + (lat * rad) / 2)) + MAP_TRANSLATE[1];
  return [x, y];
}

