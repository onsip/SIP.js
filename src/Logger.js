
module.exports = (function() {

var Logger = function(logger, category, label) {
  this.logger = logger;
  this.category = category;
  this.label = label;
};

['error', 'warn', 'log', 'debug'].forEach(function (method) {
  Logger.prototype[method] = function (content) {
    this.logger[method](this.category, this.label, content);
  };
});

return Logger;
})();
