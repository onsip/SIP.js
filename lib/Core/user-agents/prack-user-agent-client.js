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
var Constants_1 = require("../../Constants");
var transactions_1 = require("../transactions");
var user_agent_client_1 = require("./user-agent-client");
var PrackUserAgentClient = /** @class */ (function (_super) {
    __extends(PrackUserAgentClient, _super);
    function PrackUserAgentClient(dialog, delegate, options) {
        var _this = this;
        var message = dialog.createOutgoingRequestMessage(Constants_1.C.PRACK, options);
        _this = _super.call(this, transactions_1.NonInviteClientTransaction, dialog.userAgentCore, message, delegate) || this;
        dialog.signalingStateTransition(message);
        return _this;
    }
    return PrackUserAgentClient;
}(user_agent_client_1.UserAgentClient));
exports.PrackUserAgentClient = PrackUserAgentClient;
