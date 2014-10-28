var options = require('./peg.json');
var fs = require('fs');
var path = require('path').join(__dirname, './src/Grammar.pegjs');
var grammar = fs.readFileSync(path).toString();
var PEG = require('pegjs');
var Grammar = PEG.buildParser(grammar, options);

module.exports = Grammar;
