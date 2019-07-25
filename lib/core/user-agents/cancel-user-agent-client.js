"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var transactions_1 = require("../transactions");
var user_agent_client_1 = require("./user-agent-client");
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
