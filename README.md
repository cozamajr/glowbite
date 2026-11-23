# 🥝 GlowBite

A round, bubbly, neon-accented food and hydration tracker for Android, built with React + Capacitor.

## Download

**[Download the latest preview APK](https://github.com/cozamajr/glowbite/releases/download/preview/GlowBite-debug.apk)**

The [Android workflow](https://github.com/cozamajr/glowbite/actions/workflows/build-apk.yml) compiles a debug APK on GitHub-hosted runners and publishes it as a GitHub release asset.

> **Preview install warning:** The GitHub-hosted debug builds currently use ephemeral signing keys. Android may refuse to install a later preview over an earlier one. Export your GlowBite backup before uninstalling an earlier APK; uninstalling generally deletes its on-device data. Persistent release signing is planned.

## Features (v0.2)

- **Home:** glowing calorie ring, macro targets, quick actions, hydration and daily meals.
- **Diary:** day-by-day breakfast/lunch/dinner/snacks, adjustable portions, edit/remove logs, hydration.
- **Batch meal logging:** tap any meal, select as many foods as you want, set servings, then tap **Done** once.
- **Personal food library:** create/edit/delete foods independently from the meal logger.
- **Food photography:** take a picture using the native camera or upload a photo; local photos stored on-device with IndexedDB.
- **Barcode scanning:** camera barcode scanner (ZXing on Android) plus numeric barcode lookup.
- **Search foods online:** Open Food Facts product names, nutrition, serving sizes and optional images.
- **Profile:** display name, current weight, daily calorie/macronutrient and water goals, optional calories-burned goal.
- **Settings:** dark/light mode, four accent colors, three home-card banners, custom welcome subtitle, export/import, sample-data cleanup, local reset.
- **Insights:** daily macro chart, seven-day calorie chart and progress cards.

All nutrition from the Open Food Facts public/community database should be checked for accuracy and completeness; scanned product data is not guaranteed to be complete. Users can edit imported food items. Online searches need internet access. No login is required.

## Local data and backups

Daily entries, custom food details, profile and preferences are stored locally in the app's WebView storage. User-uploaded photos are stored locally in IndexedDB. **Nothing is automatically synchronized between phones or computers.**

The settings screen exports a JSON backup that includes pictures. Import restores an exported v0.2 backup and can also read the raw JSON exports from GlowBite v0.1. Import replaces current local app data, so export first.

Resetting or uninstalling may destroy local data.

## Development

Node.js 22+ and JDK 21/Android SDK for native Android builds:

```bash
npm install
npm run dev
npm run build
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

On Android, the barcode scanner requires minimum SDK **26**; the GitHub Actions build adjusts `android/variables.gradle` automatically.

## Project boundaries

GlowBite is an early preview, not a medical-grade nutrition tool. AI photo-to-nutrition estimation and cloud profile synchronization are not implemented. A phone's camera is necessary for camera scanning; manual barcode entry and image upload remain available without one.

## Food data attribution

Search and barcode lookup use [Open Food Facts](https://world.openfoodfacts.org/). Open Food Facts product data is made available by contributors under the **ODbL**; product images may have separate **Creative Commons BY-SA** terms. Please follow the project's attribution and license requirements when redistributing its data/images.
