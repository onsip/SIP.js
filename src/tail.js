if (typeof module === "object" && module && typeof module.exports === "object") {
  // Expose SIP as module.exports in loaders that implement the Node
  // module pattern (including browserify). Do not create the global, since
  // the user will be storing it themselves locally, and globals are frowned
  // upon in the Node module world.
  module.exports = SIP;
} else {
  // Otherwise expose SIP to the global object as usual.
  window.SIP = SIP;
  
  // Register as a named AMD module, since SIP can be concatenated with other
  // files that may use define, but not via a proper concatenation script that
  // understands anonymous AMD modules. A named AMD is safest and most robust
  // way to register. Lowercase sip is used because AMD module names are
  // derived from file names, and SIP is normally delivered in a lowercase
  // file name.
  if (typeof define === "function" && define.amd) {
    define("sip", [], function () { return SIP; });
  }
}

})(window);