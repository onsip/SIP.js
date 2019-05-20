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
var user_agent_client_1 = require("./user-agent-client");
var CancelUserAgentClient = /** @class */ (function (_super) {
    __extends(CancelUserAgentClient, _super);
    function CancelUserAgentClient(core, message, delegate) {
        return _super.call(this, transactions_1.NonInviteClientTransaction, core, message, delegate) || this;
    }
    return CancelUserAgentClient;
}(user_agent_client_1.UserAgentClient));
exports.CancelUserAgentClient = CancelUserAgentClient;
