// Console is not defined in ECMAScript, so just in case...
module.exports = global.console || {
  debug: function () {},
  log: function () {},
  warn: function () {},
  error: function () {}
};
