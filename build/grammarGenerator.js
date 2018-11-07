"use strict";

const fs = require("fs"),
    pegjs = require("pegjs");
    //tspegjs = require("ts-pegjs");

const thisFolder = "./src/Grammar",
    inputFile = thisFolder + "/src/Grammar.pegjs",
    outputFolder = thisFolder + "/dist",
    outputFile = outputFolder + "/Grammar.js";

const grammarContents = fs.readFileSync(inputFile, "utf8");

const parser = pegjs.generate(grammarContents, {
  allowedStartRules: [
    "Contact",
    "Name_Addr_Header",
    "Record_Route",
    "Request_Response",
    "SIP_URI",
    "Subscription_State",
    "Supported",
    "Require",
    "Via",
    "absoluteURI",
    "Call_ID",
    "Content_Disposition",
    "Content_Length",
    "Content_Type",
    "CSeq",
    "displayName",
    "Event",
    "From",
    "host",
    "Max_Forwards",
    "Min_SE",
    "Proxy_Authenticate",
    "quoted_string",
    "Refer_To",
    "Replaces",
    "Session_Expires",
    "stun_URI",
    "To",
    "turn_URI",
    "uuid",
    "WWW_Authenticate",
    "challenge",
    "sipfrag",
    "Referred_By"
  ],
  output: "source",
  format: "umd",
  exportVar: "SIP.Grammar",
  optimize: "size",
  /* TODO - we want this eventually, but right now it produces ts that makes tsc unhappy
  plugins: [tspegjs],
  "tspegjs": {
    "noTslint": false,
  }
  */
});

if (!fs.existsSync(outputFolder)){
  fs.mkdirSync(outputFolder);
}

fs.writeFile(outputFile, parser, err => {
  if (err) {
    console.log(err);
  } else {
    console.log("Grammar successfully generated.");
  }
});
