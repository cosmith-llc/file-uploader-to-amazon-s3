#!/bin/bash
set -e
set -x

project_path=$(pwd)
name=$PROJECT_NAME
dir=$(dirname "${0}")

micUsageDescriptionText=$("${dir}/get_uri_data.js" micUsageTextOnIOS) 

echo $overrideMicUsageDescriptionText
echo $micUsageDescriptionText

alias react-native="$(pwd)/node_modules/.bin/react-native"

yarn add react-native-camera

if grep -q "<key>NSMicrophoneUsageDescription" ios/$name/Info.plist; then
  echo "Mic already supported, nothing to do here."
  #plutil -replace NSMicrophoneUsageDescription -string "$micUsageDescriptionText" ios/$name/Info.plist
else 
  if [ ! -z "$micUsageDescriptionText" -a "$micUsageDescriptionText" != " " ]; then
      #plutil -insert NSMicrophoneUsageDescription -string "Some text #5" ios/$name/Info.plist
      plutil -insert NSMicrophoneUsageDescription -string "$micUsageDescriptionText" ios/$name/Info.plist
  else 
      plutil -insert NSMicrophoneUsageDescription -string "This app needs access to microphone to share your audio" ios/$name/Info.plist
  fi
fi

#if grep -q "<key>NSCameraUsageDescription" ios/$name/Info.plist; then
#  echo "Camera already supported, nothing to do here."
#  plutil -replace NSCameraUsageDescription -string "Camera already supported, nothing to do here." ios/$name/Info.plist
#else
#  plutil -insert NSCameraUsageDescription -string "This app needs access to camera to share video" ios/$name/Info.plist
#fi

cd ios

pod install

cd ..
