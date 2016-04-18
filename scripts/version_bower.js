#!/usr/bin/env node
"use strict";

// This is run during `npm version`, to update the version in bower.json
// See https://github.com/onsip/SIP.js/pull/310#issuecomment-209517244
var fs = require("fs");
var npm_version = JSON.parse(fs.readFileSync("package.json")).version;
var bower_json = JSON.parse(fs.readFileSync("bower.json"));
bower_json.version = npm_version;
fs.writeFileSync("bower.json", JSON.stringify(bower_json, null, 2));
