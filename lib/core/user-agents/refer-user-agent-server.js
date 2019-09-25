"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var transactions_1 = require("../transactions");
var user_agent_server_1 = require("./user-agent-server");
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
