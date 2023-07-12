#!/usr/bin/env node

const fs = require('fs')

const bundle = JSON.parse(fs.readFileSync('proton-bundle.json'))

console.log(bundle.libraryGlobals['@cosmith/adalo-native-camera']['NativeCameraComponent'][process.argv[2]]);