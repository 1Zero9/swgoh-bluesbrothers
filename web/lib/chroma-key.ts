/**
 * Green-screen removal for B-LU3's intro clip. Works on RGBA pixel data in place: pixels that are
 * clearly green become transparent, edge pixels fade out and lose their green fringe.
 * "Greenness" is how far green sits above the stronger of red and blue, so blue and cyan stay.
 */
export const KEY_LOW = 28; // below this the pixel is kept as it is
export const KEY_HIGH = 70; // above this the pixel is fully transparent

export function keyGreen(data: Uint8ClampedArray) {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const greenness = g - Math.max(r, b);
    if (greenness <= KEY_LOW) continue;
    if (greenness >= KEY_HIGH) {
      data[i + 3] = 0;
      continue;
    }
    const keep = 1 - (greenness - KEY_LOW) / (KEY_HIGH - KEY_LOW);
    data[i + 3] = Math.round(data[i + 3] * keep);
    data[i + 1] = Math.max(r, b); // despill: no green halo around the droid
  }
}
