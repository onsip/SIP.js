"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var transactions_1 = require("../transactions");
var user_agent_server_1 = require("./user-agent-server");
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
