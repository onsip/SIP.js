"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var transactions_1 = require("../transactions");
var user_agent_server_1 = require("./user-agent-server");
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
