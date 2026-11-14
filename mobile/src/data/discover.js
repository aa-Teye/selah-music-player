// Libraries: genres and gospel artists. Tapping one shows its latest songs on YouTube.

// Genre photos come with the app (free Unsplash photos, list in assets/genres/CREDITS.md),
// so they show at once, even offline. The colour shows while a photo loads.
export const GENRES = [
  { id: 'worship', name: 'Worship', search: 'worship songs', icon: 'hand-left-outline', color: '#6D28D9', photo: require('../../assets/genres/worship.jpg') },
  { id: 'praise', name: 'Praise', search: 'praise songs', icon: 'musical-notes-outline', color: '#C2410C', photo: require('../../assets/genres/praise.jpg') },
  { id: 'ghana', name: 'Ghana Gospel', search: 'Ghana gospel songs', icon: 'flag-outline', color: '#A16207', photo: require('../../assets/genres/ghana.jpg') },
  { id: 'nigeria', name: 'Nigerian Gospel', search: 'Nigerian gospel songs', icon: 'flag-outline', color: '#047857', photo: require('../../assets/genres/nigeria.jpg') },
  { id: 'afro', name: 'Afro Gospel', search: 'Afro gospel songs', icon: 'radio-outline', color: '#B91C1C', photo: require('../../assets/genres/afro.jpg') },
  { id: 'highlife', name: 'Highlife Gospel', search: 'highlife gospel songs', icon: 'disc-outline', color: '#BE185D', photo: require('../../assets/genres/highlife.jpg') },
  { id: 'hymns', name: 'Hymns', search: 'hymns', icon: 'book-outline', color: '#1D4ED8', photo: require('../../assets/genres/hymns.jpg') },
  { id: 'choir', name: 'Choir', search: 'gospel choir songs', icon: 'people-outline', color: '#0E7490', photo: require('../../assets/genres/choir.jpg') },
  { id: 'ccm', name: 'Contemporary Christian', search: 'contemporary Christian songs', icon: 'headset-outline', color: '#4338CA', photo: require('../../assets/genres/ccm.jpg') },
  { id: 'rap', name: 'Gospel Rap', search: 'gospel rap songs', icon: 'mic-outline', color: '#9A3412', photo: require('../../assets/genres/rap.jpg') },
  { id: 'instrumental', name: 'Instrumental', search: 'instrumental worship music', icon: 'musical-note-outline', color: '#0F766E', photo: require('../../assets/genres/instrumental.jpg') },
  { id: 'sermons', name: 'Sermons', search: 'sermons', icon: 'chatbubbles-outline', color: '#7E22CE', photo: require('../../assets/genres/sermons.jpg') }
];

export const ARTISTS = [
  { name: 'Joe Mettle', from: 'Ghana' },
  { name: 'Diana Hamilton', from: 'Ghana' },
  { name: 'Piesie Esther', from: 'Ghana' },
  { name: 'Celestine Donkor', from: 'Ghana' },
  { name: 'Joyce Blessing', from: 'Ghana' },
  { name: 'MOGmusic', from: 'Ghana' },
  { name: 'Minister GUC', from: 'Nigeria' },
  { name: 'Nathaniel Bassey', from: 'Nigeria' },
  { name: 'Sinach', from: 'Nigeria' },
  { name: 'Mercy Chinwo', from: 'Nigeria' },
  { name: 'Moses Bliss', from: 'Nigeria' },
  { name: 'Dunsin Oyekan', from: 'Nigeria' },
  { name: 'Tope Alabi', from: 'Nigeria' },
  { name: 'Victoria Orenze', from: 'Nigeria' },
  { name: 'Ada Ehi', from: 'Nigeria' },
  { name: 'Frank Edwards', from: 'Nigeria' },
  { name: 'Maverick City Music', from: 'USA' },
  { name: 'Elevation Worship', from: 'USA' },
  { name: 'CeCe Winans', from: 'USA' },
  { name: 'Brandon Lake', from: 'USA' },
  { name: 'Tasha Cobbs Leonard', from: 'USA' },
  { name: 'Hillsong Worship', from: 'Australia' }
];

/** "latest Ghana gospel songs 2026" — the newest songs on YouTube */
export function latestSongsSearch(what, year = new Date().getFullYear()) {
  return `latest ${what} ${year}`.replace(/\s+/g, ' ').trim();
}

export function artistSearch(name, year = new Date().getFullYear()) {
  return latestSongsSearch(`${name} songs`, year);
}
