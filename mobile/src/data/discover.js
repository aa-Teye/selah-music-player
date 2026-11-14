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

// youtube: the artist's own YouTube channel (its ID, or its @handle), for the artist's picture.
// Found in Wikidata, MusicBrainz and the artists' official channel pages.
export const ARTISTS = [
  { name: 'Joe Mettle', from: 'Ghana', youtube: '@JoeMettleMinistries' },
  { name: 'Diana Hamilton', from: 'Ghana', youtube: 'UC7HM1dGmRQC9Nu7rQOEZbow' },
  { name: 'Piesie Esther', from: 'Ghana', youtube: 'UCli_QDorO9szrEomXPNko3A' },
  { name: 'Celestine Donkor', from: 'Ghana', youtube: 'UCXUtc8Yz8vHcWEZZO45gs3Q' },
  { name: 'Joyce Blessing', from: 'Ghana', youtube: 'UC_M7G5ahHJzMS-C6A1tI8XA' },
  { name: 'MOGmusic', from: 'Ghana', youtube: '@MOGMusic' },
  { name: 'Minister GUC', from: 'Nigeria', youtube: '@ministerguc' },
  { name: 'Nathaniel Bassey', from: 'Nigeria', youtube: 'UCRe2Ir9wtPk_YQjElam7n2w' },
  { name: 'Sinach', from: 'Nigeria', youtube: 'UCcaV40yrjS5R88xYHxK_0rA' },
  { name: 'Mercy Chinwo', from: 'Nigeria', youtube: 'UCtIRyuESlnOflQCpmk-fHUw' },
  { name: 'Moses Bliss', from: 'Nigeria', youtube: 'UCv88VZJUuRoot7GfSO_sm-g' },
  { name: 'Dunsin Oyekan', from: 'Nigeria', youtube: 'UC9unpsMUkOGDIMraqBfZtYg' },
  { name: 'Tope Alabi', from: 'Nigeria', youtube: 'UCSso6ynLza_BKtcqMDzK-MQ' },
  { name: 'Victoria Orenze', from: 'Nigeria', youtube: 'UCo9_ALYi0IYcMn7K84YFTzw' },
  { name: 'Ada Ehi', from: 'Nigeria', youtube: 'UCpM0LdoSSvRgW-AqBTOhKow' },
  { name: 'Frank Edwards', from: 'Nigeria', youtube: 'UCWhUxVq72zmbcWlm9uguLPg' },
  { name: 'Maverick City Music', from: 'USA', youtube: 'UCd_Cl1RdIJ99lqFLjqlI27w' },
  { name: 'Elevation Worship', from: 'USA', youtube: 'UCSf-NCzjwcnXErUBW_qeFvA' },
  { name: 'CeCe Winans', from: 'USA', youtube: 'UC86Zlc-v_kkZ-yKG2cJZkxQ' },
  { name: 'Brandon Lake', from: 'USA', youtube: 'UCUvrv1Ox5rRwzG-SHCN7zrg' },
  { name: 'Tasha Cobbs Leonard', from: 'USA', youtube: 'UC8aCcbdR6hWfeynEmrguPyg' },
  { name: 'Hillsong Worship', from: 'Australia', youtube: 'UC4q12NoPNySbVqwpw4iO5Vg' }
];

/** "latest Ghana gospel songs 2026" — the newest songs on YouTube */
export function latestSongsSearch(what, year = new Date().getFullYear()) {
  return `latest ${what} ${year}`.replace(/\s+/g, ' ').trim();
}

export function artistSearch(name, year = new Date().getFullYear()) {
  return latestSongsSearch(`${name} songs`, year);
}
