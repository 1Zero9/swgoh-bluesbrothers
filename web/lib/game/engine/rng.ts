function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mix(value: number) {
  let result = value + 0x6d2b79f5;
  result = Math.imul(result ^ (result >>> 15), result | 1);
  result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
  return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
}

export function deterministicFloat(seed: string, stream: string, ...coordinates: Array<string | number>) {
  return mix(hashString([seed, stream, ...coordinates].join("|")));
}

export function deterministicInteger(seed: string, stream: string, min: number, max: number, ...coordinates: Array<string | number>) {
  return Math.floor(deterministicFloat(seed, stream, ...coordinates) * (max - min + 1)) + min;
}
