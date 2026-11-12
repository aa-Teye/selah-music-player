// The same song gets the same key, however its name is written:
// "Way Maker (Live) [Official Video]" by "Sinach ft. Joe" → "way maker|sinach"
export function cleanName(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\(.*?\)|\[.*?\]/g, ' ')
    .replace(/\b(feat|ft|featuring)\b.*$/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function songKey(title, artist) {
  return `${cleanName(title)}|${cleanName(artist)}`;
}
