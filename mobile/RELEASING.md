# Releasing Selah

Plain steps for every release: a test APK, the Play Store, instant updates, version 2, and the
iPhone later. Run every command inside the `mobile` folder.

---

## The version number

- `version` in `app.json` is what people see (**1.0.0** now). Version 2 will be **2.0.0**.
- The build number goes up by itself on every Play Store build (Expo keeps track of it).
- The menu in the app shows the version (Selah 1.0.0), so you can always tell what a phone is running.

## 1. Test on your phone (APK)

```bash
eas build -p android --profile preview
```

When it finishes, open the link on your Android phone and install it. It installs over the old one;
your songs and settings stay.

## 2. Play Store (app bundle)

```bash
eas build -p android --profile production
```

1. Download the `.aab` file from the link.
2. Play Console › your app › Testing › **Internal testing** › Create new release › upload the `.aab`.
3. Install it from the internal-testing link and try it on a few phones.
4. When it is good: Promote release › **Production**.

The first time, fill in the store listing and the App content forms: everything is ready to copy in
`store/listing.md`.

## 3. Small fixes without the Play Store (instant updates)

For changes to Selah's own code only: screens, wording, verses, bug fixes.

```bash
eas update --channel production --message "What changed"
```

- Phones download it in the background the next time Selah opens, and use it from the next start.
- Updates for test APKs: use `--channel preview` instead.
- An update only reaches phones running the **same version** it was made for (1.0.0 updates reach 1.0.0).
- **Tell people what changed:** add a new entry at the top of `src/data/whatsNew.js` with a new `id`
  (for example `1.0.0-2`). Everyone sees it once, the first time Selah opens with the update.
  Small fixes nobody needs to hear about: skip this step.

**Not by instant update** (these need a new version number and a new Play Store build):

- adding or upgrading a library with phone code (anything installed with `npx expo install`)
- changing `app.json`: permissions, plugins, icons, splash, app name
- upgrading Expo

If you are not sure, build a test APK.

## 4. Version 2

What version 2 adds, and what each part needs:

1. **Push notifications** (your messages to everyone, birthday wishes)
   - A free Firebase project → its `google-services.json` file → `android.googleServicesFile` in `app.json`
   - The Firebase key uploaded to Expo (`eas credentials`)
   - Selah server: save each phone's push token; a private page to send a message; a birthday field in the
     account and a daily job that sends the wishes
2. **Premium payments**
   - Play Console: create the subscription
   - RevenueCat: connect Google Play; put the public Android key in `app.json` → `extra.revenueCatAndroidKey`
   - Vercel: add `REVENUECAT_SECRET_KEY`, then remove `PREMIUM_MODE=open` (until then backup is free for everyone)
   - Store listing: add the Premium part; Data safety: Purchase history; content rating: digital purchases Yes
3. Change `version` in `app.json` to **2.0.0**, build a test APK, then the Play Store version.

## 5. iPhone and the App Store (after Android)

- Needs an Apple Developer account (99 USD a year).
- Build and send to Apple:
  ```bash
  eas build -p ios --profile production
  eas submit -p ios
  ```
  Expo creates the Apple certificates. Test it in TestFlight first, then send it for App Store review.
- Differences on iPhone: no small video window (picture-in-picture is Android only); songs come from the
  Files app (On My iPhone › Selah).
- App Store needs: screenshots from a large iPhone, the privacy policy link, and the App Privacy answers
  (the same facts as Google's Data safety in `store/listing.md`).

## Rules that keep builds working

- **Commit everything before building.** Expo refuses to build with unsaved changes.
- **Never set `EAS_NO_VCS`.** The project folder name ends with a space, and that mode breaks on it.
- The signing key is kept by Expo for the account **lexiswonders**. Keep that account safe.
  Google Play App Signing keeps the key Google uses for the store.
- Run the tests before a release: `npx jest` here, and `npm test` in `selah-api`.
- Server settings (Vercel) are listed in `selah-api/README.md`. YouTube search needs `YOUTUBE_API_KEY`
  there; the health link below shows `youtube: ready` once it is set.
- Before each Play Store release, read `store/policy-check.md` again (every Google Play and YouTube rule).

## Links

- Privacy policy: https://selah-music-player-selah-api.vercel.app/privacy
- Delete account: https://selah-music-player-selah-api.vercel.app/delete-account
- Server health: https://selah-music-player-selah-api.vercel.app/api/health
