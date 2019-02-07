"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pegGrammar = require("./Grammar/dist/Grammar");
var Grammar;
(function (Grammar) {
    function parse(input, startRule) {
        var options = { startRule: startRule };
        try {
            pegGrammar.parse(input, options);
        }
        catch (e) {
            options.data = -1;
        }
        return options.data;
    }
    Grammar.parse = parse;
    /**
     * Parse the given string and returns a SIP.NameAddrHeader instance or undefined if
     * it is an invalid NameAddrHeader.
     * @public
     * @param {String} name_addr_header
     */
    function nameAddrHeaderParse(nameAddrHeader) {
        var parsedNameAddrHeader = Grammar.parse(nameAddrHeader, "Name_Addr_Header");
        return parsedNameAddrHeader !== -1 ? parsedNameAddrHeader : undefined;
    }
    Grammar.nameAddrHeaderParse = nameAddrHeaderParse;
    /**
     * Parse the given string and returns a SIP.URI instance or undefined if
     * it is an invalid URI.
     * @public
     * @param {String} uri
     */
    function URIParse(uri) {
        var parsedUri = Grammar.parse(uri, "SIP_URI");
        return parsedUri !== -1 ? parsedUri : undefined;
    }
    Grammar.URIParse = URIParse;
})(Grammar = exports.Grammar || (exports.Grammar = {}));
