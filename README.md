# EnRuta V2

## Prerequisites
- [Node.js](https://nodejs.org) and npm (Recommended: Use [nvm](https://github.com/nvm-sh/nvm)).
- [React Native](https://reactnative.dev/docs/set-up-your-environment).
- [Android Studio and Android SDK](https://developer.android.com/studio).
- [Strcpy](https://github.com/Genymobile/scrcpy) to display and control of Android devices connected via USB.

## Installation
Clone the [repository](https://github.com/buriti8/buritv_mobile.git)

Install all the dependencies using yarn

    yarn install

## Android Studio
Open the `android` folder in Android Studio and let it sync the Gradle files.
Clean and Clean and Rebuild the project to ensure all dependencies are correctly set up.

Open Settings > Build Tools > Gradle > Set Gradle JDK:
- `JetBrains Runtime 21.0.10`
- `C:\Program Files\Android\Android Studio\jbr`

Open Settings > Languages & Frameworks > Android SDK > SDK Platforms > Show Package Details > Install the following components:

- Android 16.0 ("Baklava"):
    - Android SDK Platform 36
    - Sources for Android 36
    - Intel x86_64 Atom System Image
    - Google APIs ARM 64 v8a System Image
    - Google APIs Intel x86_64 Atom System Image
    - Google Play ARM 64 v8a System Image
    - Google Play Intel x86_64 Atom System Image
    - Pre-Release 16 KB Page Size Google Play Intel x86_64 Atom System Image

- Android 15.0 ("VanillaIceCream"):
    - Android SDK Platform 35
    - Sources for Android 35

## Execution

    npx react-native run-android --port=1234

## Remote Update

- [Hot Updater](https://hot-updater.dev/docs/guides/deploy)

### Validate environment

    android/app/src/main/res/values/strings.xml
    
    .env.hotupdater

### Release an update

#### Android

    yarn hot-updater deploy -m '' -f -p android -t 4.3.2 -c "enruta_v2_production"

#### iOS

    yarn hot-updater deploy -m '' -f -p ios -t 4.3.2 -c "enruta_v2_production"

### Visualize the update

    npx hot-updater console