# Selah on Google Play: what to fill in

Everything Google Play Console asks for, ready to copy. Graphics are in this folder:
`icon-512.png` (App icon) and `feature-graphic.png` (Feature graphic).

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
• Shows each song's real title, artist and album art, read from inside the file
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
• Sleep timer with a gentle fade-out, and calming background sounds for prayer and rest

A VERSE FOR EVERY DAY
• Verse of the day with a short thought, and a song for today from your own music
• An optional daily reminder at the time you choose

WORSHIP VIDEOS
• Search and watch worship videos with the built-in YouTube player

MADE WITH CARE
• Light and dark mode
• No ads. No tracking.
```

Add this part to the description **only once Selah Premium is live** (Vercel + payments set up):
```
SELAH PREMIUM (optional subscription)
• Back up your playlists, loved songs and the lyrics you typed to your Selah account
• Get them back on a new phone just by logging in
• Automatic daily backup
```

**Category:** Music & Audio
**Tags:** Music player, Offline music, Lyrics
**Contact email:** your support email (required, shown publicly)
**Privacy policy:** `https://YOUR-PROJECT.vercel.app/privacy` (needs the Vercel backend live)

**Screenshots** (2 to 8, phone): take them on your Android phone once the app is installed.
Suggested: Home (Today card) · Now Playing · synced Lyrics · My Songs with covers · Playlists (smart lists) · YouTube.

**Release notes for 1.0.0**
```
Welcome to Selah: your worship music player with synced lyrics, album art, smart playlists, daily verses and a sleep timer.
```

---

## App content (Policy › App content)

**Ads:** No, the app has no ads.

**App access:** All functionality is available without special access.
(Once accounts and Premium are live: give Google a test account with Premium gifted. See the selah-api README, "Gift Premium".)

**Target audience:** 13 and over (13–15, 16–17, 18+). Not designed for children.

**Content rating questionnaire:** category "All other app types". Answer *No* to violence, sexual content, language,
drugs and gambling. Answer *Yes* to "unrestricted internet access" (the YouTube search shows any public video).
Once accounts are live: *Yes* to "users can share content" (shared lyrics) and *Yes* to digital purchases (Premium).

**Foreground service** (Android 14+ declaration): type **Media playback**.
Description: "Selah keeps playing your music when the screen is off or you switch apps, with play/pause and skip
controls in the notification." Google may ask for a short screen recording that shows this.

**Data safety** (this is my reading of Google's rules; check each answer as you fill it in):

*This first version (accounts not switched on):*
- Data collected: **App activity › In-app search history.** YouTube searches are sent to YouTube to show results;
  Selah does not keep them. Processed ephemerally: Yes. Optional: Yes. Purpose: App functionality.
- Data shared with third parties: None.
- Encrypted in transit: Yes.

*Once accounts and Premium are live, add:*
- **Personal info › Name, Email address:** collected, required for an account, for Account management and App functionality.
- **App activity › Other user-generated content** (backups of playlists and typed lyrics, shared lyrics) and
  **App interactions** (play counts in backups): collected, optional, App functionality.
- **Financial info › Purchase history** (Premium subscription, via Google Play and RevenueCat): App functionality.
- People can ask for their data to be deleted: **Yes**, in the app (Account & Backup › Delete my account) and at
  `https://YOUR-PROJECT.vercel.app/delete-account`.

---

## Before going to Production

- [ ] Vercel backend live (privacy policy URL; and the delete-account page once accounts are in the app)
- [ ] Internal testing first: install from the Play Store test link and try it on a few phones
- [ ] Screenshots taken on Android
- [ ] For Premium: subscription created in Play Console, RevenueCat connected, keys added
- [ ] Remove `PREMIUM_MODE=open` from Vercel before Premium goes on sale

### Known risk to keep an eye on
Selah's YouTube search reads YouTube's search page directly. YouTube's rules prefer its official
YouTube Data API. If Google or YouTube ever object, switch the search to the official API: it needs a free key from
Google Cloud and has a limited number of searches per day.
