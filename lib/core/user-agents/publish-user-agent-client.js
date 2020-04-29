"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var transactions_1 = require("../transactions");
var user_agent_client_1 = require("./user-agent-client");
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
