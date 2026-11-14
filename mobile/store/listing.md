# Selah on Google Play: what to fill in

Everything Google Play Console asks for, ready to copy. Graphics are in this folder:
`icon-512.png` (App icon) and `feature-graphic.png` (Feature graphic).
How to build and upload: see `../RELEASING.md`.

---

## Main store listing

**App name** (30 max)
```
Selah: Worship Music Player
```

**Short description** (80 max)
```
Play every song on your phone with synced lyrics, daily verses and no ads.
```

**Full description** (4000 max)
```
Selah is a beautiful music player for the songs on your phone, made for worship.

PLAYS ALL YOUR MUSIC
• Finds every song on your phone: MP3, M4A, FLAC, WAV, OGG, Opus and more, in every folder and on your SD card
• Shows each song's real title, artist and album art, read from inside the file. Songs without art get their own colourful cover
• A detailed scan finds songs other players miss
• Works offline. Your music never leaves your phone

LYRICS THAT FOLLOW THE SONG
• Synced lyrics that scroll with the music
• Add your own lyrics, adjust the timing and the text size
• Share a lyric line as a beautiful picture

SMART AND PERSONAL
• Continue listening: long sermons and worship sets carry on where you stopped
• Smart playlists: most played, recently added, never played, sermons and long worship
• Your own playlists and loved songs
• Repeat one or all, shuffle, playback speed, crossfade
• Sleep timer with a gentle fade-out

A VERSE FOR EVERY DAY
• A Bible verse for every day of the year (King James Version), with a short thought
• A song for today from your own music
• An optional daily reminder at the time you choose

DISCOVER
• Browse genres: Worship, Praise, Ghana Gospel, Nigerian Gospel, Highlife Gospel, Hymns, Choir and more
• Follow your favourite gospel artists and see their latest songs

WORSHIP VIDEOS
• Search and watch worship videos with the official YouTube player
• Keep watching in a small window while you use other apps

YOUR FREE SELAH ACCOUNT (optional)
• Back up your playlists, loved songs, followed artists and the lyrics you typed
• Get them back on a new phone just by logging in. Songs that are not on the new phone are listed, so you can find them again
• Share lyrics with other Selah users

MADE WITH CARE
• Light and dark mode
• No ads. No tracking.
```

**Category:** Music & Audio
**Tags:** Music player, Offline music, Lyrics
**Contact email:** awonders001@gmail.com (shown publicly; change it if you prefer another)
**Privacy policy:** `https://selah-music-player-selah-api.vercel.app/privacy`

**Screenshots** (2 to 8, phone): take them on your Android phone once the app is installed.
Suggested: Home (Today card) · Now Playing · synced Lyrics · My Songs with covers · Libraries (genres and artists) ·
YouTube · Account & Backup.

**Release notes for 1.0.0**
```
Welcome to Selah: play all your music with synced lyrics and album art, a Bible verse for every day, worship videos, gospel artists to follow, and a free account that backs up your playlists.
```

---

## App content (Policy › App content)

**Ads:** No, the app has no ads.

**App access:** The account is optional and free, so choose *All functionality is available without special access*.
If Google asks for a login, create a test account in the app and give them its email and password.

**Target audience:** 13 and over (13–15, 16–17, 18+). Not designed for children.

**Content rating questionnaire:** category "All other app types". Answer *No* to violence, sexual content, language,
drugs and gambling. Answer *Yes* to "unrestricted internet access" (the YouTube search shows any public video) and
*Yes* to "users can share content" (shared lyrics). Digital purchases: *No* (Premium is not on sale in version 1).

**Foreground service** (Android 14+ declaration): type **Media playback**.
Description: "Selah keeps playing your music when the screen is off or you switch apps, with play/pause and skip
controls in the notification." Google may ask for a short screen recording that shows this.

**Data safety** (this is my reading of Google's rules; check each answer as you fill it in):

- **Personal info › Name, Email address:** collected; optional (only if you create an account);
  for Account management and App functionality. Not shared.
- **App activity › Other user-generated content:** backups (playlists, loved songs, followed artists, typed lyrics)
  and shared lyrics. Collected; optional; App functionality.
- **App activity › App interactions:** play counts inside backups. Collected; optional; App functionality.
- **App activity › In-app search history:** YouTube searches go through the Selah server to YouTube's official
  search. The server remembers recent searches for up to a day (not linked to anyone) and then deletes them.
  Not linked to you; App functionality.
- **App activity › Other actions:** reports of shared lyrics or of the person who shared them, and accepting the
  sharing rules (stored with your account). Collected; optional; Fraud prevention, security and compliance.
- Song titles and artists are sent to look up lyrics (lrclib.net and the Selah server). Not stored, not linked to you.
- Data shared with third parties: none.
- Encrypted in transit: Yes.
- People can ask for their data to be deleted: **Yes**, in the app (Account & Backup › Delete my account) and at
  `https://selah-music-player-selah-api.vercel.app/delete-account` (Google asks for this link).

---

## Before going to Production

- [x] Selah server live (privacy policy and delete-account pages work)
- [ ] Internal testing first: install from the Play Store test link and try it on a few phones
- [ ] Screenshots taken on Android
- [ ] App content forms filled in (above)

Version 2 (push notifications, Premium payments) and the iPhone: see `../RELEASING.md`.

### Known risk to keep an eye on
Selah's YouTube search reads YouTube's search page directly. YouTube's rules prefer its official
YouTube Data API. If Google or YouTube ever object, switch the search to the official API: it needs a free key from
Google Cloud and has a limited number of searches per day.
