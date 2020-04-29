"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
// Helpful name and version exports
const version_1 = require("./version");
const version = version_1.LIBRARY_VERSION;
exports.version = version;
const name = "sip.js";
exports.name = name;
// Export api
tslib_1.__exportStar(require("./api"), exports);
// Export grammar
tslib_1.__exportStar(require("./grammar"), exports);
// Export namespaced core
const Core = tslib_1.__importStar(require("./core"));
exports.Core = Core;
// Export namespaced web
const Web = tslib_1.__importStar(require("./platform/web"));
exports.Web = Web;
