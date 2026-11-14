# Selah: Google Play and YouTube rules check

Checked 14 November 2026 against Google Play's Developer Program Policies and YouTube's API Services
rules (Developer Policies and Required Minimum Functionality).

✅ follows the rule · ⚠️ a risk the owner chose to accept · ☐ still to do

---

## Google Play

| Rule | | What Selah does |
| --- | --- | --- |
| Privacy policy in the listing and in the app | ✅ | `/privacy` on the Selah server; linked from the menu and the account screen |
| Delete your account, in the app and on the web | ✅ | Account › Delete my account, and `/delete-account` |
| Data safety form matches what the app does | ✅ | Answers ready in `listing.md` (accounts, backups, shared lyrics, reports, YouTube searches) |
| Only the permissions the app needs | ✅ | Music files, notifications, background music playback. Camera roll, microphone, drawing over apps are blocked |
| Foreground service declaration (Android 14+) | ☐ | Fill the form in Play Console: type *Media playback* (text in `listing.md`) |
| Target audience | ✅ | 13 and over; not designed for children |
| Things users share (shared lyrics) | ✅ | Rules accepted before the first share; what is not allowed is written in `/terms`; report lyrics or the person; hide a person; lyrics or people reported by 3 people are hidden automatically; deleting an account removes everything |
| Honest store listing | ✅ | Plain description; YouTube mentioned only as the official player; no YouTube logo in the icon |
| Ads and payments | ✅ | No ads. Nothing sold in version 1 (Premium in version 2 will use Google Play Billing) |
| Updates only through Google Play | ✅ | Instant updates change only Selah's own JavaScript, which Google allows; no code is downloaded |
| Notifications | ✅ | The daily reminder is off until you turn it on, at a time you choose |
| Target API level, 64-bit, 16 KB memory pages | ✅ | Expo SDK 58 |
| Content rating questionnaire | ☐ | Fill it in Play Console (answers in `listing.md`) |

### Other people's rights

| Content | | |
| --- | --- | --- |
| Bible verses | ✅ | King James Version (public domain) |
| Song photos | ✅ | Unsplash (free to use in apps) |
| Genre photos in Libraries | ✅ | 12 free Unsplash photos inside the app: not Unsplash+, no recognizable faces, no logos. List with photographers: `assets/genres/CREDITS.md` |
| Artist pictures | ✅ | Each artist's own YouTube channel picture, through YouTube's official service (see the YouTube rules below). Not Deezer: its rules forbid apps that earn money. No pictures copied from other websites |
| YouTube videos | ✅ | Official player and official search; Selah never downloads videos |
| Lyrics from LRCLIB | ⚠️ | Song lyrics belong to their writers. LRCLIB is a community library many music apps use. If a writer or publisher complains, remove that song's lyrics; a licensed lyrics service (for example Musixmatch) is the long-term answer |

---

## YouTube (YouTube API Services)

| Rule | | What Selah does |
| --- | --- | --- |
| Use the official API, never read YouTube's website | ✅ | Search goes through the Selah server to the YouTube Data API. ☐ Add `YOUTUBE_API_KEY` in Vercel: search shows nothing until then |
| No unofficial Google services | ✅ | The search-suggestion address was removed |
| Player at least 200 × 200 | ✅ | The player is never less than 200 high |
| A video picture that starts a video: at least 120 × 70 | ✅ | Search results show 128 × 72; smaller spots show a red play tile instead of the picture |
| Users agree to YouTube's Terms; Google's Privacy Policy linked | ✅ | In `/terms`, `/privacy` and at the bottom of the YouTube tab |
| Stored YouTube details: at most 30 days | ✅ | Saved videos are checked again after 25 days (fresh details; removed videos dropped). Backups keep only video IDs. The server forgets searches after 12 hours and deletes them after 2 days. Artist pictures: asked again after 25 days, never shown after 30 |
| Say when something comes from YouTube | ✅ | Libraries: "Pictures from the artists' YouTube channels" with the YouTube logo; Home: "pictures from YouTube" |
| Do not change, cover or block the player | ✅ | Play and pause use the player's own documented functions; nothing covers the player |
| Autoplay only when the player can be seen | ✅ | Videos start when you tap them on the YouTube tab |
| **No playing from a player that is not on screen** | ⚠️ | **Accepted by the owner.** When you leave the YouTube tab for another tab, the video keeps playing with the player hidden. YouTube's rule III.I.9 forbids this. If YouTube or Google objects: pause the video when you leave the YouTube tab (one small change) |
| **Picture-in-picture window size** | ⚠️ | **Accepted by the owner.** Android's small window can be smaller than 200 × 200. If YouTube objects: remove the small window |
| Daily allowance | ☐ | 10,000 free units a day (about 100 new searches; repeated searches are free for 12 hours). When Selah grows, ask Google for more (a free YouTube compliance check) |

---

## Before uploading to Google Play

1. Add `YOUTUBE_API_KEY` in Vercel (see `selah-api/README.md`), then check `/api/health` shows `youtube: ready`.
2. Build the test APK, try everything, then build the Play Store version (`../RELEASING.md`).
3. Play Console: store listing, Data safety, content rating, target audience, foreground service, app access,
   privacy policy link (all in `listing.md`).
4. Internal testing first, then production.
