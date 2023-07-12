#!/bin/bash
set -e
set -x

project_path=$(pwd)
name=$PROJECT_NAME
dir=$(dirname "${0}")

alias react-native="$(pwd)/node_modules/.bin/react-native"

yarn add react-native-camera

sed -i.bak '/rootProject.name/a\
\include ":react-native-camera"\
\project(":react-native-camera").projectDir = new File(rootProject.projectDir, 	"../node_modules/react-native-camera/android")
' android/settings.gradle

sed -i.bak '/defaultConfig {/a\
\ missingDimensionStrategy "react-native-camera", "general"
' android/app/build.gradle


sed -i.bak '/dependencies {/a\
\  implementation project(":react-native-camera")
' android/app/build.gradle


# AndroidManifest
cd android/app
cd src/main

cat <<EOF > /tmp/adalo-sed
    /android.permission.INTERNET/a\\
    <uses-permission android:name="android.permission.RECORD_AUDIO" />\
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />\
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />\\
EOF

sed -i.bak "$(cat /tmp/adalo-sed)" AndroidManifest.xml

if grep -q "usesCleartextTraffic" AndroidManifest.xml; then
    echo "usesCleartextTraffic already supported, nothing to do here."
else
    sed -i.bak 's/allowBackup=\"false\"/allowBackup="false" android:usesCleartextTraffic="true"/g' AndroidManifest.xml
fi

echo $BUNDLE_ID
app_path=$(echo ${BUNDLE_ID} | sed -e 's/\./\//g')

cd java/$app_path

sed -i.bak '/ReactActivity;/a\
import org.reactnative.camera.RNCameraPackage;
' MainActivity.java

echo "configured Android settings"
