"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var transactions_1 = require("../transactions");
var user_agent_server_1 = require("./user-agent-server");
var ReferUserAgentServer = /** @class */ (function (_super) {
    __extends(ReferUserAgentServer, _super);
    /**
     * REFER UAS constructor.
     * @param dialogOrCore Dialog for in dialog REFER, UserAgentCore for out of dialog REFER.
     * @param message Incoming REFER request message.
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
