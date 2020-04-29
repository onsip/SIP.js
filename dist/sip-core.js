/*!
 * 
 *  SIP version 0.15.11
 *  Copyright (c) 2014-2020 Junction Networks, Inc <http://www.onsip.com>
 *  Homepage: https://sipjs.com
 *  License: https://sipjs.com/license/
 * 
 * 
 *  ~~~SIP.js contains substantial portions of JsSIP under the following license~~~
 *  Homepage: http://jssip.net
 *  Copyright (c) 2012-2013 José Luis Millán - Versatica <http://www.versatica.com>
 * 
 *  Permission is hereby granted, free of charge, to any person obtaining
 *  a copy of this software and associated documentation files (the
 *  "Software"), to deal in the Software without restriction, including
 *  without limitation the rights to use, copy, modify, merge, publish,
 *  distribute, sublicense, and/or sell copies of the Software, and to
 *  permit persons to whom the Software is furnished to do so, subject to
 *  the following conditions:
 * 
 *  The above copyright notice and this permission notice shall be
 *  included in all copies or substantial portions of the Software.
 * 
 *  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 *  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 *  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 *  NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 *  LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 *  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 *  WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * 
 *  ~~~ end JsSIP license ~~~
 * 
 * 
 * 
 * 
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["SIP"] = factory();
	else
		root["SIP"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 2);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */,
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__extends", function() { return __extends; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__assign", function() { return __assign; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__rest", function() { return __rest; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__decorate", function() { return __decorate; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__param", function() { return __param; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__metadata", function() { return __metadata; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__awaiter", function() { return __awaiter; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__generator", function() { return __generator; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__exportStar", function() { return __exportStar; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__values", function() { return __values; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__read", function() { return __read; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__spread", function() { return __spread; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__spreadArrays", function() { return __spreadArrays; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__await", function() { return __await; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__asyncGenerator", function() { return __asyncGenerator; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__asyncDelegator", function() { return __asyncDelegator; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__asyncValues", function() { return __asyncValues; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__makeTemplateObject", function() { return __makeTemplateObject; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__importStar", function() { return __importStar; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "__importDefault", function() { return __importDefault; });
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    }
    return __assign.apply(this, arguments);
}

function __rest(s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
}

function __decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
}

function __metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

function __exportStar(m, exports) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}

function __values(o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
}

function __read(o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
}

function __spread() {
    for (var ar = [], i = 0; i < arguments.length; i++)
        ar = ar.concat(__read(arguments[i]));
    return ar;
}

function __spreadArrays() {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};

function __await(v) {
    return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
    var i, p;
    return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
    function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: n === "return" } : f ? f(v) : v; } : f; }
}

function __asyncValues(o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

function __makeTemplateObject(cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};

function __importStar(mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result.default = mod;
    return result;
}

function __importDefault(mod) {
    return (mod && mod.__esModule) ? mod : { default: mod };
}


/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

/**
 * A core library implementing low level SIP protocol elements.
 * @packageDocumentation
 */
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
// Directories
tslib_1.__exportStar(__webpack_require__(3), exports);
tslib_1.__exportStar(__webpack_require__(32), exports);
tslib_1.__exportStar(__webpack_require__(63), exports);
tslib_1.__exportStar(__webpack_require__(5), exports);
tslib_1.__exportStar(__webpack_require__(25), exports);
tslib_1.__exportStar(__webpack_require__(59), exports);
tslib_1.__exportStar(__webpack_require__(28), exports);
tslib_1.__exportStar(__webpack_require__(67), exports);
tslib_1.__exportStar(__webpack_require__(69), exports);
// Files
tslib_1.__exportStar(__webpack_require__(27), exports);


/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
tslib_1.__exportStar(__webpack_require__(4), exports);
tslib_1.__exportStar(__webpack_require__(24), exports);
tslib_1.__exportStar(__webpack_require__(58), exports);


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var messages_1 = __webpack_require__(5);
/**
 * Dialog.
 * @remarks
 * A key concept for a user agent is that of a dialog.  A dialog
 * represents a peer-to-peer SIP relationship between two user agents
 * that persists for some time.  The dialog facilitates sequencing of
 * messages between the user agents and proper routing of requests
 * between both of them.  The dialog represents a context in which to
 * interpret SIP messages.
 * https://tools.ietf.org/html/rfc3261#section-12
 * @public
 */
var Dialog = /** @class */ (function () {
    /**
     * Dialog constructor.
     * @param core - User agent core.
     * @param dialogState - Initial dialog state.
     */
    function Dialog(core, dialogState) {
        this.core = core;
        this.dialogState = dialogState;
        this.core.dialogs.set(this.id, this);
    }
    /**
     * When a UAC receives a response that establishes a dialog, it
     * constructs the state of the dialog.  This state MUST be maintained
     * for the duration of the dialog.
     * https://tools.ietf.org/html/rfc3261#section-12.1.2
     * @param outgoingRequestMessage - Outgoing request message for dialog.
     * @param incomingResponseMessage - Incoming response message creating dialog.
     */
    Dialog.initialDialogStateForUserAgentClient = function (outgoingRequestMessage, incomingResponseMessage) {
        // If the request was sent over TLS, and the Request-URI contained a
        // SIPS URI, the "secure" flag is set to TRUE.
        // https://tools.ietf.org/html/rfc3261#section-12.1.2
        var secure = false; // FIXME: Currently no support for TLS.
        // The route set MUST be set to the list of URIs in the Record-Route
        // header field from the response, taken in reverse order and preserving
        // all URI parameters.  If no Record-Route header field is present in
        // the response, the route set MUST be set to the empty set.  This route
        // set, even if empty, overrides any pre-existing route set for future
        // requests in this dialog.  The remote target MUST be set to the URI
        // from the Contact header field of the response.
        // https://tools.ietf.org/html/rfc3261#section-12.1.2
        var routeSet = incomingResponseMessage.getHeaders("record-route").reverse();
        var contact = incomingResponseMessage.parseHeader("contact");
        if (!contact) { // TODO: Review to make sure this will never happen
            throw new Error("Contact undefined.");
        }
        if (!(contact instanceof messages_1.NameAddrHeader)) {
            throw new Error("Contact not instance of NameAddrHeader.");
        }
        var remoteTarget = contact.uri;
        // The local sequence number MUST be set to the value of the sequence
        // number in the CSeq header field of the request.  The remote sequence
        // number MUST be empty (it is established when the remote UA sends a
        // request within the dialog).  The call identifier component of the
        // dialog ID MUST be set to the value of the Call-ID in the request.
        // The local tag component of the dialog ID MUST be set to the tag in
        // the From field in the request, and the remote tag component of the
        // dialog ID MUST be set to the tag in the To field of the response.  A
        // UAC MUST be prepared to receive a response without a tag in the To
        // field, in which case the tag is considered to have a value of null.
        //
        //    This is to maintain backwards compatibility with RFC 2543, which
        //    did not mandate To tags.
        //
        // https://tools.ietf.org/html/rfc3261#section-12.1.2
        var localSequenceNumber = outgoingRequestMessage.cseq;
        var remoteSequenceNumber = undefined;
        var callId = outgoingRequestMessage.callId;
        var localTag = outgoingRequestMessage.fromTag;
        var remoteTag = incomingResponseMessage.toTag;
        if (!callId) { // TODO: Review to make sure this will never happen
            throw new Error("Call id undefined.");
        }
        if (!localTag) { // TODO: Review to make sure this will never happen
            throw new Error("From tag undefined.");
        }
        if (!remoteTag) { // TODO: Review to make sure this will never happen
            throw new Error("To tag undefined."); // FIXME: No backwards compatibility with RFC 2543
        }
        // The remote URI MUST be set to the URI in the To field, and the local
        // URI MUST be set to the URI in the From field.
        // https://tools.ietf.org/html/rfc3261#section-12.1.2
        if (!outgoingRequestMessage.from) { // TODO: Review to make sure this will never happen
            throw new Error("From undefined.");
        }
        if (!outgoingRequestMessage.to) { // TODO: Review to make sure this will never happen
            throw new Error("To undefined.");
        }
        var localURI = outgoingRequestMessage.from.uri;
        var remoteURI = outgoingRequestMessage.to.uri;
        // A dialog can also be in the "early" state, which occurs when it is
        // created with a provisional response, and then transition to the
        // "confirmed" state when a 2xx final response arrives.
        // https://tools.ietf.org/html/rfc3261#section-12
        if (!incomingResponseMessage.statusCode) {
            throw new Error("Incoming response status code undefined.");
        }
        var early = incomingResponseMessage.statusCode < 200 ? true : false;
        var dialogState = {
            id: callId + localTag + remoteTag,
            early: early,
            callId: callId,
            localTag: localTag,
            remoteTag: remoteTag,
            localSequenceNumber: localSequenceNumber,
            remoteSequenceNumber: remoteSequenceNumber,
            localURI: localURI,
            remoteURI: remoteURI,
            remoteTarget: remoteTarget,
            routeSet: routeSet,
            secure: secure
        };
        return dialogState;
    };
    /**
     * The UAS then constructs the state of the dialog.  This state MUST be
     * maintained for the duration of the dialog.
     * https://tools.ietf.org/html/rfc3261#section-12.1.1
     * @param incomingRequestMessage - Incoming request message creating dialog.
     * @param toTag - Tag in the To field in the response to the incoming request.
     */
    Dialog.initialDialogStateForUserAgentServer = function (incomingRequestMessage, toTag, early) {
        if (early === void 0) { early = false; }
        // If the request arrived over TLS, and the Request-URI contained a SIPS
        // URI, the "secure" flag is set to TRUE.
        // https://tools.ietf.org/html/rfc3261#section-12.1.1
        var secure = false; // FIXME: Currently no support for TLS.
        // The route set MUST be set to the list of URIs in the Record-Route
        // header field from the request, taken in order and preserving all URI
        // parameters.  If no Record-Route header field is present in the
        // request, the route set MUST be set to the empty set.  This route set,
        // even if empty, overrides any pre-existing route set for future
        // requests in this dialog.  The remote target MUST be set to the URI
        // from the Contact header field of the request.
        // https://tools.ietf.org/html/rfc3261#section-12.1.1
        var routeSet = incomingRequestMessage.getHeaders("record-route");
        var contact = incomingRequestMessage.parseHeader("contact");
        if (!contact) { // TODO: Review to make sure this will never happen
            throw new Error("Contact undefined.");
        }
        if (!(contact instanceof messages_1.NameAddrHeader)) {
            throw new Error("Contact not instance of NameAddrHeader.");
        }
        var remoteTarget = contact.uri;
        // The remote sequence number MUST be set to the value of the sequence
        // number in the CSeq header field of the request.  The local sequence
        // number MUST be empty.  The call identifier component of the dialog ID
        // MUST be set to the value of the Call-ID in the request.  The local
        // tag component of the dialog ID MUST be set to the tag in the To field
        // in the response to the request (which always includes a tag), and the
        // remote tag component of the dialog ID MUST be set to the tag from the
        // From field in the request.  A UAS MUST be prepared to receive a
        // request without a tag in the From field, in which case the tag is
        // considered to have a value of null.
        //
        //    This is to maintain backwards compatibility with RFC 2543, which
        //    did not mandate From tags.
        //
        // https://tools.ietf.org/html/rfc3261#section-12.1.1
        var remoteSequenceNumber = incomingRequestMessage.cseq;
        var localSequenceNumber = undefined;
        var callId = incomingRequestMessage.callId;
        var localTag = toTag;
        var remoteTag = incomingRequestMessage.fromTag;
        // The remote URI MUST be set to the URI in the From field, and the
        // local URI MUST be set to the URI in the To field.
        // https://tools.ietf.org/html/rfc3261#section-12.1.1
        var remoteURI = incomingRequestMessage.from.uri;
        var localURI = incomingRequestMessage.to.uri;
        var dialogState = {
            id: callId + localTag + remoteTag,
            early: early,
            callId: callId,
            localTag: localTag,
            remoteTag: remoteTag,
            localSequenceNumber: localSequenceNumber,
            remoteSequenceNumber: remoteSequenceNumber,
            localURI: localURI,
            remoteURI: remoteURI,
            remoteTarget: remoteTarget,
            routeSet: routeSet,
            secure: secure
        };
        return dialogState;
    };
    /** Destructor. */
    Dialog.prototype.dispose = function () {
        this.core.dialogs.delete(this.id);
    };
    Object.defineProperty(Dialog.prototype, "id", {
        /**
         * A dialog is identified at each UA with a dialog ID, which consists of
         * a Call-ID value, a local tag and a remote tag.  The dialog ID at each
         * UA involved in the dialog is not the same.  Specifically, the local
         * tag at one UA is identical to the remote tag at the peer UA.  The
         * tags are opaque tokens that facilitate the generation of unique
         * dialog IDs.
         * https://tools.ietf.org/html/rfc3261#section-12
         */
        get: function () {
            return this.dialogState.id;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Dialog.prototype, "early", {
        /**
         * A dialog can also be in the "early" state, which occurs when it is
         * created with a provisional response, and then it transition to the
         * "confirmed" state when a 2xx final response received or is sent.
         *
         * Note: RFC 3261 is concise on when a dialog is "confirmed", but it
         * can be a point of confusion if an INVITE dialog is "confirmed" after
         * a 2xx is sent or after receiving the ACK for the 2xx response.
         * With careful reading it can be inferred a dialog is always is
         * "confirmed" when the 2xx is sent (regardless of type of dialog).
         * However a INVITE dialog does have additional considerations
         * when it is confirmed but an ACK has not yet been received (in
         * particular with regard to a callee sending BYE requests).
         */
        get: function () {
            return this.dialogState.early;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Dialog.prototype, "callId", {
        /** Call identifier component of the dialog id. */
        get: function () {
            return this.dialogState.callId;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Dialog.prototype, "localTag", {
        /** Local tag component of the dialog id. */
        get: function () {
            return this.dialogState.localTag;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Dialog.prototype, "remoteTag", {
        /** Remote tag component of the dialog id. */
        get: function () {
            return this.dialogState.remoteTag;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Dialog.prototype, "localSequenceNumber", {
        /** Local sequence number (used to order requests from the UA to its peer). */
        get: function () {
            return this.dialogState.localSequenceNumber;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Dialog.prototype, "remoteSequenceNumber", {
        /** Remote sequence number (used to order requests from its peer to the UA). */
        get: function () {
            return this.dialogState.remoteSequenceNumber;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Dialog.prototype, "localURI", {
        /** Local URI. */
        get: function () {
            return this.dialogState.localURI;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Dialog.prototype, "remoteURI", {
        /** Remote URI. */
        get: function () {
            return this.dialogState.remoteURI;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Dialog.prototype, "remoteTarget", {
        /** Remote target. */
        get: function () {
            return this.dialogState.remoteTarget;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Dialog.prototype, "routeSet", {
        /**
         * Route set, which is an ordered list of URIs. The route set is the
         * list of servers that need to be traversed to send a request to the peer.
         */
        get: function () {
            return this.dialogState.routeSet;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Dialog.prototype, "secure", {
        /**
         * If the request was sent over TLS, and the Request-URI contained
         * a SIPS URI, the "secure" flag is set to true. *NOT IMPLEMENTED*
         */
        get: function () {
            return this.dialogState.secure;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Dialog.prototype, "userAgentCore", {
        /** The user agent core servicing this dialog. */
        get: function () {
            return this.core;
        },
        enumerable: true,
        configurable: true
    });
    /** Confirm the dialog. Only matters if dialog is currently early. */
    Dialog.prototype.confirm = function () {
        this.dialogState.early = false;
    };
    /**
     * Requests sent within a dialog, as any other requests, are atomic.  If
     * a particular request is accepted by the UAS, all the state changes
     * associated with it are performed.  If the request is rejected, none
     * of the state changes are performed.
     *
     *    Note that some requests, such as INVITEs, affect several pieces of
     *    state.
     *
     * https://tools.ietf.org/html/rfc3261#section-12.2.2
     * @param message - Incoming request message within this dialog.
     */
    Dialog.prototype.receiveRequest = function (message) {
        // ACK guard.
        // By convention, the handling of ACKs is the responsibility
        // the particular dialog implementation. For example, see SessionDialog.
        // Furthermore, ACKs have same sequence number as the associated INVITE.
        if (message.method === messages_1.C.ACK) {
            return;
        }
        // If the remote sequence number was not empty, but the sequence number
        // of the request is lower than the remote sequence number, the request
        // is out of order and MUST be rejected with a 500 (Server Internal
        // Error) response.  If the remote sequence number was not empty, and
        // the sequence number of the request is greater than the remote
        // sequence number, the request is in order.  It is possible for the
        // CSeq sequence number to be higher than the remote sequence number by
        // more than one.  This is not an error condition, and a UAS SHOULD be
        // prepared to receive and process requests with CSeq values more than
        // one higher than the previous received request.  The UAS MUST then set
        // the remote sequence number to the value of the sequence number in the
        // CSeq header field value in the request.
        //
        //    If a proxy challenges a request generated by the UAC, the UAC has
        //    to resubmit the request with credentials.  The resubmitted request
        //    will have a new CSeq number.  The UAS will never see the first
        //    request, and thus, it will notice a gap in the CSeq number space.
        //    Such a gap does not represent any error condition.
        //
        // https://tools.ietf.org/html/rfc3261#section-12.2.2
        if (this.remoteSequenceNumber) {
            if (message.cseq <= this.remoteSequenceNumber) {
                throw new Error("Out of sequence in dialog request. Did you forget to call sequenceGuard()?");
            }
            this.dialogState.remoteSequenceNumber = message.cseq;
        }
        // If the remote sequence number is empty, it MUST be set to the value
        // of the sequence number in the CSeq header field value in the request.
        // https://tools.ietf.org/html/rfc3261#section-12.2.2
        if (!this.remoteSequenceNumber) {
            this.dialogState.remoteSequenceNumber = message.cseq;
        }
        // When a UAS receives a target refresh request, it MUST replace the
        // dialog's remote target URI with the URI from the Contact header field
        // in that request, if present.
        // https://tools.ietf.org/html/rfc3261#section-12.2.2
        // Note: "target refresh request" processing delegated to sub-class.
    };
    /**
     * If the dialog identifier in the 2xx response matches the dialog
     * identifier of an existing dialog, the dialog MUST be transitioned to
     * the "confirmed" state, and the route set for the dialog MUST be
     * recomputed based on the 2xx response using the procedures of Section
     * 12.2.1.2.  Otherwise, a new dialog in the "confirmed" state MUST be
     * constructed using the procedures of Section 12.1.2.
     *
     * Note that the only piece of state that is recomputed is the route
     * set.  Other pieces of state such as the highest sequence numbers
     * (remote and local) sent within the dialog are not recomputed.  The
     * route set only is recomputed for backwards compatibility.  RFC
     * 2543 did not mandate mirroring of the Record-Route header field in
     * a 1xx, only 2xx.  However, we cannot update the entire state of
     * the dialog, since mid-dialog requests may have been sent within
     * the early dialog, modifying the sequence numbers, for example.
     *
     *  https://tools.ietf.org/html/rfc3261#section-13.2.2.4
     */
    Dialog.prototype.recomputeRouteSet = function (message) {
        this.dialogState.routeSet = message.getHeaders("record-route").reverse();
    };
    /**
     * A request within a dialog is constructed by using many of the
     * components of the state stored as part of the dialog.
     * https://tools.ietf.org/html/rfc3261#section-12.2.1.1
     * @param method - Outgoing request method.
     */
    Dialog.prototype.createOutgoingRequestMessage = function (method, options) {
        // The URI in the To field of the request MUST be set to the remote URI
        // from the dialog state.  The tag in the To header field of the request
        // MUST be set to the remote tag of the dialog ID.  The From URI of the
        // request MUST be set to the local URI from the dialog state.  The tag
        // in the From header field of the request MUST be set to the local tag
        // of the dialog ID.  If the value of the remote or local tags is null,
        // the tag parameter MUST be omitted from the To or From header fields,
        // respectively.
        //
        //    Usage of the URI from the To and From fields in the original
        //    request within subsequent requests is done for backwards
        //    compatibility with RFC 2543, which used the URI for dialog
        //    identification.  In this specification, only the tags are used for
        //    dialog identification.  It is expected that mandatory reflection
        //    of the original To and From URI in mid-dialog requests will be
        //    deprecated in a subsequent revision of this specification.
        // https://tools.ietf.org/html/rfc3261#section-12.2.1.1
        var toUri = this.remoteURI;
        var toTag = this.remoteTag;
        var fromUri = this.localURI;
        var fromTag = this.localTag;
        // The Call-ID of the request MUST be set to the Call-ID of the dialog.
        // Requests within a dialog MUST contain strictly monotonically
        // increasing and contiguous CSeq sequence numbers (increasing-by-one)
        // in each direction (excepting ACK and CANCEL of course, whose numbers
        // equal the requests being acknowledged or cancelled).  Therefore, if
        // the local sequence number is not empty, the value of the local
        // sequence number MUST be incremented by one, and this value MUST be
        // placed into the CSeq header field.  If the local sequence number is
        // empty, an initial value MUST be chosen using the guidelines of
        // Section 8.1.1.5.  The method field in the CSeq header field value
        // MUST match the method of the request.
        // https://tools.ietf.org/html/rfc3261#section-12.2.1.1
        var callId = this.callId;
        var cseq;
        if (options && options.cseq) {
            cseq = options.cseq;
        }
        else if (!this.dialogState.localSequenceNumber) {
            cseq = this.dialogState.localSequenceNumber = 1; // https://tools.ietf.org/html/rfc3261#section-8.1.1.5
        }
        else {
            cseq = this.dialogState.localSequenceNumber += 1;
        }
        // The UAC uses the remote target and route set to build the Request-URI
        // and Route header field of the request.
        //
        // If the route set is empty, the UAC MUST place the remote target URI
        // into the Request-URI.  The UAC MUST NOT add a Route header field to
        // the request.
        //
        // If the route set is not empty, and the first URI in the route set
        // contains the lr parameter (see Section 19.1.1), the UAC MUST place
        // the remote target URI into the Request-URI and MUST include a Route
        // header field containing the route set values in order, including all
        // parameters.
        //
        // If the route set is not empty, and its first URI does not contain the
        // lr parameter, the UAC MUST place the first URI from the route set
        // into the Request-URI, stripping any parameters that are not allowed
        // in a Request-URI.  The UAC MUST add a Route header field containing
        // the remainder of the route set values in order, including all
        // parameters.  The UAC MUST then place the remote target URI into the
        // Route header field as the last value.
        // https://tools.ietf.org/html/rfc3261#section-12.2.1.1
        // The lr parameter, when present, indicates that the element
        // responsible for this resource implements the routing mechanisms
        // specified in this document.  This parameter will be used in the
        // URIs proxies place into Record-Route header field values, and
        // may appear in the URIs in a pre-existing route set.
        //
        // This parameter is used to achieve backwards compatibility with
        // systems implementing the strict-routing mechanisms of RFC 2543
        // and the rfc2543bis drafts up to bis-05.  An element preparing
        // to send a request based on a URI not containing this parameter
        // can assume the receiving element implements strict-routing and
        // reformat the message to preserve the information in the
        // Request-URI.
        // https://tools.ietf.org/html/rfc3261#section-19.1.1
        // NOTE: Not backwards compatible with RFC 2543 (no support for strict-routing).
        var ruri = this.remoteTarget;
        var routeSet = this.routeSet;
        var extraHeaders = options && options.extraHeaders;
        var body = options && options.body;
        // The relative order of header fields with different field names is not
        // significant.  However, it is RECOMMENDED that header fields which are
        // needed for proxy processing (Via, Route, Record-Route, Proxy-Require,
        // Max-Forwards, and Proxy-Authorization, for example) appear towards
        // the top of the message to facilitate rapid parsing.
        // https://tools.ietf.org/html/rfc3261#section-7.3.1
        var message = this.userAgentCore.makeOutgoingRequestMessage(method, ruri, fromUri, toUri, {
            callId: callId,
            cseq: cseq,
            fromTag: fromTag,
            toTag: toTag,
            routeSet: routeSet
        }, extraHeaders, body);
        return message;
    };
    /**
     * Increment the local sequence number by one.
     * It feels like this should be protected, but the current authentication handling currently
     * needs this to keep the dialog in sync when "auto re-sends" request messages.
     * @internal
     */
    Dialog.prototype.incrementLocalSequenceNumber = function () {
        if (!this.dialogState.localSequenceNumber) {
            throw new Error("Local sequence number undefined.");
        }
        this.dialogState.localSequenceNumber += 1;
    };
    /**
     * If the remote sequence number was not empty, but the sequence number
     * of the request is lower than the remote sequence number, the request
     * is out of order and MUST be rejected with a 500 (Server Internal
     * Error) response.
     * https://tools.ietf.org/html/rfc3261#section-12.2.2
     * @param request - Incoming request to guard.
     * @returns True if the program execution is to continue in the branch in question.
     *          Otherwise a 500 Server Internal Error was stateless sent and request processing must stop.
     */
    Dialog.prototype.sequenceGuard = function (message) {
        // ACK guard.
        // By convention, handling of unexpected ACKs is responsibility
        // the particular dialog implementation. For example, see SessionDialog.
        // Furthermore, we cannot reply to an "out of sequence" ACK.
        if (message.method === messages_1.C.ACK) {
            return true;
        }
        // Note: We are rejecting on "less than or equal to" the remote
        // sequence number (excepting ACK whose numbers equal the requests
        // being acknowledged or cancelled), which is the correct thing to
        // do in our case. The only time a request with the same sequence number
        // will show up here if is a) it is a very late retransmission of a
        // request we already handled or b) it is a different request with the
        // same sequence number which would be violation of the standard.
        // Request retransmissions are absorbed by the transaction layer,
        // so any request with a duplicate sequence number getting here
        // would have to be a retransmission after the transaction terminated
        // or a broken request (with unique via branch value).
        // Requests within a dialog MUST contain strictly monotonically
        // increasing and contiguous CSeq sequence numbers (increasing-by-one)
        // in each direction (excepting ACK and CANCEL of course, whose numbers
        // equal the requests being acknowledged or cancelled).  Therefore, if
        // the local sequence number is not empty, the value of the local
        // sequence number MUST be incremented by one, and this value MUST be
        // placed into the CSeq header field.
        // https://tools.ietf.org/html/rfc3261#section-12.2.1.1
        if (this.remoteSequenceNumber && message.cseq <= this.remoteSequenceNumber) {
            this.core.replyStateless(message, { statusCode: 500 });
            return false;
        }
        return true;
    };
    return Dialog;
}());
exports.Dialog = Dialog;


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
// Directories
tslib_1.__exportStar(__webpack_require__(6), exports);
// Files
tslib_1.__exportStar(__webpack_require__(8), exports);
tslib_1.__exportStar(__webpack_require__(19), exports);
tslib_1.__exportStar(__webpack_require__(11), exports);
tslib_1.__exportStar(__webpack_require__(10), exports);
tslib_1.__exportStar(__webpack_require__(9), exports);
tslib_1.__exportStar(__webpack_require__(17), exports);
tslib_1.__exportStar(__webpack_require__(13), exports);
tslib_1.__exportStar(__webpack_require__(18), exports);
tslib_1.__exportStar(__webpack_require__(22), exports);
tslib_1.__exportStar(__webpack_require__(14), exports);
tslib_1.__exportStar(__webpack_require__(23), exports);
tslib_1.__exportStar(__webpack_require__(15), exports);


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
tslib_1.__exportStar(__webpack_require__(7), exports);


/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * SIP Methods
 * @internal
 */
var C;
(function (C) {
    C.ACK = "ACK";
    C.BYE = "BYE";
    C.CANCEL = "CANCEL";
    C.INFO = "INFO";
    C.INVITE = "INVITE";
    C.MESSAGE = "MESSAGE";
    C.NOTIFY = "NOTIFY";
    C.OPTIONS = "OPTIONS";
    C.REGISTER = "REGISTER";
    C.UPDATE = "UPDATE";
    C.SUBSCRIBE = "SUBSCRIBE";
    C.PUBLISH = "PUBLISH";
    C.REFER = "REFER";
    C.PRACK = "PRACK";
})(C = exports.C || (exports.C = {}));


/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var incoming_request_message_1 = __webpack_require__(9);
var incoming_response_message_1 = __webpack_require__(17);
var outgoing_request_message_1 = __webpack_require__(18);
/**
 * Create a Body given a legacy body type.
 * @param bodyLegacy - Body Object
 * @internal
 */
function fromBodyLegacy(bodyLegacy) {
    var content = (typeof bodyLegacy === "string") ? bodyLegacy : bodyLegacy.body;
    var contentType = (typeof bodyLegacy === "string") ? "application/sdp" : bodyLegacy.contentType;
    var contentDisposition = contentTypeToContentDisposition(contentType);
    var body = { contentDisposition: contentDisposition, contentType: contentType, content: content };
    return body;
}
exports.fromBodyLegacy = fromBodyLegacy;
/**
 * Given a message, get a normalized body.
 * The content disposition is inferred if not set.
 * @param message - The message.
 * @internal
 */
function getBody(message) {
    var contentDisposition;
    var contentType;
    var content;
    // We're in UAS role, receiving incoming request
    if (message instanceof incoming_request_message_1.IncomingRequestMessage) {
        if (message.body) {
            // FIXME: Parsing needs typing
            var parse = message.parseHeader("Content-Disposition");
            contentDisposition = parse ? parse.type : undefined;
            contentType = message.parseHeader("Content-Type");
            content = message.body;
        }
    }
    // We're in UAC role, receiving incoming response
    if (message instanceof incoming_response_message_1.IncomingResponseMessage) {
        if (message.body) {
            // FIXME: Parsing needs typing
            var parse = message.parseHeader("Content-Disposition");
            contentDisposition = parse ? parse.type : undefined;
            contentType = message.parseHeader("Content-Type");
            content = message.body;
        }
    }
    // We're in UAC role, sending outgoing request
    if (message instanceof outgoing_request_message_1.OutgoingRequestMessage) {
        if (message.body) {
            contentDisposition = message.getHeader("Content-Disposition");
            contentType = message.getHeader("Content-Type");
            if (typeof message.body === "string") {
                // FIXME: OutgoingRequest should not allow a "string" body without a "Content-Type" header.
                if (!contentType) {
                    throw new Error("Header content type header does not equal body content type.");
                }
                content = message.body;
            }
            else {
                // FIXME: OutgoingRequest should not allow the "Content-Type" header not to match th body content type
                if (contentType && contentType !== message.body.contentType) {
                    throw new Error("Header content type header does not equal body content type.");
                }
                contentType = message.body.contentType;
                content = message.body.body;
            }
        }
    }
    // We're in UAS role, sending outgoing response
    if (isBody(message)) {
        contentDisposition = message.contentDisposition;
        contentType = message.contentType;
        content = message.content;
    }
    // No content, no body.
    if (!content) {
        return undefined;
    }
    if (contentType && !contentDisposition) {
        contentDisposition = contentTypeToContentDisposition(contentType);
    }
    if (!contentDisposition) {
        throw new Error("Content disposition undefined.");
    }
    if (!contentType) {
        throw new Error("Content type undefined.");
    }
    return {
        contentDisposition: contentDisposition,
        contentType: contentType,
        content: content
    };
}
exports.getBody = getBody;
/**
 * User-Defined Type Guard for Body.
 * @param body - Body to check.
 * @internal
 */
function isBody(body) {
    return body &&
        typeof body.content === "string" &&
        typeof body.contentType === "string" &&
        body.contentDisposition === undefined ? true : typeof body.contentDisposition === "string";
}
exports.isBody = isBody;
// If the Content-Disposition header field is missing, bodies of
// Content-Type application/sdp imply the disposition "session", while
// other content types imply "render".
// https://tools.ietf.org/html/rfc3261#section-13.2.1
function contentTypeToContentDisposition(contentType) {
    if (contentType === "application/sdp") {
        return "session";
    }
    else {
        return "render";
    }
}


/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var incoming_message_1 = __webpack_require__(10);
/**
 * Incoming request message.
 * @public
 */
var IncomingRequestMessage = /** @class */ (function (_super) {
    tslib_1.__extends(IncomingRequestMessage, _super);
    function IncomingRequestMessage() {
        return _super.call(this) || this;
    }
    return IncomingRequestMessage;
}(incoming_message_1.IncomingMessage));
exports.IncomingRequestMessage = IncomingRequestMessage;


/***/ }),
/* 10 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var grammar_1 = __webpack_require__(11);
var utils_1 = __webpack_require__(16);
/**
 * Incoming message.
 * @public
 */
var IncomingMessage = /** @class */ (function () {
    function IncomingMessage() {
        this.headers = {};
    }
    /**
     * Insert a header of the given name and value into the last position of the
     * header array.
     * @param name - header name
     * @param value - header value
     */
    IncomingMessage.prototype.addHeader = function (name, value) {
        var header = { raw: value };
        name = utils_1.headerize(name);
        if (this.headers[name]) {
            this.headers[name].push(header);
        }
        else {
            this.headers[name] = [header];
        }
    };
    /**
     * Get the value of the given header name at the given position.
     * @param name - header name
     * @returns Returns the specified header, undefined if header doesn't exist.
     */
    IncomingMessage.prototype.getHeader = function (name) {
        var header = this.headers[utils_1.headerize(name)];
        if (header) {
            if (header[0]) {
                return header[0].raw;
            }
        }
        else {
            return;
        }
    };
    /**
     * Get the header/s of the given name.
     * @param name - header name
     * @returns Array - with all the headers of the specified name.
     */
    IncomingMessage.prototype.getHeaders = function (name) {
        var header = this.headers[utils_1.headerize(name)];
        var result = [];
        if (!header) {
            return [];
        }
        for (var _i = 0, header_1 = header; _i < header_1.length; _i++) {
            var headerPart = header_1[_i];
            result.push(headerPart.raw);
        }
        return result;
    };
    /**
     * Verify the existence of the given header.
     * @param name - header name
     * @returns true if header with given name exists, false otherwise
     */
    IncomingMessage.prototype.hasHeader = function (name) {
        return !!this.headers[utils_1.headerize(name)];
    };
    /**
     * Parse the given header on the given index.
     * @param name - header name
     * @param idx - header index
     * @returns Parsed header object, undefined if the
     *   header is not present or in case of a parsing error.
     */
    IncomingMessage.prototype.parseHeader = function (name, idx) {
        if (idx === void 0) { idx = 0; }
        name = utils_1.headerize(name);
        if (!this.headers[name]) {
            // this.logger.log("header '" + name + "' not present");
            return;
        }
        else if (idx >= this.headers[name].length) {
            // this.logger.log("not so many '" + name + "' headers present");
            return;
        }
        var header = this.headers[name][idx];
        var value = header.raw;
        if (header.parsed) {
            return header.parsed;
        }
        // substitute '-' by '_' for grammar rule matching.
        var parsed = grammar_1.Grammar.parse(value, name.replace(/-/g, "_"));
        if (parsed === -1) {
            this.headers[name].splice(idx, 1); // delete from headers
            // this.logger.warn('error parsing "' + name + '" header field with value "' + value + '"');
            return;
        }
        else {
            header.parsed = parsed;
            return parsed;
        }
    };
    /**
     * Message Header attribute selector. Alias of parseHeader.
     * @param name - header name
     * @param idx - header index
     * @returns Parsed header object, undefined if the
     *   header is not present or in case of a parsing error.
     *
     * @example
     * message.s('via',3).port
     */
    IncomingMessage.prototype.s = function (name, idx) {
        if (idx === void 0) { idx = 0; }
        return this.parseHeader(name, idx);
    };
    /**
     * Replace the value of the given header by the value.
     * @param name - header name
     * @param value - header value
     */
    IncomingMessage.prototype.setHeader = function (name, value) {
        this.headers[utils_1.headerize(name)] = [{ raw: value }];
    };
    IncomingMessage.prototype.toString = function () {
        return this.data;
    };
    return IncomingMessage;
}());
exports.IncomingMessage = IncomingMessage;


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var pegGrammar = tslib_1.__importStar(__webpack_require__(12));
/**
 * Grammar.
 * @internal
 */
var Grammar;
(function (Grammar) {
    /**
     * Parse.
     * @param input -
     * @param startRule -
     */
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
     * @param name_addr_header -
     */
    function nameAddrHeaderParse(nameAddrHeader) {
        var parsedNameAddrHeader = Grammar.parse(nameAddrHeader, "Name_Addr_Header");
        return parsedNameAddrHeader !== -1 ? parsedNameAddrHeader : undefined;
    }
    Grammar.nameAddrHeaderParse = nameAddrHeaderParse;
    /**
     * Parse the given string and returns a SIP.URI instance or undefined if
     * it is an invalid URI.
     * @param uri -
     */
    function URIParse(uri) {
        var parsedUri = Grammar.parse(uri, "SIP_URI");
        return parsedUri !== -1 ? parsedUri : undefined;
    }
    Grammar.URIParse = URIParse;
})(Grammar = exports.Grammar || (exports.Grammar = {}));


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

// tslint:disable:interface-name
// tslint:disable: trailing-comma
// tslint:disable: object-literal-sort-keys
// tslint:disable: max-line-length
// tslint:disable: only-arrow-functions
// tslint:disable: one-variable-per-declaration
// tslint:disable: no-consecutive-blank-lines
// tslint:disable: align
// tslint:disable: radix
// tslint:disable: quotemark
// tslint:disable: semicolon
// tslint:disable: object-literal-shorthand
// tslint:disable: variable-name
// tslint:disable: no-var-keyword
// tslint:disable: whitespace
// tslint:disable: curly
// tslint:disable: prefer-const
// tslint:disable: object-literal-key-quotes
// tslint:disable: no-string-literal
// tslint:disable: one-line
// tslint:disable: no-unused-expression
// tslint:disable: space-before-function-paren
// tslint:disable: arrow-return-shorthand
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
// Generated by PEG.js v. 0.10.0 (ts-pegjs plugin v. 0.2.6 )
//
// https://pegjs.org/   https://github.com/metadevpro/ts-pegjs
var name_addr_header_1 = __webpack_require__(13);
var uri_1 = __webpack_require__(15);
var SyntaxError = /** @class */ (function (_super) {
    tslib_1.__extends(SyntaxError, _super);
    function SyntaxError(message, expected, found, location) {
        var _this = _super.call(this) || this;
        _this.message = message;
        _this.expected = expected;
        _this.found = found;
        _this.location = location;
        _this.name = "SyntaxError";
        if (typeof Error.captureStackTrace === "function") {
            Error.captureStackTrace(_this, SyntaxError);
        }
        return _this;
    }
    SyntaxError.buildMessage = function (expected, found) {
        function hex(ch) {
            return ch.charCodeAt(0).toString(16).toUpperCase();
        }
        function literalEscape(s) {
            return s
                .replace(/\\/g, "\\\\")
                .replace(/"/g, "\\\"")
                .replace(/\0/g, "\\0")
                .replace(/\t/g, "\\t")
                .replace(/\n/g, "\\n")
                .replace(/\r/g, "\\r")
                .replace(/[\x00-\x0F]/g, function (ch) { return "\\x0" + hex(ch); })
                .replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) { return "\\x" + hex(ch); });
        }
        function classEscape(s) {
            return s
                .replace(/\\/g, "\\\\")
                .replace(/\]/g, "\\]")
                .replace(/\^/g, "\\^")
                .replace(/-/g, "\\-")
                .replace(/\0/g, "\\0")
                .replace(/\t/g, "\\t")
                .replace(/\n/g, "\\n")
                .replace(/\r/g, "\\r")
                .replace(/[\x00-\x0F]/g, function (ch) { return "\\x0" + hex(ch); })
                .replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) { return "\\x" + hex(ch); });
        }
        function describeExpectation(expectation) {
            switch (expectation.type) {
                case "literal":
                    return "\"" + literalEscape(expectation.text) + "\"";
                case "class":
                    var escapedParts = expectation.parts.map(function (part) {
                        return Array.isArray(part)
                            ? classEscape(part[0]) + "-" + classEscape(part[1])
                            : classEscape(part);
                    });
                    return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
                case "any":
                    return "any character";
                case "end":
                    return "end of input";
                case "other":
                    return expectation.description;
            }
        }
        function describeExpected(expected1) {
            var descriptions = expected1.map(describeExpectation);
            var i;
            var j;
            descriptions.sort();
            if (descriptions.length > 0) {
                for (i = 1, j = 1; i < descriptions.length; i++) {
                    if (descriptions[i - 1] !== descriptions[i]) {
                        descriptions[j] = descriptions[i];
                        j++;
                    }
                }
                descriptions.length = j;
            }
            switch (descriptions.length) {
                case 1:
                    return descriptions[0];
                case 2:
                    return descriptions[0] + " or " + descriptions[1];
                default:
                    return descriptions.slice(0, -1).join(", ")
                        + ", or "
                        + descriptions[descriptions.length - 1];
            }
        }
        function describeFound(found1) {
            return found1 ? "\"" + literalEscape(found1) + "\"" : "end of input";
        }
        return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
    };
    return SyntaxError;
}(Error));
exports.SyntaxError = SyntaxError;
function peg$parse(input, options) {
    options = options !== undefined ? options : {};
    var peg$FAILED = {};
    var peg$startRuleIndices = { Contact: 119, Name_Addr_Header: 156, Record_Route: 176, Request_Response: 81, SIP_URI: 45, Subscription_State: 186, Supported: 191, Require: 182, Via: 194, absoluteURI: 84, Call_ID: 118, Content_Disposition: 130, Content_Length: 135, Content_Type: 136, CSeq: 146, displayName: 122, Event: 149, From: 151, host: 52, Max_Forwards: 154, Min_SE: 213, Proxy_Authenticate: 157, quoted_string: 40, Refer_To: 178, Replaces: 179, Session_Expires: 210, stun_URI: 217, To: 192, turn_URI: 223, uuid: 226, WWW_Authenticate: 209, challenge: 158, sipfrag: 230, Referred_By: 231 };
    var peg$startRuleIndex = 119;
    var peg$consts = [
        "\r\n",
        peg$literalExpectation("\r\n", false),
        /^[0-9]/,
        peg$classExpectation([["0", "9"]], false, false),
        /^[a-zA-Z]/,
        peg$classExpectation([["a", "z"], ["A", "Z"]], false, false),
        /^[0-9a-fA-F]/,
        peg$classExpectation([["0", "9"], ["a", "f"], ["A", "F"]], false, false),
        /^[\0-\xFF]/,
        peg$classExpectation([["\0", "\xFF"]], false, false),
        /^["]/,
        peg$classExpectation(["\""], false, false),
        " ",
        peg$literalExpectation(" ", false),
        "\t",
        peg$literalExpectation("\t", false),
        /^[a-zA-Z0-9]/,
        peg$classExpectation([["a", "z"], ["A", "Z"], ["0", "9"]], false, false),
        ";",
        peg$literalExpectation(";", false),
        "/",
        peg$literalExpectation("/", false),
        "?",
        peg$literalExpectation("?", false),
        ":",
        peg$literalExpectation(":", false),
        "@",
        peg$literalExpectation("@", false),
        "&",
        peg$literalExpectation("&", false),
        "=",
        peg$literalExpectation("=", false),
        "+",
        peg$literalExpectation("+", false),
        "$",
        peg$literalExpectation("$", false),
        ",",
        peg$literalExpectation(",", false),
        "-",
        peg$literalExpectation("-", false),
        "_",
        peg$literalExpectation("_", false),
        ".",
        peg$literalExpectation(".", false),
        "!",
        peg$literalExpectation("!", false),
        "~",
        peg$literalExpectation("~", false),
        "*",
        peg$literalExpectation("*", false),
        "'",
        peg$literalExpectation("'", false),
        "(",
        peg$literalExpectation("(", false),
        ")",
        peg$literalExpectation(")", false),
        "%",
        peg$literalExpectation("%", false),
        function () { return " "; },
        function () { return ':'; },
        /^[!-~]/,
        peg$classExpectation([["!", "~"]], false, false),
        /^[\x80-\uFFFF]/,
        peg$classExpectation([["\x80", "\uFFFF"]], false, false),
        /^[\x80-\xBF]/,
        peg$classExpectation([["\x80", "\xBF"]], false, false),
        /^[a-f]/,
        peg$classExpectation([["a", "f"]], false, false),
        "`",
        peg$literalExpectation("`", false),
        "<",
        peg$literalExpectation("<", false),
        ">",
        peg$literalExpectation(">", false),
        "\\",
        peg$literalExpectation("\\", false),
        "[",
        peg$literalExpectation("[", false),
        "]",
        peg$literalExpectation("]", false),
        "{",
        peg$literalExpectation("{", false),
        "}",
        peg$literalExpectation("}", false),
        function () { return "*"; },
        function () { return "/"; },
        function () { return "="; },
        function () { return "("; },
        function () { return ")"; },
        function () { return ">"; },
        function () { return "<"; },
        function () { return ","; },
        function () { return ";"; },
        function () { return ":"; },
        function () { return "\""; },
        /^[!-']/,
        peg$classExpectation([["!", "'"]], false, false),
        /^[*-[]/,
        peg$classExpectation([["*", "["]], false, false),
        /^[\]-~]/,
        peg$classExpectation([["]", "~"]], false, false),
        function (contents) {
            return contents;
        },
        /^[#-[]/,
        peg$classExpectation([["#", "["]], false, false),
        /^[\0-\t]/,
        peg$classExpectation([["\0", "\t"]], false, false),
        /^[\x0B-\f]/,
        peg$classExpectation([["\x0B", "\f"]], false, false),
        /^[\x0E-\x7F]/,
        peg$classExpectation([["\x0E", "\x7F"]], false, false),
        function () {
            options = options || { data: {} };
            options.data.uri = new uri_1.URI(options.data.scheme, options.data.user, options.data.host, options.data.port);
            delete options.data.scheme;
            delete options.data.user;
            delete options.data.host;
            delete options.data.host_type;
            delete options.data.port;
        },
        function () {
            options = options || { data: {} };
            options.data.uri = new uri_1.URI(options.data.scheme, options.data.user, options.data.host, options.data.port, options.data.uri_params, options.data.uri_headers);
            delete options.data.scheme;
            delete options.data.user;
            delete options.data.host;
            delete options.data.host_type;
            delete options.data.port;
            delete options.data.uri_params;
            if (options.startRule === 'SIP_URI') {
                options.data = options.data.uri;
            }
        },
        "sips",
        peg$literalExpectation("sips", true),
        "sip",
        peg$literalExpectation("sip", true),
        function (uri_scheme) {
            options = options || { data: {} };
            options.data.scheme = uri_scheme;
        },
        function () {
            options = options || { data: {} };
            options.data.user = decodeURIComponent(text().slice(0, -1));
        },
        function () {
            options = options || { data: {} };
            options.data.password = text();
        },
        function () {
            options = options || { data: {} };
            options.data.host = text();
            return options.data.host;
        },
        function () {
            options = options || { data: {} };
            options.data.host_type = 'domain';
            return text();
        },
        /^[a-zA-Z0-9_\-]/,
        peg$classExpectation([["a", "z"], ["A", "Z"], ["0", "9"], "_", "-"], false, false),
        /^[a-zA-Z0-9\-]/,
        peg$classExpectation([["a", "z"], ["A", "Z"], ["0", "9"], "-"], false, false),
        function () {
            options = options || { data: {} };
            options.data.host_type = 'IPv6';
            return text();
        },
        "::",
        peg$literalExpectation("::", false),
        function () {
            options = options || { data: {} };
            options.data.host_type = 'IPv6';
            return text();
        },
        function () {
            options = options || { data: {} };
            options.data.host_type = 'IPv4';
            return text();
        },
        "25",
        peg$literalExpectation("25", false),
        /^[0-5]/,
        peg$classExpectation([["0", "5"]], false, false),
        "2",
        peg$literalExpectation("2", false),
        /^[0-4]/,
        peg$classExpectation([["0", "4"]], false, false),
        "1",
        peg$literalExpectation("1", false),
        /^[1-9]/,
        peg$classExpectation([["1", "9"]], false, false),
        function (port) {
            options = options || { data: {} };
            port = parseInt(port.join(''));
            options.data.port = port;
            return port;
        },
        "transport=",
        peg$literalExpectation("transport=", true),
        "udp",
        peg$literalExpectation("udp", true),
        "tcp",
        peg$literalExpectation("tcp", true),
        "sctp",
        peg$literalExpectation("sctp", true),
        "tls",
        peg$literalExpectation("tls", true),
        function (transport) {
            options = options || { data: {} };
            if (!options.data.uri_params)
                options.data.uri_params = {};
            options.data.uri_params['transport'] = transport.toLowerCase();
        },
        "user=",
        peg$literalExpectation("user=", true),
        "phone",
        peg$literalExpectation("phone", true),
        "ip",
        peg$literalExpectation("ip", true),
        function (user) {
            options = options || { data: {} };
            if (!options.data.uri_params)
                options.data.uri_params = {};
            options.data.uri_params['user'] = user.toLowerCase();
        },
        "method=",
        peg$literalExpectation("method=", true),
        function (method) {
            options = options || { data: {} };
            if (!options.data.uri_params)
                options.data.uri_params = {};
            options.data.uri_params['method'] = method;
        },
        "ttl=",
        peg$literalExpectation("ttl=", true),
        function (ttl) {
            options = options || { data: {} };
            if (!options.data.params)
                options.data.params = {};
            options.data.params['ttl'] = ttl;
        },
        "maddr=",
        peg$literalExpectation("maddr=", true),
        function (maddr) {
            options = options || { data: {} };
            if (!options.data.uri_params)
                options.data.uri_params = {};
            options.data.uri_params['maddr'] = maddr;
        },
        "lr",
        peg$literalExpectation("lr", true),
        function () {
            options = options || { data: {} };
            if (!options.data.uri_params)
                options.data.uri_params = {};
            options.data.uri_params['lr'] = undefined;
        },
        function (param, value) {
            options = options || { data: {} };
            if (!options.data.uri_params)
                options.data.uri_params = {};
            if (value === null) {
                value = undefined;
            }
            else {
                value = value[1];
            }
            options.data.uri_params[param.toLowerCase()] = value;
        },
        function (hname, hvalue) {
            hname = hname.join('').toLowerCase();
            hvalue = hvalue.join('');
            options = options || { data: {} };
            if (!options.data.uri_headers)
                options.data.uri_headers = {};
            if (!options.data.uri_headers[hname]) {
                options.data.uri_headers[hname] = [hvalue];
            }
            else {
                options.data.uri_headers[hname].push(hvalue);
            }
        },
        function () {
            options = options || { data: {} };
            // lots of tests fail if this isn't guarded...
            if (options.startRule === 'Refer_To') {
                options.data.uri = new uri_1.URI(options.data.scheme, options.data.user, options.data.host, options.data.port, options.data.uri_params, options.data.uri_headers);
                delete options.data.scheme;
                delete options.data.user;
                delete options.data.host;
                delete options.data.host_type;
                delete options.data.port;
                delete options.data.uri_params;
            }
        },
        "//",
        peg$literalExpectation("//", false),
        function () {
            options = options || { data: {} };
            options.data.scheme = text();
        },
        peg$literalExpectation("SIP", true),
        function () {
            options = options || { data: {} };
            options.data.sip_version = text();
        },
        "INVITE",
        peg$literalExpectation("INVITE", false),
        "ACK",
        peg$literalExpectation("ACK", false),
        "VXACH",
        peg$literalExpectation("VXACH", false),
        "OPTIONS",
        peg$literalExpectation("OPTIONS", false),
        "BYE",
        peg$literalExpectation("BYE", false),
        "CANCEL",
        peg$literalExpectation("CANCEL", false),
        "REGISTER",
        peg$literalExpectation("REGISTER", false),
        "SUBSCRIBE",
        peg$literalExpectation("SUBSCRIBE", false),
        "NOTIFY",
        peg$literalExpectation("NOTIFY", false),
        "REFER",
        peg$literalExpectation("REFER", false),
        "PUBLISH",
        peg$literalExpectation("PUBLISH", false),
        function () {
            options = options || { data: {} };
            options.data.method = text();
            return options.data.method;
        },
        function (status_code) {
            options = options || { data: {} };
            options.data.status_code = parseInt(status_code.join(''));
        },
        function () {
            options = options || { data: {} };
            options.data.reason_phrase = text();
        },
        function () {
            options = options || { data: {} };
            options.data = text();
        },
        function () {
            var idx, length;
            options = options || { data: {} };
            length = options.data.multi_header.length;
            for (idx = 0; idx < length; idx++) {
                if (options.data.multi_header[idx].parsed === null) {
                    options.data = null;
                    break;
                }
            }
            if (options.data !== null) {
                options.data = options.data.multi_header;
            }
            else {
                options.data = -1;
            }
        },
        function () {
            var header;
            options = options || { data: {} };
            if (!options.data.multi_header)
                options.data.multi_header = [];
            try {
                header = new name_addr_header_1.NameAddrHeader(options.data.uri, options.data.displayName, options.data.params);
                delete options.data.uri;
                delete options.data.displayName;
                delete options.data.params;
            }
            catch (e) {
                header = null;
            }
            options.data.multi_header.push({ 'position': peg$currPos,
                'offset': location().start.offset,
                'parsed': header
            });
        },
        function (displayName) {
            displayName = text().trim();
            if (displayName[0] === '\"') {
                displayName = displayName.substring(1, displayName.length - 1);
            }
            options = options || { data: {} };
            options.data.displayName = displayName;
        },
        "q",
        peg$literalExpectation("q", true),
        function (q) {
            options = options || { data: {} };
            if (!options.data.params)
                options.data.params = {};
            options.data.params['q'] = q;
        },
        "expires",
        peg$literalExpectation("expires", true),
        function (expires) {
            options = options || { data: {} };
            if (!options.data.params)
                options.data.params = {};
            options.data.params['expires'] = expires;
        },
        function (delta_seconds) {
            return parseInt(delta_seconds.join(''));
        },
        "0",
        peg$literalExpectation("0", false),
        function () {
            return parseFloat(text());
        },
        function (param, value) {
            options = options || { data: {} };
            if (!options.data.params)
                options.data.params = {};
            if (value === null) {
                value = undefined;
            }
            else {
                value = value[1];
            }
            options.data.params[param.toLowerCase()] = value;
        },
        "render",
        peg$literalExpectation("render", true),
        "session",
        peg$literalExpectation("session", true),
        "icon",
        peg$literalExpectation("icon", true),
        "alert",
        peg$literalExpectation("alert", true),
        function () {
            options = options || { data: {} };
            if (options.startRule === 'Content_Disposition') {
                options.data.type = text().toLowerCase();
            }
        },
        "handling",
        peg$literalExpectation("handling", true),
        "optional",
        peg$literalExpectation("optional", true),
        "required",
        peg$literalExpectation("required", true),
        function (length) {
            options = options || { data: {} };
            options.data = parseInt(length.join(''));
        },
        function () {
            options = options || { data: {} };
            options.data = text();
        },
        "text",
        peg$literalExpectation("text", true),
        "image",
        peg$literalExpectation("image", true),
        "audio",
        peg$literalExpectation("audio", true),
        "video",
        peg$literalExpectation("video", true),
        "application",
        peg$literalExpectation("application", true),
        "message",
        peg$literalExpectation("message", true),
        "multipart",
        peg$literalExpectation("multipart", true),
        "x-",
        peg$literalExpectation("x-", true),
        function (cseq_value) {
            options = options || { data: {} };
            options.data.value = parseInt(cseq_value.join(''));
        },
        function (expires) { options = options || { data: {} }; options.data = expires; },
        function (event_type) {
            options = options || { data: {} };
            options.data.event = event_type.toLowerCase();
        },
        function () {
            options = options || { data: {} };
            var tag = options.data.tag;
            options.data = new name_addr_header_1.NameAddrHeader(options.data.uri, options.data.displayName, options.data.params);
            if (tag) {
                options.data.setParam('tag', tag);
            }
        },
        "tag",
        peg$literalExpectation("tag", true),
        function (tag) { options = options || { data: {} }; options.data.tag = tag; },
        function (forwards) {
            options = options || { data: {} };
            options.data = parseInt(forwards.join(''));
        },
        function (min_expires) { options = options || { data: {} }; options.data = min_expires; },
        function () {
            options = options || { data: {} };
            options.data = new name_addr_header_1.NameAddrHeader(options.data.uri, options.data.displayName, options.data.params);
        },
        "digest",
        peg$literalExpectation("Digest", true),
        "realm",
        peg$literalExpectation("realm", true),
        function (realm) { options = options || { data: {} }; options.data.realm = realm; },
        "domain",
        peg$literalExpectation("domain", true),
        "nonce",
        peg$literalExpectation("nonce", true),
        function (nonce) { options = options || { data: {} }; options.data.nonce = nonce; },
        "opaque",
        peg$literalExpectation("opaque", true),
        function (opaque) { options = options || { data: {} }; options.data.opaque = opaque; },
        "stale",
        peg$literalExpectation("stale", true),
        "true",
        peg$literalExpectation("true", true),
        function () { options = options || { data: {} }; options.data.stale = true; },
        "false",
        peg$literalExpectation("false", true),
        function () { options = options || { data: {} }; options.data.stale = false; },
        "algorithm",
        peg$literalExpectation("algorithm", true),
        "md5",
        peg$literalExpectation("MD5", true),
        "md5-sess",
        peg$literalExpectation("MD5-sess", true),
        function (algorithm) {
            options = options || { data: {} };
            options.data.algorithm = algorithm.toUpperCase();
        },
        "qop",
        peg$literalExpectation("qop", true),
        "auth-int",
        peg$literalExpectation("auth-int", true),
        "auth",
        peg$literalExpectation("auth", true),
        function (qop_value) {
            options = options || { data: {} };
            options.data.qop || (options.data.qop = []);
            options.data.qop.push(qop_value.toLowerCase());
        },
        function (rack_value) {
            options = options || { data: {} };
            options.data.value = parseInt(rack_value.join(''));
        },
        function () {
            var idx, length;
            options = options || { data: {} };
            length = options.data.multi_header.length;
            for (idx = 0; idx < length; idx++) {
                if (options.data.multi_header[idx].parsed === null) {
                    options.data = null;
                    break;
                }
            }
            if (options.data !== null) {
                options.data = options.data.multi_header;
            }
            else {
                options.data = -1;
            }
        },
        function () {
            var header;
            options = options || { data: {} };
            if (!options.data.multi_header)
                options.data.multi_header = [];
            try {
                header = new name_addr_header_1.NameAddrHeader(options.data.uri, options.data.displayName, options.data.params);
                delete options.data.uri;
                delete options.data.displayName;
                delete options.data.params;
            }
            catch (e) {
                header = null;
            }
            options.data.multi_header.push({ 'position': peg$currPos,
                'offset': location().start.offset,
                'parsed': header
            });
        },
        function () {
            options = options || { data: {} };
            options.data = new name_addr_header_1.NameAddrHeader(options.data.uri, options.data.displayName, options.data.params);
        },
        function () {
            options = options || { data: {} };
            if (!(options.data.replaces_from_tag && options.data.replaces_to_tag)) {
                options.data = -1;
            }
        },
        function () {
            options = options || { data: {} };
            options.data = {
                call_id: options.data
            };
        },
        "from-tag",
        peg$literalExpectation("from-tag", true),
        function (from_tag) {
            options = options || { data: {} };
            options.data.replaces_from_tag = from_tag;
        },
        "to-tag",
        peg$literalExpectation("to-tag", true),
        function (to_tag) {
            options = options || { data: {} };
            options.data.replaces_to_tag = to_tag;
        },
        "early-only",
        peg$literalExpectation("early-only", true),
        function () {
            options = options || { data: {} };
            options.data.early_only = true;
        },
        function (head, r) { return r; },
        function (head, tail) { return list(head, tail); },
        function (value) {
            options = options || { data: {} };
            if (options.startRule === 'Require') {
                options.data = value || [];
            }
        },
        function (rseq_value) {
            options = options || { data: {} };
            options.data.value = parseInt(rseq_value.join(''));
        },
        "active",
        peg$literalExpectation("active", true),
        "pending",
        peg$literalExpectation("pending", true),
        "terminated",
        peg$literalExpectation("terminated", true),
        function () {
            options = options || { data: {} };
            options.data.state = text();
        },
        "reason",
        peg$literalExpectation("reason", true),
        function (reason) {
            options = options || { data: {} };
            if (typeof reason !== 'undefined')
                options.data.reason = reason;
        },
        function (expires) {
            options = options || { data: {} };
            if (typeof expires !== 'undefined')
                options.data.expires = expires;
        },
        "retry_after",
        peg$literalExpectation("retry_after", true),
        function (retry_after) {
            options = options || { data: {} };
            if (typeof retry_after !== 'undefined')
                options.data.retry_after = retry_after;
        },
        "deactivated",
        peg$literalExpectation("deactivated", true),
        "probation",
        peg$literalExpectation("probation", true),
        "rejected",
        peg$literalExpectation("rejected", true),
        "timeout",
        peg$literalExpectation("timeout", true),
        "giveup",
        peg$literalExpectation("giveup", true),
        "noresource",
        peg$literalExpectation("noresource", true),
        "invariant",
        peg$literalExpectation("invariant", true),
        function (value) {
            options = options || { data: {} };
            if (options.startRule === 'Supported') {
                options.data = value || [];
            }
        },
        function () {
            options = options || { data: {} };
            var tag = options.data.tag;
            options.data = new name_addr_header_1.NameAddrHeader(options.data.uri, options.data.displayName, options.data.params);
            if (tag) {
                options.data.setParam('tag', tag);
            }
        },
        "ttl",
        peg$literalExpectation("ttl", true),
        function (via_ttl_value) {
            options = options || { data: {} };
            options.data.ttl = via_ttl_value;
        },
        "maddr",
        peg$literalExpectation("maddr", true),
        function (via_maddr) {
            options = options || { data: {} };
            options.data.maddr = via_maddr;
        },
        "received",
        peg$literalExpectation("received", true),
        function (via_received) {
            options = options || { data: {} };
            options.data.received = via_received;
        },
        "branch",
        peg$literalExpectation("branch", true),
        function (via_branch) {
            options = options || { data: {} };
            options.data.branch = via_branch;
        },
        "rport",
        peg$literalExpectation("rport", true),
        function (response_port) {
            options = options || { data: {} };
            if (typeof response_port !== 'undefined')
                options.data.rport = response_port.join('');
        },
        function (via_protocol) {
            options = options || { data: {} };
            options.data.protocol = via_protocol;
        },
        peg$literalExpectation("UDP", true),
        peg$literalExpectation("TCP", true),
        peg$literalExpectation("TLS", true),
        peg$literalExpectation("SCTP", true),
        function (via_transport) {
            options = options || { data: {} };
            options.data.transport = via_transport;
        },
        function () {
            options = options || { data: {} };
            options.data.host = text();
        },
        function (via_sent_by_port) {
            options = options || { data: {} };
            options.data.port = parseInt(via_sent_by_port.join(''));
        },
        function (ttl) {
            return parseInt(ttl.join(''));
        },
        function (deltaSeconds) {
            options = options || { data: {} };
            if (options.startRule === 'Session_Expires') {
                options.data.deltaSeconds = deltaSeconds;
            }
        },
        "refresher",
        peg$literalExpectation("refresher", false),
        "uas",
        peg$literalExpectation("uas", false),
        "uac",
        peg$literalExpectation("uac", false),
        function (endpoint) {
            options = options || { data: {} };
            if (options.startRule === 'Session_Expires') {
                options.data.refresher = endpoint;
            }
        },
        function (deltaSeconds) {
            options = options || { data: {} };
            if (options.startRule === 'Min_SE') {
                options.data = deltaSeconds;
            }
        },
        "stuns",
        peg$literalExpectation("stuns", true),
        "stun",
        peg$literalExpectation("stun", true),
        function (scheme) {
            options = options || { data: {} };
            options.data.scheme = scheme;
        },
        function (host) {
            options = options || { data: {} };
            options.data.host = host;
        },
        "?transport=",
        peg$literalExpectation("?transport=", false),
        "turns",
        peg$literalExpectation("turns", true),
        "turn",
        peg$literalExpectation("turn", true),
        function (transport) {
            options = options || { data: {} };
            options.data.transport = transport;
        },
        function () {
            options = options || { data: {} };
            options.data = text();
        },
        "Referred-By",
        peg$literalExpectation("Referred-By", false),
        "b",
        peg$literalExpectation("b", false),
        "cid",
        peg$literalExpectation("cid", false)
    ];
    var peg$bytecode = [
        peg$decode("2 \"\"6 7!"),
        peg$decode("4\"\"\"5!7#"),
        peg$decode("4$\"\"5!7%"),
        peg$decode("4&\"\"5!7'"),
        peg$decode(";'.# &;("),
        peg$decode("4(\"\"5!7)"),
        peg$decode("4*\"\"5!7+"),
        peg$decode("2,\"\"6,7-"),
        peg$decode("2.\"\"6.7/"),
        peg$decode("40\"\"5!71"),
        peg$decode("22\"\"6273.\x89 &24\"\"6475.} &26\"\"6677.q &28\"\"6879.e &2:\"\"6:7;.Y &2<\"\"6<7=.M &2>\"\"6>7?.A &2@\"\"6@7A.5 &2B\"\"6B7C.) &2D\"\"6D7E"),
        peg$decode(";).# &;,"),
        peg$decode("2F\"\"6F7G.} &2H\"\"6H7I.q &2J\"\"6J7K.e &2L\"\"6L7M.Y &2N\"\"6N7O.M &2P\"\"6P7Q.A &2R\"\"6R7S.5 &2T\"\"6T7U.) &2V\"\"6V7W"),
        peg$decode("%%2X\"\"6X7Y/5#;#/,$;#/#$+#)(#'#(\"'#&'#/\"!&,)"),
        peg$decode("%%$;$0#*;$&/,#; /#$+\")(\"'#&'#.\" &\"/=#$;$/&#0#*;$&&&#/'$8\":Z\" )(\"'#&'#"),
        peg$decode(";..\" &\""),
        peg$decode("%$;'.# &;(0)*;'.# &;(&/?#28\"\"6879/0$;//'$8#:[# )(#'#(\"'#&'#"),
        peg$decode("%%$;2/&#0#*;2&&&#/g#$%$;.0#*;.&/,#;2/#$+\")(\"'#&'#0=*%$;.0#*;.&/,#;2/#$+\")(\"'#&'#&/#$+\")(\"'#&'#/\"!&,)"),
        peg$decode("4\\\"\"5!7].# &;3"),
        peg$decode("4^\"\"5!7_"),
        peg$decode("4`\"\"5!7a"),
        peg$decode(";!.) &4b\"\"5!7c"),
        peg$decode("%$;).\x95 &2F\"\"6F7G.\x89 &2J\"\"6J7K.} &2L\"\"6L7M.q &2X\"\"6X7Y.e &2P\"\"6P7Q.Y &2H\"\"6H7I.M &2@\"\"6@7A.A &2d\"\"6d7e.5 &2R\"\"6R7S.) &2N\"\"6N7O/\x9E#0\x9B*;).\x95 &2F\"\"6F7G.\x89 &2J\"\"6J7K.} &2L\"\"6L7M.q &2X\"\"6X7Y.e &2P\"\"6P7Q.Y &2H\"\"6H7I.M &2@\"\"6@7A.A &2d\"\"6d7e.5 &2R\"\"6R7S.) &2N\"\"6N7O&&&#/\"!&,)"),
        peg$decode("%$;).\x89 &2F\"\"6F7G.} &2L\"\"6L7M.q &2X\"\"6X7Y.e &2P\"\"6P7Q.Y &2H\"\"6H7I.M &2@\"\"6@7A.A &2d\"\"6d7e.5 &2R\"\"6R7S.) &2N\"\"6N7O/\x92#0\x8F*;).\x89 &2F\"\"6F7G.} &2L\"\"6L7M.q &2X\"\"6X7Y.e &2P\"\"6P7Q.Y &2H\"\"6H7I.M &2@\"\"6@7A.A &2d\"\"6d7e.5 &2R\"\"6R7S.) &2N\"\"6N7O&&&#/\"!&,)"),
        peg$decode("2T\"\"6T7U.\xE3 &2V\"\"6V7W.\xD7 &2f\"\"6f7g.\xCB &2h\"\"6h7i.\xBF &2:\"\"6:7;.\xB3 &2D\"\"6D7E.\xA7 &22\"\"6273.\x9B &28\"\"6879.\x8F &2j\"\"6j7k.\x83 &;&.} &24\"\"6475.q &2l\"\"6l7m.e &2n\"\"6n7o.Y &26\"\"6677.M &2>\"\"6>7?.A &2p\"\"6p7q.5 &2r\"\"6r7s.) &;'.# &;("),
        peg$decode("%$;).\u012B &2F\"\"6F7G.\u011F &2J\"\"6J7K.\u0113 &2L\"\"6L7M.\u0107 &2X\"\"6X7Y.\xFB &2P\"\"6P7Q.\xEF &2H\"\"6H7I.\xE3 &2@\"\"6@7A.\xD7 &2d\"\"6d7e.\xCB &2R\"\"6R7S.\xBF &2N\"\"6N7O.\xB3 &2T\"\"6T7U.\xA7 &2V\"\"6V7W.\x9B &2f\"\"6f7g.\x8F &2h\"\"6h7i.\x83 &28\"\"6879.w &2j\"\"6j7k.k &;&.e &24\"\"6475.Y &2l\"\"6l7m.M &2n\"\"6n7o.A &26\"\"6677.5 &2p\"\"6p7q.) &2r\"\"6r7s/\u0134#0\u0131*;).\u012B &2F\"\"6F7G.\u011F &2J\"\"6J7K.\u0113 &2L\"\"6L7M.\u0107 &2X\"\"6X7Y.\xFB &2P\"\"6P7Q.\xEF &2H\"\"6H7I.\xE3 &2@\"\"6@7A.\xD7 &2d\"\"6d7e.\xCB &2R\"\"6R7S.\xBF &2N\"\"6N7O.\xB3 &2T\"\"6T7U.\xA7 &2V\"\"6V7W.\x9B &2f\"\"6f7g.\x8F &2h\"\"6h7i.\x83 &28\"\"6879.w &2j\"\"6j7k.k &;&.e &24\"\"6475.Y &2l\"\"6l7m.M &2n\"\"6n7o.A &26\"\"6677.5 &2p\"\"6p7q.) &2r\"\"6r7s&&&#/\"!&,)"),
        peg$decode("%;//?#2P\"\"6P7Q/0$;//'$8#:t# )(#'#(\"'#&'#"),
        peg$decode("%;//?#24\"\"6475/0$;//'$8#:u# )(#'#(\"'#&'#"),
        peg$decode("%;//?#2>\"\"6>7?/0$;//'$8#:v# )(#'#(\"'#&'#"),
        peg$decode("%;//?#2T\"\"6T7U/0$;//'$8#:w# )(#'#(\"'#&'#"),
        peg$decode("%;//?#2V\"\"6V7W/0$;//'$8#:x# )(#'#(\"'#&'#"),
        peg$decode("%2h\"\"6h7i/0#;//'$8\":y\" )(\"'#&'#"),
        peg$decode("%;//6#2f\"\"6f7g/'$8\":z\" )(\"'#&'#"),
        peg$decode("%;//?#2D\"\"6D7E/0$;//'$8#:{# )(#'#(\"'#&'#"),
        peg$decode("%;//?#22\"\"6273/0$;//'$8#:|# )(#'#(\"'#&'#"),
        peg$decode("%;//?#28\"\"6879/0$;//'$8#:}# )(#'#(\"'#&'#"),
        peg$decode("%;//0#;&/'$8\":~\" )(\"'#&'#"),
        peg$decode("%;&/0#;//'$8\":~\" )(\"'#&'#"),
        peg$decode("%;=/T#$;G.) &;K.# &;F0/*;G.) &;K.# &;F&/,$;>/#$+#)(#'#(\"'#&'#"),
        peg$decode("4\x7F\"\"5!7\x80.A &4\x81\"\"5!7\x82.5 &4\x83\"\"5!7\x84.) &;3.# &;."),
        peg$decode("%%;//Q#;&/H$$;J.# &;K0)*;J.# &;K&/,$;&/#$+$)($'#(#'#(\"'#&'#/\"!&,)"),
        peg$decode("%;//]#;&/T$%$;J.# &;K0)*;J.# &;K&/\"!&,)/1$;&/($8$:\x85$!!)($'#(#'#(\"'#&'#"),
        peg$decode(";..G &2L\"\"6L7M.; &4\x86\"\"5!7\x87./ &4\x83\"\"5!7\x84.# &;3"),
        peg$decode("%2j\"\"6j7k/J#4\x88\"\"5!7\x89.5 &4\x8A\"\"5!7\x8B.) &4\x8C\"\"5!7\x8D/#$+\")(\"'#&'#"),
        peg$decode("%;N/M#28\"\"6879/>$;O.\" &\"/0$;S/'$8$:\x8E$ )($'#(#'#(\"'#&'#"),
        peg$decode("%;N/d#28\"\"6879/U$;O.\" &\"/G$;S/>$;_/5$;l.\" &\"/'$8&:\x8F& )(&'#(%'#($'#(#'#(\"'#&'#"),
        peg$decode("%3\x90\"\"5$7\x91.) &3\x92\"\"5#7\x93/' 8!:\x94!! )"),
        peg$decode("%;P/]#%28\"\"6879/,#;R/#$+\")(\"'#&'#.\" &\"/6$2:\"\"6:7;/'$8#:\x95# )(#'#(\"'#&'#"),
        peg$decode("$;+.) &;-.# &;Q/2#0/*;+.) &;-.# &;Q&&&#"),
        peg$decode("2<\"\"6<7=.q &2>\"\"6>7?.e &2@\"\"6@7A.Y &2B\"\"6B7C.M &2D\"\"6D7E.A &22\"\"6273.5 &26\"\"6677.) &24\"\"6475"),
        peg$decode("%$;+._ &;-.Y &2<\"\"6<7=.M &2>\"\"6>7?.A &2@\"\"6@7A.5 &2B\"\"6B7C.) &2D\"\"6D7E0e*;+._ &;-.Y &2<\"\"6<7=.M &2>\"\"6>7?.A &2@\"\"6@7A.5 &2B\"\"6B7C.) &2D\"\"6D7E&/& 8!:\x96! )"),
        peg$decode("%;T/J#%28\"\"6879/,#;^/#$+\")(\"'#&'#.\" &\"/#$+\")(\"'#&'#"),
        peg$decode("%;U.) &;\\.# &;X/& 8!:\x97! )"),
        peg$decode("%$%;V/2#2J\"\"6J7K/#$+\")(\"'#&'#0<*%;V/2#2J\"\"6J7K/#$+\")(\"'#&'#&/D#;W/;$2J\"\"6J7K.\" &\"/'$8#:\x98# )(#'#(\"'#&'#"),
        peg$decode("$4\x99\"\"5!7\x9A/,#0)*4\x99\"\"5!7\x9A&&&#"),
        peg$decode("%4$\"\"5!7%/?#$4\x9B\"\"5!7\x9C0)*4\x9B\"\"5!7\x9C&/#$+\")(\"'#&'#"),
        peg$decode("%2l\"\"6l7m/?#;Y/6$2n\"\"6n7o/'$8#:\x9D# )(#'#(\"'#&'#"),
        peg$decode("%%;Z/\xB3#28\"\"6879/\xA4$;Z/\x9B$28\"\"6879/\x8C$;Z/\x83$28\"\"6879/t$;Z/k$28\"\"6879/\\$;Z/S$28\"\"6879/D$;Z/;$28\"\"6879/,$;[/#$+-)(-'#(,'#(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u0790 &%2\x9E\"\"6\x9E7\x9F/\xA4#;Z/\x9B$28\"\"6879/\x8C$;Z/\x83$28\"\"6879/t$;Z/k$28\"\"6879/\\$;Z/S$28\"\"6879/D$;Z/;$28\"\"6879/,$;[/#$+,)(,'#(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u06F9 &%2\x9E\"\"6\x9E7\x9F/\x8C#;Z/\x83$28\"\"6879/t$;Z/k$28\"\"6879/\\$;Z/S$28\"\"6879/D$;Z/;$28\"\"6879/,$;[/#$+*)(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u067A &%2\x9E\"\"6\x9E7\x9F/t#;Z/k$28\"\"6879/\\$;Z/S$28\"\"6879/D$;Z/;$28\"\"6879/,$;[/#$+()(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u0613 &%2\x9E\"\"6\x9E7\x9F/\\#;Z/S$28\"\"6879/D$;Z/;$28\"\"6879/,$;[/#$+&)(&'#(%'#($'#(#'#(\"'#&'#.\u05C4 &%2\x9E\"\"6\x9E7\x9F/D#;Z/;$28\"\"6879/,$;[/#$+$)($'#(#'#(\"'#&'#.\u058D &%2\x9E\"\"6\x9E7\x9F/,#;[/#$+\")(\"'#&'#.\u056E &%2\x9E\"\"6\x9E7\x9F/,#;Z/#$+\")(\"'#&'#.\u054F &%;Z/\x9B#2\x9E\"\"6\x9E7\x9F/\x8C$;Z/\x83$28\"\"6879/t$;Z/k$28\"\"6879/\\$;Z/S$28\"\"6879/D$;Z/;$28\"\"6879/,$;[/#$++)(+'#(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u04C7 &%;Z/\xAA#%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\x83$2\x9E\"\"6\x9E7\x9F/t$;Z/k$28\"\"6879/\\$;Z/S$28\"\"6879/D$;Z/;$28\"\"6879/,$;[/#$+*)(*'#()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u0430 &%;Z/\xB9#%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\x92$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/k$2\x9E\"\"6\x9E7\x9F/\\$;Z/S$28\"\"6879/D$;Z/;$28\"\"6879/,$;[/#$+))()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u038A &%;Z/\xC8#%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\xA1$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/z$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/S$2\x9E\"\"6\x9E7\x9F/D$;Z/;$28\"\"6879/,$;[/#$+()(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u02D5 &%;Z/\xD7#%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\xB0$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\x89$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/b$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/;$2\x9E\"\"6\x9E7\x9F/,$;[/#$+')(''#(&'#(%'#($'#(#'#(\"'#&'#.\u0211 &%;Z/\xFE#%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\xD7$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\xB0$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\x89$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/b$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/;$2\x9E\"\"6\x9E7\x9F/,$;Z/#$+()(('#(''#(&'#(%'#($'#(#'#(\"'#&'#.\u0126 &%;Z/\u011C#%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\xF5$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\xCE$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\xA7$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/\x80$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/Y$%28\"\"6879/,#;Z/#$+\")(\"'#&'#.\" &\"/2$2\x9E\"\"6\x9E7\x9F/#$+()(('#(''#(&'#(%'#($'#(#'#(\"'#&'#/& 8!:\xA0! )"),
        peg$decode("%;#/M#;#.\" &\"/?$;#.\" &\"/1$;#.\" &\"/#$+$)($'#(#'#(\"'#&'#"),
        peg$decode("%;Z/;#28\"\"6879/,$;Z/#$+#)(#'#(\"'#&'#.# &;\\"),
        peg$decode("%;]/o#2J\"\"6J7K/`$;]/W$2J\"\"6J7K/H$;]/?$2J\"\"6J7K/0$;]/'$8':\xA1' )(''#(&'#(%'#($'#(#'#(\"'#&'#"),
        peg$decode("%2\xA2\"\"6\xA27\xA3/2#4\xA4\"\"5!7\xA5/#$+\")(\"'#&'#.\x98 &%2\xA6\"\"6\xA67\xA7/;#4\xA8\"\"5!7\xA9/,$;!/#$+#)(#'#(\"'#&'#.j &%2\xAA\"\"6\xAA7\xAB/5#;!/,$;!/#$+#)(#'#(\"'#&'#.B &%4\xAC\"\"5!7\xAD/,#;!/#$+\")(\"'#&'#.# &;!"),
        peg$decode("%%;!.\" &\"/[#;!.\" &\"/M$;!.\" &\"/?$;!.\" &\"/1$;!.\" &\"/#$+%)(%'#($'#(#'#(\"'#&'#/' 8!:\xAE!! )"),
        peg$decode("$%22\"\"6273/,#;`/#$+\")(\"'#&'#0<*%22\"\"6273/,#;`/#$+\")(\"'#&'#&"),
        peg$decode(";a.A &;b.; &;c.5 &;d./ &;e.) &;f.# &;g"),
        peg$decode("%3\xAF\"\"5*7\xB0/a#3\xB1\"\"5#7\xB2.G &3\xB3\"\"5#7\xB4.; &3\xB5\"\"5$7\xB6./ &3\xB7\"\"5#7\xB8.# &;6/($8\":\xB9\"! )(\"'#&'#"),
        peg$decode("%3\xBA\"\"5%7\xBB/I#3\xBC\"\"5%7\xBD./ &3\xBE\"\"5\"7\xBF.# &;6/($8\":\xC0\"! )(\"'#&'#"),
        peg$decode("%3\xC1\"\"5'7\xC2/1#;\x90/($8\":\xC3\"! )(\"'#&'#"),
        peg$decode("%3\xC4\"\"5$7\xC5/1#;\xF0/($8\":\xC6\"! )(\"'#&'#"),
        peg$decode("%3\xC7\"\"5&7\xC8/1#;T/($8\":\xC9\"! )(\"'#&'#"),
        peg$decode("%3\xCA\"\"5\"7\xCB/N#%2>\"\"6>7?/,#;6/#$+\")(\"'#&'#.\" &\"/'$8\":\xCC\" )(\"'#&'#"),
        peg$decode("%;h/P#%2>\"\"6>7?/,#;i/#$+\")(\"'#&'#.\" &\"/)$8\":\xCD\"\"! )(\"'#&'#"),
        peg$decode("%$;j/&#0#*;j&&&#/\"!&,)"),
        peg$decode("%$;j/&#0#*;j&&&#/\"!&,)"),
        peg$decode(";k.) &;+.# &;-"),
        peg$decode("2l\"\"6l7m.e &2n\"\"6n7o.Y &24\"\"6475.M &28\"\"6879.A &2<\"\"6<7=.5 &2@\"\"6@7A.) &2B\"\"6B7C"),
        peg$decode("%26\"\"6677/n#;m/e$$%2<\"\"6<7=/,#;m/#$+\")(\"'#&'#0<*%2<\"\"6<7=/,#;m/#$+\")(\"'#&'#&/#$+#)(#'#(\"'#&'#"),
        peg$decode("%;n/A#2>\"\"6>7?/2$;o/)$8#:\xCE#\"\" )(#'#(\"'#&'#"),
        peg$decode("$;p.) &;+.# &;-/2#0/*;p.) &;+.# &;-&&&#"),
        peg$decode("$;p.) &;+.# &;-0/*;p.) &;+.# &;-&"),
        peg$decode("2l\"\"6l7m.e &2n\"\"6n7o.Y &24\"\"6475.M &26\"\"6677.A &28\"\"6879.5 &2@\"\"6@7A.) &2B\"\"6B7C"),
        peg$decode(";\x91.# &;r"),
        peg$decode("%;\x90/G#;'/>$;s/5$;'/,$;\x84/#$+%)(%'#($'#(#'#(\"'#&'#"),
        peg$decode(";M.# &;t"),
        peg$decode("%;\x7F/E#28\"\"6879/6$;u.# &;x/'$8#:\xCF# )(#'#(\"'#&'#"),
        peg$decode("%;v.# &;w/J#%26\"\"6677/,#;\x83/#$+\")(\"'#&'#.\" &\"/#$+\")(\"'#&'#"),
        peg$decode("%2\xD0\"\"6\xD07\xD1/:#;\x80/1$;w.\" &\"/#$+#)(#'#(\"'#&'#"),
        peg$decode("%24\"\"6475/,#;{/#$+\")(\"'#&'#"),
        peg$decode("%;z/3#$;y0#*;y&/#$+\")(\"'#&'#"),
        peg$decode(";*.) &;+.# &;-"),
        peg$decode(";+.\x8F &;-.\x89 &22\"\"6273.} &26\"\"6677.q &28\"\"6879.e &2:\"\"6:7;.Y &2<\"\"6<7=.M &2>\"\"6>7?.A &2@\"\"6@7A.5 &2B\"\"6B7C.) &2D\"\"6D7E"),
        peg$decode("%;|/e#$%24\"\"6475/,#;|/#$+\")(\"'#&'#0<*%24\"\"6475/,#;|/#$+\")(\"'#&'#&/#$+\")(\"'#&'#"),
        peg$decode("%$;~0#*;~&/e#$%22\"\"6273/,#;}/#$+\")(\"'#&'#0<*%22\"\"6273/,#;}/#$+\")(\"'#&'#&/#$+\")(\"'#&'#"),
        peg$decode("$;~0#*;~&"),
        peg$decode(";+.w &;-.q &28\"\"6879.e &2:\"\"6:7;.Y &2<\"\"6<7=.M &2>\"\"6>7?.A &2@\"\"6@7A.5 &2B\"\"6B7C.) &2D\"\"6D7E"),
        peg$decode("%%;\"/\x87#$;\".G &;!.A &2@\"\"6@7A.5 &2F\"\"6F7G.) &2J\"\"6J7K0M*;\".G &;!.A &2@\"\"6@7A.5 &2F\"\"6F7G.) &2J\"\"6J7K&/#$+\")(\"'#&'#/& 8!:\xD2! )"),
        peg$decode(";\x81.# &;\x82"),
        peg$decode("%%;O/2#2:\"\"6:7;/#$+\")(\"'#&'#.\" &\"/,#;S/#$+\")(\"'#&'#.\" &\""),
        peg$decode("$;+.\x83 &;-.} &2B\"\"6B7C.q &2D\"\"6D7E.e &22\"\"6273.Y &28\"\"6879.M &2:\"\"6:7;.A &2<\"\"6<7=.5 &2>\"\"6>7?.) &2@\"\"6@7A/\x8C#0\x89*;+.\x83 &;-.} &2B\"\"6B7C.q &2D\"\"6D7E.e &22\"\"6273.Y &28\"\"6879.M &2:\"\"6:7;.A &2<\"\"6<7=.5 &2>\"\"6>7?.) &2@\"\"6@7A&&&#"),
        peg$decode("$;y0#*;y&"),
        peg$decode("%3\x92\"\"5#7\xD3/q#24\"\"6475/b$$;!/&#0#*;!&&&#/L$2J\"\"6J7K/=$$;!/&#0#*;!&&&#/'$8%:\xD4% )(%'#($'#(#'#(\"'#&'#"),
        peg$decode("2\xD5\"\"6\xD57\xD6"),
        peg$decode("2\xD7\"\"6\xD77\xD8"),
        peg$decode("2\xD9\"\"6\xD97\xDA"),
        peg$decode("2\xDB\"\"6\xDB7\xDC"),
        peg$decode("2\xDD\"\"6\xDD7\xDE"),
        peg$decode("2\xDF\"\"6\xDF7\xE0"),
        peg$decode("2\xE1\"\"6\xE17\xE2"),
        peg$decode("2\xE3\"\"6\xE37\xE4"),
        peg$decode("2\xE5\"\"6\xE57\xE6"),
        peg$decode("2\xE7\"\"6\xE77\xE8"),
        peg$decode("2\xE9\"\"6\xE97\xEA"),
        peg$decode("%;\x85.Y &;\x86.S &;\x88.M &;\x89.G &;\x8A.A &;\x8B.; &;\x8C.5 &;\x8F./ &;\x8D.) &;\x8E.# &;6/& 8!:\xEB! )"),
        peg$decode("%;\x84/G#;'/>$;\x92/5$;'/,$;\x94/#$+%)(%'#($'#(#'#(\"'#&'#"),
        peg$decode("%;\x93/' 8!:\xEC!! )"),
        peg$decode("%;!/5#;!/,$;!/#$+#)(#'#(\"'#&'#"),
        peg$decode("%$;*.A &;+.; &;-.5 &;3./ &;4.) &;'.# &;(0G*;*.A &;+.; &;-.5 &;3./ &;4.) &;'.# &;(&/& 8!:\xED! )"),
        peg$decode("%;\xB6/Y#$%;A/,#;\xB6/#$+\")(\"'#&'#06*%;A/,#;\xB6/#$+\")(\"'#&'#&/#$+\")(\"'#&'#"),
        peg$decode("%;9/N#%2:\"\"6:7;/,#;9/#$+\")(\"'#&'#.\" &\"/'$8\":\xEE\" )(\"'#&'#"),
        peg$decode("%;:.c &%;\x98/Y#$%;A/,#;\x98/#$+\")(\"'#&'#06*%;A/,#;\x98/#$+\")(\"'#&'#&/#$+\")(\"'#&'#/& 8!:\xEF! )"),
        peg$decode("%;L.# &;\x99/]#$%;B/,#;\x9B/#$+\")(\"'#&'#06*%;B/,#;\x9B/#$+\")(\"'#&'#&/'$8\":\xF0\" )(\"'#&'#"),
        peg$decode("%;\x9A.\" &\"/>#;@/5$;M/,$;?/#$+$)($'#(#'#(\"'#&'#"),
        peg$decode("%%;6/Y#$%;./,#;6/#$+\")(\"'#&'#06*%;./,#;6/#$+\")(\"'#&'#&/#$+\")(\"'#&'#.# &;H/' 8!:\xF1!! )"),
        peg$decode(";\x9C.) &;\x9D.# &;\xA0"),
        peg$decode("%3\xF2\"\"5!7\xF3/:#;</1$;\x9F/($8#:\xF4#! )(#'#(\"'#&'#"),
        peg$decode("%3\xF5\"\"5'7\xF6/:#;</1$;\x9E/($8#:\xF7#! )(#'#(\"'#&'#"),
        peg$decode("%$;!/&#0#*;!&&&#/' 8!:\xF8!! )"),
        peg$decode("%2\xF9\"\"6\xF97\xFA/o#%2J\"\"6J7K/M#;!.\" &\"/?$;!.\" &\"/1$;!.\" &\"/#$+$)($'#(#'#(\"'#&'#.\" &\"/'$8\":\xFB\" )(\"'#&'#"),
        peg$decode("%;6/J#%;</,#;\xA1/#$+\")(\"'#&'#.\" &\"/)$8\":\xFC\"\"! )(\"'#&'#"),
        peg$decode(";6.) &;T.# &;H"),
        peg$decode("%;\xA3/Y#$%;B/,#;\xA4/#$+\")(\"'#&'#06*%;B/,#;\xA4/#$+\")(\"'#&'#&/#$+\")(\"'#&'#"),
        peg$decode("%3\xFD\"\"5&7\xFE.G &3\xFF\"\"5'7\u0100.; &3\u0101\"\"5$7\u0102./ &3\u0103\"\"5%7\u0104.# &;6/& 8!:\u0105! )"),
        peg$decode(";\xA5.# &;\xA0"),
        peg$decode("%3\u0106\"\"5(7\u0107/M#;</D$3\u0108\"\"5(7\u0109./ &3\u010A\"\"5(7\u010B.# &;6/#$+#)(#'#(\"'#&'#"),
        peg$decode("%;6/Y#$%;A/,#;6/#$+\")(\"'#&'#06*%;A/,#;6/#$+\")(\"'#&'#&/#$+\")(\"'#&'#"),
        peg$decode("%$;!/&#0#*;!&&&#/' 8!:\u010C!! )"),
        peg$decode("%;\xA9/& 8!:\u010D! )"),
        peg$decode("%;\xAA/k#;;/b$;\xAF/Y$$%;B/,#;\xB0/#$+\")(\"'#&'#06*%;B/,#;\xB0/#$+\")(\"'#&'#&/#$+$)($'#(#'#(\"'#&'#"),
        peg$decode(";\xAB.# &;\xAC"),
        peg$decode("3\u010E\"\"5$7\u010F.S &3\u0110\"\"5%7\u0111.G &3\u0112\"\"5%7\u0113.; &3\u0114\"\"5%7\u0115./ &3\u0116\"\"5+7\u0117.# &;\xAD"),
        peg$decode("3\u0118\"\"5'7\u0119./ &3\u011A\"\"5)7\u011B.# &;\xAD"),
        peg$decode(";6.# &;\xAE"),
        peg$decode("%3\u011C\"\"5\"7\u011D/,#;6/#$+\")(\"'#&'#"),
        peg$decode(";\xAD.# &;6"),
        peg$decode("%;6/5#;</,$;\xB1/#$+#)(#'#(\"'#&'#"),
        peg$decode(";6.# &;H"),
        peg$decode("%;\xB3/5#;./,$;\x90/#$+#)(#'#(\"'#&'#"),
        peg$decode("%$;!/&#0#*;!&&&#/' 8!:\u011E!! )"),
        peg$decode("%;\x9E/' 8!:\u011F!! )"),
        peg$decode("%;\xB6/^#$%;B/,#;\xA0/#$+\")(\"'#&'#06*%;B/,#;\xA0/#$+\")(\"'#&'#&/($8\":\u0120\"!!)(\"'#&'#"),
        peg$decode("%%;7/e#$%2J\"\"6J7K/,#;7/#$+\")(\"'#&'#0<*%2J\"\"6J7K/,#;7/#$+\")(\"'#&'#&/#$+\")(\"'#&'#/\"!&,)"),
        peg$decode("%;L.# &;\x99/]#$%;B/,#;\xB8/#$+\")(\"'#&'#06*%;B/,#;\xB8/#$+\")(\"'#&'#&/'$8\":\u0121\" )(\"'#&'#"),
        peg$decode(";\xB9.# &;\xA0"),
        peg$decode("%3\u0122\"\"5#7\u0123/:#;</1$;6/($8#:\u0124#! )(#'#(\"'#&'#"),
        peg$decode("%$;!/&#0#*;!&&&#/' 8!:\u0125!! )"),
        peg$decode("%;\x9E/' 8!:\u0126!! )"),
        peg$decode("%$;\x9A0#*;\x9A&/x#;@/o$;M/f$;?/]$$%;B/,#;\xA0/#$+\")(\"'#&'#06*%;B/,#;\xA0/#$+\")(\"'#&'#&/'$8%:\u0127% )(%'#($'#(#'#(\"'#&'#"),
        peg$decode(";\xBE"),
        peg$decode("%3\u0128\"\"5&7\u0129/k#;./b$;\xC1/Y$$%;A/,#;\xC1/#$+\")(\"'#&'#06*%;A/,#;\xC1/#$+\")(\"'#&'#&/#$+$)($'#(#'#(\"'#&'#.# &;\xBF"),
        peg$decode("%;6/k#;./b$;\xC0/Y$$%;A/,#;\xC0/#$+\")(\"'#&'#06*%;A/,#;\xC0/#$+\")(\"'#&'#&/#$+$)($'#(#'#(\"'#&'#"),
        peg$decode("%;6/;#;</2$;6.# &;H/#$+#)(#'#(\"'#&'#"),
        peg$decode(";\xC2.G &;\xC4.A &;\xC6.; &;\xC8.5 &;\xC9./ &;\xCA.) &;\xCB.# &;\xC0"),
        peg$decode("%3\u012A\"\"5%7\u012B/5#;</,$;\xC3/#$+#)(#'#(\"'#&'#"),
        peg$decode("%;I/' 8!:\u012C!! )"),
        peg$decode("%3\u012D\"\"5&7\u012E/\x97#;</\x8E$;D/\x85$;\xC5/|$$%$;'/&#0#*;'&&&#/,#;\xC5/#$+\")(\"'#&'#0C*%$;'/&#0#*;'&&&#/,#;\xC5/#$+\")(\"'#&'#&/,$;E/#$+&)(&'#(%'#($'#(#'#(\"'#&'#"),
        peg$decode(";t.# &;w"),
        peg$decode("%3\u012F\"\"5%7\u0130/5#;</,$;\xC7/#$+#)(#'#(\"'#&'#"),
        peg$decode("%;I/' 8!:\u0131!! )"),
        peg$decode("%3\u0132\"\"5&7\u0133/:#;</1$;I/($8#:\u0134#! )(#'#(\"'#&'#"),
        peg$decode("%3\u0135\"\"5%7\u0136/]#;</T$%3\u0137\"\"5$7\u0138/& 8!:\u0139! ).4 &%3\u013A\"\"5%7\u013B/& 8!:\u013C! )/#$+#)(#'#(\"'#&'#"),
        peg$decode("%3\u013D\"\"5)7\u013E/R#;</I$3\u013F\"\"5#7\u0140./ &3\u0141\"\"5(7\u0142.# &;6/($8#:\u0143#! )(#'#(\"'#&'#"),
        peg$decode("%3\u0144\"\"5#7\u0145/\x93#;</\x8A$;D/\x81$%;\xCC/e#$%2D\"\"6D7E/,#;\xCC/#$+\")(\"'#&'#0<*%2D\"\"6D7E/,#;\xCC/#$+\")(\"'#&'#&/#$+\")(\"'#&'#/,$;E/#$+%)(%'#($'#(#'#(\"'#&'#"),
        peg$decode("%3\u0146\"\"5(7\u0147./ &3\u0148\"\"5$7\u0149.# &;6/' 8!:\u014A!! )"),
        peg$decode("%;6/Y#$%;A/,#;6/#$+\")(\"'#&'#06*%;A/,#;6/#$+\")(\"'#&'#&/#$+\")(\"'#&'#"),
        peg$decode("%;\xCF/G#;./>$;\xCF/5$;./,$;\x90/#$+%)(%'#($'#(#'#(\"'#&'#"),
        peg$decode("%$;!/&#0#*;!&&&#/' 8!:\u014B!! )"),
        peg$decode("%;\xD1/]#$%;A/,#;\xD1/#$+\")(\"'#&'#06*%;A/,#;\xD1/#$+\")(\"'#&'#&/'$8\":\u014C\" )(\"'#&'#"),
        peg$decode("%;\x99/]#$%;B/,#;\xA0/#$+\")(\"'#&'#06*%;B/,#;\xA0/#$+\")(\"'#&'#&/'$8\":\u014D\" )(\"'#&'#"),
        peg$decode("%;L.O &;\x99.I &%;@.\" &\"/:#;t/1$;?.\" &\"/#$+#)(#'#(\"'#&'#/]#$%;B/,#;\xA0/#$+\")(\"'#&'#06*%;B/,#;\xA0/#$+\")(\"'#&'#&/'$8\":\u014E\" )(\"'#&'#"),
        peg$decode("%;\xD4/]#$%;B/,#;\xD5/#$+\")(\"'#&'#06*%;B/,#;\xD5/#$+\")(\"'#&'#&/'$8\":\u014F\" )(\"'#&'#"),
        peg$decode("%;\x96/& 8!:\u0150! )"),
        peg$decode("%3\u0151\"\"5(7\u0152/:#;</1$;6/($8#:\u0153#! )(#'#(\"'#&'#.g &%3\u0154\"\"5&7\u0155/:#;</1$;6/($8#:\u0156#! )(#'#(\"'#&'#.: &%3\u0157\"\"5*7\u0158/& 8!:\u0159! ).# &;\xA0"),
        peg$decode("%%;6/k#$%;A/2#;6/)$8\":\u015A\"\"$ )(\"'#&'#0<*%;A/2#;6/)$8\":\u015A\"\"$ )(\"'#&'#&/)$8\":\u015B\"\"! )(\"'#&'#.\" &\"/' 8!:\u015C!! )"),
        peg$decode("%;\xD8/Y#$%;A/,#;\xD8/#$+\")(\"'#&'#06*%;A/,#;\xD8/#$+\")(\"'#&'#&/#$+\")(\"'#&'#"),
        peg$decode("%;\x99/Y#$%;B/,#;\xA0/#$+\")(\"'#&'#06*%;B/,#;\xA0/#$+\")(\"'#&'#&/#$+\")(\"'#&'#"),
        peg$decode("%$;!/&#0#*;!&&&#/' 8!:\u015D!! )"),
        peg$decode("%;\xDB/Y#$%;B/,#;\xDC/#$+\")(\"'#&'#06*%;B/,#;\xDC/#$+\")(\"'#&'#&/#$+\")(\"'#&'#"),
        peg$decode("%3\u015E\"\"5&7\u015F.; &3\u0160\"\"5'7\u0161./ &3\u0162\"\"5*7\u0163.# &;6/& 8!:\u0164! )"),
        peg$decode("%3\u0165\"\"5&7\u0166/:#;</1$;\xDD/($8#:\u0167#! )(#'#(\"'#&'#.} &%3\xF5\"\"5'7\xF6/:#;</1$;\x9E/($8#:\u0168#! )(#'#(\"'#&'#.P &%3\u0169\"\"5+7\u016A/:#;</1$;\x9E/($8#:\u016B#! )(#'#(\"'#&'#.# &;\xA0"),
        peg$decode("3\u016C\"\"5+7\u016D.k &3\u016E\"\"5)7\u016F._ &3\u0170\"\"5(7\u0171.S &3\u0172\"\"5'7\u0173.G &3\u0174\"\"5&7\u0175.; &3\u0176\"\"5*7\u0177./ &3\u0178\"\"5)7\u0179.# &;6"),
        peg$decode(";1.\" &\""),
        peg$decode("%%;6/k#$%;A/2#;6/)$8\":\u015A\"\"$ )(\"'#&'#0<*%;A/2#;6/)$8\":\u015A\"\"$ )(\"'#&'#&/)$8\":\u015B\"\"! )(\"'#&'#.\" &\"/' 8!:\u017A!! )"),
        peg$decode("%;L.# &;\x99/]#$%;B/,#;\xE1/#$+\")(\"'#&'#06*%;B/,#;\xE1/#$+\")(\"'#&'#&/'$8\":\u017B\" )(\"'#&'#"),
        peg$decode(";\xB9.# &;\xA0"),
        peg$decode("%;\xE3/Y#$%;A/,#;\xE3/#$+\")(\"'#&'#06*%;A/,#;\xE3/#$+\")(\"'#&'#&/#$+\")(\"'#&'#"),
        peg$decode("%;\xEA/k#;./b$;\xED/Y$$%;B/,#;\xE4/#$+\")(\"'#&'#06*%;B/,#;\xE4/#$+\")(\"'#&'#&/#$+$)($'#(#'#(\"'#&'#"),
        peg$decode(";\xE5.; &;\xE6.5 &;\xE7./ &;\xE8.) &;\xE9.# &;\xA0"),
        peg$decode("%3\u017C\"\"5#7\u017D/:#;</1$;\xF0/($8#:\u017E#! )(#'#(\"'#&'#"),
        peg$decode("%3\u017F\"\"5%7\u0180/:#;</1$;T/($8#:\u0181#! )(#'#(\"'#&'#"),
        peg$decode("%3\u0182\"\"5(7\u0183/F#;</=$;\\.) &;Y.# &;X/($8#:\u0184#! )(#'#(\"'#&'#"),
        peg$decode("%3\u0185\"\"5&7\u0186/:#;</1$;6/($8#:\u0187#! )(#'#(\"'#&'#"),
        peg$decode("%3\u0188\"\"5%7\u0189/A#;</8$$;!0#*;!&/($8#:\u018A#! )(#'#(\"'#&'#"),
        peg$decode("%;\xEB/G#;;/>$;6/5$;;/,$;\xEC/#$+%)(%'#($'#(#'#(\"'#&'#"),
        peg$decode("%3\x92\"\"5#7\xD3.# &;6/' 8!:\u018B!! )"),
        peg$decode("%3\xB1\"\"5#7\u018C.G &3\xB3\"\"5#7\u018D.; &3\xB7\"\"5#7\u018E./ &3\xB5\"\"5$7\u018F.# &;6/' 8!:\u0190!! )"),
        peg$decode("%;\xEE/D#%;C/,#;\xEF/#$+\")(\"'#&'#.\" &\"/#$+\")(\"'#&'#"),
        peg$decode("%;U.) &;\\.# &;X/& 8!:\u0191! )"),
        peg$decode("%%;!.\" &\"/[#;!.\" &\"/M$;!.\" &\"/?$;!.\" &\"/1$;!.\" &\"/#$+%)(%'#($'#(#'#(\"'#&'#/' 8!:\u0192!! )"),
        peg$decode("%%;!/?#;!.\" &\"/1$;!.\" &\"/#$+#)(#'#(\"'#&'#/' 8!:\u0193!! )"),
        peg$decode(";\xBE"),
        peg$decode("%;\x9E/^#$%;B/,#;\xF3/#$+\")(\"'#&'#06*%;B/,#;\xF3/#$+\")(\"'#&'#&/($8\":\u0194\"!!)(\"'#&'#"),
        peg$decode(";\xF4.# &;\xA0"),
        peg$decode("%2\u0195\"\"6\u01957\u0196/L#;</C$2\u0197\"\"6\u01977\u0198.) &2\u0199\"\"6\u01997\u019A/($8#:\u019B#! )(#'#(\"'#&'#"),
        peg$decode("%;\x9E/^#$%;B/,#;\xA0/#$+\")(\"'#&'#06*%;B/,#;\xA0/#$+\")(\"'#&'#&/($8\":\u019C\"!!)(\"'#&'#"),
        peg$decode("%;6/5#;0/,$;\xF7/#$+#)(#'#(\"'#&'#"),
        peg$decode("$;2.) &;4.# &;.0/*;2.) &;4.# &;.&"),
        peg$decode("$;%0#*;%&"),
        peg$decode("%;\xFA/;#28\"\"6879/,$;\xFB/#$+#)(#'#(\"'#&'#"),
        peg$decode("%3\u019D\"\"5%7\u019E.) &3\u019F\"\"5$7\u01A0/' 8!:\u01A1!! )"),
        peg$decode("%;\xFC/J#%28\"\"6879/,#;^/#$+\")(\"'#&'#.\" &\"/#$+\")(\"'#&'#"),
        peg$decode("%;\\.) &;X.# &;\x82/' 8!:\u01A2!! )"),
        peg$decode(";\".S &;!.M &2F\"\"6F7G.A &2J\"\"6J7K.5 &2H\"\"6H7I.) &2N\"\"6N7O"),
        peg$decode("2L\"\"6L7M.\x95 &2B\"\"6B7C.\x89 &2<\"\"6<7=.} &2R\"\"6R7S.q &2T\"\"6T7U.e &2V\"\"6V7W.Y &2P\"\"6P7Q.M &2@\"\"6@7A.A &2D\"\"6D7E.5 &22\"\"6273.) &2>\"\"6>7?"),
        peg$decode("%;\u0100/b#28\"\"6879/S$;\xFB/J$%2\u01A3\"\"6\u01A37\u01A4/,#;\xEC/#$+\")(\"'#&'#.\" &\"/#$+$)($'#(#'#(\"'#&'#"),
        peg$decode("%3\u01A5\"\"5%7\u01A6.) &3\u01A7\"\"5$7\u01A8/' 8!:\u01A1!! )"),
        peg$decode("%3\xB1\"\"5#7\xB2.6 &3\xB3\"\"5#7\xB4.* &$;+0#*;+&/' 8!:\u01A9!! )"),
        peg$decode("%;\u0104/\x87#2F\"\"6F7G/x$;\u0103/o$2F\"\"6F7G/`$;\u0103/W$2F\"\"6F7G/H$;\u0103/?$2F\"\"6F7G/0$;\u0105/'$8):\u01AA) )()'#(('#(''#(&'#(%'#($'#(#'#(\"'#&'#"),
        peg$decode("%;#/>#;#/5$;#/,$;#/#$+$)($'#(#'#(\"'#&'#"),
        peg$decode("%;\u0103/,#;\u0103/#$+\")(\"'#&'#"),
        peg$decode("%;\u0103/5#;\u0103/,$;\u0103/#$+#)(#'#(\"'#&'#"),
        peg$decode("%;q/T#$;m0#*;m&/D$%; /,#;\xF8/#$+\")(\"'#&'#.\" &\"/#$+#)(#'#(\"'#&'#"),
        peg$decode("%2\u01AB\"\"6\u01AB7\u01AC.) &2\u01AD\"\"6\u01AD7\u01AE/w#;0/n$;\u0108/e$$%;B/2#;\u0109.# &;\xA0/#$+\")(\"'#&'#0<*%;B/2#;\u0109.# &;\xA0/#$+\")(\"'#&'#&/#$+$)($'#(#'#(\"'#&'#"),
        peg$decode(";\x99.# &;L"),
        peg$decode("%2\u01AF\"\"6\u01AF7\u01B0/5#;</,$;\u010A/#$+#)(#'#(\"'#&'#"),
        peg$decode("%;D/S#;,/J$2:\"\"6:7;/;$;,.# &;T/,$;E/#$+%)(%'#($'#(#'#(\"'#&'#")
    ];
    var peg$currPos = 0;
    var peg$savedPos = 0;
    var peg$posDetailsCache = [{ line: 1, column: 1 }];
    var peg$maxFailPos = 0;
    var peg$maxFailExpected = [];
    var peg$silentFails = 0;
    var peg$result;
    if (options.startRule !== undefined) {
        if (!(options.startRule in peg$startRuleIndices)) {
            throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
        }
        peg$startRuleIndex = peg$startRuleIndices[options.startRule];
    }
    function text() {
        return input.substring(peg$savedPos, peg$currPos);
    }
    function location() {
        return peg$computeLocation(peg$savedPos, peg$currPos);
    }
    function expected(description, location1) {
        location1 = location1 !== undefined
            ? location1
            : peg$computeLocation(peg$savedPos, peg$currPos);
        throw peg$buildStructuredError([peg$otherExpectation(description)], input.substring(peg$savedPos, peg$currPos), location1);
    }
    function error(message, location1) {
        location1 = location1 !== undefined
            ? location1
            : peg$computeLocation(peg$savedPos, peg$currPos);
        throw peg$buildSimpleError(message, location1);
    }
    function peg$literalExpectation(text1, ignoreCase) {
        return { type: "literal", text: text1, ignoreCase: ignoreCase };
    }
    function peg$classExpectation(parts, inverted, ignoreCase) {
        return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
    }
    function peg$anyExpectation() {
        return { type: "any" };
    }
    function peg$endExpectation() {
        return { type: "end" };
    }
    function peg$otherExpectation(description) {
        return { type: "other", description: description };
    }
    function peg$computePosDetails(pos) {
        var details = peg$posDetailsCache[pos];
        var p;
        if (details) {
            return details;
        }
        else {
            p = pos - 1;
            while (!peg$posDetailsCache[p]) {
                p--;
            }
            details = peg$posDetailsCache[p];
            details = {
                line: details.line,
                column: details.column
            };
            while (p < pos) {
                if (input.charCodeAt(p) === 10) {
                    details.line++;
                    details.column = 1;
                }
                else {
                    details.column++;
                }
                p++;
            }
            peg$posDetailsCache[pos] = details;
            return details;
        }
    }
    function peg$computeLocation(startPos, endPos) {
        var startPosDetails = peg$computePosDetails(startPos);
        var endPosDetails = peg$computePosDetails(endPos);
        return {
            start: {
                offset: startPos,
                line: startPosDetails.line,
                column: startPosDetails.column
            },
            end: {
                offset: endPos,
                line: endPosDetails.line,
                column: endPosDetails.column
            }
        };
    }
    function peg$fail(expected1) {
        if (peg$currPos < peg$maxFailPos) {
            return;
        }
        if (peg$currPos > peg$maxFailPos) {
            peg$maxFailPos = peg$currPos;
            peg$maxFailExpected = [];
        }
        peg$maxFailExpected.push(expected1);
    }
    function peg$buildSimpleError(message, location1) {
        return new SyntaxError(message, [], "", location1);
    }
    function peg$buildStructuredError(expected1, found, location1) {
        return new SyntaxError(SyntaxError.buildMessage(expected1, found), expected1, found, location1);
    }
    function peg$decode(s) {
        return s.split("").map(function (ch) { return ch.charCodeAt(0) - 32; });
    }
    function peg$parseRule(index) {
        var bc = peg$bytecode[index];
        var ip = 0;
        var ips = [];
        var end = bc.length;
        var ends = [];
        var stack = [];
        var params;
        while (true) {
            while (ip < end) {
                switch (bc[ip]) {
                    case 0:
                        stack.push(peg$consts[bc[ip + 1]]);
                        ip += 2;
                        break;
                    case 1:
                        stack.push(undefined);
                        ip++;
                        break;
                    case 2:
                        stack.push(null);
                        ip++;
                        break;
                    case 3:
                        stack.push(peg$FAILED);
                        ip++;
                        break;
                    case 4:
                        stack.push([]);
                        ip++;
                        break;
                    case 5:
                        stack.push(peg$currPos);
                        ip++;
                        break;
                    case 6:
                        stack.pop();
                        ip++;
                        break;
                    case 7:
                        peg$currPos = stack.pop();
                        ip++;
                        break;
                    case 8:
                        stack.length -= bc[ip + 1];
                        ip += 2;
                        break;
                    case 9:
                        stack.splice(-2, 1);
                        ip++;
                        break;
                    case 10:
                        stack[stack.length - 2].push(stack.pop());
                        ip++;
                        break;
                    case 11:
                        stack.push(stack.splice(stack.length - bc[ip + 1], bc[ip + 1]));
                        ip += 2;
                        break;
                    case 12:
                        stack.push(input.substring(stack.pop(), peg$currPos));
                        ip++;
                        break;
                    case 13:
                        ends.push(end);
                        ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);
                        if (stack[stack.length - 1]) {
                            end = ip + 3 + bc[ip + 1];
                            ip += 3;
                        }
                        else {
                            end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                            ip += 3 + bc[ip + 1];
                        }
                        break;
                    case 14:
                        ends.push(end);
                        ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);
                        if (stack[stack.length - 1] === peg$FAILED) {
                            end = ip + 3 + bc[ip + 1];
                            ip += 3;
                        }
                        else {
                            end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                            ip += 3 + bc[ip + 1];
                        }
                        break;
                    case 15:
                        ends.push(end);
                        ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);
                        if (stack[stack.length - 1] !== peg$FAILED) {
                            end = ip + 3 + bc[ip + 1];
                            ip += 3;
                        }
                        else {
                            end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                            ip += 3 + bc[ip + 1];
                        }
                        break;
                    case 16:
                        if (stack[stack.length - 1] !== peg$FAILED) {
                            ends.push(end);
                            ips.push(ip);
                            end = ip + 2 + bc[ip + 1];
                            ip += 2;
                        }
                        else {
                            ip += 2 + bc[ip + 1];
                        }
                        break;
                    case 17:
                        ends.push(end);
                        ips.push(ip + 3 + bc[ip + 1] + bc[ip + 2]);
                        if (input.length > peg$currPos) {
                            end = ip + 3 + bc[ip + 1];
                            ip += 3;
                        }
                        else {
                            end = ip + 3 + bc[ip + 1] + bc[ip + 2];
                            ip += 3 + bc[ip + 1];
                        }
                        break;
                    case 18:
                        ends.push(end);
                        ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);
                        if (input.substr(peg$currPos, peg$consts[bc[ip + 1]].length) === peg$consts[bc[ip + 1]]) {
                            end = ip + 4 + bc[ip + 2];
                            ip += 4;
                        }
                        else {
                            end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                            ip += 4 + bc[ip + 2];
                        }
                        break;
                    case 19:
                        ends.push(end);
                        ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);
                        if (input.substr(peg$currPos, peg$consts[bc[ip + 1]].length).toLowerCase() === peg$consts[bc[ip + 1]]) {
                            end = ip + 4 + bc[ip + 2];
                            ip += 4;
                        }
                        else {
                            end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                            ip += 4 + bc[ip + 2];
                        }
                        break;
                    case 20:
                        ends.push(end);
                        ips.push(ip + 4 + bc[ip + 2] + bc[ip + 3]);
                        if (peg$consts[bc[ip + 1]].test(input.charAt(peg$currPos))) {
                            end = ip + 4 + bc[ip + 2];
                            ip += 4;
                        }
                        else {
                            end = ip + 4 + bc[ip + 2] + bc[ip + 3];
                            ip += 4 + bc[ip + 2];
                        }
                        break;
                    case 21:
                        stack.push(input.substr(peg$currPos, bc[ip + 1]));
                        peg$currPos += bc[ip + 1];
                        ip += 2;
                        break;
                    case 22:
                        stack.push(peg$consts[bc[ip + 1]]);
                        peg$currPos += peg$consts[bc[ip + 1]].length;
                        ip += 2;
                        break;
                    case 23:
                        stack.push(peg$FAILED);
                        if (peg$silentFails === 0) {
                            peg$fail(peg$consts[bc[ip + 1]]);
                        }
                        ip += 2;
                        break;
                    case 24:
                        peg$savedPos = stack[stack.length - 1 - bc[ip + 1]];
                        ip += 2;
                        break;
                    case 25:
                        peg$savedPos = peg$currPos;
                        ip++;
                        break;
                    case 26:
                        params = bc.slice(ip + 4, ip + 4 + bc[ip + 3])
                            .map(function (p) { return stack[stack.length - 1 - p]; });
                        stack.splice(stack.length - bc[ip + 2], bc[ip + 2], peg$consts[bc[ip + 1]].apply(null, params));
                        ip += 4 + bc[ip + 3];
                        break;
                    case 27:
                        stack.push(peg$parseRule(bc[ip + 1]));
                        ip += 2;
                        break;
                    case 28:
                        peg$silentFails++;
                        ip++;
                        break;
                    case 29:
                        peg$silentFails--;
                        ip++;
                        break;
                    default:
                        throw new Error("Invalid opcode: " + bc[ip] + ".");
                }
            }
            if (ends.length > 0) {
                end = ends.pop();
                ip = ips.pop();
            }
            else {
                break;
            }
        }
        return stack[0];
    }
    options.data = {}; // Object to which header attributes will be assigned during parsing
    function list(head, tail) {
        return [head].concat(tail);
    }
    peg$result = peg$parseRule(peg$startRuleIndex);
    if (peg$result !== peg$FAILED && peg$currPos === input.length) {
        return peg$result;
    }
    else {
        if (peg$result !== peg$FAILED && peg$currPos < input.length) {
            peg$fail(peg$endExpectation());
        }
        throw peg$buildStructuredError(peg$maxFailExpected, peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null, peg$maxFailPos < input.length
            ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
            : peg$computeLocation(peg$maxFailPos, peg$maxFailPos));
    }
}
exports.parse = peg$parse;


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var parameters_1 = __webpack_require__(14);
/**
 * Name Address SIP header.
 * @public
 */
var NameAddrHeader = /** @class */ (function (_super) {
    tslib_1.__extends(NameAddrHeader, _super);
    /**
     * Constructor
     * @param uri -
     * @param displayName -
     * @param parameters -
     */
    function NameAddrHeader(uri, displayName, parameters) {
        var _this = _super.call(this, parameters) || this;
        _this.uri = uri;
        _this._displayName = displayName;
        return _this;
    }
    Object.defineProperty(NameAddrHeader.prototype, "friendlyName", {
        get: function () {
            return this.displayName || this.uri.aor;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(NameAddrHeader.prototype, "displayName", {
        get: function () { return this._displayName; },
        set: function (value) {
            this._displayName = value;
        },
        enumerable: true,
        configurable: true
    });
    NameAddrHeader.prototype.clone = function () {
        return new NameAddrHeader(this.uri.clone(), this._displayName, JSON.parse(JSON.stringify(this.parameters)));
    };
    NameAddrHeader.prototype.toString = function () {
        var body = (this.displayName || this.displayName === "0") ? '"' + this.displayName + '" ' : "";
        body += "<" + this.uri.toString() + ">";
        for (var parameter in this.parameters) {
            if (this.parameters.hasOwnProperty(parameter)) {
                body += ";" + parameter;
                if (this.parameters[parameter] !== null) {
                    body += "=" + this.parameters[parameter];
                }
            }
        }
        return body;
    };
    return NameAddrHeader;
}(parameters_1.Parameters));
exports.NameAddrHeader = NameAddrHeader;


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @internal
 */
var Parameters = /** @class */ (function () {
    function Parameters(parameters) {
        this.parameters = {};
        for (var param in parameters) {
            if (parameters.hasOwnProperty(param)) {
                this.setParam(param, parameters[param]);
            }
        }
    }
    Parameters.prototype.setParam = function (key, value) {
        if (key) {
            this.parameters[key.toLowerCase()] = (typeof value === "undefined" || value === null) ? null : value.toString();
        }
    };
    Parameters.prototype.getParam = function (key) {
        if (key) {
            return this.parameters[key.toLowerCase()];
        }
    };
    Parameters.prototype.hasParam = function (key) {
        if (key) {
            return !!this.parameters.hasOwnProperty(key.toLowerCase());
        }
        return false;
    };
    Parameters.prototype.deleteParam = function (parameter) {
        parameter = parameter.toLowerCase();
        if (this.parameters.hasOwnProperty(parameter)) {
            var value = this.parameters[parameter];
            delete this.parameters[parameter];
            return value;
        }
    };
    Parameters.prototype.clearParams = function () {
        this.parameters = {};
    };
    return Parameters;
}());
exports.Parameters = Parameters;


/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var parameters_1 = __webpack_require__(14);
/**
 * URI.
 * @public
 */
var URI = /** @class */ (function (_super) {
    tslib_1.__extends(URI, _super);
    /**
     * Constructor
     * @param scheme -
     * @param user -
     * @param host -
     * @param port -
     * @param parameters -
     * @param headers -
     */
    function URI(scheme, user, host, port, parameters, headers) {
        var _this = _super.call(this, parameters) || this;
        _this.headers = {};
        // Checks
        if (!host) {
            throw new TypeError('missing or invalid "host" parameter');
        }
        // Initialize parameters
        scheme = scheme || "sip";
        for (var header in headers) {
            if (headers.hasOwnProperty(header)) {
                _this.setHeader(header, headers[header]);
            }
        }
        // Raw URI
        _this.raw = {
            scheme: scheme,
            user: user,
            host: host,
            port: port
        };
        // Normalized URI
        _this.normal = {
            scheme: scheme.toLowerCase(),
            user: user,
            host: host.toLowerCase(),
            port: port
        };
        return _this;
    }
    Object.defineProperty(URI.prototype, "scheme", {
        get: function () { return this.normal.scheme; },
        set: function (value) {
            this.raw.scheme = value;
            this.normal.scheme = value.toLowerCase();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(URI.prototype, "user", {
        get: function () { return this.normal.user; },
        set: function (value) {
            this.normal.user = this.raw.user = value;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(URI.prototype, "host", {
        get: function () { return this.normal.host; },
        set: function (value) {
            this.raw.host = value;
            this.normal.host = value.toLowerCase();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(URI.prototype, "aor", {
        get: function () { return this.normal.user + "@" + this.normal.host; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(URI.prototype, "port", {
        get: function () { return this.normal.port; },
        set: function (value) {
            this.normal.port = this.raw.port = value === 0 ? value : value;
        },
        enumerable: true,
        configurable: true
    });
    URI.prototype.setHeader = function (name, value) {
        this.headers[this.headerize(name)] = (value instanceof Array) ? value : [value];
    };
    URI.prototype.getHeader = function (name) {
        if (name) {
            return this.headers[this.headerize(name)];
        }
    };
    URI.prototype.hasHeader = function (name) {
        return !!name && !!this.headers.hasOwnProperty(this.headerize(name));
    };
    URI.prototype.deleteHeader = function (header) {
        header = this.headerize(header);
        if (this.headers.hasOwnProperty(header)) {
            var value = this.headers[header];
            delete this.headers[header];
            return value;
        }
    };
    URI.prototype.clearHeaders = function () {
        this.headers = {};
    };
    URI.prototype.clone = function () {
        return new URI(this._raw.scheme, this._raw.user || "", this._raw.host, this._raw.port, JSON.parse(JSON.stringify(this.parameters)), JSON.parse(JSON.stringify(this.headers)));
    };
    URI.prototype.toRaw = function () {
        return this._toString(this._raw);
    };
    URI.prototype.toString = function () {
        return this._toString(this._normal);
    };
    Object.defineProperty(URI.prototype, "_normal", {
        get: function () { return this.normal; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(URI.prototype, "_raw", {
        get: function () { return this.raw; },
        enumerable: true,
        configurable: true
    });
    URI.prototype._toString = function (uri) {
        var uriString = uri.scheme + ":";
        // add slashes if it's not a sip(s) URI
        if (!uri.scheme.toLowerCase().match("^sips?$")) {
            uriString += "//";
        }
        if (uri.user) {
            uriString += this.escapeUser(uri.user) + "@";
        }
        uriString += uri.host;
        if (uri.port || uri.port === 0) {
            uriString += ":" + uri.port;
        }
        for (var parameter in this.parameters) {
            if (this.parameters.hasOwnProperty(parameter)) {
                uriString += ";" + parameter;
                if (this.parameters[parameter] !== null) {
                    uriString += "=" + this.parameters[parameter];
                }
            }
        }
        var headers = [];
        for (var header in this.headers) {
            if (this.headers.hasOwnProperty(header)) {
                for (var idx in this.headers[header]) {
                    if (this.headers[header].hasOwnProperty(idx)) {
                        headers.push(header + "=" + this.headers[header][idx]);
                    }
                }
            }
        }
        if (headers.length > 0) {
            uriString += "?" + headers.join("&");
        }
        return uriString;
    };
    /*
     * Hex-escape a SIP URI user.
     * @private
     * @param {String} user
     */
    URI.prototype.escapeUser = function (user) {
        var decodedUser;
        // FIXME: This is called by toString above which should never throw, but
        // decodeURIComponent can throw and I've seen one case in production where
        // it did throw resulting in a cascading failure. This class should be
        // fixed so that decodeURIComponent is not called at this point (in toString).
        // The user should be decoded when the URI is constructor or some other
        // place where we can catch the error before the URI is created or somesuch.
        try {
            decodedUser = decodeURIComponent(user);
        }
        catch (error) {
            throw error;
        }
        // Don't hex-escape ':' (%3A), '+' (%2B), '?' (%3F"), '/' (%2F).
        return encodeURIComponent(decodedUser)
            .replace(/%3A/ig, ":")
            .replace(/%2B/ig, "+")
            .replace(/%3F/ig, "?")
            .replace(/%2F/ig, "/");
    };
    URI.prototype.headerize = function (str) {
        var exceptions = {
            "Call-Id": "Call-ID",
            "Cseq": "CSeq",
            "Min-Se": "Min-SE",
            "Rack": "RAck",
            "Rseq": "RSeq",
            "Www-Authenticate": "WWW-Authenticate",
        };
        var name = str.toLowerCase().replace(/_/g, "-").split("-");
        var parts = name.length;
        var hname = "";
        for (var part = 0; part < parts; part++) {
            if (part !== 0) {
                hname += "-";
            }
            hname += name[part].charAt(0).toUpperCase() + name[part].substring(1);
        }
        if (exceptions[hname]) {
            hname = exceptions[hname];
        }
        return hname;
    };
    return URI;
}(parameters_1.Parameters));
exports.URI = URI;


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @param size -
 * @param base -
 * @internal
 */
function createRandomToken(size, base) {
    if (base === void 0) { base = 32; }
    var token = "";
    for (var i = 0; i < size; i++) {
        var r = Math.floor(Math.random() * base);
        token += r.toString(base);
    }
    return token;
}
exports.createRandomToken = createRandomToken;
/**
 * @internal
 */
function getReasonPhrase(code) {
    return REASON_PHRASE[code] || "";
}
exports.getReasonPhrase = getReasonPhrase;
/**
 * @internal
 */
function newTag() {
    return createRandomToken(10);
}
exports.newTag = newTag;
/**
 * @param str -
 * @internal
 */
function headerize(str) {
    var exceptions = {
        "Call-Id": "Call-ID",
        "Cseq": "CSeq",
        "Min-Se": "Min-SE",
        "Rack": "RAck",
        "Rseq": "RSeq",
        "Www-Authenticate": "WWW-Authenticate",
    };
    var name = str.toLowerCase().replace(/_/g, "-").split("-");
    var parts = name.length;
    var hname = "";
    for (var part = 0; part < parts; part++) {
        if (part !== 0) {
            hname += "-";
        }
        hname += name[part].charAt(0).toUpperCase() + name[part].substring(1);
    }
    if (exceptions[hname]) {
        hname = exceptions[hname];
    }
    return hname;
}
exports.headerize = headerize;
/**
 * @param str -
 * @internal
 */
function str_utf8_length(str) {
    return encodeURIComponent(str).replace(/%[A-F\d]{2}/g, "U").length;
}
exports.str_utf8_length = str_utf8_length;
/**
 * SIP Response Reasons
 * DOC: http://www.iana.org/assignments/sip-parameters
 * @internal
 */
var REASON_PHRASE = {
    100: "Trying",
    180: "Ringing",
    181: "Call Is Being Forwarded",
    182: "Queued",
    183: "Session Progress",
    199: "Early Dialog Terminated",
    200: "OK",
    202: "Accepted",
    204: "No Notification",
    300: "Multiple Choices",
    301: "Moved Permanently",
    302: "Moved Temporarily",
    305: "Use Proxy",
    380: "Alternative Service",
    400: "Bad Request",
    401: "Unauthorized",
    402: "Payment Required",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    406: "Not Acceptable",
    407: "Proxy Authentication Required",
    408: "Request Timeout",
    410: "Gone",
    412: "Conditional Request Failed",
    413: "Request Entity Too Large",
    414: "Request-URI Too Long",
    415: "Unsupported Media Type",
    416: "Unsupported URI Scheme",
    417: "Unknown Resource-Priority",
    420: "Bad Extension",
    421: "Extension Required",
    422: "Session Interval Too Small",
    423: "Interval Too Brief",
    428: "Use Identity Header",
    429: "Provide Referrer Identity",
    430: "Flow Failed",
    433: "Anonymity Disallowed",
    436: "Bad Identity-Info",
    437: "Unsupported Certificate",
    438: "Invalid Identity Header",
    439: "First Hop Lacks Outbound Support",
    440: "Max-Breadth Exceeded",
    469: "Bad Info Package",
    470: "Consent Needed",
    478: "Unresolvable Destination",
    480: "Temporarily Unavailable",
    481: "Call/Transaction Does Not Exist",
    482: "Loop Detected",
    483: "Too Many Hops",
    484: "Address Incomplete",
    485: "Ambiguous",
    486: "Busy Here",
    487: "Request Terminated",
    488: "Not Acceptable Here",
    489: "Bad Event",
    491: "Request Pending",
    493: "Undecipherable",
    494: "Security Agreement Required",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Server Time-out",
    505: "Version Not Supported",
    513: "Message Too Large",
    580: "Precondition Failure",
    600: "Busy Everywhere",
    603: "Decline",
    604: "Does Not Exist Anywhere",
    606: "Not Acceptable"
};


/***/ }),
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var incoming_message_1 = __webpack_require__(10);
/**
 * Incoming response message.
 * @public
 */
var IncomingResponseMessage = /** @class */ (function (_super) {
    tslib_1.__extends(IncomingResponseMessage, _super);
    function IncomingResponseMessage() {
        return _super.call(this) || this;
    }
    return IncomingResponseMessage;
}(incoming_message_1.IncomingMessage));
exports.IncomingResponseMessage = IncomingResponseMessage;


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var name_addr_header_1 = __webpack_require__(13);
var utils_1 = __webpack_require__(16);
/**
 * Outgoing SIP request message.
 * @public
 */
var OutgoingRequestMessage = /** @class */ (function () {
    function OutgoingRequestMessage(method, ruri, fromURI, toURI, options, extraHeaders, body) {
        this.headers = {};
        this.extraHeaders = [];
        this.options = OutgoingRequestMessage.getDefaultOptions();
        // Options - merge a deep copy
        if (options) {
            this.options = tslib_1.__assign(tslib_1.__assign({}, this.options), options);
            if (this.options.optionTags && this.options.optionTags.length) {
                this.options.optionTags = this.options.optionTags.slice();
            }
            if (this.options.routeSet && this.options.routeSet.length) {
                this.options.routeSet = this.options.routeSet.slice();
            }
        }
        // Extra headers - deep copy
        if (extraHeaders && extraHeaders.length) {
            this.extraHeaders = extraHeaders.slice();
        }
        // Body - deep copy
        if (body) {
            // TODO: internal representation should be Body
            // this.body = { ...body };
            this.body = {
                body: body.content,
                contentType: body.contentType
            };
        }
        // Method
        this.method = method;
        // RURI
        this.ruri = ruri.clone();
        // From
        this.fromURI = fromURI.clone();
        this.fromTag = this.options.fromTag ? this.options.fromTag : utils_1.newTag();
        this.from = OutgoingRequestMessage.makeNameAddrHeader(this.fromURI, this.options.fromDisplayName, this.fromTag);
        // To
        this.toURI = toURI.clone();
        this.toTag = this.options.toTag;
        this.to = OutgoingRequestMessage.makeNameAddrHeader(this.toURI, this.options.toDisplayName, this.toTag);
        // Call-ID
        this.callId = this.options.callId ? this.options.callId : this.options.callIdPrefix + utils_1.createRandomToken(15);
        // CSeq
        this.cseq = this.options.cseq;
        // The relative order of header fields with different field names is not
        // significant.  However, it is RECOMMENDED that header fields which are
        // needed for proxy processing (Via, Route, Record-Route, Proxy-Require,
        // Max-Forwards, and Proxy-Authorization, for example) appear towards
        // the top of the message to facilitate rapid parsing.
        // https://tools.ietf.org/html/rfc3261#section-7.3.1
        this.setHeader("route", this.options.routeSet);
        this.setHeader("via", "");
        this.setHeader("to", this.to.toString());
        this.setHeader("from", this.from.toString());
        this.setHeader("cseq", this.cseq + " " + this.method);
        this.setHeader("call-id", this.callId);
        this.setHeader("max-forwards", "70");
    }
    /** Get a copy of the default options. */
    OutgoingRequestMessage.getDefaultOptions = function () {
        return {
            callId: "",
            callIdPrefix: "",
            cseq: 1,
            toDisplayName: "",
            toTag: "",
            fromDisplayName: "",
            fromTag: "",
            forceRport: false,
            hackViaTcp: false,
            optionTags: ["outbound"],
            routeSet: [],
            userAgentString: "sip.js",
            viaHost: ""
        };
    };
    OutgoingRequestMessage.makeNameAddrHeader = function (uri, displayName, tag) {
        var parameters = {};
        if (tag) {
            parameters.tag = tag;
        }
        return new name_addr_header_1.NameAddrHeader(uri, displayName, parameters);
    };
    /**
     * Get the value of the given header name at the given position.
     * @param name - header name
     * @returns Returns the specified header, undefined if header doesn't exist.
     */
    OutgoingRequestMessage.prototype.getHeader = function (name) {
        var header = this.headers[utils_1.headerize(name)];
        if (header) {
            if (header[0]) {
                return header[0];
            }
        }
        else {
            var regexp = new RegExp("^\\s*" + name + "\\s*:", "i");
            for (var _i = 0, _a = this.extraHeaders; _i < _a.length; _i++) {
                var exHeader = _a[_i];
                if (regexp.test(exHeader)) {
                    return exHeader.substring(exHeader.indexOf(":") + 1).trim();
                }
            }
        }
        return;
    };
    /**
     * Get the header/s of the given name.
     * @param name - header name
     * @returns Array with all the headers of the specified name.
     */
    OutgoingRequestMessage.prototype.getHeaders = function (name) {
        var result = [];
        var headerArray = this.headers[utils_1.headerize(name)];
        if (headerArray) {
            for (var _i = 0, headerArray_1 = headerArray; _i < headerArray_1.length; _i++) {
                var headerPart = headerArray_1[_i];
                result.push(headerPart);
            }
        }
        else {
            var regexp = new RegExp("^\\s*" + name + "\\s*:", "i");
            for (var _a = 0, _b = this.extraHeaders; _a < _b.length; _a++) {
                var exHeader = _b[_a];
                if (regexp.test(exHeader)) {
                    result.push(exHeader.substring(exHeader.indexOf(":") + 1).trim());
                }
            }
        }
        return result;
    };
    /**
     * Verify the existence of the given header.
     * @param name - header name
     * @returns true if header with given name exists, false otherwise
     */
    OutgoingRequestMessage.prototype.hasHeader = function (name) {
        if (this.headers[utils_1.headerize(name)]) {
            return true;
        }
        else {
            var regexp = new RegExp("^\\s*" + name + "\\s*:", "i");
            for (var _i = 0, _a = this.extraHeaders; _i < _a.length; _i++) {
                var extraHeader = _a[_i];
                if (regexp.test(extraHeader)) {
                    return true;
                }
            }
        }
        return false;
    };
    /**
     * Replace the the given header by the given value.
     * @param name - header name
     * @param value - header value
     */
    OutgoingRequestMessage.prototype.setHeader = function (name, value) {
        this.headers[utils_1.headerize(name)] = (value instanceof Array) ? value : [value];
    };
    /**
     * The Via header field indicates the transport used for the transaction
     * and identifies the location where the response is to be sent.  A Via
     * header field value is added only after the transport that will be
     * used to reach the next hop has been selected (which may involve the
     * usage of the procedures in [4]).
     *
     * When the UAC creates a request, it MUST insert a Via into that
     * request.  The protocol name and protocol version in the header field
     * MUST be SIP and 2.0, respectively.  The Via header field value MUST
     * contain a branch parameter.  This parameter is used to identify the
     * transaction created by that request.  This parameter is used by both
     * the client and the server.
     * https://tools.ietf.org/html/rfc3261#section-8.1.1.7
     * @param branchParameter - The branch parameter.
     * @param transport - The sent protocol transport.
     */
    OutgoingRequestMessage.prototype.setViaHeader = function (branch, transport) {
        // FIXME: Hack
        if (this.options.hackViaTcp) {
            transport = "TCP";
        }
        var via = "SIP/2.0/" + transport;
        via += " " + this.options.viaHost + ";branch=" + branch;
        if (this.options.forceRport) {
            via += ";rport";
        }
        this.setHeader("via", via);
        this.branch = branch;
    };
    OutgoingRequestMessage.prototype.toString = function () {
        var msg = "";
        msg += this.method + " " + this.ruri.toRaw() + " SIP/2.0\r\n";
        for (var header in this.headers) {
            if (this.headers[header]) {
                for (var _i = 0, _a = this.headers[header]; _i < _a.length; _i++) {
                    var headerPart = _a[_i];
                    msg += header + ": " + headerPart + "\r\n";
                }
            }
        }
        for (var _b = 0, _c = this.extraHeaders; _b < _c.length; _b++) {
            var header = _c[_b];
            msg += header.trim() + "\r\n";
        }
        msg += "Supported: " + this.options.optionTags.join(", ") + "\r\n";
        msg += "User-Agent: " + this.options.userAgentString + "\r\n";
        if (this.body) {
            if (typeof this.body === "string") {
                msg += "Content-Length: " + utils_1.str_utf8_length(this.body) + "\r\n\r\n";
                msg += this.body;
            }
            else {
                if (this.body.body && this.body.contentType) {
                    msg += "Content-Type: " + this.body.contentType + "\r\n";
                    msg += "Content-Length: " + utils_1.str_utf8_length(this.body.body) + "\r\n\r\n";
                    msg += this.body.body;
                }
                else {
                    msg += "Content-Length: " + 0 + "\r\n\r\n";
                }
            }
        }
        else {
            msg += "Content-Length: " + 0 + "\r\n\r\n";
        }
        return msg;
    };
    return OutgoingRequestMessage;
}());
exports.OutgoingRequestMessage = OutgoingRequestMessage;


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var md5_1 = tslib_1.__importDefault(__webpack_require__(20));
var utils_1 = __webpack_require__(16);
/**
 * Digest Authentication.
 * @internal
 */
var DigestAuthentication = /** @class */ (function () {
    /**
     * Constructor.
     * @param loggerFactory - LoggerFactory.
     * @param username - Username.
     * @param password - Password.
     */
    function DigestAuthentication(loggerFactory, username, password) {
        this.logger = loggerFactory.getLogger("sipjs.digestauthentication");
        this.username = username;
        this.password = password;
        this.nc = 0;
        this.ncHex = "00000000";
    }
    /**
     * Performs Digest authentication given a SIP request and the challenge
     * received in a response to that request.
     * @param request -
     * @param challenge -
     * @returns true if credentials were successfully generated, false otherwise.
     */
    DigestAuthentication.prototype.authenticate = function (request, challenge, body) {
        // Inspect and validate the challenge.
        this.algorithm = challenge.algorithm;
        this.realm = challenge.realm;
        this.nonce = challenge.nonce;
        this.opaque = challenge.opaque;
        this.stale = challenge.stale;
        if (this.algorithm) {
            if (this.algorithm !== "MD5") {
                this.logger.warn("challenge with Digest algorithm different than 'MD5', authentication aborted");
                return false;
            }
        }
        else {
            this.algorithm = "MD5";
        }
        if (!this.realm) {
            this.logger.warn("challenge without Digest realm, authentication aborted");
            return false;
        }
        if (!this.nonce) {
            this.logger.warn("challenge without Digest nonce, authentication aborted");
            return false;
        }
        // 'qop' can contain a list of values (Array). Let's choose just one.
        if (challenge.qop) {
            if (challenge.qop.indexOf("auth") > -1) {
                this.qop = "auth";
            }
            else if (challenge.qop.indexOf("auth-int") > -1) {
                this.qop = "auth-int";
            }
            else {
                // Otherwise 'qop' is present but does not contain 'auth' or 'auth-int', so abort here.
                this.logger.warn("challenge without Digest qop different than 'auth' or 'auth-int', authentication aborted");
                return false;
            }
        }
        else {
            this.qop = undefined;
        }
        // Fill other attributes.
        this.method = request.method;
        this.uri = request.ruri;
        this.cnonce = utils_1.createRandomToken(12);
        this.nc += 1;
        this.updateNcHex();
        // nc-value = 8LHEX. Max value = 'FFFFFFFF'.
        if (this.nc === 4294967296) {
            this.nc = 1;
            this.ncHex = "00000001";
        }
        // Calculate the Digest "response" value.
        this.calculateResponse(body);
        return true;
    };
    /**
     * Return the Proxy-Authorization or WWW-Authorization header value.
     */
    DigestAuthentication.prototype.toString = function () {
        var authParams = [];
        if (!this.response) {
            throw new Error("response field does not exist, cannot generate Authorization header");
        }
        authParams.push("algorithm=" + this.algorithm);
        authParams.push('username="' + this.username + '"');
        authParams.push('realm="' + this.realm + '"');
        authParams.push('nonce="' + this.nonce + '"');
        authParams.push('uri="' + this.uri + '"');
        authParams.push('response="' + this.response + '"');
        if (this.opaque) {
            authParams.push('opaque="' + this.opaque + '"');
        }
        if (this.qop) {
            authParams.push("qop=" + this.qop);
            authParams.push('cnonce="' + this.cnonce + '"');
            authParams.push("nc=" + this.ncHex);
        }
        return "Digest " + authParams.join(", ");
    };
    /**
     * Generate the 'nc' value as required by Digest in this.ncHex by reading this.nc.
     */
    DigestAuthentication.prototype.updateNcHex = function () {
        var hex = Number(this.nc).toString(16);
        this.ncHex = "00000000".substr(0, 8 - hex.length) + hex;
    };
    /**
     * Generate Digest 'response' value.
     */
    DigestAuthentication.prototype.calculateResponse = function (body) {
        var ha2;
        // HA1 = MD5(A1) = MD5(username:realm:password)
        var ha1 = md5_1.default(this.username + ":" + this.realm + ":" + this.password);
        if (this.qop === "auth") {
            // HA2 = MD5(A2) = MD5(method:digestURI)
            ha2 = md5_1.default(this.method + ":" + this.uri);
            // response = MD5(HA1:nonce:nonceCount:credentialsNonce:qop:HA2)
            this.response = md5_1.default(ha1 + ":" + this.nonce + ":" + this.ncHex + ":" + this.cnonce + ":auth:" + ha2);
        }
        else if (this.qop === "auth-int") {
            // HA2 = MD5(A2) = MD5(method:digestURI:MD5(entityBody))
            ha2 = md5_1.default(this.method + ":" + this.uri + ":" + md5_1.default(body ? body : ""));
            // response = MD5(HA1:nonce:nonceCount:credentialsNonce:qop:HA2)
            this.response = md5_1.default(ha1 + ":" + this.nonce + ":" + this.ncHex + ":" + this.cnonce + ":auth-int:" + ha2);
        }
        else if (this.qop === undefined) {
            // HA2 = MD5(A2) = MD5(method:digestURI)
            ha2 = md5_1.default(this.method + ":" + this.uri);
            // response = MD5(HA1:nonce:HA2)
            this.response = md5_1.default(ha1 + ":" + this.nonce + ":" + ha2);
        }
    };
    return DigestAuthentication;
}());
exports.DigestAuthentication = DigestAuthentication;


/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory) {
	if (true) {
		// CommonJS
		module.exports = exports = factory(__webpack_require__(21));
	}
	else {}
}(this, function (CryptoJS) {

	(function (Math) {
	    // Shortcuts
	    var C = CryptoJS;
	    var C_lib = C.lib;
	    var WordArray = C_lib.WordArray;
	    var Hasher = C_lib.Hasher;
	    var C_algo = C.algo;

	    // Constants table
	    var T = [];

	    // Compute constants
	    (function () {
	        for (var i = 0; i < 64; i++) {
	            T[i] = (Math.abs(Math.sin(i + 1)) * 0x100000000) | 0;
	        }
	    }());

	    /**
	     * MD5 hash algorithm.
	     */
	    var MD5 = C_algo.MD5 = Hasher.extend({
	        _doReset: function () {
	            this._hash = new WordArray.init([
	                0x67452301, 0xefcdab89,
	                0x98badcfe, 0x10325476
	            ]);
	        },

	        _doProcessBlock: function (M, offset) {
	            // Swap endian
	            for (var i = 0; i < 16; i++) {
	                // Shortcuts
	                var offset_i = offset + i;
	                var M_offset_i = M[offset_i];

	                M[offset_i] = (
	                    (((M_offset_i << 8)  | (M_offset_i >>> 24)) & 0x00ff00ff) |
	                    (((M_offset_i << 24) | (M_offset_i >>> 8))  & 0xff00ff00)
	                );
	            }

	            // Shortcuts
	            var H = this._hash.words;

	            var M_offset_0  = M[offset + 0];
	            var M_offset_1  = M[offset + 1];
	            var M_offset_2  = M[offset + 2];
	            var M_offset_3  = M[offset + 3];
	            var M_offset_4  = M[offset + 4];
	            var M_offset_5  = M[offset + 5];
	            var M_offset_6  = M[offset + 6];
	            var M_offset_7  = M[offset + 7];
	            var M_offset_8  = M[offset + 8];
	            var M_offset_9  = M[offset + 9];
	            var M_offset_10 = M[offset + 10];
	            var M_offset_11 = M[offset + 11];
	            var M_offset_12 = M[offset + 12];
	            var M_offset_13 = M[offset + 13];
	            var M_offset_14 = M[offset + 14];
	            var M_offset_15 = M[offset + 15];

	            // Working varialbes
	            var a = H[0];
	            var b = H[1];
	            var c = H[2];
	            var d = H[3];

	            // Computation
	            a = FF(a, b, c, d, M_offset_0,  7,  T[0]);
	            d = FF(d, a, b, c, M_offset_1,  12, T[1]);
	            c = FF(c, d, a, b, M_offset_2,  17, T[2]);
	            b = FF(b, c, d, a, M_offset_3,  22, T[3]);
	            a = FF(a, b, c, d, M_offset_4,  7,  T[4]);
	            d = FF(d, a, b, c, M_offset_5,  12, T[5]);
	            c = FF(c, d, a, b, M_offset_6,  17, T[6]);
	            b = FF(b, c, d, a, M_offset_7,  22, T[7]);
	            a = FF(a, b, c, d, M_offset_8,  7,  T[8]);
	            d = FF(d, a, b, c, M_offset_9,  12, T[9]);
	            c = FF(c, d, a, b, M_offset_10, 17, T[10]);
	            b = FF(b, c, d, a, M_offset_11, 22, T[11]);
	            a = FF(a, b, c, d, M_offset_12, 7,  T[12]);
	            d = FF(d, a, b, c, M_offset_13, 12, T[13]);
	            c = FF(c, d, a, b, M_offset_14, 17, T[14]);
	            b = FF(b, c, d, a, M_offset_15, 22, T[15]);

	            a = GG(a, b, c, d, M_offset_1,  5,  T[16]);
	            d = GG(d, a, b, c, M_offset_6,  9,  T[17]);
	            c = GG(c, d, a, b, M_offset_11, 14, T[18]);
	            b = GG(b, c, d, a, M_offset_0,  20, T[19]);
	            a = GG(a, b, c, d, M_offset_5,  5,  T[20]);
	            d = GG(d, a, b, c, M_offset_10, 9,  T[21]);
	            c = GG(c, d, a, b, M_offset_15, 14, T[22]);
	            b = GG(b, c, d, a, M_offset_4,  20, T[23]);
	            a = GG(a, b, c, d, M_offset_9,  5,  T[24]);
	            d = GG(d, a, b, c, M_offset_14, 9,  T[25]);
	            c = GG(c, d, a, b, M_offset_3,  14, T[26]);
	            b = GG(b, c, d, a, M_offset_8,  20, T[27]);
	            a = GG(a, b, c, d, M_offset_13, 5,  T[28]);
	            d = GG(d, a, b, c, M_offset_2,  9,  T[29]);
	            c = GG(c, d, a, b, M_offset_7,  14, T[30]);
	            b = GG(b, c, d, a, M_offset_12, 20, T[31]);

	            a = HH(a, b, c, d, M_offset_5,  4,  T[32]);
	            d = HH(d, a, b, c, M_offset_8,  11, T[33]);
	            c = HH(c, d, a, b, M_offset_11, 16, T[34]);
	            b = HH(b, c, d, a, M_offset_14, 23, T[35]);
	            a = HH(a, b, c, d, M_offset_1,  4,  T[36]);
	            d = HH(d, a, b, c, M_offset_4,  11, T[37]);
	            c = HH(c, d, a, b, M_offset_7,  16, T[38]);
	            b = HH(b, c, d, a, M_offset_10, 23, T[39]);
	            a = HH(a, b, c, d, M_offset_13, 4,  T[40]);
	            d = HH(d, a, b, c, M_offset_0,  11, T[41]);
	            c = HH(c, d, a, b, M_offset_3,  16, T[42]);
	            b = HH(b, c, d, a, M_offset_6,  23, T[43]);
	            a = HH(a, b, c, d, M_offset_9,  4,  T[44]);
	            d = HH(d, a, b, c, M_offset_12, 11, T[45]);
	            c = HH(c, d, a, b, M_offset_15, 16, T[46]);
	            b = HH(b, c, d, a, M_offset_2,  23, T[47]);

	            a = II(a, b, c, d, M_offset_0,  6,  T[48]);
	            d = II(d, a, b, c, M_offset_7,  10, T[49]);
	            c = II(c, d, a, b, M_offset_14, 15, T[50]);
	            b = II(b, c, d, a, M_offset_5,  21, T[51]);
	            a = II(a, b, c, d, M_offset_12, 6,  T[52]);
	            d = II(d, a, b, c, M_offset_3,  10, T[53]);
	            c = II(c, d, a, b, M_offset_10, 15, T[54]);
	            b = II(b, c, d, a, M_offset_1,  21, T[55]);
	            a = II(a, b, c, d, M_offset_8,  6,  T[56]);
	            d = II(d, a, b, c, M_offset_15, 10, T[57]);
	            c = II(c, d, a, b, M_offset_6,  15, T[58]);
	            b = II(b, c, d, a, M_offset_13, 21, T[59]);
	            a = II(a, b, c, d, M_offset_4,  6,  T[60]);
	            d = II(d, a, b, c, M_offset_11, 10, T[61]);
	            c = II(c, d, a, b, M_offset_2,  15, T[62]);
	            b = II(b, c, d, a, M_offset_9,  21, T[63]);

	            // Intermediate hash value
	            H[0] = (H[0] + a) | 0;
	            H[1] = (H[1] + b) | 0;
	            H[2] = (H[2] + c) | 0;
	            H[3] = (H[3] + d) | 0;
	        },

	        _doFinalize: function () {
	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;

	            var nBitsTotal = this._nDataBytes * 8;
	            var nBitsLeft = data.sigBytes * 8;

	            // Add padding
	            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);

	            var nBitsTotalH = Math.floor(nBitsTotal / 0x100000000);
	            var nBitsTotalL = nBitsTotal;
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = (
	                (((nBitsTotalH << 8)  | (nBitsTotalH >>> 24)) & 0x00ff00ff) |
	                (((nBitsTotalH << 24) | (nBitsTotalH >>> 8))  & 0xff00ff00)
	            );
	            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
	                (((nBitsTotalL << 8)  | (nBitsTotalL >>> 24)) & 0x00ff00ff) |
	                (((nBitsTotalL << 24) | (nBitsTotalL >>> 8))  & 0xff00ff00)
	            );

	            data.sigBytes = (dataWords.length + 1) * 4;

	            // Hash final blocks
	            this._process();

	            // Shortcuts
	            var hash = this._hash;
	            var H = hash.words;

	            // Swap endian
	            for (var i = 0; i < 4; i++) {
	                // Shortcut
	                var H_i = H[i];

	                H[i] = (((H_i << 8)  | (H_i >>> 24)) & 0x00ff00ff) |
	                       (((H_i << 24) | (H_i >>> 8))  & 0xff00ff00);
	            }

	            // Return final computed hash
	            return hash;
	        },

	        clone: function () {
	            var clone = Hasher.clone.call(this);
	            clone._hash = this._hash.clone();

	            return clone;
	        }
	    });

	    function FF(a, b, c, d, x, s, t) {
	        var n = a + ((b & c) | (~b & d)) + x + t;
	        return ((n << s) | (n >>> (32 - s))) + b;
	    }

	    function GG(a, b, c, d, x, s, t) {
	        var n = a + ((b & d) | (c & ~d)) + x + t;
	        return ((n << s) | (n >>> (32 - s))) + b;
	    }

	    function HH(a, b, c, d, x, s, t) {
	        var n = a + (b ^ c ^ d) + x + t;
	        return ((n << s) | (n >>> (32 - s))) + b;
	    }

	    function II(a, b, c, d, x, s, t) {
	        var n = a + (c ^ (b | ~d)) + x + t;
	        return ((n << s) | (n >>> (32 - s))) + b;
	    }

	    /**
	     * Shortcut function to the hasher's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     *
	     * @return {WordArray} The hash.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hash = CryptoJS.MD5('message');
	     *     var hash = CryptoJS.MD5(wordArray);
	     */
	    C.MD5 = Hasher._createHelper(MD5);

	    /**
	     * Shortcut function to the HMAC's object interface.
	     *
	     * @param {WordArray|string} message The message to hash.
	     * @param {WordArray|string} key The secret key.
	     *
	     * @return {WordArray} The HMAC.
	     *
	     * @static
	     *
	     * @example
	     *
	     *     var hmac = CryptoJS.HmacMD5(message, key);
	     */
	    C.HmacMD5 = Hasher._createHmacHelper(MD5);
	}(Math));


	return CryptoJS.MD5;

}));

/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

;(function (root, factory) {
	if (true) {
		// CommonJS
		module.exports = exports = factory();
	}
	else {}
}(this, function () {

	/**
	 * CryptoJS core components.
	 */
	var CryptoJS = CryptoJS || (function (Math, undefined) {
	    /*
	     * Local polyfil of Object.create
	     */
	    var create = Object.create || (function () {
	        function F() {};

	        return function (obj) {
	            var subtype;

	            F.prototype = obj;

	            subtype = new F();

	            F.prototype = null;

	            return subtype;
	        };
	    }())

	    /**
	     * CryptoJS namespace.
	     */
	    var C = {};

	    /**
	     * Library namespace.
	     */
	    var C_lib = C.lib = {};

	    /**
	     * Base object for prototypal inheritance.
	     */
	    var Base = C_lib.Base = (function () {


	        return {
	            /**
	             * Creates a new object that inherits from this object.
	             *
	             * @param {Object} overrides Properties to copy into the new object.
	             *
	             * @return {Object} The new object.
	             *
	             * @static
	             *
	             * @example
	             *
	             *     var MyType = CryptoJS.lib.Base.extend({
	             *         field: 'value',
	             *
	             *         method: function () {
	             *         }
	             *     });
	             */
	            extend: function (overrides) {
	                // Spawn
	                var subtype = create(this);

	                // Augment
	                if (overrides) {
	                    subtype.mixIn(overrides);
	                }

	                // Create default initializer
	                if (!subtype.hasOwnProperty('init') || this.init === subtype.init) {
	                    subtype.init = function () {
	                        subtype.$super.init.apply(this, arguments);
	                    };
	                }

	                // Initializer's prototype is the subtype object
	                subtype.init.prototype = subtype;

	                // Reference supertype
	                subtype.$super = this;

	                return subtype;
	            },

	            /**
	             * Extends this object and runs the init method.
	             * Arguments to create() will be passed to init().
	             *
	             * @return {Object} The new object.
	             *
	             * @static
	             *
	             * @example
	             *
	             *     var instance = MyType.create();
	             */
	            create: function () {
	                var instance = this.extend();
	                instance.init.apply(instance, arguments);

	                return instance;
	            },

	            /**
	             * Initializes a newly created object.
	             * Override this method to add some logic when your objects are created.
	             *
	             * @example
	             *
	             *     var MyType = CryptoJS.lib.Base.extend({
	             *         init: function () {
	             *             // ...
	             *         }
	             *     });
	             */
	            init: function () {
	            },

	            /**
	             * Copies properties into this object.
	             *
	             * @param {Object} properties The properties to mix in.
	             *
	             * @example
	             *
	             *     MyType.mixIn({
	             *         field: 'value'
	             *     });
	             */
	            mixIn: function (properties) {
	                for (var propertyName in properties) {
	                    if (properties.hasOwnProperty(propertyName)) {
	                        this[propertyName] = properties[propertyName];
	                    }
	                }

	                // IE won't copy toString using the loop above
	                if (properties.hasOwnProperty('toString')) {
	                    this.toString = properties.toString;
	                }
	            },

	            /**
	             * Creates a copy of this object.
	             *
	             * @return {Object} The clone.
	             *
	             * @example
	             *
	             *     var clone = instance.clone();
	             */
	            clone: function () {
	                return this.init.prototype.extend(this);
	            }
	        };
	    }());

	    /**
	     * An array of 32-bit words.
	     *
	     * @property {Array} words The array of 32-bit words.
	     * @property {number} sigBytes The number of significant bytes in this word array.
	     */
	    var WordArray = C_lib.WordArray = Base.extend({
	        /**
	         * Initializes a newly created word array.
	         *
	         * @param {Array} words (Optional) An array of 32-bit words.
	         * @param {number} sigBytes (Optional) The number of significant bytes in the words.
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.lib.WordArray.create();
	         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
	         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
	         */
	        init: function (words, sigBytes) {
	            words = this.words = words || [];

	            if (sigBytes != undefined) {
	                this.sigBytes = sigBytes;
	            } else {
	                this.sigBytes = words.length * 4;
	            }
	        },

	        /**
	         * Converts this word array to a string.
	         *
	         * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
	         *
	         * @return {string} The stringified word array.
	         *
	         * @example
	         *
	         *     var string = wordArray + '';
	         *     var string = wordArray.toString();
	         *     var string = wordArray.toString(CryptoJS.enc.Utf8);
	         */
	        toString: function (encoder) {
	            return (encoder || Hex).stringify(this);
	        },

	        /**
	         * Concatenates a word array to this word array.
	         *
	         * @param {WordArray} wordArray The word array to append.
	         *
	         * @return {WordArray} This word array.
	         *
	         * @example
	         *
	         *     wordArray1.concat(wordArray2);
	         */
	        concat: function (wordArray) {
	            // Shortcuts
	            var thisWords = this.words;
	            var thatWords = wordArray.words;
	            var thisSigBytes = this.sigBytes;
	            var thatSigBytes = wordArray.sigBytes;

	            // Clamp excess bits
	            this.clamp();

	            // Concat
	            if (thisSigBytes % 4) {
	                // Copy one byte at a time
	                for (var i = 0; i < thatSigBytes; i++) {
	                    var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                    thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
	                }
	            } else {
	                // Copy one word at a time
	                for (var i = 0; i < thatSigBytes; i += 4) {
	                    thisWords[(thisSigBytes + i) >>> 2] = thatWords[i >>> 2];
	                }
	            }
	            this.sigBytes += thatSigBytes;

	            // Chainable
	            return this;
	        },

	        /**
	         * Removes insignificant bits.
	         *
	         * @example
	         *
	         *     wordArray.clamp();
	         */
	        clamp: function () {
	            // Shortcuts
	            var words = this.words;
	            var sigBytes = this.sigBytes;

	            // Clamp
	            words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
	            words.length = Math.ceil(sigBytes / 4);
	        },

	        /**
	         * Creates a copy of this word array.
	         *
	         * @return {WordArray} The clone.
	         *
	         * @example
	         *
	         *     var clone = wordArray.clone();
	         */
	        clone: function () {
	            var clone = Base.clone.call(this);
	            clone.words = this.words.slice(0);

	            return clone;
	        },

	        /**
	         * Creates a word array filled with random bytes.
	         *
	         * @param {number} nBytes The number of random bytes to generate.
	         *
	         * @return {WordArray} The random word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.lib.WordArray.random(16);
	         */
	        random: function (nBytes) {
	            var words = [];

	            var r = (function (m_w) {
	                var m_w = m_w;
	                var m_z = 0x3ade68b1;
	                var mask = 0xffffffff;

	                return function () {
	                    m_z = (0x9069 * (m_z & 0xFFFF) + (m_z >> 0x10)) & mask;
	                    m_w = (0x4650 * (m_w & 0xFFFF) + (m_w >> 0x10)) & mask;
	                    var result = ((m_z << 0x10) + m_w) & mask;
	                    result /= 0x100000000;
	                    result += 0.5;
	                    return result * (Math.random() > .5 ? 1 : -1);
	                }
	            });

	            for (var i = 0, rcache; i < nBytes; i += 4) {
	                var _r = r((rcache || Math.random()) * 0x100000000);

	                rcache = _r() * 0x3ade67b7;
	                words.push((_r() * 0x100000000) | 0);
	            }

	            return new WordArray.init(words, nBytes);
	        }
	    });

	    /**
	     * Encoder namespace.
	     */
	    var C_enc = C.enc = {};

	    /**
	     * Hex encoding strategy.
	     */
	    var Hex = C_enc.Hex = {
	        /**
	         * Converts a word array to a hex string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The hex string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            // Shortcuts
	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;

	            // Convert
	            var hexChars = [];
	            for (var i = 0; i < sigBytes; i++) {
	                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                hexChars.push((bite >>> 4).toString(16));
	                hexChars.push((bite & 0x0f).toString(16));
	            }

	            return hexChars.join('');
	        },

	        /**
	         * Converts a hex string to a word array.
	         *
	         * @param {string} hexStr The hex string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
	         */
	        parse: function (hexStr) {
	            // Shortcut
	            var hexStrLength = hexStr.length;

	            // Convert
	            var words = [];
	            for (var i = 0; i < hexStrLength; i += 2) {
	                words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
	            }

	            return new WordArray.init(words, hexStrLength / 2);
	        }
	    };

	    /**
	     * Latin1 encoding strategy.
	     */
	    var Latin1 = C_enc.Latin1 = {
	        /**
	         * Converts a word array to a Latin1 string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The Latin1 string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            // Shortcuts
	            var words = wordArray.words;
	            var sigBytes = wordArray.sigBytes;

	            // Convert
	            var latin1Chars = [];
	            for (var i = 0; i < sigBytes; i++) {
	                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
	                latin1Chars.push(String.fromCharCode(bite));
	            }

	            return latin1Chars.join('');
	        },

	        /**
	         * Converts a Latin1 string to a word array.
	         *
	         * @param {string} latin1Str The Latin1 string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
	         */
	        parse: function (latin1Str) {
	            // Shortcut
	            var latin1StrLength = latin1Str.length;

	            // Convert
	            var words = [];
	            for (var i = 0; i < latin1StrLength; i++) {
	                words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
	            }

	            return new WordArray.init(words, latin1StrLength);
	        }
	    };

	    /**
	     * UTF-8 encoding strategy.
	     */
	    var Utf8 = C_enc.Utf8 = {
	        /**
	         * Converts a word array to a UTF-8 string.
	         *
	         * @param {WordArray} wordArray The word array.
	         *
	         * @return {string} The UTF-8 string.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
	         */
	        stringify: function (wordArray) {
	            try {
	                return decodeURIComponent(escape(Latin1.stringify(wordArray)));
	            } catch (e) {
	                throw new Error('Malformed UTF-8 data');
	            }
	        },

	        /**
	         * Converts a UTF-8 string to a word array.
	         *
	         * @param {string} utf8Str The UTF-8 string.
	         *
	         * @return {WordArray} The word array.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
	         */
	        parse: function (utf8Str) {
	            return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
	        }
	    };

	    /**
	     * Abstract buffered block algorithm template.
	     *
	     * The property blockSize must be implemented in a concrete subtype.
	     *
	     * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
	     */
	    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
	        /**
	         * Resets this block algorithm's data buffer to its initial state.
	         *
	         * @example
	         *
	         *     bufferedBlockAlgorithm.reset();
	         */
	        reset: function () {
	            // Initial values
	            this._data = new WordArray.init();
	            this._nDataBytes = 0;
	        },

	        /**
	         * Adds new data to this block algorithm's buffer.
	         *
	         * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
	         *
	         * @example
	         *
	         *     bufferedBlockAlgorithm._append('data');
	         *     bufferedBlockAlgorithm._append(wordArray);
	         */
	        _append: function (data) {
	            // Convert string to WordArray, else assume WordArray already
	            if (typeof data == 'string') {
	                data = Utf8.parse(data);
	            }

	            // Append
	            this._data.concat(data);
	            this._nDataBytes += data.sigBytes;
	        },

	        /**
	         * Processes available data blocks.
	         *
	         * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
	         *
	         * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
	         *
	         * @return {WordArray} The processed data.
	         *
	         * @example
	         *
	         *     var processedData = bufferedBlockAlgorithm._process();
	         *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
	         */
	        _process: function (doFlush) {
	            // Shortcuts
	            var data = this._data;
	            var dataWords = data.words;
	            var dataSigBytes = data.sigBytes;
	            var blockSize = this.blockSize;
	            var blockSizeBytes = blockSize * 4;

	            // Count blocks ready
	            var nBlocksReady = dataSigBytes / blockSizeBytes;
	            if (doFlush) {
	                // Round up to include partial blocks
	                nBlocksReady = Math.ceil(nBlocksReady);
	            } else {
	                // Round down to include only full blocks,
	                // less the number of blocks that must remain in the buffer
	                nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
	            }

	            // Count words ready
	            var nWordsReady = nBlocksReady * blockSize;

	            // Count bytes ready
	            var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

	            // Process blocks
	            if (nWordsReady) {
	                for (var offset = 0; offset < nWordsReady; offset += blockSize) {
	                    // Perform concrete-algorithm logic
	                    this._doProcessBlock(dataWords, offset);
	                }

	                // Remove processed words
	                var processedWords = dataWords.splice(0, nWordsReady);
	                data.sigBytes -= nBytesReady;
	            }

	            // Return processed words
	            return new WordArray.init(processedWords, nBytesReady);
	        },

	        /**
	         * Creates a copy of this object.
	         *
	         * @return {Object} The clone.
	         *
	         * @example
	         *
	         *     var clone = bufferedBlockAlgorithm.clone();
	         */
	        clone: function () {
	            var clone = Base.clone.call(this);
	            clone._data = this._data.clone();

	            return clone;
	        },

	        _minBufferSize: 0
	    });

	    /**
	     * Abstract hasher template.
	     *
	     * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
	     */
	    var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
	        /**
	         * Configuration options.
	         */
	        cfg: Base.extend(),

	        /**
	         * Initializes a newly created hasher.
	         *
	         * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
	         *
	         * @example
	         *
	         *     var hasher = CryptoJS.algo.SHA256.create();
	         */
	        init: function (cfg) {
	            // Apply config defaults
	            this.cfg = this.cfg.extend(cfg);

	            // Set initial values
	            this.reset();
	        },

	        /**
	         * Resets this hasher to its initial state.
	         *
	         * @example
	         *
	         *     hasher.reset();
	         */
	        reset: function () {
	            // Reset data buffer
	            BufferedBlockAlgorithm.reset.call(this);

	            // Perform concrete-hasher logic
	            this._doReset();
	        },

	        /**
	         * Updates this hasher with a message.
	         *
	         * @param {WordArray|string} messageUpdate The message to append.
	         *
	         * @return {Hasher} This hasher.
	         *
	         * @example
	         *
	         *     hasher.update('message');
	         *     hasher.update(wordArray);
	         */
	        update: function (messageUpdate) {
	            // Append
	            this._append(messageUpdate);

	            // Update the hash
	            this._process();

	            // Chainable
	            return this;
	        },

	        /**
	         * Finalizes the hash computation.
	         * Note that the finalize operation is effectively a destructive, read-once operation.
	         *
	         * @param {WordArray|string} messageUpdate (Optional) A final message update.
	         *
	         * @return {WordArray} The hash.
	         *
	         * @example
	         *
	         *     var hash = hasher.finalize();
	         *     var hash = hasher.finalize('message');
	         *     var hash = hasher.finalize(wordArray);
	         */
	        finalize: function (messageUpdate) {
	            // Final message update
	            if (messageUpdate) {
	                this._append(messageUpdate);
	            }

	            // Perform concrete-hasher logic
	            var hash = this._doFinalize();

	            return hash;
	        },

	        blockSize: 512/32,

	        /**
	         * Creates a shortcut function to a hasher's object interface.
	         *
	         * @param {Hasher} hasher The hasher to create a helper for.
	         *
	         * @return {Function} The shortcut function.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
	         */
	        _createHelper: function (hasher) {
	            return function (message, cfg) {
	                return new hasher.init(cfg).finalize(message);
	            };
	        },

	        /**
	         * Creates a shortcut function to the HMAC's object interface.
	         *
	         * @param {Hasher} hasher The hasher to use in this HMAC helper.
	         *
	         * @return {Function} The shortcut function.
	         *
	         * @static
	         *
	         * @example
	         *
	         *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
	         */
	        _createHmacHelper: function (hasher) {
	            return function (message, key) {
	                return new C_algo.HMAC.init(hasher, key).finalize(message);
	            };
	        }
	    });

	    /**
	     * Algorithm namespace.
	     */
	    var C_algo = C.algo = {};

	    return C;
	}(Math));


	return CryptoJS;

}));

/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = __webpack_require__(16);
/**
 * When a UAS wishes to construct a response to a request, it follows
 * the general procedures detailed in the following subsections.
 * Additional behaviors specific to the response code in question, which
 * are not detailed in this section, may also be required.
 * https://tools.ietf.org/html/rfc3261#section-8.2.6
 * @internal
 */
function constructOutgoingResponse(message, options) {
    var CRLF = "\r\n";
    if (options.statusCode < 100 || options.statusCode > 699) {
        throw new TypeError("Invalid statusCode: " + options.statusCode);
    }
    var reasonPhrase = options.reasonPhrase ? options.reasonPhrase : utils_1.getReasonPhrase(options.statusCode);
    // SIP responses are distinguished from requests by having a Status-Line
    // as their start-line.  A Status-Line consists of the protocol version
    // followed by a numeric Status-Code and its associated textual phrase,
    // with each element separated by a single SP character.
    // https://tools.ietf.org/html/rfc3261#section-7.2
    var response = "SIP/2.0 " + options.statusCode + " " + reasonPhrase + CRLF;
    // One largely non-method-specific guideline for the generation of
    // responses is that UASs SHOULD NOT issue a provisional response for a
    // non-INVITE request.  Rather, UASs SHOULD generate a final response to
    // a non-INVITE request as soon as possible.
    // https://tools.ietf.org/html/rfc3261#section-8.2.6.1
    if (options.statusCode >= 100 && options.statusCode < 200) {
        // TODO
    }
    // When a 100 (Trying) response is generated, any Timestamp header field
    // present in the request MUST be copied into this 100 (Trying)
    // response.  If there is a delay in generating the response, the UAS
    // SHOULD add a delay value into the Timestamp value in the response.
    // This value MUST contain the difference between the time of sending of
    // the response and receipt of the request, measured in seconds.
    // https://tools.ietf.org/html/rfc3261#section-8.2.6.1
    if (options.statusCode === 100) {
        // TODO
    }
    // The From field of the response MUST equal the From header field of
    // the request.  The Call-ID header field of the response MUST equal the
    // Call-ID header field of the request.  The CSeq header field of the
    // response MUST equal the CSeq field of the request.  The Via header
    // field values in the response MUST equal the Via header field values
    // in the request and MUST maintain the same ordering.
    // https://tools.ietf.org/html/rfc3261#section-8.2.6.2
    var fromHeader = "From: " + message.getHeader("From") + CRLF;
    var callIdHeader = "Call-ID: " + message.callId + CRLF;
    var cSeqHeader = "CSeq: " + message.cseq + " " + message.method + CRLF;
    var viaHeaders = message.getHeaders("via").reduce(function (previous, current) {
        return previous + "Via: " + current + CRLF;
    }, "");
    // If a request contained a To tag in the request, the To header field
    // in the response MUST equal that of the request.  However, if the To
    // header field in the request did not contain a tag, the URI in the To
    // header field in the response MUST equal the URI in the To header
    // field; additionally, the UAS MUST add a tag to the To header field in
    // the response (with the exception of the 100 (Trying) response, in
    // which a tag MAY be present).  This serves to identify the UAS that is
    // responding, possibly resulting in a component of a dialog ID.  The
    // same tag MUST be used for all responses to that request, both final
    // and provisional (again excepting the 100 (Trying)).
    // https://tools.ietf.org/html/rfc3261#section-8.2.6.2
    var toHeader = "To: " + message.getHeader("to");
    if (options.statusCode > 100 && !message.parseHeader("to").hasParam("tag")) {
        var toTag = options.toTag;
        if (!toTag) {
            // Stateless UAS Behavior...
            // o  To header tags MUST be generated for responses in a stateless
            //    manner - in a manner that will generate the same tag for the
            //    same request consistently.  For information on tag construction
            //    see Section 19.3.
            // https://tools.ietf.org/html/rfc3261#section-8.2.7
            toTag = utils_1.newTag(); // FIXME: newTag() currently generates random tags
        }
        toHeader += ";tag=" + toTag;
    }
    toHeader += CRLF;
    // FIXME: TODO: needs review... moved to InviteUserAgentServer (as it is specific to that)
    // let recordRouteHeaders = "";
    // if (request.method === C.INVITE && statusCode > 100 && statusCode <= 200) {
    //   recordRouteHeaders = request.getHeaders("record-route").reduce((previous, current) => {
    //     return previous + "Record-Route: " + current + CRLF;
    //   }, "");
    // }
    // FIXME: TODO: needs review...
    var supportedHeader = "";
    if (options.supported) {
        supportedHeader = "Supported: " + options.supported.join(", ") + CRLF;
    }
    // FIXME: TODO: needs review...
    var userAgentHeader = "";
    if (options.userAgent) {
        userAgentHeader = "User-Agent: " + options.userAgent + CRLF;
    }
    var extensionHeaders = "";
    if (options.extraHeaders) {
        extensionHeaders = options.extraHeaders.reduce(function (previous, current) {
            return previous + current.trim() + CRLF;
        }, "");
    }
    // The relative order of header fields with different field names is not
    // significant.  However, it is RECOMMENDED that header fields which are
    // needed for proxy processing (Via, Route, Record-Route, Proxy-Require,
    // Max-Forwards, and Proxy-Authorization, for example) appear towards
    // the top of the message to facilitate rapid parsing.
    // https://tools.ietf.org/html/rfc3261#section-7.3.1
    // response += recordRouteHeaders;
    response += viaHeaders;
    response += fromHeader;
    response += toHeader;
    response += cSeqHeader;
    response += callIdHeader;
    response += supportedHeader;
    response += userAgentHeader;
    response += extensionHeaders;
    if (options.body) {
        response += "Content-Type: " + options.body.contentType + CRLF;
        response += "Content-Length: " + utils_1.str_utf8_length(options.body.content) + CRLF + CRLF;
        response += options.body.content;
    }
    else {
        response += "Content-Length: " + 0 + CRLF + CRLF;
    }
    return { message: response };
}
exports.constructOutgoingResponse = constructOutgoingResponse;


/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var grammar_1 = __webpack_require__(11);
var incoming_request_message_1 = __webpack_require__(9);
var incoming_response_message_1 = __webpack_require__(17);
/**
 * Extract and parse every header of a SIP message.
 * @internal
 */
var Parser;
(function (Parser) {
    function getHeader(data, headerStart) {
        // 'start' position of the header.
        var start = headerStart;
        // 'end' position of the header.
        var end = 0;
        // 'partial end' position of the header.
        var partialEnd = 0;
        // End of message.
        if (data.substring(start, start + 2).match(/(^\r\n)/)) {
            return -2;
        }
        while (end === 0) {
            // Partial End of Header.
            partialEnd = data.indexOf("\r\n", start);
            // 'indexOf' returns -1 if the value to be found never occurs.
            if (partialEnd === -1) {
                return partialEnd;
            }
            if (!data.substring(partialEnd + 2, partialEnd + 4).match(/(^\r\n)/) &&
                data.charAt(partialEnd + 2).match(/(^\s+)/)) {
                // Not the end of the message. Continue from the next position.
                start = partialEnd + 2;
            }
            else {
                end = partialEnd;
            }
        }
        return end;
    }
    Parser.getHeader = getHeader;
    function parseHeader(message, data, headerStart, headerEnd) {
        var hcolonIndex = data.indexOf(":", headerStart);
        var headerName = data.substring(headerStart, hcolonIndex).trim();
        var headerValue = data.substring(hcolonIndex + 1, headerEnd).trim();
        var parsed;
        // If header-field is well-known, parse it.
        switch (headerName.toLowerCase()) {
            case "via":
            case "v":
                message.addHeader("via", headerValue);
                if (message.getHeaders("via").length === 1) {
                    parsed = message.parseHeader("Via");
                    if (parsed) {
                        message.via = parsed;
                        message.viaBranch = parsed.branch;
                    }
                }
                else {
                    parsed = 0;
                }
                break;
            case "from":
            case "f":
                message.setHeader("from", headerValue);
                parsed = message.parseHeader("from");
                if (parsed) {
                    message.from = parsed;
                    message.fromTag = parsed.getParam("tag");
                }
                break;
            case "to":
            case "t":
                message.setHeader("to", headerValue);
                parsed = message.parseHeader("to");
                if (parsed) {
                    message.to = parsed;
                    message.toTag = parsed.getParam("tag");
                }
                break;
            case "record-route":
                parsed = grammar_1.Grammar.parse(headerValue, "Record_Route");
                if (parsed === -1) {
                    parsed = undefined;
                    break;
                }
                if (!(parsed instanceof Array)) {
                    parsed = undefined;
                    break;
                }
                parsed.forEach(function (header) {
                    message.addHeader("record-route", headerValue.substring(header.position, header.offset));
                    message.headers["Record-Route"][message.getHeaders("record-route").length - 1].parsed = header.parsed;
                });
                break;
            case "call-id":
            case "i":
                message.setHeader("call-id", headerValue);
                parsed = message.parseHeader("call-id");
                if (parsed) {
                    message.callId = headerValue;
                }
                break;
            case "contact":
            case "m":
                parsed = grammar_1.Grammar.parse(headerValue, "Contact");
                if (parsed === -1) {
                    parsed = undefined;
                    break;
                }
                if (!(parsed instanceof Array)) {
                    parsed = undefined;
                    break;
                }
                parsed.forEach(function (header) {
                    message.addHeader("contact", headerValue.substring(header.position, header.offset));
                    message.headers.Contact[message.getHeaders("contact").length - 1].parsed = header.parsed;
                });
                break;
            case "content-length":
            case "l":
                message.setHeader("content-length", headerValue);
                parsed = message.parseHeader("content-length");
                break;
            case "content-type":
            case "c":
                message.setHeader("content-type", headerValue);
                parsed = message.parseHeader("content-type");
                break;
            case "cseq":
                message.setHeader("cseq", headerValue);
                parsed = message.parseHeader("cseq");
                if (parsed) {
                    message.cseq = parsed.value;
                }
                if (message instanceof incoming_response_message_1.IncomingResponseMessage) {
                    message.method = parsed.method;
                }
                break;
            case "max-forwards":
                message.setHeader("max-forwards", headerValue);
                parsed = message.parseHeader("max-forwards");
                break;
            case "www-authenticate":
                message.setHeader("www-authenticate", headerValue);
                parsed = message.parseHeader("www-authenticate");
                break;
            case "proxy-authenticate":
                message.setHeader("proxy-authenticate", headerValue);
                parsed = message.parseHeader("proxy-authenticate");
                break;
            case "refer-to":
            case "r":
                message.setHeader("refer-to", headerValue);
                parsed = message.parseHeader("refer-to");
                if (parsed) {
                    message.referTo = parsed;
                }
                break;
            default:
                // Do not parse this header.
                message.addHeader(headerName.toLowerCase(), headerValue);
                parsed = 0;
        }
        if (parsed === undefined) {
            return {
                error: "error parsing header '" + headerName + "'"
            };
        }
        else {
            return true;
        }
    }
    Parser.parseHeader = parseHeader;
    function parseMessage(data, logger) {
        var headerStart = 0;
        var headerEnd = data.indexOf("\r\n");
        if (headerEnd === -1) {
            logger.warn("no CRLF found, not a SIP message, discarded");
            return;
        }
        // Parse first line. Check if it is a Request or a Reply.
        var firstLine = data.substring(0, headerEnd);
        var parsed = grammar_1.Grammar.parse(firstLine, "Request_Response");
        var message;
        if (parsed === -1) {
            logger.warn('error parsing first line of SIP message: "' + firstLine + '"');
            return;
        }
        else if (!parsed.status_code) {
            message = new incoming_request_message_1.IncomingRequestMessage();
            message.method = parsed.method;
            message.ruri = parsed.uri;
        }
        else {
            message = new incoming_response_message_1.IncomingResponseMessage();
            message.statusCode = parsed.status_code;
            message.reasonPhrase = parsed.reason_phrase;
        }
        message.data = data;
        headerStart = headerEnd + 2;
        // Loop over every line in data. Detect the end of each header and parse
        // it or simply add to the headers collection.
        var bodyStart;
        while (true) {
            headerEnd = getHeader(data, headerStart);
            // The SIP message has normally finished.
            if (headerEnd === -2) {
                bodyStart = headerStart + 2;
                break;
            }
            else if (headerEnd === -1) {
                // data.indexOf returned -1 due to a malformed message.
                logger.error("malformed message");
                return;
            }
            var parsedHeader = parseHeader(message, data, headerStart, headerEnd);
            if (parsedHeader !== true) {
                logger.error(parsed.error);
                return;
            }
            headerStart = headerEnd + 2;
        }
        // RFC3261 18.3.
        // If there are additional bytes in the transport packet
        // beyond the end of the body, they MUST be discarded.
        if (message.hasHeader("content-length")) {
            message.body = data.substr(bodyStart, Number(message.getHeader("content-length")));
        }
        else {
            message.body = data.substring(bodyStart);
        }
        return message;
    }
    Parser.parseMessage = parseMessage;
})(Parser = exports.Parser || (exports.Parser = {}));


/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var messages_1 = __webpack_require__(5);
var session_1 = __webpack_require__(25);
var timers_1 = __webpack_require__(27);
var transactions_1 = __webpack_require__(28);
var bye_user_agent_client_1 = __webpack_require__(42);
var bye_user_agent_server_1 = __webpack_require__(44);
var info_user_agent_client_1 = __webpack_require__(46);
var info_user_agent_server_1 = __webpack_require__(47);
var message_user_agent_client_1 = __webpack_require__(48);
var message_user_agent_server_1 = __webpack_require__(49);
var notify_user_agent_client_1 = __webpack_require__(50);
var notify_user_agent_server_1 = __webpack_require__(51);
var prack_user_agent_client_1 = __webpack_require__(52);
var prack_user_agent_server_1 = __webpack_require__(53);
var re_invite_user_agent_client_1 = __webpack_require__(54);
var re_invite_user_agent_server_1 = __webpack_require__(55);
var refer_user_agent_client_1 = __webpack_require__(56);
var refer_user_agent_server_1 = __webpack_require__(57);
var dialog_1 = __webpack_require__(4);
/**
 * Session Dialog.
 * @public
 */
var SessionDialog = /** @class */ (function (_super) {
    tslib_1.__extends(SessionDialog, _super);
    function SessionDialog(initialTransaction, core, state, delegate) {
        var _this = _super.call(this, core, state) || this;
        _this.initialTransaction = initialTransaction;
        /** The state of the offer/answer exchange. */
        _this._signalingState = session_1.SignalingState.Initial;
        /** True if waiting for an ACK to the initial transaction 2xx (UAS only). */
        _this.ackWait = false;
        _this.delegate = delegate;
        if (initialTransaction instanceof transactions_1.InviteServerTransaction) {
            // If we're created by an invite server transaction, we're
            // going to be waiting for an ACK if are to be confirmed.
            _this.ackWait = true;
        }
        // If we're confirmed upon creation start the retransmitting whatever
        // the 2xx final response was that confirmed us into existence.
        if (!_this.early) {
            _this.start2xxRetransmissionTimer();
        }
        _this.signalingStateTransition(initialTransaction.request);
        _this.logger = core.loggerFactory.getLogger("sip.invite-dialog");
        _this.logger.log("INVITE dialog " + _this.id + " constructed");
        return _this;
    }
    SessionDialog.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        this._signalingState = session_1.SignalingState.Closed;
        this._offer = undefined;
        this._answer = undefined;
        if (this.invite2xxTimer) {
            clearTimeout(this.invite2xxTimer);
            this.invite2xxTimer = undefined;
        }
        // The UAS MUST still respond to any pending requests received for that
        // dialog.  It is RECOMMENDED that a 487 (Request Terminated) response
        // be generated to those pending requests.
        // https://tools.ietf.org/html/rfc3261#section-15.1.2
        // TODO:
        // this.userAgentServers.forEach((uas) => uas.reply(487));
        this.logger.log("INVITE dialog " + this.id + " destroyed");
    };
    Object.defineProperty(SessionDialog.prototype, "sessionState", {
        // FIXME: Need real state machine
        get: function () {
            if (this.early) {
                return session_1.SessionState.Early;
            }
            else if (this.ackWait) {
                return session_1.SessionState.AckWait;
            }
            else if (this._signalingState === session_1.SignalingState.Closed) {
                return session_1.SessionState.Terminated;
            }
            else {
                return session_1.SessionState.Confirmed;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SessionDialog.prototype, "signalingState", {
        /** The state of the offer/answer exchange. */
        get: function () {
            return this._signalingState;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SessionDialog.prototype, "offer", {
        /** The current offer. Undefined unless signaling state HaveLocalOffer, HaveRemoteOffer, of Stable. */
        get: function () {
            return this._offer;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SessionDialog.prototype, "answer", {
        /** The current answer. Undefined unless signaling state Stable. */
        get: function () {
            return this._answer;
        },
        enumerable: true,
        configurable: true
    });
    /** Confirm the dialog. Only matters if dialog is currently early. */
    SessionDialog.prototype.confirm = function () {
        // When we're confirmed start the retransmitting whatever
        // the 2xx final response that may have confirmed us.
        if (this.early) {
            this.start2xxRetransmissionTimer();
        }
        _super.prototype.confirm.call(this);
    };
    /** Re-confirm the dialog. Only matters if handling re-INVITE request. */
    SessionDialog.prototype.reConfirm = function () {
        // When we're confirmed start the retransmitting whatever
        // the 2xx final response that may have confirmed us.
        if (this.reinviteUserAgentServer) {
            this.startReInvite2xxRetransmissionTimer();
        }
    };
    /**
     * The UAC core MUST generate an ACK request for each 2xx received from
     * the transaction layer.  The header fields of the ACK are constructed
     * in the same way as for any request sent within a dialog (see Section
     * 12) with the exception of the CSeq and the header fields related to
     * authentication.  The sequence number of the CSeq header field MUST be
     * the same as the INVITE being acknowledged, but the CSeq method MUST
     * be ACK.  The ACK MUST contain the same credentials as the INVITE.  If
     * the 2xx contains an offer (based on the rules above), the ACK MUST
     * carry an answer in its body.  If the offer in the 2xx response is not
     * acceptable, the UAC core MUST generate a valid answer in the ACK and
     * then send a BYE immediately.
     * https://tools.ietf.org/html/rfc3261#section-13.2.2.4
     * @param options - ACK options bucket.
     */
    SessionDialog.prototype.ack = function (options) {
        if (options === void 0) { options = {}; }
        this.logger.log("INVITE dialog " + this.id + " sending ACK request");
        var transaction;
        if (this.reinviteUserAgentClient) {
            // We're sending ACK for a re-INVITE
            if (!(this.reinviteUserAgentClient.transaction instanceof transactions_1.InviteClientTransaction)) {
                throw new Error("Transaction not instance of InviteClientTransaction.");
            }
            transaction = this.reinviteUserAgentClient.transaction;
            this.reinviteUserAgentClient = undefined;
        }
        else {
            // We're sending ACK for the initial INVITE
            if (!(this.initialTransaction instanceof transactions_1.InviteClientTransaction)) {
                throw new Error("Initial transaction not instance of InviteClientTransaction.");
            }
            transaction = this.initialTransaction;
        }
        options.cseq = transaction.request.cseq; // ACK cseq is INVITE cseq
        var message = this.createOutgoingRequestMessage(messages_1.C.ACK, options);
        transaction.ackResponse(message); // See InviteClientTransaction for details.
        this.signalingStateTransition(message);
        return { message: message };
    };
    /**
     * Terminating a Session
     *
     * This section describes the procedures for terminating a session
     * established by SIP.  The state of the session and the state of the
     * dialog are very closely related.  When a session is initiated with an
     * INVITE, each 1xx or 2xx response from a distinct UAS creates a
     * dialog, and if that response completes the offer/answer exchange, it
     * also creates a session.  As a result, each session is "associated"
     * with a single dialog - the one which resulted in its creation.  If an
     * initial INVITE generates a non-2xx final response, that terminates
     * all sessions (if any) and all dialogs (if any) that were created
     * through responses to the request.  By virtue of completing the
     * transaction, a non-2xx final response also prevents further sessions
     * from being created as a result of the INVITE.  The BYE request is
     * used to terminate a specific session or attempted session.  In this
     * case, the specific session is the one with the peer UA on the other
     * side of the dialog.  When a BYE is received on a dialog, any session
     * associated with that dialog SHOULD terminate.  A UA MUST NOT send a
     * BYE outside of a dialog.  The caller's UA MAY send a BYE for either
     * confirmed or early dialogs, and the callee's UA MAY send a BYE on
     * confirmed dialogs, but MUST NOT send a BYE on early dialogs.
     *
     * However, the callee's UA MUST NOT send a BYE on a confirmed dialog
     * until it has received an ACK for its 2xx response or until the server
     * transaction times out.  If no SIP extensions have defined other
     * application layer states associated with the dialog, the BYE also
     * terminates the dialog.
     *
     * https://tools.ietf.org/html/rfc3261#section-15
     * FIXME: Make these proper Exceptions...
     * @param options - BYE options bucket.
     * @returns
     * Throws `Error` if callee's UA attempts a BYE on an early dialog.
     * Throws `Error` if callee's UA attempts a BYE on a confirmed dialog
     *                while it's waiting on the ACK for its 2xx response.
     */
    SessionDialog.prototype.bye = function (delegate, options) {
        this.logger.log("INVITE dialog " + this.id + " sending BYE request");
        // The caller's UA MAY send a BYE for either
        // confirmed or early dialogs, and the callee's UA MAY send a BYE on
        // confirmed dialogs, but MUST NOT send a BYE on early dialogs.
        //
        // However, the callee's UA MUST NOT send a BYE on a confirmed dialog
        // until it has received an ACK for its 2xx response or until the server
        // transaction times out.
        // https://tools.ietf.org/html/rfc3261#section-15
        if (this.initialTransaction instanceof transactions_1.InviteServerTransaction) {
            if (this.early) {
                // FIXME: TODO: This should throw a proper exception.
                throw new Error("UAS MUST NOT send a BYE on early dialogs.");
            }
            if (this.ackWait && this.initialTransaction.state !== transactions_1.TransactionState.Terminated) {
                // FIXME: TODO: This should throw a proper exception.
                throw new Error("UAS MUST NOT send a BYE on a confirmed dialog " +
                    "until it has received an ACK for its 2xx response " +
                    "or until the server transaction times out.");
            }
        }
        // A BYE request is constructed as would any other request within a
        // dialog, as described in Section 12.
        //
        // Once the BYE is constructed, the UAC core creates a new non-INVITE
        // client transaction, and passes it the BYE request.  The UAC MUST
        // consider the session terminated (and therefore stop sending or
        // listening for media) as soon as the BYE request is passed to the
        // client transaction.  If the response for the BYE is a 481
        // (Call/Transaction Does Not Exist) or a 408 (Request Timeout) or no
        // response at all is received for the BYE (that is, a timeout is
        // returned by the client transaction), the UAC MUST consider the
        // session and the dialog terminated.
        // https://tools.ietf.org/html/rfc3261#section-15.1.1
        return new bye_user_agent_client_1.ByeUserAgentClient(this, delegate, options);
    };
    /**
     * An INFO request can be associated with an Info Package (see
     * Section 5), or associated with a legacy INFO usage (see Section 2).
     *
     * The construction of the INFO request is the same as any other
     * non-target refresh request within an existing invite dialog usage as
     * described in Section 12.2 of RFC 3261.
     * https://tools.ietf.org/html/rfc6086#section-4.2.1
     * @param options - Options bucket.
     */
    SessionDialog.prototype.info = function (delegate, options) {
        this.logger.log("INVITE dialog " + this.id + " sending INFO request");
        if (this.early) {
            // FIXME: TODO: This should throw a proper exception.
            throw new Error("Dialog not confirmed.");
        }
        return new info_user_agent_client_1.InfoUserAgentClient(this, delegate, options);
    };
    /**
     * Modifying an Existing Session
     *
     * A successful INVITE request (see Section 13) establishes both a
     * dialog between two user agents and a session using the offer-answer
     * model.  Section 12 explains how to modify an existing dialog using a
     * target refresh request (for example, changing the remote target URI
     * of the dialog).  This section describes how to modify the actual
     * session.  This modification can involve changing addresses or ports,
     * adding a media stream, deleting a media stream, and so on.  This is
     * accomplished by sending a new INVITE request within the same dialog
     * that established the session.  An INVITE request sent within an
     * existing dialog is known as a re-INVITE.
     *
     *    Note that a single re-INVITE can modify the dialog and the
     *    parameters of the session at the same time.
     *
     * Either the caller or callee can modify an existing session.
     * https://tools.ietf.org/html/rfc3261#section-14
     * @param options - Options bucket
     */
    SessionDialog.prototype.invite = function (delegate, options) {
        this.logger.log("INVITE dialog " + this.id + " sending INVITE request");
        if (this.early) {
            // FIXME: TODO: This should throw a proper exception.
            throw new Error("Dialog not confirmed.");
        }
        // Note that a UAC MUST NOT initiate a new INVITE transaction within a
        // dialog while another INVITE transaction is in progress in either
        // direction.
        //
        //    1. If there is an ongoing INVITE client transaction, the TU MUST
        //       wait until the transaction reaches the completed or terminated
        //       state before initiating the new INVITE.
        //
        //    2. If there is an ongoing INVITE server transaction, the TU MUST
        //       wait until the transaction reaches the confirmed or terminated
        //       state before initiating the new INVITE.
        //
        // However, a UA MAY initiate a regular transaction while an INVITE
        // transaction is in progress.  A UA MAY also initiate an INVITE
        // transaction while a regular transaction is in progress.
        // https://tools.ietf.org/html/rfc3261#section-14.1
        if (this.reinviteUserAgentClient) {
            // FIXME: TODO: This should throw a proper exception.
            throw new Error("There is an ongoing re-INVITE client transaction.");
        }
        if (this.reinviteUserAgentServer) {
            // FIXME: TODO: This should throw a proper exception.
            throw new Error("There is an ongoing re-INVITE server transaction.");
        }
        return new re_invite_user_agent_client_1.ReInviteUserAgentClient(this, delegate, options);
    };
    /**
     * A UAC MAY associate a MESSAGE request with an existing dialog.  If a
     * MESSAGE request is sent within a dialog, it is "associated" with any
     * media session or sessions associated with that dialog.
     * https://tools.ietf.org/html/rfc3428#section-4
     * @param options - Options bucket.
     */
    SessionDialog.prototype.message = function (delegate, options) {
        this.logger.log("INVITE dialog " + this.id + " sending MESSAGE request");
        if (this.early) {
            // FIXME: TODO: This should throw a proper exception.
            throw new Error("Dialog not confirmed.");
        }
        var message = this.createOutgoingRequestMessage(messages_1.C.MESSAGE, options);
        return new message_user_agent_client_1.MessageUserAgentClient(this.core, message, delegate);
    };
    /**
     * The NOTIFY mechanism defined in [2] MUST be used to inform the agent
     * sending the REFER of the status of the reference.
     * https://tools.ietf.org/html/rfc3515#section-2.4.4
     * @param options - Options bucket.
     */
    SessionDialog.prototype.notify = function (delegate, options) {
        this.logger.log("INVITE dialog " + this.id + " sending NOTIFY request");
        if (this.early) {
            // FIXME: TODO: This should throw a proper exception.
            throw new Error("Dialog not confirmed.");
        }
        return new notify_user_agent_client_1.NotifyUserAgentClient(this, delegate, options);
    };
    /**
     * Assuming the response is to be transmitted reliably, the UAC MUST
     * create a new request with method PRACK.  This request is sent within
     * the dialog associated with the provisional response (indeed, the
     * provisional response may have created the dialog).  PRACK requests
     * MAY contain bodies, which are interpreted according to their type and
     * disposition.
     * https://tools.ietf.org/html/rfc3262#section-4
     * @param options - Options bucket.
     */
    SessionDialog.prototype.prack = function (delegate, options) {
        this.logger.log("INVITE dialog " + this.id + " sending PRACK request");
        return new prack_user_agent_client_1.PrackUserAgentClient(this, delegate, options);
    };
    /**
     * REFER is a SIP request and is constructed as defined in [1].  A REFER
     * request MUST contain exactly one Refer-To header field value.
     * https://tools.ietf.org/html/rfc3515#section-2.4.1
     * @param options - Options bucket.
     */
    SessionDialog.prototype.refer = function (delegate, options) {
        this.logger.log("INVITE dialog " + this.id + " sending REFER request");
        if (this.early) {
            // FIXME: TODO: This should throw a proper exception.
            throw new Error("Dialog not confirmed.");
        }
        // FIXME: TODO: Validate Refer-To header field value.
        return new refer_user_agent_client_1.ReferUserAgentClient(this, delegate, options);
    };
    /**
     * Requests sent within a dialog, as any other requests, are atomic.  If
     * a particular request is accepted by the UAS, all the state changes
     * associated with it are performed.  If the request is rejected, none
     * of the state changes are performed.
     * https://tools.ietf.org/html/rfc3261#section-12.2.2
     * @param message - Incoming request message within this dialog.
     */
    SessionDialog.prototype.receiveRequest = function (message) {
        this.logger.log("INVITE dialog " + this.id + " received " + message.method + " request");
        // Response retransmissions cease when an ACK request for the
        // response is received.  This is independent of whatever transport
        // protocols are used to send the response.
        // https://tools.ietf.org/html/rfc6026#section-8.1
        if (message.method === messages_1.C.ACK) {
            // If ackWait is true, then this is the ACK to the initial INVITE,
            // otherwise this is an ACK to an in dialog INVITE. In either case,
            // guard to make sure the sequence number of the ACK matches the INVITE.
            if (this.ackWait) {
                if (this.initialTransaction instanceof transactions_1.InviteClientTransaction) {
                    this.logger.warn("INVITE dialog " + this.id + " received unexpected " + message.method + " request, dropping.");
                    return;
                }
                if (this.initialTransaction.request.cseq !== message.cseq) {
                    this.logger.warn("INVITE dialog " + this.id + " received unexpected " + message.method + " request, dropping.");
                    return;
                }
                // Update before the delegate has a chance to handle the
                // message as delegate may callback into this dialog.
                this.ackWait = false;
            }
            else {
                if (!this.reinviteUserAgentServer) {
                    this.logger.warn("INVITE dialog " + this.id + " received unexpected " + message.method + " request, dropping.");
                    return;
                }
                if (this.reinviteUserAgentServer.transaction.request.cseq !== message.cseq) {
                    this.logger.warn("INVITE dialog " + this.id + " received unexpected " + message.method + " request, dropping.");
                    return;
                }
                this.reinviteUserAgentServer = undefined;
            }
            this.signalingStateTransition(message);
            if (this.delegate && this.delegate.onAck) {
                this.delegate.onAck({ message: message });
            }
            return;
        }
        // Request within a dialog out of sequence guard.
        // https://tools.ietf.org/html/rfc3261#section-12.2.2
        if (!this.sequenceGuard(message)) {
            this.logger.log("INVITE dialog " + this.id + " rejected out of order " + message.method + " request.");
            return;
        }
        if (message.method === messages_1.C.INVITE) {
            // A UAS that receives a second INVITE before it sends the final
            // response to a first INVITE with a lower CSeq sequence number on the
            // same dialog MUST return a 500 (Server Internal Error) response to the
            // second INVITE and MUST include a Retry-After header field with a
            // randomly chosen value of between 0 and 10 seconds.
            // https://tools.ietf.org/html/rfc3261#section-14.2
            if (this.reinviteUserAgentServer) {
                // https://tools.ietf.org/html/rfc3261#section-20.33
                var retryAfter = Math.floor((Math.random() * 10)) + 1;
                var extraHeaders = ["Retry-After: " + retryAfter];
                this.core.replyStateless(message, { statusCode: 500, extraHeaders: extraHeaders });
                return;
            }
            // A UAS that receives an INVITE on a dialog while an INVITE it had sent
            // on that dialog is in progress MUST return a 491 (Request Pending)
            // response to the received INVITE.
            // https://tools.ietf.org/html/rfc3261#section-14.2
            if (this.reinviteUserAgentClient) {
                this.core.replyStateless(message, { statusCode: 491 });
                return;
            }
        }
        // Request within a dialog common processing.
        // https://tools.ietf.org/html/rfc3261#section-12.2.2
        _super.prototype.receiveRequest.call(this, message);
        // Requests within a dialog MAY contain Record-Route and Contact header
        // fields.  However, these requests do not cause the dialog's route set
        // to be modified, although they may modify the remote target URI.
        // Specifically, requests that are not target refresh requests do not
        // modify the dialog's remote target URI, and requests that are target
        // refresh requests do.  For dialogs that have been established with an
        // INVITE, the only target refresh request defined is re-INVITE (see
        // Section 14).  Other extensions may define different target refresh
        // requests for dialogs established in other ways.
        //
        //    Note that an ACK is NOT a target refresh request.
        //
        // Target refresh requests only update the dialog's remote target URI,
        // and not the route set formed from the Record-Route.  Updating the
        // latter would introduce severe backwards compatibility problems with
        // RFC 2543-compliant systems.
        // https://tools.ietf.org/html/rfc3261#section-15
        if (message.method === messages_1.C.INVITE) {
            // FIXME: parser needs to be typed...
            var contact = message.parseHeader("contact");
            if (!contact) { // TODO: Review to make sure this will never happen
                throw new Error("Contact undefined.");
            }
            if (!(contact instanceof messages_1.NameAddrHeader)) {
                throw new Error("Contact not instance of NameAddrHeader.");
            }
            this.dialogState.remoteTarget = contact.uri;
        }
        // Switch on method and then delegate.
        switch (message.method) {
            case messages_1.C.BYE:
                // A UAS core receiving a BYE request for an existing dialog MUST follow
                // the procedures of Section 12.2.2 to process the request.  Once done,
                // the UAS SHOULD terminate the session (and therefore stop sending and
                // listening for media).  The only case where it can elect not to are
                // multicast sessions, where participation is possible even if the other
                // participant in the dialog has terminated its involvement in the
                // session.  Whether or not it ends its participation on the session,
                // the UAS core MUST generate a 2xx response to the BYE, and MUST pass
                // that to the server transaction for transmission.
                //
                // The UAS MUST still respond to any pending requests received for that
                // dialog.  It is RECOMMENDED that a 487 (Request Terminated) response
                // be generated to those pending requests.
                // https://tools.ietf.org/html/rfc3261#section-15.1.2
                {
                    var uas = new bye_user_agent_server_1.ByeUserAgentServer(this, message);
                    this.delegate && this.delegate.onBye ?
                        this.delegate.onBye(uas) :
                        uas.accept();
                    this.dispose();
                }
                break;
            case messages_1.C.INFO:
                // If a UA receives an INFO request associated with an Info Package that
                // the UA has not indicated willingness to receive, the UA MUST send a
                // 469 (Bad Info Package) response (see Section 11.6), which contains a
                // Recv-Info header field with Info Packages for which the UA is willing
                // to receive INFO requests.
                {
                    var uas = new info_user_agent_server_1.InfoUserAgentServer(this, message);
                    this.delegate && this.delegate.onInfo ?
                        this.delegate.onInfo(uas) :
                        uas.reject({
                            statusCode: 469,
                            extraHeaders: ["Recv-Info :"]
                        });
                }
                break;
            case messages_1.C.INVITE:
                // If the new session description is not acceptable, the UAS can reject
                // it by returning a 488 (Not Acceptable Here) response for the re-
                // INVITE.  This response SHOULD include a Warning header field.
                // https://tools.ietf.org/html/rfc3261#section-14.2
                {
                    var uas = new re_invite_user_agent_server_1.ReInviteUserAgentServer(this, message);
                    this.signalingStateTransition(message);
                    this.delegate && this.delegate.onInvite ?
                        this.delegate.onInvite(uas) :
                        uas.reject({ statusCode: 488 }); // TODO: Warning header field.
                }
                break;
            case messages_1.C.MESSAGE:
                {
                    var uas = new message_user_agent_server_1.MessageUserAgentServer(this.core, message);
                    this.delegate && this.delegate.onMessage ?
                        this.delegate.onMessage(uas) :
                        uas.accept();
                }
                break;
            case messages_1.C.NOTIFY:
                // https://tools.ietf.org/html/rfc3515#section-2.4.4
                {
                    var uas = new notify_user_agent_server_1.NotifyUserAgentServer(this, message);
                    this.delegate && this.delegate.onNotify ?
                        this.delegate.onNotify(uas) :
                        uas.accept();
                }
                break;
            case messages_1.C.PRACK:
                // https://tools.ietf.org/html/rfc3262#section-4
                {
                    var uas = new prack_user_agent_server_1.PrackUserAgentServer(this, message);
                    this.delegate && this.delegate.onPrack ?
                        this.delegate.onPrack(uas) :
                        uas.accept();
                }
                break;
            case messages_1.C.REFER:
                // https://tools.ietf.org/html/rfc3515#section-2.4.2
                {
                    var uas = new refer_user_agent_server_1.ReferUserAgentServer(this, message);
                    this.delegate && this.delegate.onRefer ?
                        this.delegate.onRefer(uas) :
                        uas.reject();
                }
                break;
            default:
                {
                    this.logger.log("INVITE dialog " + this.id + " received unimplemented " + message.method + " request");
                    this.core.replyStateless(message, { statusCode: 501 });
                }
                break;
        }
    };
    SessionDialog.prototype.reliableSequenceGuard = function (message) {
        var statusCode = message.statusCode;
        if (!statusCode) {
            throw new Error("Status code undefined");
        }
        if (statusCode > 100 && statusCode < 200) {
            // If a provisional response is received for an initial request, and
            // that response contains a Require header field containing the option
            // tag 100rel, the response is to be sent reliably.  If the response is
            // a 100 (Trying) (as opposed to 101 to 199), this option tag MUST be
            // ignored, and the procedures below MUST NOT be used.
            // https://tools.ietf.org/html/rfc3262#section-4
            var requireHeader = message.getHeader("require");
            var rseqHeader = message.getHeader("rseq");
            var rseq = requireHeader && requireHeader.includes("100rel") && rseqHeader ? Number(rseqHeader) : undefined;
            if (rseq) {
                // Handling of subsequent reliable provisional responses for the same
                // initial request follows the same rules as above, with the following
                // difference: reliable provisional responses are guaranteed to be in
                // order.  As a result, if the UAC receives another reliable provisional
                // response to the same request, and its RSeq value is not one higher
                // than the value of the sequence number, that response MUST NOT be
                // acknowledged with a PRACK, and MUST NOT be processed further by the
                // UAC.  An implementation MAY discard the response, or MAY cache the
                // response in the hopes of receiving the missing responses.
                // https://tools.ietf.org/html/rfc3262#section-4
                if (this.rseq && this.rseq + 1 !== rseq) {
                    return false;
                }
                // Once a reliable provisional response is received, retransmissions of
                // that response MUST be discarded.  A response is a retransmission when
                // its dialog ID, CSeq, and RSeq match the original response.  The UAC
                // MUST maintain a sequence number that indicates the most recently
                // received in-order reliable provisional response for the initial
                // request.  This sequence number MUST be maintained until a final
                // response is received for the initial request.  Its value MUST be
                // initialized to the RSeq header field in the first reliable
                // provisional response received for the initial request.
                // https://tools.ietf.org/html/rfc3262#section-4
                if (!this.rseq) {
                    this.rseq = rseq;
                }
            }
        }
        return true;
    };
    /**
     * If not in a stable signaling state, rollback to prior stable signaling state.
     */
    SessionDialog.prototype.signalingStateRollback = function () {
        if (this._signalingState === session_1.SignalingState.HaveLocalOffer ||
            this.signalingState === session_1.SignalingState.HaveRemoteOffer) {
            if (this._rollbackOffer && this._rollbackAnswer) {
                this._signalingState = session_1.SignalingState.Stable;
                this._offer = this._rollbackOffer;
                this._answer = this._rollbackAnswer;
            }
        }
    };
    /**
     * Update the signaling state of the dialog.
     * @param message - The message to base the update off of.
     */
    SessionDialog.prototype.signalingStateTransition = function (message) {
        var body = messages_1.getBody(message);
        // No body, no session. No, woman, no cry.
        if (!body || body.contentDisposition !== "session") {
            return;
        }
        // We've got an existing offer and answer which we may wish to rollback to
        if (this._signalingState === session_1.SignalingState.Stable) {
            this._rollbackOffer = this._offer;
            this._rollbackAnswer = this._answer;
        }
        // We're in UAS role, receiving incoming request with session description
        if (message instanceof messages_1.IncomingRequestMessage) {
            switch (this._signalingState) {
                case session_1.SignalingState.Initial:
                case session_1.SignalingState.Stable:
                    this._signalingState = session_1.SignalingState.HaveRemoteOffer;
                    this._offer = body;
                    this._answer = undefined;
                    break;
                case session_1.SignalingState.HaveLocalOffer:
                    this._signalingState = session_1.SignalingState.Stable;
                    this._answer = body;
                    break;
                case session_1.SignalingState.HaveRemoteOffer:
                    // You cannot make a new offer while one is in progress.
                    // https://tools.ietf.org/html/rfc3261#section-13.2.1
                    // FIXME: What to do here?
                    break;
                case session_1.SignalingState.Closed:
                    break;
                default:
                    throw new Error("Unexpected signaling state.");
            }
        }
        // We're in UAC role, receiving incoming response with session description
        if (message instanceof messages_1.IncomingResponseMessage) {
            switch (this._signalingState) {
                case session_1.SignalingState.Initial:
                case session_1.SignalingState.Stable:
                    this._signalingState = session_1.SignalingState.HaveRemoteOffer;
                    this._offer = body;
                    this._answer = undefined;
                    break;
                case session_1.SignalingState.HaveLocalOffer:
                    this._signalingState = session_1.SignalingState.Stable;
                    this._answer = body;
                    break;
                case session_1.SignalingState.HaveRemoteOffer:
                    // You cannot make a new offer while one is in progress.
                    // https://tools.ietf.org/html/rfc3261#section-13.2.1
                    // FIXME: What to do here?
                    break;
                case session_1.SignalingState.Closed:
                    break;
                default:
                    throw new Error("Unexpected signaling state.");
            }
        }
        // We're in UAC role, sending outgoing request with session description
        if (message instanceof messages_1.OutgoingRequestMessage) {
            switch (this._signalingState) {
                case session_1.SignalingState.Initial:
                case session_1.SignalingState.Stable:
                    this._signalingState = session_1.SignalingState.HaveLocalOffer;
                    this._offer = body;
                    this._answer = undefined;
                    break;
                case session_1.SignalingState.HaveLocalOffer:
                    // You cannot make a new offer while one is in progress.
                    // https://tools.ietf.org/html/rfc3261#section-13.2.1
                    // FIXME: What to do here?
                    break;
                case session_1.SignalingState.HaveRemoteOffer:
                    this._signalingState = session_1.SignalingState.Stable;
                    this._answer = body;
                    break;
                case session_1.SignalingState.Closed:
                    break;
                default:
                    throw new Error("Unexpected signaling state.");
            }
        }
        // We're in UAS role, sending outgoing response with session description
        if (messages_1.isBody(message)) {
            switch (this._signalingState) {
                case session_1.SignalingState.Initial:
                case session_1.SignalingState.Stable:
                    this._signalingState = session_1.SignalingState.HaveLocalOffer;
                    this._offer = body;
                    this._answer = undefined;
                    break;
                case session_1.SignalingState.HaveLocalOffer:
                    // You cannot make a new offer while one is in progress.
                    // https://tools.ietf.org/html/rfc3261#section-13.2.1
                    // FIXME: What to do here?
                    break;
                case session_1.SignalingState.HaveRemoteOffer:
                    this._signalingState = session_1.SignalingState.Stable;
                    this._answer = body;
                    break;
                case session_1.SignalingState.Closed:
                    break;
                default:
                    throw new Error("Unexpected signaling state.");
            }
        }
    };
    SessionDialog.prototype.start2xxRetransmissionTimer = function () {
        var _this = this;
        if (this.initialTransaction instanceof transactions_1.InviteServerTransaction) {
            var transaction_1 = this.initialTransaction;
            // Once the response has been constructed, it is passed to the INVITE
            // server transaction.  In order to ensure reliable end-to-end
            // transport of the response, it is necessary to periodically pass
            // the response directly to the transport until the ACK arrives.  The
            // 2xx response is passed to the transport with an interval that
            // starts at T1 seconds and doubles for each retransmission until it
            // reaches T2 seconds (T1 and T2 are defined in Section 17).
            // Response retransmissions cease when an ACK request for the
            // response is received.  This is independent of whatever transport
            // protocols are used to send the response.
            // https://tools.ietf.org/html/rfc6026#section-8.1
            var timeout_1 = timers_1.Timers.T1;
            var retransmission_1 = function () {
                if (!_this.ackWait) {
                    _this.invite2xxTimer = undefined;
                    return;
                }
                _this.logger.log("No ACK for 2xx response received, attempting retransmission");
                transaction_1.retransmitAcceptedResponse();
                timeout_1 = Math.min(timeout_1 * 2, timers_1.Timers.T2);
                _this.invite2xxTimer = setTimeout(retransmission_1, timeout_1);
            };
            this.invite2xxTimer = setTimeout(retransmission_1, timeout_1);
            // If the server retransmits the 2xx response for 64*T1 seconds without
            // receiving an ACK, the dialog is confirmed, but the session SHOULD be
            // terminated.  This is accomplished with a BYE, as described in Section 15.
            // https://tools.ietf.org/html/rfc3261#section-13.3.1.4
            var stateChanged_1 = function () {
                if (transaction_1.state === transactions_1.TransactionState.Terminated) {
                    transaction_1.removeListener("stateChanged", stateChanged_1);
                    if (_this.invite2xxTimer) {
                        clearTimeout(_this.invite2xxTimer);
                        _this.invite2xxTimer = undefined;
                    }
                    if (_this.ackWait) {
                        if (_this.delegate && _this.delegate.onAckTimeout) {
                            _this.delegate.onAckTimeout();
                        }
                        else {
                            _this.bye();
                        }
                    }
                }
            };
            transaction_1.addListener("stateChanged", stateChanged_1);
        }
    };
    // FIXME: Refactor
    SessionDialog.prototype.startReInvite2xxRetransmissionTimer = function () {
        var _this = this;
        if (this.reinviteUserAgentServer && this.reinviteUserAgentServer.transaction instanceof transactions_1.InviteServerTransaction) {
            var transaction_2 = this.reinviteUserAgentServer.transaction;
            // Once the response has been constructed, it is passed to the INVITE
            // server transaction.  In order to ensure reliable end-to-end
            // transport of the response, it is necessary to periodically pass
            // the response directly to the transport until the ACK arrives.  The
            // 2xx response is passed to the transport with an interval that
            // starts at T1 seconds and doubles for each retransmission until it
            // reaches T2 seconds (T1 and T2 are defined in Section 17).
            // Response retransmissions cease when an ACK request for the
            // response is received.  This is independent of whatever transport
            // protocols are used to send the response.
            // https://tools.ietf.org/html/rfc6026#section-8.1
            var timeout_2 = timers_1.Timers.T1;
            var retransmission_2 = function () {
                if (!_this.reinviteUserAgentServer) {
                    _this.invite2xxTimer = undefined;
                    return;
                }
                _this.logger.log("No ACK for 2xx response received, attempting retransmission");
                transaction_2.retransmitAcceptedResponse();
                timeout_2 = Math.min(timeout_2 * 2, timers_1.Timers.T2);
                _this.invite2xxTimer = setTimeout(retransmission_2, timeout_2);
            };
            this.invite2xxTimer = setTimeout(retransmission_2, timeout_2);
            // If the server retransmits the 2xx response for 64*T1 seconds without
            // receiving an ACK, the dialog is confirmed, but the session SHOULD be
            // terminated.  This is accomplished with a BYE, as described in Section 15.
            // https://tools.ietf.org/html/rfc3261#section-13.3.1.4
            var stateChanged_2 = function () {
                if (transaction_2.state === transactions_1.TransactionState.Terminated) {
                    transaction_2.removeListener("stateChanged", stateChanged_2);
                    if (_this.invite2xxTimer) {
                        clearTimeout(_this.invite2xxTimer);
                        _this.invite2xxTimer = undefined;
                    }
                    if (_this.reinviteUserAgentServer) {
                        // FIXME: TODO: What to do here
                    }
                }
            };
            transaction_2.addListener("stateChanged", stateChanged_2);
        }
    };
    return SessionDialog;
}(dialog_1.Dialog));
exports.SessionDialog = SessionDialog;


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
tslib_1.__exportStar(__webpack_require__(26), exports);


/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Session state.
 * @remarks
 * https://tools.ietf.org/html/rfc3261#section-13
 * @public
 */
var SessionState;
(function (SessionState) {
    SessionState["Initial"] = "Initial";
    SessionState["Early"] = "Early";
    SessionState["AckWait"] = "AckWait";
    SessionState["Confirmed"] = "Confirmed";
    SessionState["Terminated"] = "Terminated";
})(SessionState = exports.SessionState || (exports.SessionState = {}));
/**
 * Offer/Answer state.
 * @remarks
 * ```txt
 *         Offer                Answer             RFC    Ini Est Early
 *  -------------------------------------------------------------------
 *  1. INVITE Req.          2xx INVITE Resp.     RFC 3261  Y   Y    N
 *  2. 2xx INVITE Resp.     ACK Req.             RFC 3261  Y   Y    N
 *  3. INVITE Req.          1xx-rel INVITE Resp. RFC 3262  Y   Y    N
 *  4. 1xx-rel INVITE Resp. PRACK Req.           RFC 3262  Y   Y    N
 *  5. PRACK Req.           200 PRACK Resp.      RFC 3262  N   Y    Y
 *  6. UPDATE Req.          2xx UPDATE Resp.     RFC 3311  N   Y    Y
 *
 *       Table 1: Summary of SIP Usage of the Offer/Answer Model
 * ```
 * https://tools.ietf.org/html/rfc6337#section-2.2
 * @public
 */
var SignalingState;
(function (SignalingState) {
    SignalingState["Initial"] = "Initial";
    SignalingState["HaveLocalOffer"] = "HaveLocalOffer";
    SignalingState["HaveRemoteOffer"] = "HaveRemoteOffer";
    SignalingState["Stable"] = "Stable";
    SignalingState["Closed"] = "Closed";
})(SignalingState = exports.SignalingState || (exports.SignalingState = {}));


/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var T1 = 500;
var T2 = 4000;
var T4 = 5000;
/**
 * Timers.
 * @public
 */
exports.Timers = {
    T1: T1,
    T2: T2,
    T4: T4,
    TIMER_B: 64 * T1,
    TIMER_D: 0 * T1,
    TIMER_F: 64 * T1,
    TIMER_H: 64 * T1,
    TIMER_I: 0 * T4,
    TIMER_J: 0 * T1,
    TIMER_K: 0 * T4,
    TIMER_L: 64 * T1,
    TIMER_M: 64 * T1,
    TIMER_N: 64 * T1,
    PROVISIONAL_RESPONSE_INTERVAL: 60000 // See RFC 3261 Section 13.3.1.1
};


/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
tslib_1.__exportStar(__webpack_require__(29), exports);
tslib_1.__exportStar(__webpack_require__(36), exports);
tslib_1.__exportStar(__webpack_require__(38), exports);
tslib_1.__exportStar(__webpack_require__(40), exports);
tslib_1.__exportStar(__webpack_require__(41), exports);
tslib_1.__exportStar(__webpack_require__(36), exports);
tslib_1.__exportStar(__webpack_require__(39), exports);
tslib_1.__exportStar(__webpack_require__(37), exports);
tslib_1.__exportStar(__webpack_require__(30), exports);


/***/ }),
/* 29 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var transaction_1 = __webpack_require__(30);
/**
 * Client Transaction.
 * @remarks
 * The client transaction provides its functionality through the
 * maintenance of a state machine.
 *
 * The TU communicates with the client transaction through a simple
 * interface.  When the TU wishes to initiate a new transaction, it
 * creates a client transaction and passes it the SIP request to send
 * and an IP address, port, and transport to which to send it.  The
 * client transaction begins execution of its state machine.  Valid
 * responses are passed up to the TU from the client transaction.
 * https://tools.ietf.org/html/rfc3261#section-17.1
 * @public
 */
var ClientTransaction = /** @class */ (function (_super) {
    tslib_1.__extends(ClientTransaction, _super);
    function ClientTransaction(_request, transport, user, state, loggerCategory) {
        var _this = _super.call(this, transport, user, ClientTransaction.makeId(_request), state, loggerCategory) || this;
        _this._request = _request;
        _this.user = user;
        // The Via header field indicates the transport used for the transaction
        // and identifies the location where the response is to be sent.  A Via
        // header field value is added only after the transport that will be
        // used to reach the next hop has been selected (which may involve the
        // usage of the procedures in [4]).
        // https://tools.ietf.org/html/rfc3261#section-8.1.1.7
        _request.setViaHeader(_this.id, transport.protocol);
        return _this;
    }
    ClientTransaction.makeId = function (request) {
        if (request.method === "CANCEL") {
            if (!request.branch) {
                throw new Error("Outgoing CANCEL request without a branch.");
            }
            return request.branch;
        }
        else {
            return "z9hG4bK" + Math.floor(Math.random() * 10000000);
        }
    };
    Object.defineProperty(ClientTransaction.prototype, "request", {
        /** The outgoing request the transaction handling. */
        get: function () {
            return this._request;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * A 408 to non-INVITE will always arrive too late to be useful ([3]),
     * The client already has full knowledge of the timeout. The only
     * information this message would convey is whether or not the server
     * believed the transaction timed out. However, with the current design
     * of the NIT, a client cannot do anything with this knowledge. Thus,
     * the 408 is simply wasting network resources and contributes to the
     * response bombardment illustrated in [3].
     * https://tools.ietf.org/html/rfc4320#section-4.1
     */
    ClientTransaction.prototype.onRequestTimeout = function () {
        if (this.user.onRequestTimeout) {
            this.user.onRequestTimeout();
        }
    };
    return ClientTransaction;
}(transaction_1.Transaction));
exports.ClientTransaction = ClientTransaction;


/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var events_1 = __webpack_require__(31);
var exceptions_1 = __webpack_require__(32);
/**
 * Transaction.
 * @remarks
 * SIP is a transactional protocol: interactions between components take
 * place in a series of independent message exchanges.  Specifically, a
 * SIP transaction consists of a single request and any responses to
 * that request, which include zero or more provisional responses and
 * one or more final responses.  In the case of a transaction where the
 * request was an INVITE (known as an INVITE transaction), the
 * transaction also includes the ACK only if the final response was not
 * a 2xx response.  If the response was a 2xx, the ACK is not considered
 * part of the transaction.
 * https://tools.ietf.org/html/rfc3261#section-17
 * @public
 */
var Transaction = /** @class */ (function (_super) {
    tslib_1.__extends(Transaction, _super);
    function Transaction(_transport, _user, _id, _state, loggerCategory) {
        var _this = _super.call(this) || this;
        _this._transport = _transport;
        _this._user = _user;
        _this._id = _id;
        _this._state = _state;
        _this.logger = _user.loggerFactory.getLogger(loggerCategory, _id);
        _this.logger.debug("Constructing " + _this.typeToString() + " with id " + _this.id + ".");
        return _this;
    }
    /**
     * Destructor.
     * Once the transaction is in the "terminated" state, it is destroyed
     * immediately and there is no need to call `dispose`. However, if a
     * transaction needs to be ended prematurely, the transaction user may
     * do so by calling this method (for example, perhaps the UA is shutting down).
     * No state transition will occur upon calling this method, all outstanding
     * transmission timers will be cancelled, and use of the transaction after
     * calling `dispose` is undefined.
     */
    Transaction.prototype.dispose = function () {
        this.logger.debug("Destroyed " + this.typeToString() + " with id " + this.id + ".");
    };
    Object.defineProperty(Transaction.prototype, "id", {
        /** Transaction id. */
        get: function () {
            return this._id;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Transaction.prototype, "kind", {
        /** Transaction kind. Deprecated. */
        get: function () {
            throw new Error("Invalid kind.");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Transaction.prototype, "state", {
        /** Transaction state. */
        get: function () {
            return this._state;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Transaction.prototype, "transport", {
        /** Transaction transport. */
        get: function () {
            return this._transport;
        },
        enumerable: true,
        configurable: true
    });
    Transaction.prototype.on = function (name, callback) { return _super.prototype.on.call(this, name, callback); };
    Transaction.prototype.logTransportError = function (error, message) {
        this.logger.error(error.message);
        this.logger.error("Transport error occurred in " + this.typeToString() + " with id " + this.id + ".");
        this.logger.error(message);
    };
    /**
     * Pass message to transport for transmission. If transport fails,
     * the transaction user is notified by callback to onTransportError().
     * @returns
     * Rejects with `TransportError` if transport fails.
     */
    Transaction.prototype.send = function (message) {
        var _this = this;
        return this.transport.send(message).catch(function (error) {
            // If the transport rejects, it SHOULD reject with a TransportError.
            // But the transport may be external code, so we are careful
            // make sure we convert it to a TransportError if need be.
            if (error instanceof exceptions_1.TransportError) {
                _this.onTransportError(error);
                throw error;
            }
            var transportError;
            if (error && typeof error.message === "string") {
                transportError = new exceptions_1.TransportError(error.message);
            }
            else {
                transportError = new exceptions_1.TransportError();
            }
            _this.onTransportError(transportError);
            throw transportError;
        });
    };
    Transaction.prototype.setState = function (state) {
        this.logger.debug("State change to \"" + state + "\" on " + this.typeToString() + " with id " + this.id + ".");
        this._state = state;
        if (this._user.onStateChange) {
            this._user.onStateChange(state);
        }
        this.emit("stateChanged");
    };
    Transaction.prototype.typeToString = function () {
        return "UnknownType";
    };
    return Transaction;
}(events_1.EventEmitter));
exports.Transaction = Transaction;


/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.



var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
    return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target)
      .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
    return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
    throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
    return defaultMaxListeners;
  },
  set: function(arg) {
    if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
      throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
    }
    defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
      this._events === Object.getPrototypeOf(this)._events) {
    this._events = Object.create(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
    throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
    doError = (doError && events.error === undefined);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    var er;
    if (args.length > 0)
      er = args[0];
    if (er instanceof Error) {
      // Note: The comments on the `throw` lines are intentional, they show
      // up in Node's output if this results in an unhandled exception.
      throw er; // Unhandled 'error' event
    }
    // At least give some kind of context to the user
    var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
    err.context = er;
    throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
    return false;

  if (typeof handler === 'function') {
    ReflectApply(handler, this, args);
  } else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
    events = target._events = Object.create(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener !== undefined) {
      target.emit('newListener', type,
                  listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (existing === undefined) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
        prepend ? [listener, existing] : [existing, listener];
      // If we've already got an array, just append.
    } else if (prepend) {
      existing.unshift(listener);
    } else {
      existing.push(listener);
    }

    // Check for listener leak
    m = _getMaxListeners(target);
    if (m > 0 && existing.length > m && !existing.warned) {
      existing.warned = true;
      // No error code for this since it is a Warning
      // eslint-disable-next-line no-restricted-syntax
      var w = new Error('Possible EventEmitter memory leak detected. ' +
                          existing.length + ' ' + String(type) + ' listeners ' +
                          'added. Use emitter.setMaxListeners() to ' +
                          'increase limit');
      w.name = 'MaxListenersExceededWarning';
      w.emitter = target;
      w.type = type;
      w.count = existing.length;
      ProcessEmitWarning(w);
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    if (arguments.length === 0)
      return this.listener.call(this.target);
    return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      checkListener(listener);
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      checkListener(listener);

      events = this._events;
      if (events === undefined)
        return this;

      list = events[type];
      if (list === undefined)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = Object.create(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else {
          spliceOne(list, position);
        }

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener !== undefined)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (events === undefined)
        return this;

      // not listening for removeListener, no need to emit
      if (events.removeListener === undefined) {
        if (arguments.length === 0) {
          this._events = Object.create(null);
          this._eventsCount = 0;
        } else if (events[type] !== undefined) {
          if (--this._eventsCount === 0)
            this._events = Object.create(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = Object.keys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = Object.create(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners !== undefined) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
    return [];

  var evlistener = events[type];
  if (evlistener === undefined)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
    unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener !== undefined) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
    list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}


/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
tslib_1.__exportStar(__webpack_require__(33), exports);
tslib_1.__exportStar(__webpack_require__(34), exports);
tslib_1.__exportStar(__webpack_require__(35), exports);


/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
/**
 * An Exception is considered a condition that a reasonable application may wish to catch.
 * An Error indicates serious problems that a reasonable application should not try to catch.
 * @public
 */
var Exception = /** @class */ (function (_super) {
    tslib_1.__extends(Exception, _super);
    function Exception(message) {
        var _newTarget = this.constructor;
        var _this = _super.call(this, message) || this;
        Object.setPrototypeOf(_this, _newTarget.prototype); // restore prototype chain
        return _this;
    }
    return Exception;
}(Error));
exports.Exception = Exception;


/***/ }),
/* 34 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var exception_1 = __webpack_require__(33);
/**
 * Indicates that the operation could not be completed given the current transaction state.
 * @public
 */
var TransactionStateError = /** @class */ (function (_super) {
    tslib_1.__extends(TransactionStateError, _super);
    function TransactionStateError(message) {
        return _super.call(this, message ? message : "Transaction state error.") || this;
    }
    return TransactionStateError;
}(exception_1.Exception));
exports.TransactionStateError = TransactionStateError;


/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var exception_1 = __webpack_require__(33);
/**
 * Transport error.
 * @public
 */
var TransportError = /** @class */ (function (_super) {
    tslib_1.__extends(TransportError, _super);
    function TransportError(message) {
        return _super.call(this, message ? message : "Unspecified transport error.") || this;
    }
    return TransportError;
}(exception_1.Exception));
exports.TransportError = TransportError;


/***/ }),
/* 36 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var timers_1 = __webpack_require__(27);
var client_transaction_1 = __webpack_require__(29);
var transaction_state_1 = __webpack_require__(37);
/**
 * INVITE Client Transaction.
 * @remarks
 * The INVITE transaction consists of a three-way handshake.  The client
 * transaction sends an INVITE, the server transaction sends responses,
 * and the client transaction sends an ACK.
 * https://tools.ietf.org/html/rfc3261#section-17.1.1
 * @public
 */
var InviteClientTransaction = /** @class */ (function (_super) {
    tslib_1.__extends(InviteClientTransaction, _super);
    /**
     * Constructor.
     * Upon construction, the outgoing request's Via header is updated by calling `setViaHeader`.
     * Then `toString` is called on the outgoing request and the message is sent via the transport.
     * After construction the transaction will be in the "calling" state and the transaction id
     * will equal the branch parameter set in the Via header of the outgoing request.
     * https://tools.ietf.org/html/rfc3261#section-17.1.1
     * @param request - The outgoing INVITE request.
     * @param transport - The transport.
     * @param user - The transaction user.
     */
    function InviteClientTransaction(request, transport, user) {
        var _this = _super.call(this, request, transport, user, transaction_state_1.TransactionState.Calling, "sip.transaction.ict") || this;
        /**
         * Map of 2xx to-tag to ACK.
         * If value is not undefined, value is the ACK which was sent.
         * If key exists but value is undefined, a 2xx was received but the ACK not yet sent.
         * Otherwise, a 2xx was not (yet) received for this transaction.
         */
        _this.ackRetransmissionCache = new Map();
        // FIXME: Timer A for unreliable transport not implemented
        //
        // If an unreliable transport is being used, the client transaction
        // MUST start timer A with a value of T1. If a reliable transport is being used,
        // the client transaction SHOULD NOT start timer A (Timer A controls request retransmissions).
        // For any transport, the client transaction MUST start timer B with a value
        // of 64*T1 seconds (Timer B controls transaction timeouts).
        // https://tools.ietf.org/html/rfc3261#section-17.1.1.2
        //
        // While not spelled out in the RFC, Timer B is the maximum amount of time that a sender
        // will wait for an INVITE message to be acknowledged (a SIP response message is received).
        // So Timer B should be cleared when the transaction state proceeds from "Calling".
        _this.B = setTimeout(function () { return _this.timer_B(); }, timers_1.Timers.TIMER_B);
        _this.send(request.toString()).catch(function (error) {
            _this.logTransportError(error, "Failed to send initial outgoing request.");
        });
        return _this;
    }
    /**
     * Destructor.
     */
    InviteClientTransaction.prototype.dispose = function () {
        if (this.B) {
            clearTimeout(this.B);
            this.B = undefined;
        }
        if (this.D) {
            clearTimeout(this.D);
            this.D = undefined;
        }
        if (this.M) {
            clearTimeout(this.M);
            this.M = undefined;
        }
        _super.prototype.dispose.call(this);
    };
    Object.defineProperty(InviteClientTransaction.prototype, "kind", {
        /** Transaction kind. Deprecated. */
        get: function () {
            return "ict";
        },
        enumerable: true,
        configurable: true
    });
    /**
     * ACK a 2xx final response.
     *
     * The transaction includes the ACK only if the final response was not a 2xx response (the
     * transaction will generate and send the ACK to the transport automagically). If the
     * final response was a 2xx, the ACK is not considered part of the transaction (the
     * transaction user needs to generate and send the ACK).
     *
     * This library is not strictly RFC compliant with regard to ACK handling for 2xx final
     * responses. Specifically, retransmissions of ACKs to a 2xx final responses is handled
     * by the transaction layer (instead of the UAC core). The "standard" approach is for
     * the UAC core to receive all 2xx responses and manage sending ACK retransmissions to
     * the transport directly. Herein the transaction layer manages sending ACKs to 2xx responses
     * and any retransmissions of those ACKs as needed.
     *
     * @param ack - The outgoing ACK request.
     */
    InviteClientTransaction.prototype.ackResponse = function (ack) {
        var _this = this;
        var toTag = ack.toTag;
        if (!toTag) {
            throw new Error("To tag undefined.");
        }
        var id = "z9hG4bK" + Math.floor(Math.random() * 10000000);
        ack.setViaHeader(id, this.transport.protocol);
        this.ackRetransmissionCache.set(toTag, ack); // Add to ACK retransmission cache
        this.send(ack.toString()).catch(function (error) {
            _this.logTransportError(error, "Failed to send ACK to 2xx response.");
        });
    };
    /**
     * Handler for incoming responses from the transport which match this transaction.
     * @param response - The incoming response.
     */
    InviteClientTransaction.prototype.receiveResponse = function (response) {
        var _this = this;
        var statusCode = response.statusCode;
        if (!statusCode || statusCode < 100 || statusCode > 699) {
            throw new Error("Invalid status code " + statusCode);
        }
        switch (this.state) {
            case transaction_state_1.TransactionState.Calling:
                // If the client transaction receives a provisional response while in
                // the "Calling" state, it transitions to the "Proceeding" state. In the
                // "Proceeding" state, the client transaction SHOULD NOT retransmit the
                // request any longer. Furthermore, the provisional response MUST be
                // passed to the TU.  Any further provisional responses MUST be passed
                // up to the TU while in the "Proceeding" state.
                // https://tools.ietf.org/html/rfc3261#section-17.1.1.2
                if (statusCode >= 100 && statusCode <= 199) {
                    this.stateTransition(transaction_state_1.TransactionState.Proceeding);
                    if (this.user.receiveResponse) {
                        this.user.receiveResponse(response);
                    }
                    return;
                }
                // When a 2xx response is received while in either the "Calling" or
                // "Proceeding" states, the client transaction MUST transition to
                // the "Accepted" state... The 2xx response MUST be passed up to the TU.
                // The client transaction MUST NOT generate an ACK to the 2xx response -- its
                // handling is delegated to the TU. A UAC core will send an ACK to
                // the 2xx response using a new transaction.
                // https://tools.ietf.org/html/rfc6026#section-8.4
                if (statusCode >= 200 && statusCode <= 299) {
                    this.ackRetransmissionCache.set(response.toTag, undefined); // Prime the ACK cache
                    this.stateTransition(transaction_state_1.TransactionState.Accepted);
                    if (this.user.receiveResponse) {
                        this.user.receiveResponse(response);
                    }
                    return;
                }
                // When in either the "Calling" or "Proceeding" states, reception of
                // a response with status code from 300-699 MUST cause the client
                // transaction to transition to "Completed". The client transaction
                // MUST pass the received response up to the TU, and the client
                // transaction MUST generate an ACK request, even if the transport is
                // reliable (guidelines for constructing the ACK from the response
                // are given in Section 17.1.1.3), and then pass the ACK to the
                // transport layer for transmission. The ACK MUST be sent to the
                // same address, port, and transport to which the original request was sent.
                // https://tools.ietf.org/html/rfc6026#section-8.4
                if (statusCode >= 300 && statusCode <= 699) {
                    this.stateTransition(transaction_state_1.TransactionState.Completed);
                    this.ack(response);
                    if (this.user.receiveResponse) {
                        this.user.receiveResponse(response);
                    }
                    return;
                }
                break;
            case transaction_state_1.TransactionState.Proceeding:
                // In the "Proceeding" state, the client transaction SHOULD NOT retransmit the
                // request any longer. Furthermore, the provisional response MUST be
                // passed to the TU.  Any further provisional responses MUST be passed
                // up to the TU while in the "Proceeding" state.
                // https://tools.ietf.org/html/rfc3261#section-17.1.1.2
                if (statusCode >= 100 && statusCode <= 199) {
                    if (this.user.receiveResponse) {
                        this.user.receiveResponse(response);
                    }
                    return;
                }
                // When a 2xx response is received while in either the "Calling" or "Proceeding" states,
                // the client transaction MUST transition to the "Accepted" state...
                // The 2xx response MUST be passed up to the TU. The client
                // transaction MUST NOT generate an ACK to the 2xx response -- its
                // handling is delegated to the TU. A UAC core will send an ACK to
                // the 2xx response using a new transaction.
                // https://tools.ietf.org/html/rfc6026#section-8.4
                if (statusCode >= 200 && statusCode <= 299) {
                    this.ackRetransmissionCache.set(response.toTag, undefined); // Prime the ACK cache
                    this.stateTransition(transaction_state_1.TransactionState.Accepted);
                    if (this.user.receiveResponse) {
                        this.user.receiveResponse(response);
                    }
                    return;
                }
                // When in either the "Calling" or "Proceeding" states, reception of
                // a response with status code from 300-699 MUST cause the client
                // transaction to transition to "Completed". The client transaction
                // MUST pass the received response up to the TU, and the client
                // transaction MUST generate an ACK request, even if the transport is
                // reliable (guidelines for constructing the ACK from the response
                // are given in Section 17.1.1.3), and then pass the ACK to the
                // transport layer for transmission. The ACK MUST be sent to the
                // same address, port, and transport to which the original request was sent.
                // https://tools.ietf.org/html/rfc6026#section-8.4
                if (statusCode >= 300 && statusCode <= 699) {
                    this.stateTransition(transaction_state_1.TransactionState.Completed);
                    this.ack(response);
                    if (this.user.receiveResponse) {
                        this.user.receiveResponse(response);
                    }
                    return;
                }
                break;
            case transaction_state_1.TransactionState.Accepted:
                // The purpose of the "Accepted" state is to allow the client
                // transaction to continue to exist to receive, and pass to the TU,
                // any retransmissions of the 2xx response and any additional 2xx
                // responses from other branches of the INVITE if it forked
                // downstream. Timer M reflects the amount of time that the
                // transaction user will wait for such messages.
                //
                // Any 2xx responses that match this client transaction and that are
                // received while in the "Accepted" state MUST be passed up to the
                // TU. The client transaction MUST NOT generate an ACK to the 2xx
                // response. The client transaction takes no further action.
                // https://tools.ietf.org/html/rfc6026#section-8.4
                if (statusCode >= 200 && statusCode <= 299) {
                    // NOTE: This implementation herein is intentionally not RFC compliant.
                    // While the first 2xx response for a given branch is passed up to the TU,
                    // retransmissions of 2xx responses are absorbed and the ACK associated
                    // with the original response is resent. This approach is taken because
                    // our current transaction users are not currently in a good position to
                    // deal with 2xx retransmission. This SHOULD NOT cause any compliance issues - ;)
                    //
                    // If we don't have a cache hit, pass the response to the TU.
                    if (!this.ackRetransmissionCache.has(response.toTag)) {
                        this.ackRetransmissionCache.set(response.toTag, undefined); // Prime the ACK cache
                        if (this.user.receiveResponse) {
                            this.user.receiveResponse(response);
                        }
                        return;
                    }
                    // If we have a cache hit, try pulling the ACK from cache and retransmitting it.
                    var ack = this.ackRetransmissionCache.get(response.toTag);
                    if (ack) {
                        this.send(ack.toString()).catch(function (error) {
                            _this.logTransportError(error, "Failed to send retransmission of ACK to 2xx response.");
                        });
                        return;
                    }
                    // If an ACK was not found in cache then we have received a retransmitted 2xx
                    // response before the TU responded to the original response (we don't have an ACK yet).
                    // So discard this response under the assumption that the TU will eventually
                    // get us a ACK for the original response.
                    return;
                }
                break;
            case transaction_state_1.TransactionState.Completed:
                // Any retransmissions of a response with status code 300-699 that
                // are received while in the "Completed" state MUST cause the ACK to
                // be re-passed to the transport layer for retransmission, but the
                // newly received response MUST NOT be passed up to the TU.
                // https://tools.ietf.org/html/rfc6026#section-8.4
                if (statusCode >= 300 && statusCode <= 699) {
                    this.ack(response);
                    return;
                }
                break;
            case transaction_state_1.TransactionState.Terminated:
                break;
            default:
                throw new Error("Invalid state " + this.state);
        }
        // Any response received that does not match an existing client
        // transaction state machine is simply dropped. (Implementations are,
        // of course, free to log or do other implementation-specific things
        // with such responses, but the implementer should be sure to consider
        // the impact of large numbers of malicious stray responses.)
        // https://tools.ietf.org/html/rfc6026#section-7.2
        var message = "Received unexpected " + statusCode + " response while in state " + this.state + ".";
        this.logger.warn(message);
        return;
    };
    /**
     * The client transaction SHOULD inform the TU that a transport failure
     * has occurred, and the client transaction SHOULD transition directly
     * to the "Terminated" state.  The TU will handle the failover
     * mechanisms described in [4].
     * https://tools.ietf.org/html/rfc3261#section-17.1.4
     * @param error - The error.
     */
    InviteClientTransaction.prototype.onTransportError = function (error) {
        if (this.user.onTransportError) {
            this.user.onTransportError(error);
        }
        this.stateTransition(transaction_state_1.TransactionState.Terminated, true);
    };
    /** For logging. */
    InviteClientTransaction.prototype.typeToString = function () {
        return "INVITE client transaction";
    };
    InviteClientTransaction.prototype.ack = function (response) {
        var _this = this;
        // The ACK request constructed by the client transaction MUST contain
        // values for the Call-ID, From, and Request-URI that are equal to the
        // values of those header fields in the request passed to the transport
        // by the client transaction (call this the "original request"). The To
        // header field in the ACK MUST equal the To header field in the
        // response being acknowledged, and therefore will usually differ from
        // the To header field in the original request by the addition of the
        // tag parameter. The ACK MUST contain a single Via header field, and
        // this MUST be equal to the top Via header field of the original
        // request. The CSeq header field in the ACK MUST contain the same
        // value for the sequence number as was present in the original request,
        // but the method parameter MUST be equal to "ACK".
        //
        // If the INVITE request whose response is being acknowledged had Route
        // header fields, those header fields MUST appear in the ACK. This is
        // to ensure that the ACK can be routed properly through any downstream
        // stateless proxies.
        // https://tools.ietf.org/html/rfc3261#section-17.1.1.3
        var ruri = this.request.ruri;
        var callId = this.request.callId;
        var cseq = this.request.cseq;
        var from = this.request.getHeader("from");
        var to = response.getHeader("to");
        var via = this.request.getHeader("via");
        var route = this.request.getHeader("route");
        if (!from) {
            throw new Error("From undefined.");
        }
        if (!to) {
            throw new Error("To undefined.");
        }
        if (!via) {
            throw new Error("Via undefined.");
        }
        var ack = "ACK " + ruri + " SIP/2.0\r\n";
        if (route) {
            ack += "Route: " + route + "\r\n";
        }
        ack += "Via: " + via + "\r\n";
        ack += "To: " + to + "\r\n";
        ack += "From: " + from + "\r\n";
        ack += "Call-ID: " + callId + "\r\n";
        ack += "CSeq: " + cseq + " ACK\r\n";
        ack += "Max-Forwards: 70\r\n";
        ack += "Content-Length: 0\r\n\r\n";
        // TOOO: "User-Agent" header
        this.send(ack).catch(function (error) {
            _this.logTransportError(error, "Failed to send ACK to non-2xx response.");
        });
        return;
    };
    /**
     * Execute a state transition.
     * @param newState - New state.
     */
    InviteClientTransaction.prototype.stateTransition = function (newState, dueToTransportError) {
        var _this = this;
        if (dueToTransportError === void 0) { dueToTransportError = false; }
        // Assert valid state transitions.
        var invalidStateTransition = function () {
            throw new Error("Invalid state transition from " + _this.state + " to " + newState);
        };
        switch (newState) {
            case transaction_state_1.TransactionState.Calling:
                invalidStateTransition();
                break;
            case transaction_state_1.TransactionState.Proceeding:
                if (this.state !== transaction_state_1.TransactionState.Calling) {
                    invalidStateTransition();
                }
                break;
            case transaction_state_1.TransactionState.Accepted:
            case transaction_state_1.TransactionState.Completed:
                if (this.state !== transaction_state_1.TransactionState.Calling &&
                    this.state !== transaction_state_1.TransactionState.Proceeding) {
                    invalidStateTransition();
                }
                break;
            case transaction_state_1.TransactionState.Terminated:
                if (this.state !== transaction_state_1.TransactionState.Calling &&
                    this.state !== transaction_state_1.TransactionState.Accepted &&
                    this.state !== transaction_state_1.TransactionState.Completed) {
                    if (!dueToTransportError) {
                        invalidStateTransition();
                    }
                }
                break;
            default:
                invalidStateTransition();
        }
        // While not spelled out in the RFC, Timer B is the maximum amount of time that a sender
        // will wait for an INVITE message to be acknowledged (a SIP response message is received).
        // So Timer B should be cleared when the transaction state proceeds from "Calling".
        if (this.B) {
            clearTimeout(this.B);
            this.B = undefined;
        }
        if (newState === transaction_state_1.TransactionState.Proceeding) {
            // Timers have no effect on "Proceeding" state.
            // In the "Proceeding" state, the client transaction
            // SHOULD NOT retransmit the request any longer.
            // https://tools.ietf.org/html/rfc3261#section-17.1.1.2
        }
        // The client transaction MUST start Timer D when it enters the "Completed" state
        // for any reason, with a value of at least 32 seconds for unreliable transports,
        // and a value of zero seconds for reliable transports.
        // https://tools.ietf.org/html/rfc6026#section-8.4
        if (newState === transaction_state_1.TransactionState.Completed) {
            this.D = setTimeout(function () { return _this.timer_D(); }, timers_1.Timers.TIMER_D);
        }
        // The client transaction MUST transition to the "Accepted" state,
        // and Timer M MUST be started with a value of 64*T1.
        // https://tools.ietf.org/html/rfc6026#section-8.4
        if (newState === transaction_state_1.TransactionState.Accepted) {
            this.M = setTimeout(function () { return _this.timer_M(); }, timers_1.Timers.TIMER_M);
        }
        // Once the transaction is in the "Terminated" state, it MUST be destroyed immediately.
        // https://tools.ietf.org/html/rfc6026#section-8.7
        if (newState === transaction_state_1.TransactionState.Terminated) {
            this.dispose();
        }
        // Update state.
        this.setState(newState);
    };
    /**
     * When timer A fires, the client transaction MUST retransmit the
     * request by passing it to the transport layer, and MUST reset the
     * timer with a value of 2*T1.
     * When timer A fires 2*T1 seconds later, the request MUST be
     * retransmitted again (assuming the client transaction is still in this
     * state). This process MUST continue so that the request is
     * retransmitted with intervals that double after each transmission.
     * These retransmissions SHOULD only be done while the client
     * transaction is in the "Calling" state.
     * https://tools.ietf.org/html/rfc3261#section-17.1.1.2
     */
    InviteClientTransaction.prototype.timer_A = function () {
        // TODO
    };
    /**
     * If the client transaction is still in the "Calling" state when timer
     * B fires, the client transaction SHOULD inform the TU that a timeout
     * has occurred.  The client transaction MUST NOT generate an ACK.
     * https://tools.ietf.org/html/rfc3261#section-17.1.1.2
     */
    InviteClientTransaction.prototype.timer_B = function () {
        this.logger.debug("Timer B expired for INVITE client transaction " + this.id + ".");
        if (this.state === transaction_state_1.TransactionState.Calling) {
            this.onRequestTimeout();
            this.stateTransition(transaction_state_1.TransactionState.Terminated);
        }
    };
    /**
     * If Timer D fires while the client transaction is in the "Completed" state,
     * the client transaction MUST move to the "Terminated" state.
     * https://tools.ietf.org/html/rfc6026#section-8.4
     */
    InviteClientTransaction.prototype.timer_D = function () {
        this.logger.debug("Timer D expired for INVITE client transaction " + this.id + ".");
        if (this.state === transaction_state_1.TransactionState.Completed) {
            this.stateTransition(transaction_state_1.TransactionState.Terminated);
        }
    };
    /**
     * If Timer M fires while the client transaction is in the "Accepted"
     * state, the client transaction MUST move to the "Terminated" state.
     * https://tools.ietf.org/html/rfc6026#section-8.4
     */
    InviteClientTransaction.prototype.timer_M = function () {
        this.logger.debug("Timer M expired for INVITE client transaction " + this.id + ".");
        if (this.state === transaction_state_1.TransactionState.Accepted) {
            this.stateTransition(transaction_state_1.TransactionState.Terminated);
        }
    };
    return InviteClientTransaction;
}(client_transaction_1.ClientTransaction));
exports.InviteClientTransaction = InviteClientTransaction;


/***/ }),
/* 37 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Transaction state.
 * @public
 */
var TransactionState;
(function (TransactionState) {
    TransactionState["Accepted"] = "Accepted";
    TransactionState["Calling"] = "Calling";
    TransactionState["Completed"] = "Completed";
    TransactionState["Confirmed"] = "Confirmed";
    TransactionState["Proceeding"] = "Proceeding";
    TransactionState["Terminated"] = "Terminated";
    TransactionState["Trying"] = "Trying";
})(TransactionState = exports.TransactionState || (exports.TransactionState = {}));


/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var messages_1 = __webpack_require__(5);
var timers_1 = __webpack_require__(27);
var server_transaction_1 = __webpack_require__(39);
var transaction_state_1 = __webpack_require__(37);
/**
 * INVITE Server Transaction.
 * @remarks
 * https://tools.ietf.org/html/rfc3261#section-17.2.1
 * @public
 */
var InviteServerTransaction = /** @class */ (function (_super) {
    tslib_1.__extends(InviteServerTransaction, _super);
    /**
     * Constructor.
     * Upon construction, a "100 Trying" reply will be immediately sent.
     * After construction the transaction will be in the "proceeding" state and the transaction
     * `id` will equal the branch parameter set in the Via header of the incoming request.
     * https://tools.ietf.org/html/rfc3261#section-17.2.1
     * @param request - Incoming INVITE request from the transport.
     * @param transport - The transport.
     * @param user - The transaction user.
     */
    function InviteServerTransaction(request, transport, user) {
        return _super.call(this, request, transport, user, transaction_state_1.TransactionState.Proceeding, "sip.transaction.ist") || this;
    }
    /**
     * Destructor.
     */
    InviteServerTransaction.prototype.dispose = function () {
        this.stopProgressExtensionTimer();
        if (this.H) {
            clearTimeout(this.H);
            this.H = undefined;
        }
        if (this.I) {
            clearTimeout(this.I);
            this.I = undefined;
        }
        if (this.L) {
            clearTimeout(this.L);
            this.L = undefined;
        }
        _super.prototype.dispose.call(this);
    };
    Object.defineProperty(InviteServerTransaction.prototype, "kind", {
        /** Transaction kind. Deprecated. */
        get: function () {
            return "ist";
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Receive requests from transport matching this transaction.
     * @param request - Request matching this transaction.
     */
    InviteServerTransaction.prototype.receiveRequest = function (request) {
        var _this = this;
        switch (this.state) {
            case transaction_state_1.TransactionState.Proceeding:
                // If a request retransmission is received while in the "Proceeding" state, the most
                // recent provisional response that was received from the TU MUST be passed to the
                // transport layer for retransmission.
                // https://tools.ietf.org/html/rfc3261#section-17.2.1
                if (request.method === messages_1.C.INVITE) {
                    if (this.lastProvisionalResponse) {
                        this.send(this.lastProvisionalResponse).catch(function (error) {
                            _this.logTransportError(error, "Failed to send retransmission of provisional response.");
                        });
                    }
                    return;
                }
                break;
            case transaction_state_1.TransactionState.Accepted:
                // While in the "Accepted" state, any retransmissions of the INVITE
                // received will match this transaction state machine and will be
                // absorbed by the machine without changing its state. These
                // retransmissions are not passed onto the TU.
                // https://tools.ietf.org/html/rfc6026#section-7.1
                if (request.method === messages_1.C.INVITE) {
                    return;
                }
                break;
            case transaction_state_1.TransactionState.Completed:
                // Furthermore, while in the "Completed" state, if a request retransmission is
                // received, the server SHOULD pass the response to the transport for retransmission.
                // https://tools.ietf.org/html/rfc3261#section-17.2.1
                if (request.method === messages_1.C.INVITE) {
                    if (!this.lastFinalResponse) {
                        throw new Error("Last final response undefined.");
                    }
                    this.send(this.lastFinalResponse).catch(function (error) {
                        _this.logTransportError(error, "Failed to send retransmission of final response.");
                    });
                    return;
                }
                // If an ACK is received while the server transaction is in the "Completed" state,
                // the server transaction MUST transition to the "Confirmed" state.
                // https://tools.ietf.org/html/rfc3261#section-17.2.1
                if (request.method === messages_1.C.ACK) {
                    this.stateTransition(transaction_state_1.TransactionState.Confirmed);
                    return;
                }
                break;
            case transaction_state_1.TransactionState.Confirmed:
                // The purpose of the "Confirmed" state is to absorb any additional ACK messages that arrive,
                // triggered from retransmissions of the final response.
                // https://tools.ietf.org/html/rfc3261#section-17.2.1
                if (request.method === messages_1.C.INVITE || request.method === messages_1.C.ACK) {
                    return;
                }
                break;
            case transaction_state_1.TransactionState.Terminated:
                // For good measure absorb any additional messages that arrive (should not happen).
                if (request.method === messages_1.C.INVITE || request.method === messages_1.C.ACK) {
                    return;
                }
                break;
            default:
                throw new Error("Invalid state " + this.state);
        }
        var message = "INVITE server transaction received unexpected " + request.method + " request while in state " + this.state + ".";
        this.logger.warn(message);
        return;
    };
    /**
     * Receive responses from TU for this transaction.
     * @param statusCode - Status code of response.
     * @param response - Response.
     */
    InviteServerTransaction.prototype.receiveResponse = function (statusCode, response) {
        var _this = this;
        if (statusCode < 100 || statusCode > 699) {
            throw new Error("Invalid status code " + statusCode);
        }
        switch (this.state) {
            case transaction_state_1.TransactionState.Proceeding:
                // The TU passes any number of provisional responses to the server
                // transaction. So long as the server transaction is in the
                // "Proceeding" state, each of these MUST be passed to the transport
                // layer for transmission. They are not sent reliably by the
                // transaction layer (they are not retransmitted by it) and do not cause
                // a change in the state of the server transaction.
                // https://tools.ietf.org/html/rfc3261#section-17.2.1
                if (statusCode >= 100 && statusCode <= 199) {
                    this.lastProvisionalResponse = response;
                    // Start the progress extension timer only for a non-100 provisional response.
                    if (statusCode > 100) {
                        this.startProgressExtensionTimer(); // FIXME: remove
                    }
                    this.send(response).catch(function (error) {
                        _this.logTransportError(error, "Failed to send 1xx response.");
                    });
                    return;
                }
                // If, while in the "Proceeding" state, the TU passes a 2xx response
                // to the server transaction, the server transaction MUST pass this
                // response to the transport layer for transmission. It is not
                // retransmitted by the server transaction; retransmissions of 2xx
                // responses are handled by the TU. The server transaction MUST then
                // transition to the "Accepted" state.
                // https://tools.ietf.org/html/rfc6026#section-8.5
                if (statusCode >= 200 && statusCode <= 299) {
                    this.lastFinalResponse = response;
                    this.stateTransition(transaction_state_1.TransactionState.Accepted);
                    this.send(response).catch(function (error) {
                        _this.logTransportError(error, "Failed to send 2xx response.");
                    });
                    return;
                }
                // While in the "Proceeding" state, if the TU passes a response with
                // status code from 300 to 699 to the server transaction, the response
                // MUST be passed to the transport layer for transmission, and the state
                // machine MUST enter the "Completed" state.
                // https://tools.ietf.org/html/rfc3261#section-17.2.1
                if (statusCode >= 300 && statusCode <= 699) {
                    this.lastFinalResponse = response;
                    this.stateTransition(transaction_state_1.TransactionState.Completed);
                    this.send(response).catch(function (error) {
                        _this.logTransportError(error, "Failed to send non-2xx final response.");
                    });
                    return;
                }
                break;
            case transaction_state_1.TransactionState.Accepted:
                // While in the "Accepted" state, if the TU passes a 2xx response,
                // the server transaction MUST pass the response to the transport layer for transmission.
                // https://tools.ietf.org/html/rfc6026#section-8.7
                if (statusCode >= 200 && statusCode <= 299) {
                    this.send(response).catch(function (error) {
                        _this.logTransportError(error, "Failed to send 2xx response.");
                    });
                    return;
                }
                break;
            case transaction_state_1.TransactionState.Completed:
                break;
            case transaction_state_1.TransactionState.Confirmed:
                break;
            case transaction_state_1.TransactionState.Terminated:
                break;
            default:
                throw new Error("Invalid state " + this.state);
        }
        var message = "INVITE server transaction received unexpected " + statusCode + " response from TU while in state " + this.state + ".";
        this.logger.error(message);
        throw new Error(message);
    };
    /**
     * Retransmit the last 2xx response. This is a noop if not in the "accepted" state.
     */
    InviteServerTransaction.prototype.retransmitAcceptedResponse = function () {
        var _this = this;
        if (this.state === transaction_state_1.TransactionState.Accepted && this.lastFinalResponse) {
            this.send(this.lastFinalResponse).catch(function (error) {
                _this.logTransportError(error, "Failed to send 2xx response.");
            });
        }
    };
    /**
     * First, the procedures in [4] are followed, which attempt to deliver the response to a backup.
     * If those should all fail, based on the definition of failure in [4], the server transaction SHOULD
     * inform the TU that a failure has occurred, and MUST remain in the current state.
     * https://tools.ietf.org/html/rfc6026#section-8.8
     */
    InviteServerTransaction.prototype.onTransportError = function (error) {
        if (this.user.onTransportError) {
            this.user.onTransportError(error);
        }
    };
    /** For logging. */
    InviteServerTransaction.prototype.typeToString = function () {
        return "INVITE server transaction";
    };
    /**
     * Execute a state transition.
     * @param newState - New state.
     */
    InviteServerTransaction.prototype.stateTransition = function (newState) {
        var _this = this;
        // Assert valid state transitions.
        var invalidStateTransition = function () {
            throw new Error("Invalid state transition from " + _this.state + " to " + newState);
        };
        switch (newState) {
            case transaction_state_1.TransactionState.Proceeding:
                invalidStateTransition();
                break;
            case transaction_state_1.TransactionState.Accepted:
            case transaction_state_1.TransactionState.Completed:
                if (this.state !== transaction_state_1.TransactionState.Proceeding) {
                    invalidStateTransition();
                }
                break;
            case transaction_state_1.TransactionState.Confirmed:
                if (this.state !== transaction_state_1.TransactionState.Completed) {
                    invalidStateTransition();
                }
                break;
            case transaction_state_1.TransactionState.Terminated:
                if (this.state !== transaction_state_1.TransactionState.Accepted &&
                    this.state !== transaction_state_1.TransactionState.Completed &&
                    this.state !== transaction_state_1.TransactionState.Confirmed) {
                    invalidStateTransition();
                }
                break;
            default:
                invalidStateTransition();
        }
        // On any state transition, stop resending provisional responses
        this.stopProgressExtensionTimer();
        // The purpose of the "Accepted" state is to absorb retransmissions of an accepted INVITE request.
        // Any such retransmissions are absorbed entirely within the server transaction.
        // They are not passed up to the TU since any downstream UAS cores that accepted the request have
        // taken responsibility for reliability and will already retransmit their 2xx responses if necessary.
        // https://tools.ietf.org/html/rfc6026#section-8.7
        if (newState === transaction_state_1.TransactionState.Accepted) {
            this.L = setTimeout(function () { return _this.timer_L(); }, timers_1.Timers.TIMER_L);
        }
        // When the "Completed" state is entered, timer H MUST be set to fire in 64*T1 seconds for all transports.
        // Timer H determines when the server transaction abandons retransmitting the response.
        // If an ACK is received while the server transaction is in the "Completed" state,
        // the server transaction MUST transition to the "Confirmed" state.
        // https://tools.ietf.org/html/rfc3261#section-17.2.1
        if (newState === transaction_state_1.TransactionState.Completed) {
            // FIXME: Missing timer G for unreliable transports.
            this.H = setTimeout(function () { return _this.timer_H(); }, timers_1.Timers.TIMER_H);
        }
        // The purpose of the "Confirmed" state is to absorb any additional ACK messages that arrive,
        // triggered from retransmissions of the final response. When this state is entered, timer I
        // is set to fire in T4 seconds for unreliable transports, and zero seconds for reliable
        // transports. Once timer I fires, the server MUST transition to the "Terminated" state.
        // https://tools.ietf.org/html/rfc3261#section-17.2.1
        if (newState === transaction_state_1.TransactionState.Confirmed) {
            // FIXME: This timer is not getting set correctly for unreliable transports.
            this.I = setTimeout(function () { return _this.timer_I(); }, timers_1.Timers.TIMER_I);
        }
        // Once the transaction is in the "Terminated" state, it MUST be destroyed immediately.
        // https://tools.ietf.org/html/rfc6026#section-8.7
        if (newState === transaction_state_1.TransactionState.Terminated) {
            this.dispose();
        }
        // Update state.
        this.setState(newState);
    };
    /**
     * FIXME: UAS Provisional Retransmission Timer. See RFC 3261 Section 13.3.1.1
     * This is in the wrong place. This is not a transaction level thing. It's a UAS level thing.
     */
    InviteServerTransaction.prototype.startProgressExtensionTimer = function () {
        var _this = this;
        // Start the progress extension timer only for the first non-100 provisional response.
        if (this.progressExtensionTimer === undefined) {
            this.progressExtensionTimer = setInterval(function () {
                _this.logger.debug("Progress extension timer expired for INVITE server transaction " + _this.id + ".");
                if (!_this.lastProvisionalResponse) {
                    throw new Error("Last provisional response undefined.");
                }
                _this.send(_this.lastProvisionalResponse).catch(function (error) {
                    _this.logTransportError(error, "Failed to send retransmission of provisional response.");
                });
            }, timers_1.Timers.PROVISIONAL_RESPONSE_INTERVAL);
        }
    };
    /**
     * FIXME: UAS Provisional Retransmission Timer id. See RFC 3261 Section 13.3.1.1
     * This is in the wrong place. This is not a transaction level thing. It's a UAS level thing.
     */
    InviteServerTransaction.prototype.stopProgressExtensionTimer = function () {
        if (this.progressExtensionTimer !== undefined) {
            clearInterval(this.progressExtensionTimer);
            this.progressExtensionTimer = undefined;
        }
    };
    /**
     * While in the "Proceeding" state, if the TU passes a response with status code
     * from 300 to 699 to the server transaction, the response MUST be passed to the
     * transport layer for transmission, and the state machine MUST enter the "Completed" state.
     * For unreliable transports, timer G is set to fire in T1 seconds, and is not set to fire for
     * reliable transports. If timer G fires, the response is passed to the transport layer once
     * more for retransmission, and timer G is set to fire in MIN(2*T1, T2) seconds. From then on,
     * when timer G fires, the response is passed to the transport again for transmission, and
     * timer G is reset with a value that doubles, unless that value exceeds T2, in which case
     * it is reset with the value of T2.
     * https://tools.ietf.org/html/rfc3261#section-17.2.1
     */
    InviteServerTransaction.prototype.timer_G = function () {
        // TODO
    };
    /**
     * If timer H fires while in the "Completed" state, it implies that the ACK was never received.
     * In this case, the server transaction MUST transition to the "Terminated" state, and MUST
     * indicate to the TU that a transaction failure has occurred.
     * https://tools.ietf.org/html/rfc3261#section-17.2.1
     */
    InviteServerTransaction.prototype.timer_H = function () {
        this.logger.debug("Timer H expired for INVITE server transaction " + this.id + ".");
        if (this.state === transaction_state_1.TransactionState.Completed) {
            this.logger.warn("ACK to negative final response was never received, terminating transaction.");
            this.stateTransition(transaction_state_1.TransactionState.Terminated);
        }
    };
    /**
     * Once timer I fires, the server MUST transition to the "Terminated" state.
     * https://tools.ietf.org/html/rfc3261#section-17.2.1
     */
    InviteServerTransaction.prototype.timer_I = function () {
        this.logger.debug("Timer I expired for INVITE server transaction " + this.id + ".");
        this.stateTransition(transaction_state_1.TransactionState.Terminated);
    };
    /**
     * When Timer L fires and the state machine is in the "Accepted" state, the machine MUST
     * transition to the "Terminated" state. Once the transaction is in the "Terminated" state,
     * it MUST be destroyed immediately. Timer L reflects the amount of time the server
     * transaction could receive 2xx responses for retransmission from the
     * TU while it is waiting to receive an ACK.
     * https://tools.ietf.org/html/rfc6026#section-7.1
     * https://tools.ietf.org/html/rfc6026#section-8.7
     */
    InviteServerTransaction.prototype.timer_L = function () {
        this.logger.debug("Timer L expired for INVITE server transaction " + this.id + ".");
        if (this.state === transaction_state_1.TransactionState.Accepted) {
            this.stateTransition(transaction_state_1.TransactionState.Terminated);
        }
    };
    return InviteServerTransaction;
}(server_transaction_1.ServerTransaction));
exports.InviteServerTransaction = InviteServerTransaction;


/***/ }),
/* 39 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var transaction_1 = __webpack_require__(30);
/**
 * Server Transaction.
 * @remarks
 * The server transaction is responsible for the delivery of requests to
 * the TU and the reliable transmission of responses.  It accomplishes
 * this through a state machine.  Server transactions are created by the
 * core when a request is received, and transaction handling is desired
 * for that request (this is not always the case).
 * https://tools.ietf.org/html/rfc3261#section-17.2
 * @public
 */
var ServerTransaction = /** @class */ (function (_super) {
    tslib_1.__extends(ServerTransaction, _super);
    function ServerTransaction(_request, transport, user, state, loggerCategory) {
        var _this = _super.call(this, transport, user, _request.viaBranch, state, loggerCategory) || this;
        _this._request = _request;
        _this.user = user;
        return _this;
    }
    Object.defineProperty(ServerTransaction.prototype, "request", {
        /** The incoming request the transaction handling. */
        get: function () {
            return this._request;
        },
        enumerable: true,
        configurable: true
    });
    return ServerTransaction;
}(transaction_1.Transaction));
exports.ServerTransaction = ServerTransaction;


/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var timers_1 = __webpack_require__(27);
var client_transaction_1 = __webpack_require__(29);
var transaction_state_1 = __webpack_require__(37);
/**
 * Non-INVITE Client Transaction.
 * @remarks
 * Non-INVITE transactions do not make use of ACK.
 * They are simple request-response interactions.
 * https://tools.ietf.org/html/rfc3261#section-17.1.2
 * @public
 */
var NonInviteClientTransaction = /** @class */ (function (_super) {
    tslib_1.__extends(NonInviteClientTransaction, _super);
    /**
     * Constructor
     * Upon construction, the outgoing request's Via header is updated by calling `setViaHeader`.
     * Then `toString` is called on the outgoing request and the message is sent via the transport.
     * After construction the transaction will be in the "calling" state and the transaction id
     * will equal the branch parameter set in the Via header of the outgoing request.
     * https://tools.ietf.org/html/rfc3261#section-17.1.2
     * @param request - The outgoing Non-INVITE request.
     * @param transport - The transport.
     * @param user - The transaction user.
     */
    function NonInviteClientTransaction(request, transport, user) {
        var _this = _super.call(this, request, transport, user, transaction_state_1.TransactionState.Trying, "sip.transaction.nict") || this;
        // FIXME: Timer E for unreliable transports not implemented.
        //
        // The "Trying" state is entered when the TU initiates a new client
        // transaction with a request.  When entering this state, the client
        // transaction SHOULD set timer F to fire in 64*T1 seconds. The request
        // MUST be passed to the transport layer for transmission.
        // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
        _this.F = setTimeout(function () { return _this.timer_F(); }, timers_1.Timers.TIMER_F);
        _this.send(request.toString()).catch(function (error) {
            _this.logTransportError(error, "Failed to send initial outgoing request.");
        });
        return _this;
    }
    /**
     * Destructor.
     */
    NonInviteClientTransaction.prototype.dispose = function () {
        if (this.F) {
            clearTimeout(this.F);
            this.F = undefined;
        }
        if (this.K) {
            clearTimeout(this.K);
            this.K = undefined;
        }
        _super.prototype.dispose.call(this);
    };
    Object.defineProperty(NonInviteClientTransaction.prototype, "kind", {
        /** Transaction kind. Deprecated. */
        get: function () {
            return "nict";
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Handler for incoming responses from the transport which match this transaction.
     * @param response - The incoming response.
     */
    NonInviteClientTransaction.prototype.receiveResponse = function (response) {
        var statusCode = response.statusCode;
        if (!statusCode || statusCode < 100 || statusCode > 699) {
            throw new Error("Invalid status code " + statusCode);
        }
        switch (this.state) {
            case transaction_state_1.TransactionState.Trying:
                // If a provisional response is received while in the "Trying" state, the
                // response MUST be passed to the TU, and then the client transaction
                // SHOULD move to the "Proceeding" state.
                // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
                if (statusCode >= 100 && statusCode <= 199) {
                    this.stateTransition(transaction_state_1.TransactionState.Proceeding);
                    if (this.user.receiveResponse) {
                        this.user.receiveResponse(response);
                    }
                    return;
                }
                // If a final response (status codes 200-699) is received while in the
                // "Trying" state, the response MUST be passed to the TU, and the
                // client transaction MUST transition to the "Completed" state.
                // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
                if (statusCode >= 200 && statusCode <= 699) {
                    this.stateTransition(transaction_state_1.TransactionState.Completed);
                    if (statusCode === 408) {
                        this.onRequestTimeout();
                        return;
                    }
                    if (this.user.receiveResponse) {
                        this.user.receiveResponse(response);
                    }
                    return;
                }
                break;
            case transaction_state_1.TransactionState.Proceeding:
                // If a provisional response is received while in the "Proceeding" state,
                // the response MUST be passed to the TU. (From Figure 6)
                // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
                if (statusCode >= 100 && statusCode <= 199) {
                    if (this.user.receiveResponse) {
                        return this.user.receiveResponse(response);
                    }
                }
                // If a final response (status codes 200-699) is received while in the
                // "Proceeding" state, the response MUST be passed to the TU, and the
                // client transaction MUST transition to the "Completed" state.
                // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
                if (statusCode >= 200 && statusCode <= 699) {
                    this.stateTransition(transaction_state_1.TransactionState.Completed);
                    if (statusCode === 408) {
                        this.onRequestTimeout();
                        return;
                    }
                    if (this.user.receiveResponse) {
                        this.user.receiveResponse(response);
                    }
                    return;
                }
            case transaction_state_1.TransactionState.Completed:
                // The "Completed" state exists to buffer any additional response
                // retransmissions that may be received (which is why the client
                // transaction remains there only for unreliable transports).
                // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
                return;
            case transaction_state_1.TransactionState.Terminated:
                // For good measure just absorb additional response retransmissions.
                return;
            default:
                throw new Error("Invalid state " + this.state);
        }
        var message = "Non-INVITE client transaction received unexpected " + statusCode + " response while in state " + this.state + ".";
        this.logger.warn(message);
        return;
    };
    /**
     * The client transaction SHOULD inform the TU that a transport failure has occurred,
     * and the client transaction SHOULD transition directly to the "Terminated" state.
     * The TU will handle the fail over mechanisms described in [4].
     * https://tools.ietf.org/html/rfc3261#section-17.1.4
     * @param error - Transport error
     */
    NonInviteClientTransaction.prototype.onTransportError = function (error) {
        if (this.user.onTransportError) {
            this.user.onTransportError(error);
        }
        this.stateTransition(transaction_state_1.TransactionState.Terminated, true);
    };
    /** For logging. */
    NonInviteClientTransaction.prototype.typeToString = function () {
        return "non-INVITE client transaction";
    };
    /**
     * Execute a state transition.
     * @param newState - New state.
     */
    NonInviteClientTransaction.prototype.stateTransition = function (newState, dueToTransportError) {
        var _this = this;
        if (dueToTransportError === void 0) { dueToTransportError = false; }
        // Assert valid state transitions.
        var invalidStateTransition = function () {
            throw new Error("Invalid state transition from " + _this.state + " to " + newState);
        };
        switch (newState) {
            case transaction_state_1.TransactionState.Trying:
                invalidStateTransition();
                break;
            case transaction_state_1.TransactionState.Proceeding:
                if (this.state !== transaction_state_1.TransactionState.Trying) {
                    invalidStateTransition();
                }
                break;
            case transaction_state_1.TransactionState.Completed:
                if (this.state !== transaction_state_1.TransactionState.Trying &&
                    this.state !== transaction_state_1.TransactionState.Proceeding) {
                    invalidStateTransition();
                }
                break;
            case transaction_state_1.TransactionState.Terminated:
                if (this.state !== transaction_state_1.TransactionState.Trying &&
                    this.state !== transaction_state_1.TransactionState.Proceeding &&
                    this.state !== transaction_state_1.TransactionState.Completed) {
                    if (!dueToTransportError) {
                        invalidStateTransition();
                    }
                }
                break;
            default:
                invalidStateTransition();
        }
        // Once the client transaction enters the "Completed" state, it MUST set
        // Timer K to fire in T4 seconds for unreliable transports, and zero
        // seconds for reliable transports  The "Completed" state exists to
        // buffer any additional response retransmissions that may be received
        // (which is why the client transaction remains there only for unreliable transports).
        // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
        if (newState === transaction_state_1.TransactionState.Completed) {
            if (this.F) {
                clearTimeout(this.F);
                this.F = undefined;
            }
            this.K = setTimeout(function () { return _this.timer_K(); }, timers_1.Timers.TIMER_K);
        }
        // Once the transaction is in the terminated state, it MUST be destroyed immediately.
        // https://tools.ietf.org/html/rfc3261#section-17.1.2.2
        if (newState === transaction_state_1.TransactionState.Terminated) {
            this.dispose();
        }
        // Update state.
        this.setState(newState);
    };
    /**
     * If Timer F fires while the client transaction is still in the
     * "Trying" state, the client transaction SHOULD inform the TU about the
     * timeout, and then it SHOULD enter the "Terminated" state.
     * If timer F fires while in the "Proceeding" state, the TU MUST be informed of
     * a timeout, and the client transaction MUST transition to the terminated state.
     * https://tools.ietf.org/html/rfc3261#section-17.1.2.2
     */
    NonInviteClientTransaction.prototype.timer_F = function () {
        this.logger.debug("Timer F expired for non-INVITE client transaction " + this.id + ".");
        if (this.state === transaction_state_1.TransactionState.Trying || this.state === transaction_state_1.TransactionState.Proceeding) {
            this.onRequestTimeout();
            this.stateTransition(transaction_state_1.TransactionState.Terminated);
        }
    };
    /**
     * If Timer K fires while in this (COMPLETED) state, the client transaction
     * MUST transition to the "Terminated" state.
     * https://tools.ietf.org/html/rfc3261#section-17.1.2.2
     */
    NonInviteClientTransaction.prototype.timer_K = function () {
        if (this.state === transaction_state_1.TransactionState.Completed) {
            this.stateTransition(transaction_state_1.TransactionState.Terminated);
        }
    };
    return NonInviteClientTransaction;
}(client_transaction_1.ClientTransaction));
exports.NonInviteClientTransaction = NonInviteClientTransaction;


/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var timers_1 = __webpack_require__(27);
var server_transaction_1 = __webpack_require__(39);
var transaction_state_1 = __webpack_require__(37);
/**
 * Non-INVITE Server Transaction.
 * @remarks
 * https://tools.ietf.org/html/rfc3261#section-17.2.2
 * @public
 */
var NonInviteServerTransaction = /** @class */ (function (_super) {
    tslib_1.__extends(NonInviteServerTransaction, _super);
    /**
     * Constructor.
     * After construction the transaction will be in the "trying": state and the transaction
     * `id` will equal the branch parameter set in the Via header of the incoming request.
     * https://tools.ietf.org/html/rfc3261#section-17.2.2
     * @param request - Incoming Non-INVITE request from the transport.
     * @param transport - The transport.
     * @param user - The transaction user.
     */
    function NonInviteServerTransaction(request, transport, user) {
        return _super.call(this, request, transport, user, transaction_state_1.TransactionState.Trying, "sip.transaction.nist") || this;
    }
    /**
     * Destructor.
     */
    NonInviteServerTransaction.prototype.dispose = function () {
        if (this.J) {
            clearTimeout(this.J);
            this.J = undefined;
        }
        _super.prototype.dispose.call(this);
    };
    Object.defineProperty(NonInviteServerTransaction.prototype, "kind", {
        /** Transaction kind. Deprecated. */
        get: function () {
            return "nist";
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Receive requests from transport matching this transaction.
     * @param request - Request matching this transaction.
     */
    NonInviteServerTransaction.prototype.receiveRequest = function (request) {
        var _this = this;
        switch (this.state) {
            case transaction_state_1.TransactionState.Trying:
                // Once in the "Trying" state, any further request retransmissions are discarded.
                // https://tools.ietf.org/html/rfc3261#section-17.2.2
                break;
            case transaction_state_1.TransactionState.Proceeding:
                // If a retransmission of the request is received while in the "Proceeding" state,
                // the most recently sent provisional response MUST be passed to the transport layer for retransmission.
                // https://tools.ietf.org/html/rfc3261#section-17.2.2
                if (!this.lastResponse) {
                    throw new Error("Last response undefined.");
                }
                this.send(this.lastResponse).catch(function (error) {
                    _this.logTransportError(error, "Failed to send retransmission of provisional response.");
                });
                break;
            case transaction_state_1.TransactionState.Completed:
                // While in the "Completed" state, the server transaction MUST pass the final response to the transport
                // layer for retransmission whenever a retransmission of the request is received. Any other final responses
                // passed by the TU to the server transaction MUST be discarded while in the "Completed" state.
                // https://tools.ietf.org/html/rfc3261#section-17.2.2
                if (!this.lastResponse) {
                    throw new Error("Last response undefined.");
                }
                this.send(this.lastResponse).catch(function (error) {
                    _this.logTransportError(error, "Failed to send retransmission of final response.");
                });
                break;
            case transaction_state_1.TransactionState.Terminated:
                break;
            default:
                throw new Error("Invalid state " + this.state);
        }
    };
    /**
     * Receive responses from TU for this transaction.
     * @param statusCode - Status code of response. 101-199 not allowed per RFC 4320.
     * @param response - Response to send.
     */
    NonInviteServerTransaction.prototype.receiveResponse = function (statusCode, response) {
        var _this = this;
        if (statusCode < 100 || statusCode > 699) {
            throw new Error("Invalid status code " + statusCode);
        }
        // An SIP element MUST NOT send any provisional response with a
        // Status-Code other than 100 to a non-INVITE request.
        // An SIP element MUST NOT respond to a non-INVITE request with a
        // Status-Code of 100 over any unreliable transport, such as UDP,
        // before the amount of time it takes a client transaction's Timer E to be reset to T2.
        // An SIP element MAY respond to a non-INVITE request with a
        // Status-Code of 100 over a reliable transport at any time.
        // https://tools.ietf.org/html/rfc4320#section-4.1
        if (statusCode > 100 && statusCode <= 199) {
            throw new Error("Provisional response other than 100 not allowed.");
        }
        switch (this.state) {
            case transaction_state_1.TransactionState.Trying:
                // While in the "Trying" state, if the TU passes a provisional response
                // to the server transaction, the server transaction MUST enter the "Proceeding" state.
                // The response MUST be passed to the transport layer for transmission.
                // https://tools.ietf.org/html/rfc3261#section-17.2.2
                this.lastResponse = response;
                if (statusCode >= 100 && statusCode < 200) {
                    this.stateTransition(transaction_state_1.TransactionState.Proceeding);
                    this.send(response).catch(function (error) {
                        _this.logTransportError(error, "Failed to send provisional response.");
                    });
                    return;
                }
                if (statusCode >= 200 && statusCode <= 699) {
                    this.stateTransition(transaction_state_1.TransactionState.Completed);
                    this.send(response).catch(function (error) {
                        _this.logTransportError(error, "Failed to send final response.");
                    });
                    return;
                }
                break;
            case transaction_state_1.TransactionState.Proceeding:
                // Any further provisional responses that are received from the TU while
                // in the "Proceeding" state MUST be passed to the transport layer for transmission.
                // If the TU passes a final response (status codes 200-699) to the server while in
                // the "Proceeding" state, the transaction MUST enter the "Completed" state, and
                // the response MUST be passed to the transport layer for transmission.
                // https://tools.ietf.org/html/rfc3261#section-17.2.2
                this.lastResponse = response;
                if (statusCode >= 200 && statusCode <= 699) {
                    this.stateTransition(transaction_state_1.TransactionState.Completed);
                    this.send(response).catch(function (error) {
                        _this.logTransportError(error, "Failed to send final response.");
                    });
                    return;
                }
                break;
            case transaction_state_1.TransactionState.Completed:
                // Any other final responses passed by the TU to the server
                // transaction MUST be discarded while in the "Completed" state.
                // https://tools.ietf.org/html/rfc3261#section-17.2.2
                return;
            case transaction_state_1.TransactionState.Terminated:
                break;
            default:
                throw new Error("Invalid state " + this.state);
        }
        var message = "Non-INVITE server transaction received unexpected " + statusCode + " response from TU while in state " + this.state + ".";
        this.logger.error(message);
        throw new Error(message);
    };
    /**
     * First, the procedures in [4] are followed, which attempt to deliver the response to a backup.
     * If those should all fail, based on the definition of failure in [4], the server transaction SHOULD
     * inform the TU that a failure has occurred, and SHOULD transition to the terminated state.
     * https://tools.ietf.org/html/rfc3261#section-17.2.4
     */
    NonInviteServerTransaction.prototype.onTransportError = function (error) {
        if (this.user.onTransportError) {
            this.user.onTransportError(error);
        }
        this.stateTransition(transaction_state_1.TransactionState.Terminated, true);
    };
    /** For logging. */
    NonInviteServerTransaction.prototype.typeToString = function () {
        return "non-INVITE server transaction";
    };
    NonInviteServerTransaction.prototype.stateTransition = function (newState, dueToTransportError) {
        var _this = this;
        if (dueToTransportError === void 0) { dueToTransportError = false; }
        // Assert valid state transitions.
        var invalidStateTransition = function () {
            throw new Error("Invalid state transition from " + _this.state + " to " + newState);
        };
        switch (newState) {
            case transaction_state_1.TransactionState.Trying:
                invalidStateTransition();
                break;
            case transaction_state_1.TransactionState.Proceeding:
                if (this.state !== transaction_state_1.TransactionState.Trying) {
                    invalidStateTransition();
                }
                break;
            case transaction_state_1.TransactionState.Completed:
                if (this.state !== transaction_state_1.TransactionState.Trying && this.state !== transaction_state_1.TransactionState.Proceeding) {
                    invalidStateTransition();
                }
                break;
            case transaction_state_1.TransactionState.Terminated:
                if (this.state !== transaction_state_1.TransactionState.Proceeding && this.state !== transaction_state_1.TransactionState.Completed) {
                    if (!dueToTransportError) {
                        invalidStateTransition();
                    }
                }
                break;
            default:
                invalidStateTransition();
        }
        // When the server transaction enters the "Completed" state, it MUST set Timer J to fire
        // in 64*T1 seconds for unreliable transports, and zero seconds for reliable transports.
        // https://tools.ietf.org/html/rfc3261#section-17.2.2
        if (newState === transaction_state_1.TransactionState.Completed) {
            this.J = setTimeout(function () { return _this.timer_J(); }, timers_1.Timers.TIMER_J);
        }
        // The server transaction MUST be destroyed the instant it enters the "Terminated" state.
        // https://tools.ietf.org/html/rfc3261#section-17.2.2
        if (newState === transaction_state_1.TransactionState.Terminated) {
            this.dispose();
        }
        this.setState(newState);
    };
    /**
     * The server transaction remains in this state until Timer J fires,
     * at which point it MUST transition to the "Terminated" state.
     * https://tools.ietf.org/html/rfc3261#section-17.2.2
     */
    NonInviteServerTransaction.prototype.timer_J = function () {
        this.logger.debug("Timer J expired for NON-INVITE server transaction " + this.id + ".");
        if (this.state === transaction_state_1.TransactionState.Completed) {
            this.stateTransition(transaction_state_1.TransactionState.Terminated);
        }
    };
    return NonInviteServerTransaction;
}(server_transaction_1.ServerTransaction));
exports.NonInviteServerTransaction = NonInviteServerTransaction;


/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var messages_1 = __webpack_require__(5);
var transactions_1 = __webpack_require__(28);
var user_agent_client_1 = __webpack_require__(43);
/**
 * BYE UAC.
 * @public
 */
var ByeUserAgentClient = /** @class */ (function (_super) {
    tslib_1.__extends(ByeUserAgentClient, _super);
    function ByeUserAgentClient(dialog, delegate, options) {
        var _this = this;
        var message = dialog.createOutgoingRequestMessage(messages_1.C.BYE, options);
        _this = _super.call(this, transactions_1.NonInviteClientTransaction, dialog.userAgentCore, message, delegate) || this;
        dialog.dispose();
        return _this;
    }
    return ByeUserAgentClient;
}(user_agent_client_1.UserAgentClient));
exports.ByeUserAgentClient = ByeUserAgentClient;


/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var messages_1 = __webpack_require__(5);
var transactions_1 = __webpack_require__(28);
/**
 * User Agent Client (UAC).
 * @remarks
 * A user agent client is a logical entity
 * that creates a new request, and then uses the client
 * transaction state machinery to send it.  The role of UAC lasts
 * only for the duration of that transaction.  In other words, if
 * a piece of software initiates a request, it acts as a UAC for
 * the duration of that transaction.  If it receives a request
 * later, it assumes the role of a user agent server for the
 * processing of that transaction.
 * https://tools.ietf.org/html/rfc3261#section-6
 * @public
 */
var UserAgentClient = /** @class */ (function () {
    function UserAgentClient(transactionConstructor, core, message, delegate) {
        this.transactionConstructor = transactionConstructor;
        this.core = core;
        this.message = message;
        this.delegate = delegate;
        this.challenged = false;
        this.stale = false;
        this.logger = this.loggerFactory.getLogger("sip.user-agent-client");
        this.init();
    }
    UserAgentClient.prototype.dispose = function () {
        this.transaction.dispose();
    };
    Object.defineProperty(UserAgentClient.prototype, "loggerFactory", {
        get: function () {
            return this.core.loggerFactory;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UserAgentClient.prototype, "transaction", {
        /** The transaction associated with this request. */
        get: function () {
            if (!this._transaction) {
                throw new Error("Transaction undefined.");
            }
            return this._transaction;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Since requests other than INVITE are responded to immediately, sending a
     * CANCEL for a non-INVITE request would always create a race condition.
     * A CANCEL request SHOULD NOT be sent to cancel a request other than INVITE.
     * https://tools.ietf.org/html/rfc3261#section-9.1
     * @param options - Cancel options bucket.
     */
    UserAgentClient.prototype.cancel = function (reason, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        if (!this.transaction) {
            throw new Error("Transaction undefined.");
        }
        if (!this.message.to) {
            throw new Error("To undefined.");
        }
        if (!this.message.from) {
            throw new Error("From undefined.");
        }
        // The following procedures are used to construct a CANCEL request.  The
        // Request-URI, Call-ID, To, the numeric part of CSeq, and From header
        // fields in the CANCEL request MUST be identical to those in the
        // request being cancelled, including tags.  A CANCEL constructed by a
        // client MUST have only a single Via header field value matching the
        // top Via value in the request being cancelled.  Using the same values
        // for these header fields allows the CANCEL to be matched with the
        // request it cancels (Section 9.2 indicates how such matching occurs).
        // However, the method part of the CSeq header field MUST have a value
        // of CANCEL.  This allows it to be identified and processed as a
        // transaction in its own right (See Section 17).
        // https://tools.ietf.org/html/rfc3261#section-9.1
        var message = this.core.makeOutgoingRequestMessage(messages_1.C.CANCEL, this.message.ruri, this.message.from.uri, this.message.to.uri, {
            toTag: this.message.toTag,
            fromTag: this.message.fromTag,
            callId: this.message.callId,
            cseq: this.message.cseq
        }, options.extraHeaders);
        // TODO: Revisit this.
        // The CANCEL needs to use the same branch parameter so that
        // it matches the INVITE transaction, but this is a hacky way to do this.
        // Or at the very least not well documented. If the the branch parameter
        // is set on the outgoing request, the transaction will use it.
        // Otherwise the transaction will make a new one.
        message.branch = this.message.branch;
        if (this.message.headers.Route) {
            message.headers.Route = this.message.headers.Route;
        }
        if (reason) {
            message.setHeader("Reason", reason);
        }
        // If no provisional response has been received, the CANCEL request MUST
        // NOT be sent; rather, the client MUST wait for the arrival of a
        // provisional response before sending the request. If the original
        // request has generated a final response, the CANCEL SHOULD NOT be
        // sent, as it is an effective no-op, since CANCEL has no effect on
        // requests that have already generated a final response.
        // https://tools.ietf.org/html/rfc3261#section-9.1
        if (this.transaction.state === transactions_1.TransactionState.Proceeding) {
            var uac = new UserAgentClient(transactions_1.NonInviteClientTransaction, this.core, message);
        }
        else {
            this.transaction.once("stateChanged", function () {
                if (_this.transaction && _this.transaction.state === transactions_1.TransactionState.Proceeding) {
                    var uac = new UserAgentClient(transactions_1.NonInviteClientTransaction, _this.core, message);
                }
            });
        }
        return message;
    };
    /**
     * If a 401 (Unauthorized) or 407 (Proxy Authentication Required)
     * response is received, the UAC SHOULD follow the authorization
     * procedures of Section 22.2 and Section 22.3 to retry the request with
     * credentials.
     * https://tools.ietf.org/html/rfc3261#section-8.1.3.5
     * 22 Usage of HTTP Authentication
     * https://tools.ietf.org/html/rfc3261#section-22
     * 22.1 Framework
     * https://tools.ietf.org/html/rfc3261#section-22.1
     * 22.2 User-to-User Authentication
     * https://tools.ietf.org/html/rfc3261#section-22.2
     * 22.3 Proxy-to-User Authentication
     * https://tools.ietf.org/html/rfc3261#section-22.3
     *
     * FIXME: This "guard for and retry the request with credentials"
     * implementation is not complete and at best minimally passable.
     * @param response - The incoming response to guard.
     * @param dialog - If defined, the dialog within which the response was received.
     * @returns True if the program execution is to continue in the branch in question.
     *          Otherwise the request is retried with credentials and current request processing must stop.
     */
    UserAgentClient.prototype.authenticationGuard = function (message, dialog) {
        var statusCode = message.statusCode;
        if (!statusCode) {
            throw new Error("Response status code undefined.");
        }
        // If a 401 (Unauthorized) or 407 (Proxy Authentication Required)
        // response is received, the UAC SHOULD follow the authorization
        // procedures of Section 22.2 and Section 22.3 to retry the request with
        // credentials.
        // https://tools.ietf.org/html/rfc3261#section-8.1.3.5
        if (statusCode !== 401 && statusCode !== 407) {
            return true;
        }
        // Get and parse the appropriate WWW-Authenticate or Proxy-Authenticate header.
        var challenge;
        var authorizationHeaderName;
        if (statusCode === 401) {
            challenge = message.parseHeader("www-authenticate");
            authorizationHeaderName = "authorization";
        }
        else {
            challenge = message.parseHeader("proxy-authenticate");
            authorizationHeaderName = "proxy-authorization";
        }
        // Verify it seems a valid challenge.
        if (!challenge) {
            this.logger.warn(statusCode + " with wrong or missing challenge, cannot authenticate");
            return true;
        }
        // Avoid infinite authentications.
        if (this.challenged && (this.stale || challenge.stale !== true)) {
            this.logger.warn(statusCode + " apparently in authentication loop, cannot authenticate");
            return true;
        }
        // Get credentials.
        if (!this.credentials) {
            this.credentials = this.core.configuration.authenticationFactory();
            if (!this.credentials) {
                this.logger.warn("Unable to obtain credentials, cannot authenticate");
                return true;
            }
        }
        // Verify that the challenge is really valid.
        if (!this.credentials.authenticate(this.message, challenge)) {
            return true;
        }
        this.challenged = true;
        if (challenge.stale) {
            this.stale = true;
        }
        // If response to out of dialog request, assume incrementing the CSeq will suffice.
        var cseq = this.message.cseq += 1;
        // If response to in dialog request, get a valid next CSeq number.
        if (dialog && dialog.localSequenceNumber) {
            dialog.incrementLocalSequenceNumber();
            cseq = this.message.cseq = dialog.localSequenceNumber;
        }
        this.message.setHeader("cseq", cseq + " " + this.message.method);
        this.message.setHeader(authorizationHeaderName, this.credentials.toString());
        // Calling init (again) will swap out our existing client transaction with a new one.
        // FIXME: HACK: An assumption is being made here that there is nothing that needs to
        // be cleaned up beyond the client transaction which is being replaced. For example,
        // it is assumed that no early dialogs have been created.
        this.init();
        return false;
    };
    /**
     * 8.1.3.1 Transaction Layer Errors
     * In some cases, the response returned by the transaction layer will
     * not be a SIP message, but rather a transaction layer error.  When a
     * timeout error is received from the transaction layer, it MUST be
     * treated as if a 408 (Request Timeout) status code has been received.
     * If a fatal transport error is reported by the transport layer
     * (generally, due to fatal ICMP errors in UDP or connection failures in
     * TCP), the condition MUST be treated as a 503 (Service Unavailable)
     * status code.
     * https://tools.ietf.org/html/rfc3261#section-8.1.3.1
     */
    UserAgentClient.prototype.onRequestTimeout = function () {
        this.logger.warn("User agent client request timed out. Generating internal 408 Request Timeout.");
        var message = new messages_1.IncomingResponseMessage();
        message.statusCode = 408;
        message.reasonPhrase = "Request Timeout";
        this.receiveResponse(message);
        return;
    };
    /**
     * 8.1.3.1 Transaction Layer Errors
     * In some cases, the response returned by the transaction layer will
     * not be a SIP message, but rather a transaction layer error.  When a
     * timeout error is received from the transaction layer, it MUST be
     * treated as if a 408 (Request Timeout) status code has been received.
     * If a fatal transport error is reported by the transport layer
     * (generally, due to fatal ICMP errors in UDP or connection failures in
     * TCP), the condition MUST be treated as a 503 (Service Unavailable)
     * status code.
     * https://tools.ietf.org/html/rfc3261#section-8.1.3.1
     * @param error - Transport error
     */
    UserAgentClient.prototype.onTransportError = function (error) {
        this.logger.error(error.message);
        this.logger.error("User agent client request transport error. Generating internal 503 Service Unavailable.");
        var message = new messages_1.IncomingResponseMessage();
        message.statusCode = 503;
        message.reasonPhrase = "Service Unavailable";
        this.receiveResponse(message);
    };
    /**
     * Receive a response from the transaction layer.
     * @param message - Incoming response message.
     */
    UserAgentClient.prototype.receiveResponse = function (message) {
        if (!this.authenticationGuard(message)) {
            return;
        }
        var statusCode = message.statusCode ? message.statusCode.toString() : "";
        if (!statusCode) {
            throw new Error("Response status code undefined.");
        }
        switch (true) {
            case /^100$/.test(statusCode):
                if (this.delegate && this.delegate.onTrying) {
                    this.delegate.onTrying({ message: message });
                }
                break;
            case /^1[0-9]{2}$/.test(statusCode):
                if (this.delegate && this.delegate.onProgress) {
                    this.delegate.onProgress({ message: message });
                }
                break;
            case /^2[0-9]{2}$/.test(statusCode):
                if (this.delegate && this.delegate.onAccept) {
                    this.delegate.onAccept({ message: message });
                }
                break;
            case /^3[0-9]{2}$/.test(statusCode):
                if (this.delegate && this.delegate.onRedirect) {
                    this.delegate.onRedirect({ message: message });
                }
                break;
            case /^[4-6][0-9]{2}$/.test(statusCode):
                if (this.delegate && this.delegate.onReject) {
                    this.delegate.onReject({ message: message });
                }
                break;
            default:
                throw new Error("Invalid status code " + statusCode);
        }
    };
    UserAgentClient.prototype.init = function () {
        var _this = this;
        // We are the transaction user.
        var user = {
            loggerFactory: this.loggerFactory,
            onRequestTimeout: function () { return _this.onRequestTimeout(); },
            onStateChange: function (newState) {
                if (newState === transactions_1.TransactionState.Terminated) {
                    // Remove the terminated transaction from the core.
                    _this.core.userAgentClients.delete(userAgentClientId);
                    // FIXME: HACK: Our transaction may have been swapped out with a new one
                    // post authentication (see above), so make sure to only to dispose of
                    // ourselves if this terminating transaction is our current transaction.
                    if (transaction === _this._transaction) {
                        _this.dispose();
                    }
                }
            },
            onTransportError: function (error) { return _this.onTransportError(error); },
            receiveResponse: function (message) { return _this.receiveResponse(message); }
        };
        // Create a new transaction with us as the user.
        var transaction = new this.transactionConstructor(this.message, this.core.transport, user);
        this._transaction = transaction;
        // Add the new transaction to the core.
        var userAgentClientId = transaction.id + transaction.request.method;
        this.core.userAgentClients.set(userAgentClientId, this);
    };
    return UserAgentClient;
}());
exports.UserAgentClient = UserAgentClient;


/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var transactions_1 = __webpack_require__(28);
var user_agent_server_1 = __webpack_require__(45);
/**
 * BYE UAS.
 * @public
 */
var ByeUserAgentServer = /** @class */ (function (_super) {
    tslib_1.__extends(ByeUserAgentServer, _super);
    function ByeUserAgentServer(dialog, message, delegate) {
        return _super.call(this, transactions_1.NonInviteServerTransaction, dialog.userAgentCore, message, delegate) || this;
    }
    return ByeUserAgentServer;
}(user_agent_server_1.UserAgentServer));
exports.ByeUserAgentServer = ByeUserAgentServer;


/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var exceptions_1 = __webpack_require__(32);
var messages_1 = __webpack_require__(5);
var utils_1 = __webpack_require__(16);
var transactions_1 = __webpack_require__(28);
/**
 * User Agent Server (UAS).
 * @remarks
 * A user agent server is a logical entity
 * that generates a response to a SIP request.  The response
 * accepts, rejects, or redirects the request.  This role lasts
 * only for the duration of that transaction.  In other words, if
 * a piece of software responds to a request, it acts as a UAS for
 * the duration of that transaction.  If it generates a request
 * later, it assumes the role of a user agent client for the
 * processing of that transaction.
 * https://tools.ietf.org/html/rfc3261#section-6
 * @public
 */
var UserAgentServer = /** @class */ (function () {
    function UserAgentServer(transactionConstructor, core, message, delegate) {
        this.transactionConstructor = transactionConstructor;
        this.core = core;
        this.message = message;
        this.delegate = delegate;
        this.logger = this.loggerFactory.getLogger("sip.user-agent-server");
        this.toTag = message.toTag ? message.toTag : utils_1.newTag();
        this.init();
    }
    UserAgentServer.prototype.dispose = function () {
        this.transaction.dispose();
    };
    Object.defineProperty(UserAgentServer.prototype, "loggerFactory", {
        get: function () {
            return this.core.loggerFactory;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UserAgentServer.prototype, "transaction", {
        /** The transaction associated with this request. */
        get: function () {
            if (!this._transaction) {
                throw new Error("Transaction undefined.");
            }
            return this._transaction;
        },
        enumerable: true,
        configurable: true
    });
    UserAgentServer.prototype.accept = function (options) {
        if (options === void 0) { options = { statusCode: 200 }; }
        if (!this.acceptable) {
            throw new exceptions_1.TransactionStateError(this.message.method + " not acceptable in state " + this.transaction.state + ".");
        }
        var statusCode = options.statusCode;
        if (statusCode < 200 || statusCode > 299) {
            throw new TypeError("Invalid statusCode: " + statusCode);
        }
        var response = this.reply(options);
        return response;
    };
    UserAgentServer.prototype.progress = function (options) {
        if (options === void 0) { options = { statusCode: 180 }; }
        if (!this.progressable) {
            throw new exceptions_1.TransactionStateError(this.message.method + " not progressable in state " + this.transaction.state + ".");
        }
        var statusCode = options.statusCode;
        if (statusCode < 101 || statusCode > 199) {
            throw new TypeError("Invalid statusCode: " + statusCode);
        }
        var response = this.reply(options);
        return response;
    };
    UserAgentServer.prototype.redirect = function (contacts, options) {
        if (options === void 0) { options = { statusCode: 302 }; }
        if (!this.redirectable) {
            throw new exceptions_1.TransactionStateError(this.message.method + " not redirectable in state " + this.transaction.state + ".");
        }
        var statusCode = options.statusCode;
        if (statusCode < 300 || statusCode > 399) {
            throw new TypeError("Invalid statusCode: " + statusCode);
        }
        var contactHeaders = new Array();
        contacts.forEach(function (contact) { return contactHeaders.push("Contact: " + contact.toString()); });
        options.extraHeaders = (options.extraHeaders || []).concat(contactHeaders);
        var response = this.reply(options);
        return response;
    };
    UserAgentServer.prototype.reject = function (options) {
        if (options === void 0) { options = { statusCode: 480 }; }
        if (!this.rejectable) {
            throw new exceptions_1.TransactionStateError(this.message.method + " not rejectable in state " + this.transaction.state + ".");
        }
        var statusCode = options.statusCode;
        if (statusCode < 400 || statusCode > 699) {
            throw new TypeError("Invalid statusCode: " + statusCode);
        }
        var response = this.reply(options);
        return response;
    };
    UserAgentServer.prototype.trying = function (options) {
        if (!this.tryingable) {
            throw new exceptions_1.TransactionStateError(this.message.method + " not tryingable in state " + this.transaction.state + ".");
        }
        var response = this.reply({ statusCode: 100 });
        return response;
    };
    /**
     * If the UAS did not find a matching transaction for the CANCEL
     * according to the procedure above, it SHOULD respond to the CANCEL
     * with a 481 (Call Leg/Transaction Does Not Exist).  If the transaction
     * for the original request still exists, the behavior of the UAS on
     * receiving a CANCEL request depends on whether it has already sent a
     * final response for the original request.  If it has, the CANCEL
     * request has no effect on the processing of the original request, no
     * effect on any session state, and no effect on the responses generated
     * for the original request.  If the UAS has not issued a final response
     * for the original request, its behavior depends on the method of the
     * original request.  If the original request was an INVITE, the UAS
     * SHOULD immediately respond to the INVITE with a 487 (Request
     * Terminated).  A CANCEL request has no impact on the processing of
     * transactions with any other method defined in this specification.
     * https://tools.ietf.org/html/rfc3261#section-9.2
     * @param request - Incoming CANCEL request.
     */
    UserAgentServer.prototype.receiveCancel = function (message) {
        // Note: Currently CANCEL is being handled as a special case.
        // No UAS is created to handle the CANCEL and the response to
        // it CANCEL is being handled statelessly by the user agent core.
        // As such, there is currently no way to externally impact the
        // response to the a CANCEL request.
        if (this.delegate && this.delegate.onCancel) {
            this.delegate.onCancel(message);
        }
    };
    Object.defineProperty(UserAgentServer.prototype, "acceptable", {
        get: function () {
            if (this.transaction instanceof transactions_1.InviteServerTransaction) {
                return (this.transaction.state === transactions_1.TransactionState.Proceeding ||
                    this.transaction.state === transactions_1.TransactionState.Accepted);
            }
            if (this.transaction instanceof transactions_1.NonInviteServerTransaction) {
                return (this.transaction.state === transactions_1.TransactionState.Trying ||
                    this.transaction.state === transactions_1.TransactionState.Proceeding);
            }
            throw new Error("Unknown transaction type.");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UserAgentServer.prototype, "progressable", {
        get: function () {
            if (this.transaction instanceof transactions_1.InviteServerTransaction) {
                return this.transaction.state === transactions_1.TransactionState.Proceeding;
            }
            if (this.transaction instanceof transactions_1.NonInviteServerTransaction) {
                return false; // https://tools.ietf.org/html/rfc4320#section-4.1
            }
            throw new Error("Unknown transaction type.");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UserAgentServer.prototype, "redirectable", {
        get: function () {
            if (this.transaction instanceof transactions_1.InviteServerTransaction) {
                return this.transaction.state === transactions_1.TransactionState.Proceeding;
            }
            if (this.transaction instanceof transactions_1.NonInviteServerTransaction) {
                return (this.transaction.state === transactions_1.TransactionState.Trying ||
                    this.transaction.state === transactions_1.TransactionState.Proceeding);
            }
            throw new Error("Unknown transaction type.");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UserAgentServer.prototype, "rejectable", {
        get: function () {
            if (this.transaction instanceof transactions_1.InviteServerTransaction) {
                return this.transaction.state === transactions_1.TransactionState.Proceeding;
            }
            if (this.transaction instanceof transactions_1.NonInviteServerTransaction) {
                return (this.transaction.state === transactions_1.TransactionState.Trying ||
                    this.transaction.state === transactions_1.TransactionState.Proceeding);
            }
            throw new Error("Unknown transaction type.");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UserAgentServer.prototype, "tryingable", {
        get: function () {
            if (this.transaction instanceof transactions_1.InviteServerTransaction) {
                return this.transaction.state === transactions_1.TransactionState.Proceeding;
            }
            if (this.transaction instanceof transactions_1.NonInviteServerTransaction) {
                return this.transaction.state === transactions_1.TransactionState.Trying;
            }
            throw new Error("Unknown transaction type.");
        },
        enumerable: true,
        configurable: true
    });
    /**
     * When a UAS wishes to construct a response to a request, it follows
     * the general procedures detailed in the following subsections.
     * Additional behaviors specific to the response code in question, which
     * are not detailed in this section, may also be required.
     *
     * Once all procedures associated with the creation of a response have
     * been completed, the UAS hands the response back to the server
     * transaction from which it received the request.
     * https://tools.ietf.org/html/rfc3261#section-8.2.6
     * @param statusCode - Status code to reply with.
     * @param options - Reply options bucket.
     */
    UserAgentServer.prototype.reply = function (options) {
        if (!options.toTag && options.statusCode !== 100) {
            options.toTag = this.toTag;
        }
        options.userAgent = options.userAgent || this.core.configuration.userAgentHeaderFieldValue;
        options.supported = options.supported || this.core.configuration.supportedOptionTagsResponse;
        var response = messages_1.constructOutgoingResponse(this.message, options);
        this.transaction.receiveResponse(options.statusCode, response.message);
        return response;
    };
    UserAgentServer.prototype.init = function () {
        var _this = this;
        // We are the transaction user.
        var user = {
            loggerFactory: this.loggerFactory,
            onStateChange: function (newState) {
                if (newState === transactions_1.TransactionState.Terminated) {
                    // Remove the terminated transaction from the core.
                    _this.core.userAgentServers.delete(userAgentServerId);
                    _this.dispose();
                }
            },
            onTransportError: function (error) {
                _this.logger.error(error.message);
                if (_this.delegate && _this.delegate.onTransportError) {
                    _this.delegate.onTransportError(error);
                }
                else {
                    _this.logger.error("User agent server response transport error.");
                }
            }
        };
        // Create a new transaction with us as the user.
        var transaction = new this.transactionConstructor(this.message, this.core.transport, user);
        this._transaction = transaction;
        // Add the new transaction to the core.
        var userAgentServerId = transaction.id;
        this.core.userAgentServers.set(transaction.id, this);
    };
    return UserAgentServer;
}());
exports.UserAgentServer = UserAgentServer;


/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var messages_1 = __webpack_require__(5);
var transactions_1 = __webpack_require__(28);
var user_agent_client_1 = __webpack_require__(43);
/**
 * INFO UAC.
 * @public
 */
var InfoUserAgentClient = /** @class */ (function (_super) {
    tslib_1.__extends(InfoUserAgentClient, _super);
    function InfoUserAgentClient(dialog, delegate, options) {
        var _this = this;
        var message = dialog.createOutgoingRequestMessage(messages_1.C.INFO, options);
        _this = _super.call(this, transactions_1.NonInviteClientTransaction, dialog.userAgentCore, message, delegate) || this;
        return _this;
    }
    return InfoUserAgentClient;
}(user_agent_client_1.UserAgentClient));
exports.InfoUserAgentClient = InfoUserAgentClient;


/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var transactions_1 = __webpack_require__(28);
var user_agent_server_1 = __webpack_require__(45);
/**
 * INFO UAS.
 * @public
 */
var InfoUserAgentServer = /** @class */ (function (_super) {
    tslib_1.__extends(InfoUserAgentServer, _super);
    function InfoUserAgentServer(dialog, message, delegate) {
        return _super.call(this, transactions_1.NonInviteServerTransaction, dialog.userAgentCore, message, delegate) || this;
    }
    return InfoUserAgentServer;
}(user_agent_server_1.UserAgentServer));
exports.InfoUserAgentServer = InfoUserAgentServer;


/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var transactions_1 = __webpack_require__(28);
var user_agent_client_1 = __webpack_require__(43);
/**
 * MESSAGE UAC.
 * @public
 */
var MessageUserAgentClient = /** @class */ (function (_super) {
    tslib_1.__extends(MessageUserAgentClient, _super);
    function MessageUserAgentClient(core, message, delegate) {
        return _super.call(this, transactions_1.NonInviteClientTransaction, core, message, delegate) || this;
    }
    return MessageUserAgentClient;
}(user_agent_client_1.UserAgentClient));
exports.MessageUserAgentClient = MessageUserAgentClient;


/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var transactions_1 = __webpack_require__(28);
var user_agent_server_1 = __webpack_require__(45);
/**
 * MESSAGE UAS.
 * @public
 */
var MessageUserAgentServer = /** @class */ (function (_super) {
    tslib_1.__extends(MessageUserAgentServer, _super);
    function MessageUserAgentServer(core, message, delegate) {
        return _super.call(this, transactions_1.NonInviteServerTransaction, core, message, delegate) || this;
    }
    return MessageUserAgentServer;
}(user_agent_server_1.UserAgentServer));
exports.MessageUserAgentServer = MessageUserAgentServer;


/***/ }),
/* 50 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var messages_1 = __webpack_require__(5);
var transactions_1 = __webpack_require__(28);
var user_agent_client_1 = __webpack_require__(43);
/**
 * NOTIFY UAS.
 * @public
 */
var NotifyUserAgentClient = /** @class */ (function (_super) {
    tslib_1.__extends(NotifyUserAgentClient, _super);
    function NotifyUserAgentClient(dialog, delegate, options) {
        var _this = this;
        var message = dialog.createOutgoingRequestMessage(messages_1.C.NOTIFY, options);
        _this = _super.call(this, transactions_1.NonInviteClientTransaction, dialog.userAgentCore, message, delegate) || this;
        return _this;
    }
    return NotifyUserAgentClient;
}(user_agent_client_1.UserAgentClient));
exports.NotifyUserAgentClient = NotifyUserAgentClient;


/***/ }),
/* 51 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var transactions_1 = __webpack_require__(28);
var user_agent_server_1 = __webpack_require__(45);
/**
 * NOTIFY UAS.
 * @public
 */
var NotifyUserAgentServer = /** @class */ (function (_super) {
    tslib_1.__extends(NotifyUserAgentServer, _super);
    /**
     * NOTIFY UAS constructor.
     * @param dialogOrCore - Dialog for in dialog NOTIFY, UserAgentCore for out of dialog NOTIFY (deprecated).
     * @param message - Incoming NOTIFY request message.
     */
    function NotifyUserAgentServer(dialogOrCore, message, delegate) {
        var _this = this;
        var userAgentCore = instanceOfDialog(dialogOrCore) ?
            dialogOrCore.userAgentCore :
            dialogOrCore;
        _this = _super.call(this, transactions_1.NonInviteServerTransaction, userAgentCore, message, delegate) || this;
        return _this;
    }
    return NotifyUserAgentServer;
}(user_agent_server_1.UserAgentServer));
exports.NotifyUserAgentServer = NotifyUserAgentServer;
function instanceOfDialog(object) {
    return object.userAgentCore !== undefined;
}


/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var messages_1 = __webpack_require__(5);
var transactions_1 = __webpack_require__(28);
var user_agent_client_1 = __webpack_require__(43);
/**
 * PRACK UAC.
 * @public
 */
var PrackUserAgentClient = /** @class */ (function (_super) {
    tslib_1.__extends(PrackUserAgentClient, _super);
    function PrackUserAgentClient(dialog, delegate, options) {
        var _this = this;
        var message = dialog.createOutgoingRequestMessage(messages_1.C.PRACK, options);
        _this = _super.call(this, transactions_1.NonInviteClientTransaction, dialog.userAgentCore, message, delegate) || this;
        dialog.signalingStateTransition(message);
        return _this;
    }
    return PrackUserAgentClient;
}(user_agent_client_1.UserAgentClient));
exports.PrackUserAgentClient = PrackUserAgentClient;


/***/ }),
/* 53 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var transactions_1 = __webpack_require__(28);
var user_agent_server_1 = __webpack_require__(45);
/**
 * PRACK UAS.
 * @public
 */
var PrackUserAgentServer = /** @class */ (function (_super) {
    tslib_1.__extends(PrackUserAgentServer, _super);
    function PrackUserAgentServer(dialog, message, delegate) {
        var _this = _super.call(this, transactions_1.NonInviteServerTransaction, dialog.userAgentCore, message, delegate) || this;
        // Update dialog signaling state with offer/answer in body
        dialog.signalingStateTransition(message);
        _this.dialog = dialog;
        return _this;
    }
    /**
     * Update the dialog signaling state on a 2xx response.
     * @param options - Options bucket.
     */
    PrackUserAgentServer.prototype.accept = function (options) {
        if (options === void 0) { options = { statusCode: 200 }; }
        if (options.body) {
            // Update dialog signaling state with offer/answer in body
            this.dialog.signalingStateTransition(options.body);
        }
        return _super.prototype.accept.call(this, options);
    };
    return PrackUserAgentServer;
}(user_agent_server_1.UserAgentServer));
exports.PrackUserAgentServer = PrackUserAgentServer;


/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var messages_1 = __webpack_require__(5);
var transactions_1 = __webpack_require__(28);
var user_agent_client_1 = __webpack_require__(43);
/**
 * Re-INVITE UAC.
 * @remarks
 * 14 Modifying an Existing Session
 * https://tools.ietf.org/html/rfc3261#section-14
 * 14.1 UAC Behavior
 * https://tools.ietf.org/html/rfc3261#section-14.1
 * @public
 */
var ReInviteUserAgentClient = /** @class */ (function (_super) {
    tslib_1.__extends(ReInviteUserAgentClient, _super);
    function ReInviteUserAgentClient(dialog, delegate, options) {
        var _this = this;
        var message = dialog.createOutgoingRequestMessage(messages_1.C.INVITE, options);
        _this = _super.call(this, transactions_1.InviteClientTransaction, dialog.userAgentCore, message, delegate) || this;
        _this.delegate = delegate;
        dialog.signalingStateTransition(message);
        // FIXME: TODO: next line obviously needs to be improved...
        dialog.reinviteUserAgentClient = _this; // let the dialog know re-invite request sent
        _this.dialog = dialog;
        return _this;
    }
    ReInviteUserAgentClient.prototype.receiveResponse = function (message) {
        var _this = this;
        if (!this.authenticationGuard(message, this.dialog)) {
            return;
        }
        var statusCode = message.statusCode ? message.statusCode.toString() : "";
        if (!statusCode) {
            throw new Error("Response status code undefined.");
        }
        switch (true) {
            case /^100$/.test(statusCode):
                if (this.delegate && this.delegate.onTrying) {
                    this.delegate.onTrying({ message: message });
                }
                break;
            case /^1[0-9]{2}$/.test(statusCode):
                if (this.delegate && this.delegate.onProgress) {
                    this.delegate.onProgress({
                        message: message,
                        session: this.dialog,
                        prack: function (options) {
                            throw new Error("Unimplemented.");
                        }
                    });
                }
                break;
            case /^2[0-9]{2}$/.test(statusCode):
                // Update dialog signaling state with offer/answer in body
                this.dialog.signalingStateTransition(message);
                if (this.delegate && this.delegate.onAccept) {
                    this.delegate.onAccept({
                        message: message,
                        session: this.dialog,
                        ack: function (options) {
                            var outgoingAckRequest = _this.dialog.ack(options);
                            return outgoingAckRequest;
                        }
                    });
                }
                break;
            case /^3[0-9]{2}$/.test(statusCode):
                this.dialog.signalingStateRollback();
                this.dialog.reinviteUserAgentClient = undefined; // ACK was handled by transaction
                if (this.delegate && this.delegate.onRedirect) {
                    this.delegate.onRedirect({ message: message });
                }
                break;
            case /^[4-6][0-9]{2}$/.test(statusCode):
                this.dialog.signalingStateRollback();
                this.dialog.reinviteUserAgentClient = undefined; // ACK was handled by transaction
                if (this.delegate && this.delegate.onReject) {
                    this.delegate.onReject({ message: message });
                }
                else {
                    // If a UA receives a non-2xx final response to a re-INVITE, the session
                    // parameters MUST remain unchanged, as if no re-INVITE had been issued.
                    // Note that, as stated in Section 12.2.1.2, if the non-2xx final
                    // response is a 481 (Call/Transaction Does Not Exist), or a 408
                    // (Request Timeout), or no response at all is received for the re-
                    // INVITE (that is, a timeout is returned by the INVITE client
                    // transaction), the UAC will terminate the dialog.
                    //
                    // If a UAC receives a 491 response to a re-INVITE, it SHOULD start a
                    // timer with a value T chosen as follows:
                    //
                    //    1. If the UAC is the owner of the Call-ID of the dialog ID
                    //       (meaning it generated the value), T has a randomly chosen value
                    //       between 2.1 and 4 seconds in units of 10 ms.
                    //
                    //    2. If the UAC is not the owner of the Call-ID of the dialog ID, T
                    //       has a randomly chosen value of between 0 and 2 seconds in units
                    //       of 10 ms.
                    //
                    // When the timer fires, the UAC SHOULD attempt the re-INVITE once more,
                    // if it still desires for that session modification to take place.  For
                    // example, if the call was already hung up with a BYE, the re-INVITE
                    // would not take place.
                    // https://tools.ietf.org/html/rfc3261#section-14.1
                    // FIXME: TODO: The above.
                }
                break;
            default:
                throw new Error("Invalid status code " + statusCode);
        }
    };
    return ReInviteUserAgentClient;
}(user_agent_client_1.UserAgentClient));
exports.ReInviteUserAgentClient = ReInviteUserAgentClient;


/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var transactions_1 = __webpack_require__(28);
var user_agent_server_1 = __webpack_require__(45);
/**
 * Re-INVITE UAS.
 * @remarks
 * 14 Modifying an Existing Session
 * https://tools.ietf.org/html/rfc3261#section-14
 * 14.2 UAS Behavior
 * https://tools.ietf.org/html/rfc3261#section-14.2
 * @public
 */
var ReInviteUserAgentServer = /** @class */ (function (_super) {
    tslib_1.__extends(ReInviteUserAgentServer, _super);
    function ReInviteUserAgentServer(dialog, message, delegate) {
        var _this = _super.call(this, transactions_1.InviteServerTransaction, dialog.userAgentCore, message, delegate) || this;
        dialog.reinviteUserAgentServer = _this;
        _this.dialog = dialog;
        return _this;
    }
    /**
     * Update the dialog signaling state on a 2xx response.
     * @param options - Options bucket.
     */
    ReInviteUserAgentServer.prototype.accept = function (options) {
        if (options === void 0) { options = { statusCode: 200 }; }
        // FIXME: The next two lines SHOULD go away, but I suppose it's technically harmless...
        // These are here because some versions of SIP.js prior to 0.13.8 set the route set
        // of all in dialog ACKs based on the Record-Route headers in the associated 2xx
        // response. While this worked for dialog forming 2xx responses, it was technically
        // broken for re-INVITE ACKS as it only worked if the UAS populated the Record-Route
        // headers in the re-INVITE 2xx response (which is not required and a waste of bandwidth
        // as the should be ignored if present in re-INVITE ACKS) and the UAS populated
        // the Record-Route headers with the correct values (would be weird not too, but...).
        // Anyway, for now the technically useless Record-Route headers are being added
        // to maintain "backwards compatibility" with the older broken versions of SIP.js.
        options.extraHeaders = options.extraHeaders || [];
        options.extraHeaders = options.extraHeaders.concat(this.dialog.routeSet.map(function (route) { return "Record-Route: " + route; }));
        // Send and return the response
        var response = _super.prototype.accept.call(this, options);
        var session = this.dialog;
        var result = tslib_1.__assign(tslib_1.__assign({}, response), { session: session });
        if (options.body) {
            // Update dialog signaling state with offer/answer in body
            this.dialog.signalingStateTransition(options.body);
        }
        // Update dialog
        this.dialog.reConfirm();
        return result;
    };
    /**
     * Update the dialog signaling state on a 1xx response.
     * @param options - Progress options bucket.
     */
    ReInviteUserAgentServer.prototype.progress = function (options) {
        if (options === void 0) { options = { statusCode: 180 }; }
        // Send and return the response
        var response = _super.prototype.progress.call(this, options);
        var session = this.dialog;
        var result = tslib_1.__assign(tslib_1.__assign({}, response), { session: session });
        // Update dialog signaling state
        if (options.body) {
            this.dialog.signalingStateTransition(options.body);
        }
        return result;
    };
    /**
     * TODO: Not Yet Supported
     * @param contacts - Contacts to redirect to.
     * @param options - Redirect options bucket.
     */
    ReInviteUserAgentServer.prototype.redirect = function (contacts, options) {
        if (options === void 0) { options = { statusCode: 302 }; }
        this.dialog.signalingStateRollback();
        this.dialog.reinviteUserAgentServer = undefined; // ACK will be handled by transaction
        throw new Error("Unimplemented.");
    };
    /**
     * 3.1 Background on Re-INVITE Handling by UASs
     * An error response to a re-INVITE has the following semantics.  As
     * specified in Section 12.2.2 of RFC 3261 [RFC3261], if a re-INVITE is
     * rejected, no state changes are performed.
     * https://tools.ietf.org/html/rfc6141#section-3.1
     * @param options - Reject options bucket.
     */
    ReInviteUserAgentServer.prototype.reject = function (options) {
        if (options === void 0) { options = { statusCode: 488 }; }
        this.dialog.signalingStateRollback();
        this.dialog.reinviteUserAgentServer = undefined; // ACK will be handled by transaction
        return _super.prototype.reject.call(this, options);
    };
    return ReInviteUserAgentServer;
}(user_agent_server_1.UserAgentServer));
exports.ReInviteUserAgentServer = ReInviteUserAgentServer;


/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var messages_1 = __webpack_require__(5);
var transactions_1 = __webpack_require__(28);
var user_agent_client_1 = __webpack_require__(43);
/**
 * REFER UAC.
 * @public
 */
var ReferUserAgentClient = /** @class */ (function (_super) {
    tslib_1.__extends(ReferUserAgentClient, _super);
    function ReferUserAgentClient(dialog, delegate, options) {
        var _this = this;
        var message = dialog.createOutgoingRequestMessage(messages_1.C.REFER, options);
        _this = _super.call(this, transactions_1.NonInviteClientTransaction, dialog.userAgentCore, message, delegate) || this;
        return _this;
    }
    return ReferUserAgentClient;
}(user_agent_client_1.UserAgentClient));
exports.ReferUserAgentClient = ReferUserAgentClient;


/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var transactions_1 = __webpack_require__(28);
var user_agent_server_1 = __webpack_require__(45);
/**
 * REFER UAS.
 * @public
 */
var ReferUserAgentServer = /** @class */ (function (_super) {
    tslib_1.__extends(ReferUserAgentServer, _super);
    /**
     * REFER UAS constructor.
     * @param dialogOrCore - Dialog for in dialog REFER, UserAgentCore for out of dialog REFER.
     * @param message - Incoming REFER request message.
     */
    function ReferUserAgentServer(dialogOrCore, message, delegate) {
        var _this = this;
        var userAgentCore = instanceOfSessionDialog(dialogOrCore) ?
            dialogOrCore.userAgentCore :
            dialogOrCore;
        _this = _super.call(this, transactions_1.NonInviteServerTransaction, userAgentCore, message, delegate) || this;
        return _this;
    }
    return ReferUserAgentServer;
}(user_agent_server_1.UserAgentServer));
exports.ReferUserAgentServer = ReferUserAgentServer;
function instanceOfSessionDialog(object) {
    return object.userAgentCore !== undefined;
}


/***/ }),
/* 58 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var messages_1 = __webpack_require__(5);
var subscription_1 = __webpack_require__(59);
var timers_1 = __webpack_require__(27);
var allowed_methods_1 = __webpack_require__(61);
var notify_user_agent_server_1 = __webpack_require__(51);
var re_subscribe_user_agent_client_1 = __webpack_require__(62);
var dialog_1 = __webpack_require__(4);
/**
 * Subscription Dialog.
 * @remarks
 * SIP-Specific Event Notification
 *
 * Abstract
 *
 *    This document describes an extension to the Session Initiation
 *    Protocol (SIP) defined by RFC 3261.  The purpose of this extension is
 *    to provide an extensible framework by which SIP nodes can request
 *    notification from remote nodes indicating that certain events have
 *    occurred.
 *
 *    Note that the event notification mechanisms defined herein are NOT
 *    intended to be a general-purpose infrastructure for all classes of
 *    event subscription and notification.
 *
 *    This document represents a backwards-compatible improvement on the
 *    original mechanism described by RFC 3265, taking into account several
 *    years of implementation experience.  Accordingly, this document
 *    obsoletes RFC 3265.  This document also updates RFC 4660 slightly to
 *    accommodate some small changes to the mechanism that were discussed
 *    in that document.
 *
 *  https://tools.ietf.org/html/rfc6665
 * @public
 */
var SubscriptionDialog = /** @class */ (function (_super) {
    tslib_1.__extends(SubscriptionDialog, _super);
    function SubscriptionDialog(subscriptionEvent, subscriptionExpires, subscriptionState, core, state, delegate) {
        var _this = _super.call(this, core, state) || this;
        _this.delegate = delegate;
        _this._autoRefresh = false;
        _this._subscriptionEvent = subscriptionEvent;
        _this._subscriptionExpires = subscriptionExpires;
        _this._subscriptionExpiresInitial = subscriptionExpires;
        _this._subscriptionExpiresLastSet = Math.floor(Date.now() / 1000);
        _this._subscriptionRefresh = undefined;
        _this._subscriptionRefreshLastSet = undefined;
        _this._subscriptionState = subscriptionState;
        _this.logger = core.loggerFactory.getLogger("sip.subscribe-dialog");
        _this.logger.log("SUBSCRIBE dialog " + _this.id + " constructed");
        return _this;
    }
    /**
     * When a UAC receives a response that establishes a dialog, it
     * constructs the state of the dialog.  This state MUST be maintained
     * for the duration of the dialog.
     * https://tools.ietf.org/html/rfc3261#section-12.1.2
     * @param outgoingRequestMessage - Outgoing request message for dialog.
     * @param incomingResponseMessage - Incoming response message creating dialog.
     */
    SubscriptionDialog.initialDialogStateForSubscription = function (outgoingSubscribeRequestMessage, incomingNotifyRequestMessage) {
        // If the request was sent over TLS, and the Request-URI contained a
        // SIPS URI, the "secure" flag is set to TRUE.
        // https://tools.ietf.org/html/rfc3261#section-12.1.2
        var secure = false; // FIXME: Currently no support for TLS.
        // The route set MUST be set to the list of URIs in the Record-Route
        // header field from the response, taken in reverse order and preserving
        // all URI parameters.  If no Record-Route header field is present in
        // the response, the route set MUST be set to the empty set.  This route
        // set, even if empty, overrides any pre-existing route set for future
        // requests in this dialog.  The remote target MUST be set to the URI
        // from the Contact header field of the response.
        // https://tools.ietf.org/html/rfc3261#section-12.1.2
        var routeSet = incomingNotifyRequestMessage.getHeaders("record-route");
        var contact = incomingNotifyRequestMessage.parseHeader("contact");
        if (!contact) { // TODO: Review to make sure this will never happen
            throw new Error("Contact undefined.");
        }
        if (!(contact instanceof messages_1.NameAddrHeader)) {
            throw new Error("Contact not instance of NameAddrHeader.");
        }
        var remoteTarget = contact.uri;
        // The local sequence number MUST be set to the value of the sequence
        // number in the CSeq header field of the request.  The remote sequence
        // number MUST be empty (it is established when the remote UA sends a
        // request within the dialog).  The call identifier component of the
        // dialog ID MUST be set to the value of the Call-ID in the request.
        // The local tag component of the dialog ID MUST be set to the tag in
        // the From field in the request, and the remote tag component of the
        // dialog ID MUST be set to the tag in the To field of the response.  A
        // UAC MUST be prepared to receive a response without a tag in the To
        // field, in which case the tag is considered to have a value of null.
        //
        //    This is to maintain backwards compatibility with RFC 2543, which
        //    did not mandate To tags.
        //
        // https://tools.ietf.org/html/rfc3261#section-12.1.2
        var localSequenceNumber = outgoingSubscribeRequestMessage.cseq;
        var remoteSequenceNumber = undefined;
        var callId = outgoingSubscribeRequestMessage.callId;
        var localTag = outgoingSubscribeRequestMessage.fromTag;
        var remoteTag = incomingNotifyRequestMessage.fromTag;
        if (!callId) { // TODO: Review to make sure this will never happen
            throw new Error("Call id undefined.");
        }
        if (!localTag) { // TODO: Review to make sure this will never happen
            throw new Error("From tag undefined.");
        }
        if (!remoteTag) { // TODO: Review to make sure this will never happen
            throw new Error("To tag undefined."); // FIXME: No backwards compatibility with RFC 2543
        }
        // The remote URI MUST be set to the URI in the To field, and the local
        // URI MUST be set to the URI in the From field.
        // https://tools.ietf.org/html/rfc3261#section-12.1.2
        if (!outgoingSubscribeRequestMessage.from) { // TODO: Review to make sure this will never happen
            throw new Error("From undefined.");
        }
        if (!outgoingSubscribeRequestMessage.to) { // TODO: Review to make sure this will never happen
            throw new Error("To undefined.");
        }
        var localURI = outgoingSubscribeRequestMessage.from.uri;
        var remoteURI = outgoingSubscribeRequestMessage.to.uri;
        // A dialog can also be in the "early" state, which occurs when it is
        // created with a provisional response, and then transition to the
        // "confirmed" state when a 2xx final response arrives.
        // https://tools.ietf.org/html/rfc3261#section-12
        var early = false;
        var dialogState = {
            id: callId + localTag + remoteTag,
            early: early,
            callId: callId,
            localTag: localTag,
            remoteTag: remoteTag,
            localSequenceNumber: localSequenceNumber,
            remoteSequenceNumber: remoteSequenceNumber,
            localURI: localURI,
            remoteURI: remoteURI,
            remoteTarget: remoteTarget,
            routeSet: routeSet,
            secure: secure
        };
        return dialogState;
    };
    SubscriptionDialog.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        if (this.N) {
            clearTimeout(this.N);
            this.N = undefined;
        }
        this.refreshTimerClear();
        this.logger.log("SUBSCRIBE dialog " + this.id + " destroyed");
    };
    Object.defineProperty(SubscriptionDialog.prototype, "autoRefresh", {
        get: function () {
            return this._autoRefresh;
        },
        set: function (autoRefresh) {
            this._autoRefresh = true;
            this.refreshTimerSet();
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SubscriptionDialog.prototype, "subscriptionEvent", {
        get: function () {
            return this._subscriptionEvent;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SubscriptionDialog.prototype, "subscriptionExpires", {
        /** Number of seconds until subscription expires. */
        get: function () {
            var secondsSinceLastSet = Math.floor(Date.now() / 1000) - this._subscriptionExpiresLastSet;
            var secondsUntilExpires = this._subscriptionExpires - secondsSinceLastSet;
            return Math.max(secondsUntilExpires, 0);
        },
        set: function (expires) {
            if (expires < 0) {
                throw new Error("Expires must be greater than or equal to zero.");
            }
            this._subscriptionExpires = expires;
            this._subscriptionExpiresLastSet = Math.floor(Date.now() / 1000);
            if (this.autoRefresh) {
                var refresh = this.subscriptionRefresh;
                if (refresh === undefined || refresh >= expires) {
                    this.refreshTimerSet();
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SubscriptionDialog.prototype, "subscriptionExpiresInitial", {
        get: function () {
            return this._subscriptionExpiresInitial;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SubscriptionDialog.prototype, "subscriptionRefresh", {
        /** Number of seconds until subscription auto refresh. */
        get: function () {
            if (this._subscriptionRefresh === undefined || this._subscriptionRefreshLastSet === undefined) {
                return undefined;
            }
            var secondsSinceLastSet = Math.floor(Date.now() / 1000) - this._subscriptionRefreshLastSet;
            var secondsUntilExpires = this._subscriptionRefresh - secondsSinceLastSet;
            return Math.max(secondsUntilExpires, 0);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(SubscriptionDialog.prototype, "subscriptionState", {
        get: function () {
            return this._subscriptionState;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Receive in dialog request message from transport.
     * @param message -  The incoming request message.
     */
    SubscriptionDialog.prototype.receiveRequest = function (message) {
        this.logger.log("SUBSCRIBE dialog " + this.id + " received " + message.method + " request");
        // Request within a dialog out of sequence guard.
        // https://tools.ietf.org/html/rfc3261#section-12.2.2
        if (!this.sequenceGuard(message)) {
            this.logger.log("SUBSCRIBE dialog " + this.id + " rejected out of order " + message.method + " request.");
            return;
        }
        // Request within a dialog common processing.
        // https://tools.ietf.org/html/rfc3261#section-12.2.2
        _super.prototype.receiveRequest.call(this, message);
        // Switch on method and then delegate.
        switch (message.method) {
            case messages_1.C.NOTIFY:
                this.onNotify(message);
                break;
            default:
                this.logger.log("SUBSCRIBE dialog " + this.id + " received unimplemented " + message.method + " request");
                this.core.replyStateless(message, { statusCode: 501 });
                break;
        }
    };
    /**
     * 4.1.2.2.  Refreshing of Subscriptions
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.2
     */
    SubscriptionDialog.prototype.refresh = function () {
        var allowHeader = "Allow: " + allowed_methods_1.AllowedMethods.toString();
        var options = {};
        options.extraHeaders = (options.extraHeaders || []).slice();
        options.extraHeaders.push(allowHeader);
        options.extraHeaders.push("Event: " + this.subscriptionEvent);
        options.extraHeaders.push("Expires: " + this.subscriptionExpiresInitial);
        options.extraHeaders.push("Contact: " + this.core.configuration.contact.toString());
        return this.subscribe(undefined, options);
    };
    /**
     * 4.1.2.2.  Refreshing of Subscriptions
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.2
     * @param delegate - Delegate to handle responses.
     * @param options - Options bucket.
     */
    SubscriptionDialog.prototype.subscribe = function (delegate, options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        if (this.subscriptionState !== subscription_1.SubscriptionState.Pending && this.subscriptionState !== subscription_1.SubscriptionState.Active) {
            // FIXME: This needs to be a proper exception
            throw new Error("Invalid state " + this.subscriptionState + ". May only re-subscribe while in state \"pending\" or \"active\".");
        }
        this.logger.log("SUBSCRIBE dialog " + this.id + " sending SUBSCRIBE request");
        var uac = new re_subscribe_user_agent_client_1.ReSubscribeUserAgentClient(this, delegate, options);
        // When refreshing a subscription, a subscriber starts Timer N, set to
        // 64*T1, when it sends the SUBSCRIBE request.
        // https://tools.ietf.org/html/rfc6665#section-4.1.2.2
        this.N = setTimeout(function () { return _this.timer_N(); }, timers_1.Timers.TIMER_N);
        return uac;
    };
    /**
     * 4.4.1.  Dialog Creation and Termination
     * A subscription is destroyed after a notifier sends a NOTIFY request
     * with a "Subscription-State" of "terminated", or in certain error
     * situations described elsewhere in this document.
     * https://tools.ietf.org/html/rfc6665#section-4.4.1
     */
    SubscriptionDialog.prototype.terminate = function () {
        this.stateTransition(subscription_1.SubscriptionState.Terminated);
        this.onTerminated();
    };
    /**
     * 4.1.2.3.  Unsubscribing
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.3
     */
    SubscriptionDialog.prototype.unsubscribe = function () {
        var allowHeader = "Allow: " + allowed_methods_1.AllowedMethods.toString();
        var options = {};
        options.extraHeaders = (options.extraHeaders || []).slice();
        options.extraHeaders.push(allowHeader);
        options.extraHeaders.push("Event: " + this.subscriptionEvent);
        options.extraHeaders.push("Expires: 0");
        options.extraHeaders.push("Contact: " + this.core.configuration.contact.toString());
        return this.subscribe(undefined, options);
    };
    /**
     * Handle in dialog NOTIFY requests.
     * This does not include the first NOTIFY which created the dialog.
     * @param message - The incoming NOTIFY request message.
     */
    SubscriptionDialog.prototype.onNotify = function (message) {
        // If, for some reason, the event package designated in the "Event"
        // header field of the NOTIFY request is not supported, the subscriber
        // will respond with a 489 (Bad Event) response.
        // https://tools.ietf.org/html/rfc6665#section-4.1.3
        var event = message.parseHeader("Event").event;
        if (!event || event !== this.subscriptionEvent) {
            this.core.replyStateless(message, { statusCode: 489 });
            return;
        }
        // In the state diagram, "Re-subscription times out" means that an
        // attempt to refresh or update the subscription using a new SUBSCRIBE
        // request does not result in a NOTIFY request before the corresponding
        // Timer N expires.
        // https://tools.ietf.org/html/rfc6665#section-4.1.2
        if (this.N) {
            clearTimeout(this.N);
            this.N = undefined;
        }
        // NOTIFY requests MUST contain "Subscription-State" header fields that
        // indicate the status of the subscription.
        // https://tools.ietf.org/html/rfc6665#section-4.1.3
        var subscriptionState = message.parseHeader("Subscription-State");
        if (!subscriptionState || !subscriptionState.state) {
            this.core.replyStateless(message, { statusCode: 489 });
            return;
        }
        var state = subscriptionState.state;
        var expires = subscriptionState.expires ? Math.max(subscriptionState.expires, 0) : undefined;
        // Update our state and expiration.
        switch (state) {
            case "pending":
                this.stateTransition(subscription_1.SubscriptionState.Pending, expires);
                break;
            case "active":
                this.stateTransition(subscription_1.SubscriptionState.Active, expires);
                break;
            case "terminated":
                this.stateTransition(subscription_1.SubscriptionState.Terminated, expires);
                break;
            default:
                this.logger.warn("Unrecognized subscription state.");
                break;
        }
        // Delegate remainder of NOTIFY handling.
        var uas = new notify_user_agent_server_1.NotifyUserAgentServer(this, message);
        if (this.delegate && this.delegate.onNotify) {
            this.delegate.onNotify(uas);
        }
        else {
            uas.accept();
        }
    };
    SubscriptionDialog.prototype.onRefresh = function (request) {
        if (this.delegate && this.delegate.onRefresh) {
            this.delegate.onRefresh(request);
        }
    };
    SubscriptionDialog.prototype.onTerminated = function () {
        if (this.delegate && this.delegate.onTerminated) {
            this.delegate.onTerminated();
        }
    };
    SubscriptionDialog.prototype.refreshTimerClear = function () {
        if (this.refreshTimer) {
            clearTimeout(this.refreshTimer);
            this.refreshTimer = undefined;
        }
    };
    SubscriptionDialog.prototype.refreshTimerSet = function () {
        var _this = this;
        this.refreshTimerClear();
        if (this.autoRefresh && this.subscriptionExpires > 0) {
            var refresh = this.subscriptionExpires * 900;
            this._subscriptionRefresh = Math.floor(refresh / 1000);
            this._subscriptionRefreshLastSet = Math.floor(Date.now() / 1000);
            this.refreshTimer = setTimeout(function () {
                _this.refreshTimer = undefined;
                _this._subscriptionRefresh = undefined;
                _this._subscriptionRefreshLastSet = undefined;
                _this.onRefresh(_this.refresh());
            }, refresh);
        }
    };
    SubscriptionDialog.prototype.stateTransition = function (newState, newExpires) {
        var _this = this;
        // Assert valid state transitions.
        var invalidStateTransition = function () {
            _this.logger.warn("Invalid subscription state transition from " + _this.subscriptionState + " to " + newState);
        };
        switch (newState) {
            case subscription_1.SubscriptionState.Initial:
                invalidStateTransition();
                return;
            case subscription_1.SubscriptionState.NotifyWait:
                invalidStateTransition();
                return;
            case subscription_1.SubscriptionState.Pending:
                if (this.subscriptionState !== subscription_1.SubscriptionState.NotifyWait &&
                    this.subscriptionState !== subscription_1.SubscriptionState.Pending) {
                    invalidStateTransition();
                    return;
                }
                break;
            case subscription_1.SubscriptionState.Active:
                if (this.subscriptionState !== subscription_1.SubscriptionState.NotifyWait &&
                    this.subscriptionState !== subscription_1.SubscriptionState.Pending &&
                    this.subscriptionState !== subscription_1.SubscriptionState.Active) {
                    invalidStateTransition();
                    return;
                }
                break;
            case subscription_1.SubscriptionState.Terminated:
                if (this.subscriptionState !== subscription_1.SubscriptionState.NotifyWait &&
                    this.subscriptionState !== subscription_1.SubscriptionState.Pending &&
                    this.subscriptionState !== subscription_1.SubscriptionState.Active) {
                    invalidStateTransition();
                    return;
                }
                break;
            default:
                invalidStateTransition();
                return;
        }
        // If the "Subscription-State" value is "pending", the subscription has
        // been received by the notifier, but there is insufficient policy
        // information to grant or deny the subscription yet.  If the header
        // field also contains an "expires" parameter, the subscriber SHOULD
        // take it as the authoritative subscription duration and adjust
        // accordingly.  No further action is necessary on the part of the
        // subscriber.  The "retry-after" and "reason" parameters have no
        // semantics for "pending".
        // https://tools.ietf.org/html/rfc6665#section-4.1.3
        if (newState === subscription_1.SubscriptionState.Pending) {
            if (newExpires) {
                this.subscriptionExpires = newExpires;
            }
        }
        // If the "Subscription-State" header field value is "active", it means
        // that the subscription has been accepted and (in general) has been
        // authorized.  If the header field also contains an "expires"
        // parameter, the subscriber SHOULD take it as the authoritative
        // subscription duration and adjust accordingly.  The "retry-after" and
        // "reason" parameters have no semantics for "active".
        // https://tools.ietf.org/html/rfc6665#section-4.1.3
        if (newState === subscription_1.SubscriptionState.Active) {
            if (newExpires) {
                this.subscriptionExpires = newExpires;
            }
        }
        // If the "Subscription-State" value is "terminated", the subscriber
        // MUST consider the subscription terminated.  The "expires" parameter
        // has no semantics for "terminated" -- notifiers SHOULD NOT include an
        // "expires" parameter on a "Subscription-State" header field with a
        // value of "terminated", and subscribers MUST ignore any such
        // parameter, if present.
        if (newState === subscription_1.SubscriptionState.Terminated) {
            this.dispose();
        }
        this._subscriptionState = newState;
    };
    /**
     * When refreshing a subscription, a subscriber starts Timer N, set to
     * 64*T1, when it sends the SUBSCRIBE request.  If this Timer N expires
     * prior to the receipt of a NOTIFY request, the subscriber considers
     * the subscription terminated.  If the subscriber receives a success
     * response to the SUBSCRIBE request that indicates that no NOTIFY
     * request will be generated -- such as the 204 response defined for use
     * with the optional extension described in [RFC5839] -- then it MUST
     * cancel Timer N.
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.2
     */
    SubscriptionDialog.prototype.timer_N = function () {
        if (this.subscriptionState !== subscription_1.SubscriptionState.Terminated) {
            this.stateTransition(subscription_1.SubscriptionState.Terminated);
            this.onTerminated();
        }
    };
    return SubscriptionDialog;
}(dialog_1.Dialog));
exports.SubscriptionDialog = SubscriptionDialog;


/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
tslib_1.__exportStar(__webpack_require__(60), exports);


/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Subscription state.
 * @remarks
 * https://tools.ietf.org/html/rfc6665#section-4.1.2
 * @public
 */
var SubscriptionState;
(function (SubscriptionState) {
    SubscriptionState["Initial"] = "Initial";
    SubscriptionState["NotifyWait"] = "NotifyWait";
    SubscriptionState["Pending"] = "Pending";
    SubscriptionState["Active"] = "Active";
    SubscriptionState["Terminated"] = "Terminated";
})(SubscriptionState = exports.SubscriptionState || (exports.SubscriptionState = {}));


/***/ }),
/* 61 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var messages_1 = __webpack_require__(5);
/**
 * FIXME: TODO: Should be configurable/variable.
 */
exports.AllowedMethods = [
    messages_1.C.ACK,
    messages_1.C.BYE,
    messages_1.C.CANCEL,
    messages_1.C.INFO,
    messages_1.C.INVITE,
    messages_1.C.MESSAGE,
    messages_1.C.NOTIFY,
    messages_1.C.OPTIONS,
    messages_1.C.PRACK,
    messages_1.C.REFER,
    messages_1.C.REGISTER,
    messages_1.C.SUBSCRIBE
];


/***/ }),
/* 62 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var messages_1 = __webpack_require__(5);
var transactions_1 = __webpack_require__(28);
var user_agent_client_1 = __webpack_require__(43);
/**
 * Re-SUBSCRIBE UAC.
 * @public
 */
var ReSubscribeUserAgentClient = /** @class */ (function (_super) {
    tslib_1.__extends(ReSubscribeUserAgentClient, _super);
    function ReSubscribeUserAgentClient(dialog, delegate, options) {
        var _this = this;
        var message = dialog.createOutgoingRequestMessage(messages_1.C.SUBSCRIBE, options);
        _this = _super.call(this, transactions_1.NonInviteClientTransaction, dialog.userAgentCore, message, delegate) || this;
        _this.dialog = dialog;
        return _this;
    }
    ReSubscribeUserAgentClient.prototype.waitNotifyStop = function () {
        // TODO: Placeholder. Not utilized currently.
        return;
    };
    /**
     * Receive a response from the transaction layer.
     * @param message - Incoming response message.
     */
    ReSubscribeUserAgentClient.prototype.receiveResponse = function (message) {
        if (message.statusCode && message.statusCode >= 200 && message.statusCode < 300) {
            //  The "Expires" header field in a 200-class response to SUBSCRIBE
            //  request indicates the actual duration for which the subscription will
            //  remain active (unless refreshed).  The received value might be
            //  smaller than the value indicated in the SUBSCRIBE request but cannot
            //  be larger; see Section 4.2.1 for details.
            // https://tools.ietf.org/html/rfc6665#section-4.1.2.1
            var expires = message.getHeader("Expires");
            if (!expires) {
                this.logger.warn("Expires header missing in a 200-class response to SUBSCRIBE");
            }
            else {
                var subscriptionExpiresReceived = Number(expires);
                if (this.dialog.subscriptionExpires > subscriptionExpiresReceived) {
                    this.dialog.subscriptionExpires = subscriptionExpiresReceived;
                }
            }
        }
        if (message.statusCode && message.statusCode >= 400 && message.statusCode < 700) {
            // If a SUBSCRIBE request to refresh a subscription receives a 404, 405,
            // 410, 416, 480-485, 489, 501, or 604 response, the subscriber MUST
            // consider the subscription terminated.  (See [RFC5057] for further
            // details and notes about the effect of error codes on dialogs and
            // usages within dialog, such as subscriptions).  If the subscriber
            // wishes to re-subscribe to the state, he does so by composing an
            // unrelated initial SUBSCRIBE request with a freshly generated Call-ID
            // and a new, unique "From" tag (see Section 4.1.2.1).
            // https://tools.ietf.org/html/rfc6665#section-4.1.2.2
            var errorCodes = [404, 405, 410, 416, 480, 481, 482, 483, 484, 485, 489, 501, 604];
            if (errorCodes.indexOf(message.statusCode) !== -1) {
                this.dialog.terminate();
            }
            // If a SUBSCRIBE request to refresh a subscription fails with any error
            // code other than those listed above, the original subscription is
            // still considered valid for the duration of the most recently known
            // "Expires" value as negotiated by the most recent successful SUBSCRIBE
            // transaction, or as communicated by a NOTIFY request in its
            // "Subscription-State" header field "expires" parameter.
            // https://tools.ietf.org/html/rfc6665#section-4.1.2.2
        }
        _super.prototype.receiveResponse.call(this, message);
    };
    return ReSubscribeUserAgentClient;
}(user_agent_client_1.UserAgentClient));
exports.ReSubscribeUserAgentClient = ReSubscribeUserAgentClient;


/***/ }),
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
tslib_1.__exportStar(__webpack_require__(64), exports);
tslib_1.__exportStar(__webpack_require__(65), exports);
tslib_1.__exportStar(__webpack_require__(66), exports);


/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Log levels.
 * @public
 */
var Levels;
(function (Levels) {
    Levels[Levels["error"] = 0] = "error";
    Levels[Levels["warn"] = 1] = "warn";
    Levels[Levels["log"] = 2] = "log";
    Levels[Levels["debug"] = 3] = "debug";
})(Levels = exports.Levels || (exports.Levels = {}));


/***/ }),
/* 65 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var levels_1 = __webpack_require__(64);
var logger_1 = __webpack_require__(66);
/**
 * Logger.
 * @public
 */
var LoggerFactory = /** @class */ (function () {
    function LoggerFactory() {
        this.builtinEnabled = true;
        this._level = levels_1.Levels.log;
        this.loggers = {};
        this.logger = this.getLogger("sip:loggerfactory");
    }
    Object.defineProperty(LoggerFactory.prototype, "level", {
        get: function () { return this._level; },
        set: function (newLevel) {
            if (newLevel >= 0 && newLevel <= 3) {
                this._level = newLevel;
            }
            else if (newLevel > 3) {
                this._level = 3;
            }
            else if (levels_1.Levels.hasOwnProperty(newLevel)) {
                this._level = newLevel;
            }
            else {
                this.logger.error("invalid 'level' parameter value: " + JSON.stringify(newLevel));
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(LoggerFactory.prototype, "connector", {
        get: function () {
            return this._connector;
        },
        set: function (value) {
            if (!value) {
                this._connector = undefined;
            }
            else if (typeof value === "function") {
                this._connector = value;
            }
            else {
                this.logger.error("invalid 'connector' parameter value: " + JSON.stringify(value));
            }
        },
        enumerable: true,
        configurable: true
    });
    LoggerFactory.prototype.getLogger = function (category, label) {
        if (label && this.level === 3) {
            return new logger_1.Logger(this, category, label);
        }
        else if (this.loggers[category]) {
            return this.loggers[category];
        }
        else {
            var logger = new logger_1.Logger(this, category);
            this.loggers[category] = logger;
            return logger;
        }
    };
    LoggerFactory.prototype.genericLog = function (levelToLog, category, label, content) {
        if (this.level >= levelToLog) {
            if (this.builtinEnabled) {
                this.print(levelToLog, category, label, content);
            }
        }
        if (this.connector) {
            this.connector(levels_1.Levels[levelToLog], category, label, content);
        }
    };
    LoggerFactory.prototype.print = function (levelToLog, category, label, content) {
        if (typeof content === "string") {
            var prefix = [new Date(), category];
            if (label) {
                prefix.push(label);
            }
            content = prefix.concat(content).join(" | ");
        }
        switch (levelToLog) {
            case levels_1.Levels.error:
                // tslint:disable-next-line:no-console
                console.error(content);
                break;
            case levels_1.Levels.warn:
                // tslint:disable-next-line:no-console
                console.warn(content);
                break;
            case levels_1.Levels.log:
                // tslint:disable-next-line:no-console
                console.log(content);
                break;
            case levels_1.Levels.debug:
                // tslint:disable-next-line:no-console
                console.debug(content);
                break;
            default:
                break;
        }
    };
    return LoggerFactory;
}());
exports.LoggerFactory = LoggerFactory;


/***/ }),
/* 66 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var levels_1 = __webpack_require__(64);
/**
 * Logger.
 * @public
 */
var Logger = /** @class */ (function () {
    function Logger(logger, category, label) {
        this.logger = logger;
        this.category = category;
        this.label = label;
    }
    Logger.prototype.error = function (content) { this.genericLog(levels_1.Levels.error, content); };
    Logger.prototype.warn = function (content) { this.genericLog(levels_1.Levels.warn, content); };
    Logger.prototype.log = function (content) { this.genericLog(levels_1.Levels.log, content); };
    Logger.prototype.debug = function (content) { this.genericLog(levels_1.Levels.debug, content); };
    Logger.prototype.genericLog = function (level, content) {
        this.logger.genericLog(level, this.category, this.label, content);
    };
    return Logger;
}());
exports.Logger = Logger;


/***/ }),
/* 67 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
tslib_1.__exportStar(__webpack_require__(68), exports);


/***/ }),
/* 68 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var messages_1 = __webpack_require__(5);
var transactions_1 = __webpack_require__(28);
var user_agents_1 = __webpack_require__(69);
var allowed_methods_1 = __webpack_require__(61);
/**
 * This is ported from UA.C.ACCEPTED_BODY_TYPES.
 * FIXME: TODO: Should be configurable/variable.
 */
var acceptedBodyTypes = [
    "application/sdp",
    "application/dtmf-relay"
];
/**
 * User Agent Core.
 * @remarks
 * Core designates the functions specific to a particular type
 * of SIP entity, i.e., specific to either a stateful or stateless
 * proxy, a user agent or registrar.  All cores, except those for
 * the stateless proxy, are transaction users.
 * https://tools.ietf.org/html/rfc3261#section-6
 *
 * UAC Core: The set of processing functions required of a UAC that
 * reside above the transaction and transport layers.
 * https://tools.ietf.org/html/rfc3261#section-6
 *
 * UAS Core: The set of processing functions required at a UAS that
 * resides above the transaction and transport layers.
 * https://tools.ietf.org/html/rfc3261#section-6
 * @public
 */
var UserAgentCore = /** @class */ (function () {
    /**
     * Constructor.
     * @param configuration - Configuration.
     * @param delegate - Delegate.
     */
    function UserAgentCore(configuration, delegate) {
        if (delegate === void 0) { delegate = {}; }
        /** UACs. */
        this.userAgentClients = new Map();
        /** UASs. */
        this.userAgentServers = new Map();
        this.configuration = configuration;
        this.delegate = delegate;
        this.dialogs = new Map();
        this.subscribers = new Map();
        this.logger = configuration.loggerFactory.getLogger("sip.user-agent-core");
    }
    /** Destructor. */
    UserAgentCore.prototype.dispose = function () {
        this.reset();
    };
    /** Reset. */
    UserAgentCore.prototype.reset = function () {
        this.dialogs.forEach(function (dialog) { return dialog.dispose(); });
        this.dialogs.clear();
        this.subscribers.forEach(function (subscriber) { return subscriber.dispose(); });
        this.subscribers.clear();
        this.userAgentClients.forEach(function (uac) { return uac.dispose(); });
        this.userAgentClients.clear();
        this.userAgentServers.forEach(function (uac) { return uac.dispose(); });
        this.userAgentServers.clear();
    };
    Object.defineProperty(UserAgentCore.prototype, "loggerFactory", {
        /** Logger factory. */
        get: function () {
            return this.configuration.loggerFactory;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(UserAgentCore.prototype, "transport", {
        /** Transport. */
        get: function () {
            var transport = this.configuration.transportAccessor();
            if (!transport) {
                throw new Error("Transport undefined.");
            }
            return transport;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Send INVITE.
     * @param request - Outgoing request.
     * @param delegate - Request delegate.
     */
    UserAgentCore.prototype.invite = function (request, delegate) {
        return new user_agents_1.InviteUserAgentClient(this, request, delegate);
    };
    /**
     * Send MESSAGE.
     * @param request - Outgoing request.
     * @param delegate - Request delegate.
     */
    UserAgentCore.prototype.message = function (request, delegate) {
        return new user_agents_1.MessageUserAgentClient(this, request, delegate);
    };
    /**
     * Send PUBLISH.
     * @param request - Outgoing request.
     * @param delegate - Request delegate.
     */
    UserAgentCore.prototype.publish = function (request, delegate) {
        return new user_agents_1.PublishUserAgentClient(this, request, delegate);
    };
    /**
     * Send REGISTER.
     * @param request - Outgoing request.
     * @param delegate - Request delegate.
     */
    UserAgentCore.prototype.register = function (request, delegate) {
        return new user_agents_1.RegisterUserAgentClient(this, request, delegate);
    };
    /**
     * Send SUBSCRIBE.
     * @param request - Outgoing request.
     * @param delegate - Request delegate.
     */
    UserAgentCore.prototype.subscribe = function (request, delegate) {
        return new user_agents_1.SubscribeUserAgentClient(this, request, delegate);
    };
    /**
     * Send a request.
     * @param request - Outgoing request.
     * @param delegate - Request delegate.
     */
    UserAgentCore.prototype.request = function (request, delegate) {
        return new user_agents_1.UserAgentClient(transactions_1.NonInviteClientTransaction, this, request, delegate);
    };
    /**
     * Outgoing request message factory function.
     * @param method - Method.
     * @param requestURI - Request-URI.
     * @param fromURI - From URI.
     * @param toURI - To URI.
     * @param options - Request options.
     * @param extraHeaders - Extra headers to add.
     * @param body - Message body.
     */
    UserAgentCore.prototype.makeOutgoingRequestMessage = function (method, requestURI, fromURI, toURI, options, extraHeaders, body) {
        // default values from user agent configuration
        var callIdPrefix = this.configuration.sipjsId;
        var fromDisplayName = this.configuration.displayName;
        var forceRport = this.configuration.viaForceRport;
        var hackViaTcp = this.configuration.hackViaTcp;
        var optionTags = this.configuration.supportedOptionTags.slice();
        if (method === messages_1.C.REGISTER) {
            optionTags.push("path", "gruu");
        }
        if (method === messages_1.C.INVITE && (this.configuration.contact.pubGruu || this.configuration.contact.tempGruu)) {
            optionTags.push("gruu");
        }
        var routeSet = this.configuration.routeSet;
        var userAgentString = this.configuration.userAgentHeaderFieldValue;
        var viaHost = this.configuration.viaHost;
        var defaultOptions = {
            callIdPrefix: callIdPrefix,
            forceRport: forceRport,
            fromDisplayName: fromDisplayName,
            hackViaTcp: hackViaTcp,
            optionTags: optionTags,
            routeSet: routeSet,
            userAgentString: userAgentString,
            viaHost: viaHost,
        };
        // merge provided options with default options
        var requestOptions = tslib_1.__assign(tslib_1.__assign({}, defaultOptions), options);
        return new messages_1.OutgoingRequestMessage(method, requestURI, fromURI, toURI, requestOptions, extraHeaders, body);
    };
    /**
     * Handle an incoming request message from the transport.
     * @param message - Incoming request message from transport layer.
     */
    UserAgentCore.prototype.receiveIncomingRequestFromTransport = function (message) {
        this.receiveRequestFromTransport(message);
    };
    /**
     * Handle an incoming response message from the transport.
     * @param message - Incoming response message from transport layer.
     */
    UserAgentCore.prototype.receiveIncomingResponseFromTransport = function (message) {
        this.receiveResponseFromTransport(message);
    };
    /**
     * A stateless UAS is a UAS that does not maintain transaction state.
     * It replies to requests normally, but discards any state that would
     * ordinarily be retained by a UAS after a response has been sent.  If a
     * stateless UAS receives a retransmission of a request, it regenerates
     * the response and re-sends it, just as if it were replying to the first
     * instance of the request. A UAS cannot be stateless unless the request
     * processing for that method would always result in the same response
     * if the requests are identical. This rules out stateless registrars,
     * for example.  Stateless UASs do not use a transaction layer; they
     * receive requests directly from the transport layer and send responses
     * directly to the transport layer.
     * https://tools.ietf.org/html/rfc3261#section-8.2.7
     * @param message - Incoming request message to reply to.
     * @param statusCode - Status code to reply with.
     */
    UserAgentCore.prototype.replyStateless = function (message, options) {
        var _this = this;
        var userAgent = this.configuration.userAgentHeaderFieldValue;
        var supported = this.configuration.supportedOptionTagsResponse;
        options = tslib_1.__assign(tslib_1.__assign({}, options), { userAgent: userAgent, supported: supported });
        var response = messages_1.constructOutgoingResponse(message, options);
        this.transport.send(response.message).catch(function (error) {
            // If the transport rejects, it SHOULD reject with a TransportError.
            // But the transport may be external code, so we are careful...
            if (error instanceof Error) {
                _this.logger.error(error.message);
            }
            _this.logger.error("Transport error occurred sending stateless reply to " + message.method + " request.");
            // TODO: Currently there is no hook to provide notification that a transport error occurred
            // and throwing would result in an uncaught error (in promise), so we silently eat the error.
            // Furthermore, silently eating stateless reply transport errors is arguably what we want to do here.
        });
        return response;
    };
    /**
     * In Section 18.2.1, replace the last paragraph with:
     *
     * Next, the server transport attempts to match the request to a
     * server transaction.  It does so using the matching rules described
     * in Section 17.2.3.  If a matching server transaction is found, the
     * request is passed to that transaction for processing.  If no match
     * is found, the request is passed to the core, which may decide to
     * construct a new server transaction for that request.
     * https://tools.ietf.org/html/rfc6026#section-8.10
     * @param message - Incoming request message from transport layer.
     */
    UserAgentCore.prototype.receiveRequestFromTransport = function (message) {
        // When a request is received from the network by the server, it has to
        // be matched to an existing transaction.  This is accomplished in the
        // following manner.
        //
        // The branch parameter in the topmost Via header field of the request
        // is examined.  If it is present and begins with the magic cookie
        // "z9hG4bK", the request was generated by a client transaction
        // compliant to this specification.  Therefore, the branch parameter
        // will be unique across all transactions sent by that client.  The
        // request matches a transaction if:
        //
        //    1. the branch parameter in the request is equal to the one in the
        //       top Via header field of the request that created the
        //       transaction, and
        //
        //    2. the sent-by value in the top Via of the request is equal to the
        //       one in the request that created the transaction, and
        //
        //    3. the method of the request matches the one that created the
        //       transaction, except for ACK, where the method of the request
        //       that created the transaction is INVITE.
        //
        // This matching rule applies to both INVITE and non-INVITE transactions
        // alike.
        //
        //    The sent-by value is used as part of the matching process because
        //    there could be accidental or malicious duplication of branch
        //    parameters from different clients.
        // https://tools.ietf.org/html/rfc3261#section-17.2.3
        var transactionId = message.viaBranch; // FIXME: Currently only using rule 1...
        var uas = this.userAgentServers.get(transactionId);
        // When receiving an ACK that matches an existing INVITE server
        // transaction and that does not contain a branch parameter containing
        // the magic cookie defined in RFC 3261, the matching transaction MUST
        // be checked to see if it is in the "Accepted" state.  If it is, then
        // the ACK must be passed directly to the transaction user instead of
        // being absorbed by the transaction state machine.  This is necessary
        // as requests from RFC 2543 clients will not include a unique branch
        // parameter, and the mechanisms for calculating the transaction ID from
        // such a request will be the same for both INVITE and ACKs.
        // https://tools.ietf.org/html/rfc6026#section-6
        // Any ACKs received from the network while in the "Accepted" state MUST be
        // passed directly to the TU and not absorbed.
        // https://tools.ietf.org/html/rfc6026#section-7.1
        if (message.method === messages_1.C.ACK) {
            if (uas && uas.transaction.state === transactions_1.TransactionState.Accepted) {
                if (uas instanceof user_agents_1.InviteUserAgentServer) {
                    // These are ACKs matching an INVITE server transaction.
                    // These should never happen with RFC 3261 compliant user agents
                    // (would be a broken ACK to negative final response or something)
                    // but is apparently how RFC 2543 user agents do things.
                    // We are not currently supporting this case.
                    // NOTE: Not backwards compatible with RFC 2543 (no support for strict-routing).
                    this.logger.warn("Discarding out of dialog ACK after 2xx response sent on transaction " + transactionId + ".");
                    return;
                }
            }
        }
        // The CANCEL method requests that the TU at the server side cancel a
        // pending transaction.  The TU determines the transaction to be
        // cancelled by taking the CANCEL request, and then assuming that the
        // request method is anything but CANCEL or ACK and applying the
        // transaction matching procedures of Section 17.2.3.  The matching
        // transaction is the one to be cancelled.
        // https://tools.ietf.org/html/rfc3261#section-9.2
        if (message.method === messages_1.C.CANCEL) {
            if (uas) {
                // Regardless of the method of the original request, as long as the
                // CANCEL matched an existing transaction, the UAS answers the CANCEL
                // request itself with a 200 (OK) response.
                // https://tools.ietf.org/html/rfc3261#section-9.2
                this.replyStateless(message, { statusCode: 200 });
                // If the transaction for the original request still exists, the behavior
                // of the UAS on receiving a CANCEL request depends on whether it has already
                // sent a final response for the original request. If it has, the CANCEL
                // request has no effect on the processing of the original request, no
                // effect on any session state, and no effect on the responses generated
                // for the original request. If the UAS has not issued a final response
                // for the original request, its behavior depends on the method of the
                // original request. If the original request was an INVITE, the UAS
                // SHOULD immediately respond to the INVITE with a 487 (Request
                // Terminated).
                // https://tools.ietf.org/html/rfc3261#section-9.2
                if (uas.transaction instanceof transactions_1.InviteServerTransaction &&
                    uas.transaction.state === transactions_1.TransactionState.Proceeding) {
                    if (uas instanceof user_agents_1.InviteUserAgentServer) {
                        uas.receiveCancel(message);
                    }
                    // A CANCEL request has no impact on the processing of
                    // transactions with any other method defined in this specification.
                    // https://tools.ietf.org/html/rfc3261#section-9.2
                }
            }
            else {
                // If the UAS did not find a matching transaction for the CANCEL
                // according to the procedure above, it SHOULD respond to the CANCEL
                // with a 481 (Call Leg/Transaction Does Not Exist).
                // https://tools.ietf.org/html/rfc3261#section-9.2
                this.replyStateless(message, { statusCode: 481 });
            }
            return;
        }
        // If a matching server transaction is found, the request is passed to that
        // transaction for processing.
        // https://tools.ietf.org/html/rfc6026#section-8.10
        if (uas) {
            uas.transaction.receiveRequest(message);
            return;
        }
        // If no match is found, the request is passed to the core, which may decide to
        // construct a new server transaction for that request.
        // https://tools.ietf.org/html/rfc6026#section-8.10
        this.receiveRequest(message);
        return;
    };
    /**
     * UAC and UAS procedures depend strongly on two factors.  First, based
     * on whether the request or response is inside or outside of a dialog,
     * and second, based on the method of a request.  Dialogs are discussed
     * thoroughly in Section 12; they represent a peer-to-peer relationship
     * between user agents and are established by specific SIP methods, such
     * as INVITE.
     * @param message - Incoming request message.
     */
    UserAgentCore.prototype.receiveRequest = function (message) {
        // 8.2 UAS Behavior
        // UASs SHOULD process the requests in the order of the steps that
        // follow in this section (that is, starting with authentication, then
        // inspecting the method, the header fields, and so on throughout the
        // remainder of this section).
        // https://tools.ietf.org/html/rfc3261#section-8.2
        // 8.2.1 Method Inspection
        // Once a request is authenticated (or authentication is skipped), the
        // UAS MUST inspect the method of the request.  If the UAS recognizes
        // but does not support the method of a request, it MUST generate a 405
        // (Method Not Allowed) response.  Procedures for generating responses
        // are described in Section 8.2.6.  The UAS MUST also add an Allow
        // header field to the 405 (Method Not Allowed) response.  The Allow
        // header field MUST list the set of methods supported by the UAS
        // generating the message.
        // https://tools.ietf.org/html/rfc3261#section-8.2.1
        if (allowed_methods_1.AllowedMethods.indexOf(message.method) === -1) {
            var allowHeader = "Allow: " + allowed_methods_1.AllowedMethods.toString();
            this.replyStateless(message, {
                statusCode: 405,
                extraHeaders: [allowHeader]
            });
            return;
        }
        // 8.2.2 Header Inspection
        // https://tools.ietf.org/html/rfc3261#section-8.2.2
        if (!message.ruri) { // FIXME: A request message should always have an ruri
            throw new Error("Request-URI undefined.");
        }
        // 8.2.2.1 To and Request-URI
        // If the Request-URI uses a scheme not supported by the UAS, it SHOULD
        // reject the request with a 416 (Unsupported URI Scheme) response.
        // https://tools.ietf.org/html/rfc3261#section-8.2.2.1
        if (message.ruri.scheme !== "sip") {
            this.replyStateless(message, { statusCode: 416 });
            return;
        }
        // 8.2.2.1 To and Request-URI
        // If the Request-URI does not identify an address that the
        // UAS is willing to accept requests for, it SHOULD reject
        // the request with a 404 (Not Found) response.
        // https://tools.ietf.org/html/rfc3261#section-8.2.2.1
        var ruri = message.ruri;
        var ruriMatches = function (uri) {
            return !!uri && uri.user === ruri.user;
        };
        if (!ruriMatches(this.configuration.aor) &&
            !(ruriMatches(this.configuration.contact.uri) ||
                ruriMatches(this.configuration.contact.pubGruu) ||
                ruriMatches(this.configuration.contact.tempGruu))) {
            this.logger.warn("Request-URI does not point to us.");
            if (message.method !== messages_1.C.ACK) {
                this.replyStateless(message, { statusCode: 404 });
            }
            return;
        }
        // 8.2.2.1 To and Request-URI
        // Other potential sources of received Request-URIs include
        // the Contact header fields of requests and responses sent by the UA
        // that establish or refresh dialogs.
        // https://tools.ietf.org/html/rfc3261#section-8.2.2.1
        if (message.method === messages_1.C.INVITE) {
            if (!message.hasHeader("Contact")) {
                this.replyStateless(message, {
                    statusCode: 400,
                    reasonPhrase: "Missing Contact Header"
                });
                return;
            }
        }
        // 8.2.2.2 Merged Requests
        // If the request has no tag in the To header field, the UAS core MUST
        // check the request against ongoing transactions.  If the From tag,
        // Call-ID, and CSeq exactly match those associated with an ongoing
        // transaction, but the request does not match that transaction (based
        // on the matching rules in Section 17.2.3), the UAS core SHOULD
        // generate a 482 (Loop Detected) response and pass it to the server
        // transaction.
        //
        //    The same request has arrived at the UAS more than once, following
        //    different paths, most likely due to forking.  The UAS processes
        //    the first such request received and responds with a 482 (Loop
        //    Detected) to the rest of them.
        // https://tools.ietf.org/html/rfc3261#section-8.2.2.2
        if (!message.toTag) {
            var transactionId = message.viaBranch;
            if (!this.userAgentServers.has(transactionId)) {
                var mergedRequest = Array.from(this.userAgentServers.values())
                    .some(function (uas) {
                    return uas.transaction.request.fromTag === message.fromTag &&
                        uas.transaction.request.callId === message.callId &&
                        uas.transaction.request.cseq === message.cseq;
                });
                if (mergedRequest) {
                    this.replyStateless(message, { statusCode: 482 });
                    return;
                }
            }
        }
        // 8.2.2.3 Require
        // https://tools.ietf.org/html/rfc3261#section-8.2.2.3
        // TODO
        // 8.2.3 Content Processing
        // https://tools.ietf.org/html/rfc3261#section-8.2.3
        // TODO
        // 8.2.4 Applying Extensions
        // https://tools.ietf.org/html/rfc3261#section-8.2.4
        // TODO
        // 8.2.5 Processing the Request
        // Assuming all of the checks in the previous subsections are passed,
        // the UAS processing becomes method-specific.
        // https://tools.ietf.org/html/rfc3261#section-8.2.5
        // The UAS will receive the request from the transaction layer.  If the
        // request has a tag in the To header field, the UAS core computes the
        // dialog identifier corresponding to the request and compares it with
        // existing dialogs.  If there is a match, this is a mid-dialog request.
        // In that case, the UAS first applies the same processing rules for
        // requests outside of a dialog, discussed in Section 8.2.
        // https://tools.ietf.org/html/rfc3261#section-12.2.2
        if (message.toTag) {
            this.receiveInsideDialogRequest(message);
        }
        else {
            this.receiveOutsideDialogRequest(message);
        }
        return;
    };
    /**
     * Once a dialog has been established between two UAs, either of them
     * MAY initiate new transactions as needed within the dialog.  The UA
     * sending the request will take the UAC role for the transaction.  The
     * UA receiving the request will take the UAS role.  Note that these may
     * be different roles than the UAs held during the transaction that
     * established the dialog.
     * https://tools.ietf.org/html/rfc3261#section-12.2
     * @param message - Incoming request message.
     */
    UserAgentCore.prototype.receiveInsideDialogRequest = function (message) {
        // NOTIFY requests are matched to such SUBSCRIBE requests if they
        // contain the same "Call-ID", a "To" header field "tag" parameter that
        // matches the "From" header field "tag" parameter of the SUBSCRIBE
        // request, and the same "Event" header field.  Rules for comparisons of
        // the "Event" header fields are described in Section 8.2.1.
        // https://tools.ietf.org/html/rfc6665#section-4.4.1
        if (message.method === messages_1.C.NOTIFY) {
            var event_1 = message.parseHeader("Event");
            if (!event_1 || !event_1.event) {
                this.replyStateless(message, { statusCode: 489 });
                return;
            }
            // FIXME: Subscriber id should also matching on event id.
            var subscriberId = message.callId + message.toTag + event_1.event;
            var subscriber = this.subscribers.get(subscriberId);
            if (subscriber) {
                var uas = new user_agents_1.NotifyUserAgentServer(this, message);
                subscriber.onNotify(uas);
                return;
            }
        }
        // Requests sent within a dialog, as any other requests, are atomic.  If
        // a particular request is accepted by the UAS, all the state changes
        // associated with it are performed.  If the request is rejected, none
        // of the state changes are performed.
        //
        //    Note that some requests, such as INVITEs, affect several pieces of
        //    state.
        //
        // The UAS will receive the request from the transaction layer.  If the
        // request has a tag in the To header field, the UAS core computes the
        // dialog identifier corresponding to the request and compares it with
        // existing dialogs.  If there is a match, this is a mid-dialog request.
        // https://tools.ietf.org/html/rfc3261#section-12.2.2
        var dialogId = message.callId + message.toTag + message.fromTag;
        var dialog = this.dialogs.get(dialogId);
        if (dialog) {
            // [Sip-implementors] Reg. SIP reinvite, UPDATE and OPTIONS
            // You got the question right.
            //
            // And you got the right answer too. :-)
            //
            //   Thanks,
            //   Paul
            //
            // Robert Sparks wrote:
            // > So I've lost track of the question during the musing.
            // >
            // > I _think_ the fundamental question being asked is this:
            // >
            // > Is an endpoint required to reject (with a 481) an OPTIONS request that
            // > arrives with at to-tag but does not match any existing dialog state.
            // > (Assuming some earlier requirement hasn't forced another error code). Or
            // > is it OK if it just sends
            // > a 200 OK anyhow.
            // >
            // > My take on the collection of specs is that its _not_ ok for it to send
            // > the 200 OK anyhow and that it is required to send
            // > the 481. I base this primarily on these sentences from 11.2 in 3261:
            // >
            // >    The response to an OPTIONS is constructed using the standard rules
            // >    for a SIP response as discussed in Section 8.2.6.  The response code
            // >    chosen MUST be the same that would have been chosen had the request
            // >    been an INVITE.
            // >
            // > Did I miss the point of the question?
            // >
            // > On May 15, 2008, at 12:48 PM, Paul Kyzivat wrote:
            // >
            // >> [Including Robert in hopes of getting his insight on this.]
            // https://lists.cs.columbia.edu/pipermail/sip-implementors/2008-May/019178.html
            //
            // Requests that do not change in any way the state of a dialog may be
            // received within a dialog (for example, an OPTIONS request).  They are
            // processed as if they had been received outside the dialog.
            // https://tools.ietf.org/html/rfc3261#section-12.2.2
            if (message.method === messages_1.C.OPTIONS) {
                var allowHeader = "Allow: " + allowed_methods_1.AllowedMethods.toString();
                var acceptHeader = "Accept: " + acceptedBodyTypes.toString();
                this.replyStateless(message, {
                    statusCode: 200,
                    extraHeaders: [allowHeader, acceptHeader]
                });
                return;
            }
            // Pass the incoming request to the dialog for further handling.
            dialog.receiveRequest(message);
            return;
        }
        // The most important behaviors of a stateless UAS are the following:
        // ...
        // o  A stateless UAS MUST ignore ACK requests.
        // ...
        // https://tools.ietf.org/html/rfc3261#section-8.2.7
        if (message.method === messages_1.C.ACK) {
            // If a final response to an INVITE was sent statelessly,
            // the corresponding ACK:
            // - will not match an existing transaction
            // - may have tag in the To header field
            // - not not match any existing dialogs
            // Absorb unmatched ACKs.
            return;
        }
        // If the request has a tag in the To header field, but the dialog
        // identifier does not match any existing dialogs, the UAS may have
        // crashed and restarted, or it may have received a request for a
        // different (possibly failed) UAS (the UASs can construct the To tags
        // so that a UAS can identify that the tag was for a UAS for which it is
        // providing recovery).  Another possibility is that the incoming
        // request has been simply mis-routed.  Based on the To tag, the UAS MAY
        // either accept or reject the request.  Accepting the request for
        // acceptable To tags provides robustness, so that dialogs can persist
        // even through crashes.  UAs wishing to support this capability must
        // take into consideration some issues such as choosing monotonically
        // increasing CSeq sequence numbers even across reboots, reconstructing
        // the route set, and accepting out-of-range RTP timestamps and sequence
        // numbers.
        //
        // If the UAS wishes to reject the request because it does not wish to
        // recreate the dialog, it MUST respond to the request with a 481
        // (Call/Transaction Does Not Exist) status code and pass that to the
        // server transaction.
        // https://tools.ietf.org/html/rfc3261#section-12.2.2
        this.replyStateless(message, { statusCode: 481 });
        return;
    };
    /**
     * Assuming all of the checks in the previous subsections are passed,
     * the UAS processing becomes method-specific.
     *  https://tools.ietf.org/html/rfc3261#section-8.2.5
     * @param message - Incoming request message.
     */
    UserAgentCore.prototype.receiveOutsideDialogRequest = function (message) {
        switch (message.method) {
            case messages_1.C.ACK:
                // Absorb stray out of dialog ACKs
                break;
            case messages_1.C.BYE:
                // If the BYE does not match an existing dialog, the UAS core SHOULD
                // generate a 481 (Call/Transaction Does Not Exist) response and pass
                // that to the server transaction. This rule means that a BYE sent
                // without tags by a UAC will be rejected.
                // https://tools.ietf.org/html/rfc3261#section-15.1.2
                this.replyStateless(message, { statusCode: 481 });
                break;
            case messages_1.C.CANCEL:
                throw new Error("Unexpected out of dialog request method " + message.method + ".");
                break;
            case messages_1.C.INFO:
                // Use of the INFO method does not constitute a separate dialog usage.
                // INFO messages are always part of, and share the fate of, an invite
                // dialog usage [RFC5057].  INFO messages cannot be sent as part of
                // other dialog usages, or outside an existing dialog.
                // https://tools.ietf.org/html/rfc6086#section-1
                this.replyStateless(message, { statusCode: 405 }); // Should never happen
                break;
            case messages_1.C.INVITE:
                // https://tools.ietf.org/html/rfc3261#section-13.3.1
                {
                    var uas = new user_agents_1.InviteUserAgentServer(this, message);
                    this.delegate.onInvite ?
                        this.delegate.onInvite(uas) :
                        uas.reject();
                }
                break;
            case messages_1.C.MESSAGE:
                // MESSAGE requests are discouraged inside a dialog.  Implementations
                // are restricted from creating a usage for the purpose of carrying a
                // sequence of MESSAGE requests (though some implementations use it that
                // way, against the standard recommendation).
                // https://tools.ietf.org/html/rfc5057#section-5.3
                {
                    var uas = new user_agents_1.MessageUserAgentServer(this, message);
                    this.delegate.onMessage ?
                        this.delegate.onMessage(uas) :
                        uas.accept();
                }
                break;
            case messages_1.C.NOTIFY:
                // Obsoleted by: RFC 6665
                // If any non-SUBSCRIBE mechanisms are defined to create subscriptions,
                // it is the responsibility of the parties defining those mechanisms to
                // ensure that correlation of a NOTIFY message to the corresponding
                // subscription is possible.  Designers of such mechanisms are also
                // warned to make a distinction between sending a NOTIFY message to a
                // subscriber who is aware of the subscription, and sending a NOTIFY
                // message to an unsuspecting node.  The latter behavior is invalid, and
                // MUST receive a "481 Subscription does not exist" response (unless
                // some other 400- or 500-class error code is more applicable), as
                // described in section 3.2.4.  In other words, knowledge of a
                // subscription must exist in both the subscriber and the notifier to be
                // valid, even if installed via a non-SUBSCRIBE mechanism.
                // https://tools.ietf.org/html/rfc3265#section-3.2
                //
                // NOTIFY requests are sent to inform subscribers of changes in state to
                // which the subscriber has a subscription.  Subscriptions are created
                // using the SUBSCRIBE method.  In legacy implementations, it is
                // possible that other means of subscription creation have been used.
                // However, this specification does not allow the creation of
                // subscriptions except through SUBSCRIBE requests and (for backwards-
                // compatibility) REFER requests [RFC3515].
                // https://tools.ietf.org/html/rfc6665#section-3.2
                {
                    var uas = new user_agents_1.NotifyUserAgentServer(this, message);
                    this.delegate.onNotify ?
                        this.delegate.onNotify(uas) :
                        uas.reject({ statusCode: 405 });
                }
                break;
            case messages_1.C.OPTIONS:
                // https://tools.ietf.org/html/rfc3261#section-11.2
                {
                    var allowHeader = "Allow: " + allowed_methods_1.AllowedMethods.toString();
                    var acceptHeader = "Accept: " + acceptedBodyTypes.toString();
                    this.replyStateless(message, {
                        statusCode: 200,
                        extraHeaders: [allowHeader, acceptHeader]
                    });
                }
                break;
            case messages_1.C.REFER:
                // https://tools.ietf.org/html/rfc3515#section-2.4.2
                {
                    var uas = new user_agents_1.ReferUserAgentServer(this, message);
                    this.delegate.onRefer ?
                        this.delegate.onRefer(uas) :
                        uas.reject({ statusCode: 405 });
                }
                break;
            case messages_1.C.REGISTER:
                // https://tools.ietf.org/html/rfc3261#section-10.3
                {
                    var uas = new user_agents_1.RegisterUserAgentServer(this, message);
                    this.delegate.onRegister ?
                        this.delegate.onRegister(uas) :
                        uas.reject({ statusCode: 405 });
                }
                break;
            case messages_1.C.SUBSCRIBE:
                // https://tools.ietf.org/html/rfc6665#section-4.2
                {
                    var uas = new user_agents_1.SubscribeUserAgentServer(this, message);
                    this.delegate.onSubscribe ?
                        this.delegate.onSubscribe(uas) :
                        uas.reject({ statusCode: 480 });
                }
                break;
            default:
                throw new Error("Unexpected out of dialog request method " + message.method + ".");
        }
        return;
    };
    /**
     * Responses are first processed by the transport layer and then passed
     * up to the transaction layer.  The transaction layer performs its
     * processing and then passes the response up to the TU.  The majority
     * of response processing in the TU is method specific.  However, there
     * are some general behaviors independent of the method.
     * https://tools.ietf.org/html/rfc3261#section-8.1.3
     * @param message - Incoming response message from transport layer.
     */
    UserAgentCore.prototype.receiveResponseFromTransport = function (message) {
        // 8.1.3.1 Transaction Layer Errors
        // https://tools.ietf.org/html/rfc3261#section-8.1.3.1
        // Handled by transaction layer callbacks.
        // 8.1.3.2 Unrecognized Responses
        // https://tools.ietf.org/html/rfc3261#section-8.1.3.1
        // TODO
        // 8.1.3.3 Vias
        // https://tools.ietf.org/html/rfc3261#section-8.1.3.3
        if (message.getHeaders("via").length > 1) {
            this.logger.warn("More than one Via header field present in the response, dropping");
            return;
        }
        // 8.1.3.4 Processing 3xx Responses
        // https://tools.ietf.org/html/rfc3261#section-8.1.3.4
        // TODO
        // 8.1.3.5 Processing 4xx Responses
        // https://tools.ietf.org/html/rfc3261#section-8.1.3.5
        // TODO
        // When the transport layer in the client receives a response, it has to
        // determine which client transaction will handle the response, so that
        // the processing of Sections 17.1.1 and 17.1.2 can take place.  The
        // branch parameter in the top Via header field is used for this
        // purpose.  A response matches a client transaction under two
        // conditions:
        //
        //    1.  If the response has the same value of the branch parameter in
        //        the top Via header field as the branch parameter in the top
        //        Via header field of the request that created the transaction.
        //
        //    2.  If the method parameter in the CSeq header field matches the
        //        method of the request that created the transaction.  The
        //        method is needed since a CANCEL request constitutes a
        //        different transaction, but shares the same value of the branch
        //        parameter.
        // https://tools.ietf.org/html/rfc3261#section-17.1.3
        var userAgentClientId = message.viaBranch + message.method;
        var userAgentClient = this.userAgentClients.get(userAgentClientId);
        // The client transport uses the matching procedures of Section
        // 17.1.3 to attempt to match the response to an existing
        // transaction.  If there is a match, the response MUST be passed to
        // that transaction.  Otherwise, any element other than a stateless
        // proxy MUST silently discard the response.
        // https://tools.ietf.org/html/rfc6026#section-8.9
        if (userAgentClient) {
            userAgentClient.transaction.receiveResponse(message);
        }
        else {
            this.logger.warn("Discarding unmatched " + message.statusCode + " response to " + message.method + " " + userAgentClientId + ".");
        }
    };
    return UserAgentCore;
}());
exports.UserAgentCore = UserAgentCore;


/***/ }),
/* 69 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
tslib_1.__exportStar(__webpack_require__(42), exports);
tslib_1.__exportStar(__webpack_require__(44), exports);
tslib_1.__exportStar(__webpack_require__(70), exports);
tslib_1.__exportStar(__webpack_require__(46), exports);
tslib_1.__exportStar(__webpack_require__(47), exports);
tslib_1.__exportStar(__webpack_require__(71), exports);
tslib_1.__exportStar(__webpack_require__(72), exports);
tslib_1.__exportStar(__webpack_require__(48), exports);
tslib_1.__exportStar(__webpack_require__(49), exports);
tslib_1.__exportStar(__webpack_require__(50), exports);
tslib_1.__exportStar(__webpack_require__(51), exports);
tslib_1.__exportStar(__webpack_require__(73), exports);
tslib_1.__exportStar(__webpack_require__(52), exports);
tslib_1.__exportStar(__webpack_require__(53), exports);
tslib_1.__exportStar(__webpack_require__(54), exports);
tslib_1.__exportStar(__webpack_require__(55), exports);
tslib_1.__exportStar(__webpack_require__(62), exports);
tslib_1.__exportStar(__webpack_require__(74), exports);
tslib_1.__exportStar(__webpack_require__(56), exports);
tslib_1.__exportStar(__webpack_require__(57), exports);
tslib_1.__exportStar(__webpack_require__(75), exports);
tslib_1.__exportStar(__webpack_require__(76), exports);
tslib_1.__exportStar(__webpack_require__(77), exports);
tslib_1.__exportStar(__webpack_require__(78), exports);
tslib_1.__exportStar(__webpack_require__(43), exports);
tslib_1.__exportStar(__webpack_require__(45), exports);


/***/ }),
/* 70 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var transactions_1 = __webpack_require__(28);
var user_agent_client_1 = __webpack_require__(43);
/**
 * CANCEL UAC.
 * @public
 */
var CancelUserAgentClient = /** @class */ (function (_super) {
    tslib_1.__extends(CancelUserAgentClient, _super);
    function CancelUserAgentClient(core, message, delegate) {
        return _super.call(this, transactions_1.NonInviteClientTransaction, core, message, delegate) || this;
    }
    return CancelUserAgentClient;
}(user_agent_client_1.UserAgentClient));
exports.CancelUserAgentClient = CancelUserAgentClient;


/***/ }),
/* 71 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var dialogs_1 = __webpack_require__(3);
var session_1 = __webpack_require__(25);
var transactions_1 = __webpack_require__(28);
var user_agent_client_1 = __webpack_require__(43);
/**
 * INVITE UAC.
 * @remarks
 * 13 Initiating a Session
 * https://tools.ietf.org/html/rfc3261#section-13
 * 13.1 Overview
 * https://tools.ietf.org/html/rfc3261#section-13.1
 * 13.2 UAC Processing
 * https://tools.ietf.org/html/rfc3261#section-13.2
 * @public
 */
var InviteUserAgentClient = /** @class */ (function (_super) {
    tslib_1.__extends(InviteUserAgentClient, _super);
    function InviteUserAgentClient(core, message, delegate) {
        var _this = _super.call(this, transactions_1.InviteClientTransaction, core, message, delegate) || this;
        _this.confirmedDialogAcks = new Map();
        _this.confirmedDialogs = new Map();
        _this.earlyDialogs = new Map();
        _this.delegate = delegate;
        return _this;
    }
    InviteUserAgentClient.prototype.dispose = function () {
        // The UAC core considers the INVITE transaction completed 64*T1 seconds
        // after the reception of the first 2xx response.  At this point all the
        // early dialogs that have not transitioned to established dialogs are
        // terminated.  Once the INVITE transaction is considered completed by
        // the UAC core, no more new 2xx responses are expected to arrive.
        //
        // If, after acknowledging any 2xx response to an INVITE, the UAC does
        // not want to continue with that dialog, then the UAC MUST terminate
        // the dialog by sending a BYE request as described in Section 15.
        // https://tools.ietf.org/html/rfc3261#section-13.2.2.4
        this.earlyDialogs.forEach(function (earlyDialog) { return earlyDialog.dispose(); });
        this.earlyDialogs.clear();
        _super.prototype.dispose.call(this);
    };
    /**
     * Special case for transport error while sending ACK.
     * @param error - Transport error
     */
    InviteUserAgentClient.prototype.onTransportError = function (error) {
        if (this.transaction.state === transactions_1.TransactionState.Calling) {
            return _super.prototype.onTransportError.call(this, error);
        }
        // If not in 'calling' state, the transport error occurred while sending an ACK.
        this.logger.error(error.message);
        this.logger.error("User agent client request transport error while sending ACK.");
    };
    /**
     * Once the INVITE has been passed to the INVITE client transaction, the
     * UAC waits for responses for the INVITE.
     * https://tools.ietf.org/html/rfc3261#section-13.2.2
     * @param incomingResponse - Incoming response to INVITE request.
     */
    InviteUserAgentClient.prototype.receiveResponse = function (message) {
        var _this = this;
        if (!this.authenticationGuard(message)) {
            return;
        }
        var statusCode = message.statusCode ? message.statusCode.toString() : "";
        if (!statusCode) {
            throw new Error("Response status code undefined.");
        }
        switch (true) {
            case /^100$/.test(statusCode):
                if (this.delegate && this.delegate.onTrying) {
                    this.delegate.onTrying({ message: message });
                }
                return;
            case /^1[0-9]{2}$/.test(statusCode):
                // Zero, one or multiple provisional responses may arrive before one or
                // more final responses are received.  Provisional responses for an
                // INVITE request can create "early dialogs".  If a provisional response
                // has a tag in the To field, and if the dialog ID of the response does
                // not match an existing dialog, one is constructed using the procedures
                // defined in Section 12.1.2.
                //
                // The early dialog will only be needed if the UAC needs to send a
                // request to its peer within the dialog before the initial INVITE
                // transaction completes.  Header fields present in a provisional
                // response are applicable as long as the dialog is in the early state
                // (for example, an Allow header field in a provisional response
                // contains the methods that can be used in the dialog while this is in
                // the early state).
                // https://tools.ietf.org/html/rfc3261#section-13.2.2.1
                {
                    // Provisional without to tag, no dialog to create.
                    if (!message.toTag) {
                        this.logger.warn("Non-100 1xx INVITE response received without a to tag, dropping.");
                        return;
                    }
                    // Compute dialog state.
                    var dialogState = dialogs_1.Dialog.initialDialogStateForUserAgentClient(this.message, message);
                    // Have existing early dialog or create a new one.
                    var earlyDialog = this.earlyDialogs.get(dialogState.id);
                    if (!earlyDialog) {
                        var transaction = this.transaction;
                        if (!(transaction instanceof transactions_1.InviteClientTransaction)) {
                            throw new Error("Transaction not instance of InviteClientTransaction.");
                        }
                        earlyDialog = new dialogs_1.SessionDialog(transaction, this.core, dialogState);
                        this.earlyDialogs.set(earlyDialog.id, earlyDialog);
                    }
                    // Guard against out of order reliable provisional responses.
                    // Note that this is where the rseq tracking is done.
                    if (!earlyDialog.reliableSequenceGuard(message)) {
                        this.logger.warn("1xx INVITE reliable response received out of order, dropping.");
                        return;
                    }
                    // If the initial offer is in an INVITE, the answer MUST be in a
                    // reliable non-failure message from UAS back to UAC which is
                    // correlated to that INVITE.  For this specification, that is
                    // only the final 2xx response to that INVITE.  That same exact
                    // answer MAY also be placed in any provisional responses sent
                    // prior to the answer.  The UAC MUST treat the first session
                    // description it receives as the answer, and MUST ignore any
                    // session descriptions in subsequent responses to the initial
                    // INVITE.
                    // https://tools.ietf.org/html/rfc3261#section-13.2.1
                    if (earlyDialog.signalingState === session_1.SignalingState.Initial ||
                        earlyDialog.signalingState === session_1.SignalingState.HaveLocalOffer) {
                        earlyDialog.signalingStateTransition(message);
                    }
                    // Pass response to delegate.
                    var session_2 = earlyDialog;
                    if (this.delegate && this.delegate.onProgress) {
                        this.delegate.onProgress({
                            message: message,
                            session: session_2,
                            prack: function (options) {
                                var outgoingPrackRequest = session_2.prack(undefined, options);
                                return outgoingPrackRequest;
                            }
                        });
                    }
                }
                return;
            case /^2[0-9]{2}$/.test(statusCode):
                // Multiple 2xx responses may arrive at the UAC for a single INVITE
                // request due to a forking proxy.  Each response is distinguished by
                // the tag parameter in the To header field, and each represents a
                // distinct dialog, with a distinct dialog identifier.
                //
                // If the dialog identifier in the 2xx response matches the dialog
                // identifier of an existing dialog, the dialog MUST be transitioned to
                // the "confirmed" state, and the route set for the dialog MUST be
                // recomputed based on the 2xx response using the procedures of Section
                // 12.2.1.2.  Otherwise, a new dialog in the "confirmed" state MUST be
                // constructed using the procedures of Section 12.1.2.
                // https://tools.ietf.org/html/rfc3261#section-13.2.2.4
                {
                    // Compute dialog state.
                    var dialogState = dialogs_1.Dialog.initialDialogStateForUserAgentClient(this.message, message);
                    // NOTE: Currently our transaction layer is caching the 2xx ACKs and
                    // handling retransmissions of the ACK which is an approach which is
                    // not to spec. In any event, this block is intended to provide a to
                    // spec implementation of ACK retransmissions, but it should not be
                    // hit currently.
                    var dialog = this.confirmedDialogs.get(dialogState.id);
                    if (dialog) {
                        // Once the ACK has been constructed, the procedures of [4] are used to
                        // determine the destination address, port and transport.  However, the
                        // request is passed to the transport layer directly for transmission,
                        // rather than a client transaction.  This is because the UAC core
                        // handles retransmissions of the ACK, not the transaction layer.  The
                        // ACK MUST be passed to the client transport every time a
                        // retransmission of the 2xx final response that triggered the ACK
                        // arrives.
                        // https://tools.ietf.org/html/rfc3261#section-13.2.2.4
                        var outgoingAckRequest = this.confirmedDialogAcks.get(dialogState.id);
                        if (outgoingAckRequest) {
                            var transaction = this.transaction;
                            if (!(transaction instanceof transactions_1.InviteClientTransaction)) {
                                throw new Error("Client transaction not instance of InviteClientTransaction.");
                            }
                            transaction.ackResponse(outgoingAckRequest.message);
                        }
                        else {
                            // If still waiting for an ACK, drop the retransmission of the 2xx final response.
                        }
                        return;
                    }
                    // If the dialog identifier in the 2xx response matches the dialog
                    // identifier of an existing dialog, the dialog MUST be transitioned to
                    // the "confirmed" state, and the route set for the dialog MUST be
                    // recomputed based on the 2xx response using the procedures of Section
                    // 12.2.1.2. Otherwise, a new dialog in the "confirmed" state MUST be
                    // constructed using the procedures of Section 12.1.2.
                    // https://tools.ietf.org/html/rfc3261#section-13.2.2.4
                    dialog = this.earlyDialogs.get(dialogState.id);
                    if (dialog) {
                        dialog.confirm();
                        dialog.recomputeRouteSet(message);
                        this.earlyDialogs.delete(dialog.id);
                        this.confirmedDialogs.set(dialog.id, dialog);
                    }
                    else {
                        var transaction = this.transaction;
                        if (!(transaction instanceof transactions_1.InviteClientTransaction)) {
                            throw new Error("Transaction not instance of InviteClientTransaction.");
                        }
                        dialog = new dialogs_1.SessionDialog(transaction, this.core, dialogState);
                        this.confirmedDialogs.set(dialog.id, dialog);
                    }
                    // If the initial offer is in an INVITE, the answer MUST be in a
                    // reliable non-failure message from UAS back to UAC which is
                    // correlated to that INVITE.  For this specification, that is
                    // only the final 2xx response to that INVITE.  That same exact
                    // answer MAY also be placed in any provisional responses sent
                    // prior to the answer.  The UAC MUST treat the first session
                    // description it receives as the answer, and MUST ignore any
                    // session descriptions in subsequent responses to the initial
                    // INVITE.
                    // https://tools.ietf.org/html/rfc3261#section-13.2.1
                    if (dialog.signalingState === session_1.SignalingState.Initial ||
                        dialog.signalingState === session_1.SignalingState.HaveLocalOffer) {
                        dialog.signalingStateTransition(message);
                    }
                    // Session Initiated! :)
                    var session_3 = dialog;
                    // The UAC core MUST generate an ACK request for each 2xx received from
                    // the transaction layer.  The header fields of the ACK are constructed
                    // in the same way as for any request sent within a dialog (see Section
                    // 12) with the exception of the CSeq and the header fields related to
                    // authentication.  The sequence number of the CSeq header field MUST be
                    // the same as the INVITE being acknowledged, but the CSeq method MUST
                    // be ACK.  The ACK MUST contain the same credentials as the INVITE.  If
                    // the 2xx contains an offer (based on the rules above), the ACK MUST
                    // carry an answer in its body.  If the offer in the 2xx response is not
                    // acceptable, the UAC core MUST generate a valid answer in the ACK and
                    // then send a BYE immediately.
                    // https://tools.ietf.org/html/rfc3261#section-13.2.2.4
                    if (this.delegate && this.delegate.onAccept) {
                        this.delegate.onAccept({
                            message: message,
                            session: session_3,
                            ack: function (options) {
                                var outgoingAckRequest = session_3.ack(options);
                                _this.confirmedDialogAcks.set(session_3.id, outgoingAckRequest);
                                return outgoingAckRequest;
                            }
                        });
                    }
                    else {
                        var outgoingAckRequest = session_3.ack();
                        this.confirmedDialogAcks.set(session_3.id, outgoingAckRequest);
                    }
                }
                return;
            case /^3[0-9]{2}$/.test(statusCode):
                // 12.3 Termination of a Dialog
                //
                // Independent of the method, if a request outside of a dialog generates
                // a non-2xx final response, any early dialogs created through
                // provisional responses to that request are terminated.  The mechanism
                // for terminating confirmed dialogs is method specific.  In this
                // specification, the BYE method terminates a session and the dialog
                // associated with it.  See Section 15 for details.
                // https://tools.ietf.org/html/rfc3261#section-12.3
                // All early dialogs are considered terminated upon reception of the
                // non-2xx final response.
                //
                // After having received the non-2xx final response the UAC core
                // considers the INVITE transaction completed.  The INVITE client
                // transaction handles the generation of ACKs for the response (see
                // Section 17).
                // https://tools.ietf.org/html/rfc3261#section-13.2.2.3
                this.earlyDialogs.forEach(function (earlyDialog) { return earlyDialog.dispose(); });
                this.earlyDialogs.clear();
                // A 3xx response may contain one or more Contact header field values
                // providing new addresses where the callee might be reachable.
                // Depending on the status code of the 3xx response (see Section 21.3),
                // the UAC MAY choose to try those new addresses.
                // https://tools.ietf.org/html/rfc3261#section-13.2.2.2
                if (this.delegate && this.delegate.onRedirect) {
                    this.delegate.onRedirect({ message: message });
                }
                return;
            case /^[4-6][0-9]{2}$/.test(statusCode):
                // 12.3 Termination of a Dialog
                //
                // Independent of the method, if a request outside of a dialog generates
                // a non-2xx final response, any early dialogs created through
                // provisional responses to that request are terminated.  The mechanism
                // for terminating confirmed dialogs is method specific.  In this
                // specification, the BYE method terminates a session and the dialog
                // associated with it.  See Section 15 for details.
                // https://tools.ietf.org/html/rfc3261#section-12.3
                // All early dialogs are considered terminated upon reception of the
                // non-2xx final response.
                //
                // After having received the non-2xx final response the UAC core
                // considers the INVITE transaction completed.  The INVITE client
                // transaction handles the generation of ACKs for the response (see
                // Section 17).
                // https://tools.ietf.org/html/rfc3261#section-13.2.2.3
                this.earlyDialogs.forEach(function (earlyDialog) { return earlyDialog.dispose(); });
                this.earlyDialogs.clear();
                // A single non-2xx final response may be received for the INVITE.  4xx,
                // 5xx and 6xx responses may contain a Contact header field value
                // indicating the location where additional information about the error
                // can be found.  Subsequent final responses (which would only arrive
                // under error conditions) MUST be ignored.
                // https://tools.ietf.org/html/rfc3261#section-13.2.2.3
                if (this.delegate && this.delegate.onReject) {
                    this.delegate.onReject({ message: message });
                }
                return;
            default:
                throw new Error("Invalid status code " + statusCode);
        }
        throw new Error("Executing what should be an unreachable code path receiving " + statusCode + " response.");
    };
    return InviteUserAgentClient;
}(user_agent_client_1.UserAgentClient));
exports.InviteUserAgentClient = InviteUserAgentClient;


/***/ }),
/* 72 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var dialogs_1 = __webpack_require__(3);
var exceptions_1 = __webpack_require__(32);
var session_1 = __webpack_require__(25);
var transactions_1 = __webpack_require__(28);
var allowed_methods_1 = __webpack_require__(61);
var user_agent_server_1 = __webpack_require__(45);
/**
 * INVITE UAS.
 * @remarks
 * 13 Initiating a Session
 * https://tools.ietf.org/html/rfc3261#section-13
 * 13.1 Overview
 * https://tools.ietf.org/html/rfc3261#section-13.1
 * 13.3 UAS Processing
 * https://tools.ietf.org/html/rfc3261#section-13.3
 * @public
 */
var InviteUserAgentServer = /** @class */ (function (_super) {
    tslib_1.__extends(InviteUserAgentServer, _super);
    function InviteUserAgentServer(core, message, delegate) {
        var _this = _super.call(this, transactions_1.InviteServerTransaction, core, message, delegate) || this;
        _this.core = core;
        return _this;
    }
    InviteUserAgentServer.prototype.dispose = function () {
        if (this.earlyDialog) {
            this.earlyDialog.dispose();
        }
        _super.prototype.dispose.call(this);
    };
    /**
     * 13.3.1.4 The INVITE is Accepted
     * The UAS core generates a 2xx response.  This response establishes a
     * dialog, and therefore follows the procedures of Section 12.1.1 in
     * addition to those of Section 8.2.6.
     * https://tools.ietf.org/html/rfc3261#section-13.3.1.4
     * @param options - Accept options bucket.
     */
    InviteUserAgentServer.prototype.accept = function (options) {
        if (options === void 0) { options = { statusCode: 200 }; }
        if (!this.acceptable) {
            throw new exceptions_1.TransactionStateError(this.message.method + " not acceptable in state " + this.transaction.state + ".");
        }
        // This response establishes a dialog...
        // https://tools.ietf.org/html/rfc3261#section-13.3.1.4
        if (!this.confirmedDialog) {
            if (this.earlyDialog) {
                this.earlyDialog.confirm();
                this.confirmedDialog = this.earlyDialog;
                this.earlyDialog = undefined;
            }
            else {
                var transaction = this.transaction;
                if (!(transaction instanceof transactions_1.InviteServerTransaction)) {
                    throw new Error("Transaction not instance of InviteClientTransaction.");
                }
                var state = dialogs_1.Dialog.initialDialogStateForUserAgentServer(this.message, this.toTag);
                this.confirmedDialog = new dialogs_1.SessionDialog(transaction, this.core, state);
            }
        }
        // When a UAS responds to a request with a response that establishes a
        // dialog (such as a 2xx to INVITE), the UAS MUST copy all Record-Route
        // header field values from the request into the response (including the
        // URIs, URI parameters, and any Record-Route header field parameters,
        // whether they are known or unknown to the UAS) and MUST maintain the
        // order of those values.  The UAS MUST add a Contact header field to
        // the response.  The Contact header field contains an address where the
        // UAS would like to be contacted for subsequent requests in the dialog
        // (which includes the ACK for a 2xx response in the case of an INVITE).
        // Generally, the host portion of this URI is the IP address or FQDN of
        // the host.  The URI provided in the Contact header field MUST be a SIP
        // or SIPS URI.  If the request that initiated the dialog contained a
        // SIPS URI in the Request-URI or in the top Record-Route header field
        // value, if there was any, or the Contact header field if there was no
        // Record-Route header field, the Contact header field in the response
        // MUST be a SIPS URI.  The URI SHOULD have global scope (that is, the
        // same URI can be used in messages outside this dialog).  The same way,
        // the scope of the URI in the Contact header field of the INVITE is not
        // limited to this dialog either.  It can therefore be used in messages
        // to the UAC even outside this dialog.
        // https://tools.ietf.org/html/rfc3261#section-12.1.1
        var recordRouteHeader = this.message
            .getHeaders("record-route")
            .map(function (header) { return "Record-Route: " + header; });
        var contactHeader = "Contact: " + this.core.configuration.contact.toString();
        // A 2xx response to an INVITE SHOULD contain the Allow header field and
        // the Supported header field, and MAY contain the Accept header field.
        // Including these header fields allows the UAC to determine the
        // features and extensions supported by the UAS for the duration of the
        // call, without probing.
        // https://tools.ietf.org/html/rfc3261#section-13.3.1.4
        // FIXME: TODO: This should not be hard coded.
        var allowHeader = "Allow: " + allowed_methods_1.AllowedMethods.toString();
        // FIXME: TODO: Supported header (see reply())
        // FIXME: TODO: Accept header
        // If the INVITE request contained an offer, and the UAS had not yet
        // sent an answer, the 2xx MUST contain an answer.  If the INVITE did
        // not contain an offer, the 2xx MUST contain an offer if the UAS had
        // not yet sent an offer.
        // https://tools.ietf.org/html/rfc3261#section-13.3.1.4
        if (!options.body) {
            if (this.confirmedDialog.signalingState === session_1.SignalingState.Stable) {
                options.body = this.confirmedDialog.answer; // resend the answer sent in provisional response
            }
            else if (this.confirmedDialog.signalingState === session_1.SignalingState.Initial ||
                this.confirmedDialog.signalingState === session_1.SignalingState.HaveRemoteOffer) {
                throw new Error("Response must have a body.");
            }
        }
        options.statusCode = options.statusCode || 200;
        options.extraHeaders = options.extraHeaders || [];
        options.extraHeaders = options.extraHeaders.concat(recordRouteHeader);
        options.extraHeaders.push(allowHeader);
        options.extraHeaders.push(contactHeader);
        var response = _super.prototype.accept.call(this, options);
        var session = this.confirmedDialog;
        var result = tslib_1.__assign(tslib_1.__assign({}, response), { session: session });
        // Update dialog signaling state
        if (options.body) {
            // Once the UAS has sent or received an answer to the initial
            // offer, it MUST NOT generate subsequent offers in any responses
            // to the initial INVITE.  This means that a UAS based on this
            // specification alone can never generate subsequent offers until
            // completion of the initial transaction.
            // https://tools.ietf.org/html/rfc3261#section-13.2.1
            if (this.confirmedDialog.signalingState !== session_1.SignalingState.Stable) {
                this.confirmedDialog.signalingStateTransition(options.body);
            }
        }
        return result;
    };
    /**
     * 13.3.1.1 Progress
     * If the UAS is not able to answer the invitation immediately, it can
     * choose to indicate some kind of progress to the UAC (for example, an
     * indication that a phone is ringing).  This is accomplished with a
     * provisional response between 101 and 199.  These provisional
     * responses establish early dialogs and therefore follow the procedures
     * of Section 12.1.1 in addition to those of Section 8.2.6.  A UAS MAY
     * send as many provisional responses as it likes.  Each of these MUST
     * indicate the same dialog ID.  However, these will not be delivered
     * reliably.
     *
     * If the UAS desires an extended period of time to answer the INVITE,
     * it will need to ask for an "extension" in order to prevent proxies
     * from canceling the transaction.  A proxy has the option of canceling
     * a transaction when there is a gap of 3 minutes between responses in a
     * transaction.  To prevent cancellation, the UAS MUST send a non-100
     * provisional response at every minute, to handle the possibility of
     * lost provisional responses.
     * https://tools.ietf.org/html/rfc3261#section-13.3.1.1
     * @param options - Progress options bucket.
     */
    InviteUserAgentServer.prototype.progress = function (options) {
        if (options === void 0) { options = { statusCode: 180 }; }
        if (!this.progressable) {
            throw new exceptions_1.TransactionStateError(this.message.method + " not progressable in state " + this.transaction.state + ".");
        }
        // This response establishes a dialog...
        // https://tools.ietf.org/html/rfc3261#section-13.3.1.4
        if (!this.earlyDialog) {
            var transaction = this.transaction;
            if (!(transaction instanceof transactions_1.InviteServerTransaction)) {
                throw new Error("Transaction not instance of InviteClientTransaction.");
            }
            var state = dialogs_1.Dialog.initialDialogStateForUserAgentServer(this.message, this.toTag, true);
            this.earlyDialog = new dialogs_1.SessionDialog(transaction, this.core, state);
        }
        // When a UAS responds to a request with a response that establishes a
        // dialog (such as a 2xx to INVITE), the UAS MUST copy all Record-Route
        // header field values from the request into the response (including the
        // URIs, URI parameters, and any Record-Route header field parameters,
        // whether they are known or unknown to the UAS) and MUST maintain the
        // order of those values.  The UAS MUST add a Contact header field to
        // the response.  The Contact header field contains an address where the
        // UAS would like to be contacted for subsequent requests in the dialog
        // (which includes the ACK for a 2xx response in the case of an INVITE).
        // Generally, the host portion of this URI is the IP address or FQDN of
        // the host.  The URI provided in the Contact header field MUST be a SIP
        // or SIPS URI.  If the request that initiated the dialog contained a
        // SIPS URI in the Request-URI or in the top Record-Route header field
        // value, if there was any, or the Contact header field if there was no
        // Record-Route header field, the Contact header field in the response
        // MUST be a SIPS URI.  The URI SHOULD have global scope (that is, the
        // same URI can be used in messages outside this dialog).  The same way,
        // the scope of the URI in the Contact header field of the INVITE is not
        // limited to this dialog either.  It can therefore be used in messages
        // to the UAC even outside this dialog.
        // https://tools.ietf.org/html/rfc3261#section-12.1.1
        var recordRouteHeader = this.message
            .getHeaders("record-route")
            .map(function (header) { return "Record-Route: " + header; });
        var contactHeader = "Contact: " + this.core.configuration.contact;
        options.extraHeaders = options.extraHeaders || [];
        options.extraHeaders = options.extraHeaders.concat(recordRouteHeader);
        options.extraHeaders.push(contactHeader);
        var response = _super.prototype.progress.call(this, options);
        var session = this.earlyDialog;
        var result = tslib_1.__assign(tslib_1.__assign({}, response), { session: session });
        // Update dialog signaling state
        if (options.body) {
            // Once the UAS has sent or received an answer to the initial
            // offer, it MUST NOT generate subsequent offers in any responses
            // to the initial INVITE.  This means that a UAS based on this
            // specification alone can never generate subsequent offers until
            // completion of the initial transaction.
            // https://tools.ietf.org/html/rfc3261#section-13.2.1
            if (this.earlyDialog.signalingState !== session_1.SignalingState.Stable) {
                this.earlyDialog.signalingStateTransition(options.body);
            }
        }
        return result;
    };
    /**
     * 13.3.1.2 The INVITE is Redirected
     * If the UAS decides to redirect the call, a 3xx response is sent.  A
     * 300 (Multiple Choices), 301 (Moved Permanently) or 302 (Moved
     * Temporarily) response SHOULD contain a Contact header field
     * containing one or more URIs of new addresses to be tried.  The
     * response is passed to the INVITE server transaction, which will deal
     * with its retransmissions.
     * https://tools.ietf.org/html/rfc3261#section-13.3.1.2
     * @param contacts - Contacts to redirect to.
     * @param options - Redirect options bucket.
     */
    InviteUserAgentServer.prototype.redirect = function (contacts, options) {
        if (options === void 0) { options = { statusCode: 302 }; }
        return _super.prototype.redirect.call(this, contacts, options);
    };
    /**
     * 13.3.1.3 The INVITE is Rejected
     * A common scenario occurs when the callee is currently not willing or
     * able to take additional calls at this end system.  A 486 (Busy Here)
     * SHOULD be returned in such a scenario.
     * https://tools.ietf.org/html/rfc3261#section-13.3.1.3
     * @param options - Reject options bucket.
     */
    InviteUserAgentServer.prototype.reject = function (options) {
        if (options === void 0) { options = { statusCode: 486 }; }
        return _super.prototype.reject.call(this, options);
    };
    return InviteUserAgentServer;
}(user_agent_server_1.UserAgentServer));
exports.InviteUserAgentServer = InviteUserAgentServer;


/***/ }),
/* 73 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var transactions_1 = __webpack_require__(28);
var user_agent_client_1 = __webpack_require__(43);
/**
 * PUBLISH UAC.
 * @public
 */
var PublishUserAgentClient = /** @class */ (function (_super) {
    tslib_1.__extends(PublishUserAgentClient, _super);
    function PublishUserAgentClient(core, message, delegate) {
        return _super.call(this, transactions_1.NonInviteClientTransaction, core, message, delegate) || this;
    }
    return PublishUserAgentClient;
}(user_agent_client_1.UserAgentClient));
exports.PublishUserAgentClient = PublishUserAgentClient;


/***/ }),
/* 74 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var transactions_1 = __webpack_require__(28);
var user_agent_server_1 = __webpack_require__(45);
/**
 * Re-SUBSCRIBE UAS.
 * @public
 */
var ReSubscribeUserAgentServer = /** @class */ (function (_super) {
    tslib_1.__extends(ReSubscribeUserAgentServer, _super);
    function ReSubscribeUserAgentServer(dialog, message, delegate) {
        return _super.call(this, transactions_1.NonInviteServerTransaction, dialog.userAgentCore, message, delegate) || this;
    }
    return ReSubscribeUserAgentServer;
}(user_agent_server_1.UserAgentServer));
exports.ReSubscribeUserAgentServer = ReSubscribeUserAgentServer;


/***/ }),
/* 75 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var transactions_1 = __webpack_require__(28);
var user_agent_client_1 = __webpack_require__(43);
/**
 * REGISTER UAC.
 * @public
 */
var RegisterUserAgentClient = /** @class */ (function (_super) {
    tslib_1.__extends(RegisterUserAgentClient, _super);
    function RegisterUserAgentClient(core, message, delegate) {
        return _super.call(this, transactions_1.NonInviteClientTransaction, core, message, delegate) || this;
    }
    return RegisterUserAgentClient;
}(user_agent_client_1.UserAgentClient));
exports.RegisterUserAgentClient = RegisterUserAgentClient;


/***/ }),
/* 76 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var transactions_1 = __webpack_require__(28);
var user_agent_server_1 = __webpack_require__(45);
/**
 * REGISTER UAS.
 * @public
 */
var RegisterUserAgentServer = /** @class */ (function (_super) {
    tslib_1.__extends(RegisterUserAgentServer, _super);
    function RegisterUserAgentServer(core, message, delegate) {
        var _this = _super.call(this, transactions_1.NonInviteServerTransaction, core, message, delegate) || this;
        _this.core = core;
        return _this;
    }
    return RegisterUserAgentServer;
}(user_agent_server_1.UserAgentServer));
exports.RegisterUserAgentServer = RegisterUserAgentServer;


/***/ }),
/* 77 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var subscription_dialog_1 = __webpack_require__(58);
var subscription_1 = __webpack_require__(59);
var timers_1 = __webpack_require__(27);
var transactions_1 = __webpack_require__(28);
var user_agent_client_1 = __webpack_require__(43);
/**
 * SUBSCRIBE UAC.
 * @remarks
 * 4.1.  Subscriber Behavior
 * https://tools.ietf.org/html/rfc6665#section-4.1
 *
 * User agent client for installation of a single subscription per SUBSCRIBE request.
 * TODO: Support for installation of multiple subscriptions on forked SUBSCRIBE requests.
 * @public
 */
var SubscribeUserAgentClient = /** @class */ (function (_super) {
    tslib_1.__extends(SubscribeUserAgentClient, _super);
    function SubscribeUserAgentClient(core, message, delegate) {
        var _this = this;
        // Get event from request message.
        var event = message.getHeader("Event");
        if (!event) {
            throw new Error("Event undefined");
        }
        // Get expires from request message.
        var expires = message.getHeader("Expires");
        if (!expires) {
            throw new Error("Expires undefined");
        }
        _this = _super.call(this, transactions_1.NonInviteClientTransaction, core, message, delegate) || this;
        _this.delegate = delegate;
        // FIXME: Subscriber id should also be matching on event id.
        _this.subscriberId = message.callId + message.fromTag + event;
        _this.subscriptionExpiresRequested = _this.subscriptionExpires = Number(expires);
        _this.subscriptionEvent = event;
        _this.subscriptionState = subscription_1.SubscriptionState.NotifyWait;
        // Start waiting for a NOTIFY we can use to create a subscription.
        _this.waitNotifyStart();
        return _this;
    }
    /**
     * Destructor.
     * Note that Timer N may live on waiting for an initial NOTIFY and
     * the delegate may still receive that NOTIFY. If you don't want
     * that behavior then either clear the delegate so the delegate
     * doesn't get called (a 200 will be sent in response to the NOTIFY)
     * or call `waitNotifyStop` which will clear Timer N and remove this
     * UAC from the core (a 481 will be sent in response to the NOTIFY).
     */
    SubscribeUserAgentClient.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
    };
    /**
     * Handle out of dialog NOTIFY associated with SUBSCRIBE request.
     * This is the first NOTIFY received after the SUBSCRIBE request.
     * @param uas - User agent server handling the subscription creating NOTIFY.
     */
    SubscribeUserAgentClient.prototype.onNotify = function (uas) {
        // NOTIFY requests are matched to such SUBSCRIBE requests if they
        // contain the same "Call-ID", a "To" header field "tag" parameter that
        // matches the "From" header field "tag" parameter of the SUBSCRIBE
        // request, and the same "Event" header field.  Rules for comparisons of
        // the "Event" header fields are described in Section 8.2.1.
        // https://tools.ietf.org/html/rfc6665#section-4.4.1
        var event = uas.message.parseHeader("Event").event;
        if (!event || event !== this.subscriptionEvent) {
            this.logger.warn("Failed to parse event.");
            uas.reject({ statusCode: 489 });
            return;
        }
        // NOTIFY requests MUST contain "Subscription-State" header fields that
        // indicate the status of the subscription.
        // https://tools.ietf.org/html/rfc6665#section-4.1.3
        var subscriptionState = uas.message.parseHeader("Subscription-State");
        if (!subscriptionState || !subscriptionState.state) {
            this.logger.warn("Failed to parse subscription state.");
            uas.reject({ statusCode: 489 });
            return;
        }
        // Validate subscription state.
        var state = subscriptionState.state;
        switch (state) {
            case "pending":
                break;
            case "active":
                break;
            case "terminated":
                break;
            default:
                this.logger.warn("Invalid subscription state " + state);
                uas.reject({ statusCode: 489 });
                return;
        }
        // Dialogs usages are created upon completion of a NOTIFY transaction
        // for a new subscription, unless the NOTIFY request contains a
        // "Subscription-State" of "terminated."
        // https://tools.ietf.org/html/rfc6665#section-4.4.1
        if (state !== "terminated") {
            // The Contact header field MUST be present and contain exactly one SIP
            // or SIPS URI in any request that can result in the establishment of a
            // dialog.
            // https://tools.ietf.org/html/rfc3261#section-8.1.1.8
            var contact = uas.message.parseHeader("contact");
            if (!contact) {
                this.logger.warn("Failed to parse contact.");
                uas.reject({ statusCode: 489 });
                return;
            }
        }
        // In accordance with the rules for proxying non-INVITE requests as
        // defined in [RFC3261], successful SUBSCRIBE requests will receive only
        // one 200-class response; however, due to forking, the subscription may
        // have been accepted by multiple nodes.  The subscriber MUST therefore
        // be prepared to receive NOTIFY requests with "From:" tags that differ
        // from the "To:" tag received in the SUBSCRIBE 200-class response.
        //
        // If multiple NOTIFY requests are received in different dialogs in
        // response to a single SUBSCRIBE request, each dialog represents a
        // different destination to which the SUBSCRIBE request was forked.
        // Subscriber handling in such situations varies by event package; see
        // Section 5.4.9 for details.
        // https://tools.ietf.org/html/rfc6665#section-4.1.4
        // Each event package MUST specify whether forked SUBSCRIBE requests are
        // allowed to install multiple subscriptions.
        //
        // If such behavior is not allowed, the first potential dialog-
        // establishing message will create a dialog.  All subsequent NOTIFY
        // requests that correspond to the SUBSCRIBE request (i.e., have
        // matching "To", "From", "Call-ID", and "Event" header fields, as well
        // as "From" header field "tag" parameter and "Event" header field "id"
        // parameter) but that do not match the dialog would be rejected with a
        // 481 response.  Note that the 200-class response to the SUBSCRIBE
        // request can arrive after a matching NOTIFY request has been received;
        // such responses might not correlate to the same dialog established by
        // the NOTIFY request.  Except as required to complete the SUBSCRIBE
        // transaction, such non-matching 200-class responses are ignored.
        //
        // If installing of multiple subscriptions by way of a single forked
        // SUBSCRIBE request is allowed, the subscriber establishes a new dialog
        // towards each notifier by returning a 200-class response to each
        // NOTIFY request.  Each dialog is then handled as its own entity and is
        // refreshed independently of the other dialogs.
        //
        // In the case that multiple subscriptions are allowed, the event
        // package MUST specify whether merging of the notifications to form a
        // single state is required, and how such merging is to be performed.
        // Note that it is possible that some event packages may be defined in
        // such a way that each dialog is tied to a mutually exclusive state
        // that is unaffected by the other dialogs; this MUST be clearly stated
        // if it is the case.
        // https://tools.ietf.org/html/rfc6665#section-5.4.9
        // *** NOTE: This implementation is only for event packages which
        // do not allow forked requests to install multiple subscriptions.
        // As such and in accordance with the specification, we stop waiting
        // and any future NOTIFY requests will be rejected with a 481.
        if (this.dialog) {
            throw new Error("Dialog already created. This implementation only supports install of single subscriptions.");
        }
        this.waitNotifyStop();
        // Update expires.
        this.subscriptionExpires =
            subscriptionState.expires ?
                Math.min(this.subscriptionExpires, Math.max(subscriptionState.expires, 0)) :
                this.subscriptionExpires;
        // Update subscription state.
        switch (state) {
            case "pending":
                this.subscriptionState = subscription_1.SubscriptionState.Pending;
                break;
            case "active":
                this.subscriptionState = subscription_1.SubscriptionState.Active;
                break;
            case "terminated":
                this.subscriptionState = subscription_1.SubscriptionState.Terminated;
                break;
            default:
                throw new Error("Unrecognized state " + state + ".");
        }
        // Dialogs usages are created upon completion of a NOTIFY transaction
        // for a new subscription, unless the NOTIFY request contains a
        // "Subscription-State" of "terminated."
        // https://tools.ietf.org/html/rfc6665#section-4.4.1
        if (this.subscriptionState !== subscription_1.SubscriptionState.Terminated) {
            // Because the dialog usage is established by the NOTIFY request, the
            // route set at the subscriber is taken from the NOTIFY request itself,
            // as opposed to the route set present in the 200-class response to the
            // SUBSCRIBE request.
            // https://tools.ietf.org/html/rfc6665#section-4.4.1
            var dialogState = subscription_dialog_1.SubscriptionDialog.initialDialogStateForSubscription(this.message, uas.message);
            // Subscription Initiated! :)
            this.dialog = new subscription_dialog_1.SubscriptionDialog(this.subscriptionEvent, this.subscriptionExpires, this.subscriptionState, this.core, dialogState);
        }
        // Delegate.
        if (this.delegate && this.delegate.onNotify) {
            var request = uas;
            var subscription = this.dialog;
            this.delegate.onNotify({ request: request, subscription: subscription });
        }
        else {
            uas.accept();
        }
    };
    SubscribeUserAgentClient.prototype.waitNotifyStart = function () {
        var _this = this;
        if (!this.N) {
            // Add ourselves to the core's subscriber map.
            // This allows the core to route out of dialog NOTIFY messages to us.
            this.core.subscribers.set(this.subscriberId, this);
            this.N = setTimeout(function () { return _this.timer_N(); }, timers_1.Timers.TIMER_N);
        }
    };
    SubscribeUserAgentClient.prototype.waitNotifyStop = function () {
        if (this.N) {
            // Remove ourselves to the core's subscriber map.
            // Any future out of dialog NOTIFY messages will be rejected with a 481.
            this.core.subscribers.delete(this.subscriberId);
            clearTimeout(this.N);
            this.N = undefined;
        }
    };
    /**
     * Receive a response from the transaction layer.
     * @param message - Incoming response message.
     */
    SubscribeUserAgentClient.prototype.receiveResponse = function (message) {
        if (!this.authenticationGuard(message)) {
            return;
        }
        if (message.statusCode && message.statusCode >= 200 && message.statusCode < 300) {
            //  The "Expires" header field in a 200-class response to SUBSCRIBE
            //  request indicates the actual duration for which the subscription will
            //  remain active (unless refreshed).  The received value might be
            //  smaller than the value indicated in the SUBSCRIBE request but cannot
            //  be larger; see Section 4.2.1 for details.
            // https://tools.ietf.org/html/rfc6665#section-4.1.2.1
            // The "Expires" values present in SUBSCRIBE 200-class responses behave
            // in the same way as they do in REGISTER responses: the server MAY
            // shorten the interval but MUST NOT lengthen it.
            //
            //    If the duration specified in a SUBSCRIBE request is unacceptably
            //    short, the notifier may be able to send a 423 response, as
            //    described earlier in this section.
            //
            // 200-class responses to SUBSCRIBE requests will not generally contain
            // any useful information beyond subscription duration; their primary
            // purpose is to serve as a reliability mechanism.  State information
            // will be communicated via a subsequent NOTIFY request from the
            // notifier.
            // https://tools.ietf.org/html/rfc6665#section-4.2.1.1
            var expires = message.getHeader("Expires");
            if (!expires) {
                this.logger.warn("Expires header missing in a 200-class response to SUBSCRIBE");
            }
            else {
                var subscriptionExpiresReceived = Number(expires);
                if (subscriptionExpiresReceived > this.subscriptionExpiresRequested) {
                    this.logger.warn("Expires header in a 200-class response to SUBSCRIBE with a higher value than the one in the request");
                }
                if (subscriptionExpiresReceived < this.subscriptionExpires) {
                    this.subscriptionExpires = subscriptionExpiresReceived;
                }
            }
            // If a NOTIFY arrived before 200-class response a dialog may have been created.
            // Updated the dialogs expiration only if this indicates earlier expiration.
            if (this.dialog) {
                if (this.dialog.subscriptionExpires > this.subscriptionExpires) {
                    this.dialog.subscriptionExpires = this.subscriptionExpires;
                }
            }
        }
        if (message.statusCode && message.statusCode >= 300 && message.statusCode < 700) {
            this.waitNotifyStop(); // No NOTIFY will be sent after a negative final response.
        }
        _super.prototype.receiveResponse.call(this, message);
    };
    /**
     * To ensure that subscribers do not wait indefinitely for a
     * subscription to be established, a subscriber starts a Timer N, set to
     * 64*T1, when it sends a SUBSCRIBE request.  If this Timer N expires
     * prior to the receipt of a NOTIFY request, the subscriber considers
     * the subscription failed, and cleans up any state associated with the
     * subscription attempt.
     * https://tools.ietf.org/html/rfc6665#section-4.1.2.4
     */
    SubscribeUserAgentClient.prototype.timer_N = function () {
        this.logger.warn("Timer N expired for SUBSCRIBE user agent client. Timed out waiting for NOTIFY.");
        this.waitNotifyStop();
        if (this.delegate && this.delegate.onNotifyTimeout) {
            this.delegate.onNotifyTimeout();
        }
    };
    return SubscribeUserAgentClient;
}(user_agent_client_1.UserAgentClient));
exports.SubscribeUserAgentClient = SubscribeUserAgentClient;


/***/ }),
/* 78 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = __webpack_require__(1);
var transactions_1 = __webpack_require__(28);
var user_agent_server_1 = __webpack_require__(45);
/**
 * SUBSCRIBE UAS.
 * @public
 */
var SubscribeUserAgentServer = /** @class */ (function (_super) {
    tslib_1.__extends(SubscribeUserAgentServer, _super);
    function SubscribeUserAgentServer(core, message, delegate) {
        var _this = _super.call(this, transactions_1.NonInviteServerTransaction, core, message, delegate) || this;
        _this.core = core;
        return _this;
    }
    return SubscribeUserAgentServer;
}(user_agent_server_1.UserAgentServer));
exports.SubscribeUserAgentServer = SubscribeUserAgentServer;


/***/ })
/******/ ]);
});