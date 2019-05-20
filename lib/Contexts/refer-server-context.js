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
var transactions_1 = require("../Core/transactions");
var Constants_1 = require("../Constants");
var Enums_1 = require("../Enums");
var Exceptions_1 = require("../Exceptions");
var Grammar_1 = require("../Grammar");
var ReferContext_1 = require("../ReferContext");
var SIPMessage_1 = require("../SIPMessage");
var ReferServerContext = /** @class */ (function (_super) {
    __extends(ReferServerContext, _super);
    /**
     * Receives an in dialog REFER and handles the implicit subscription
     * dialog usage created by a REFER. The REFER is received within the
     * session provided.
     * @param ua UA
     * @param context The invite context within which REFER will be sent.
     * @param target Target of the REFER.
     * @param options Options bucket.
     */
    function ReferServerContext(ua, message, session) {
        var _this = _super.call(this, ua, message) || this;
        _this.session = session;
        return _this;
    }
    ReferServerContext.prototype.accept = function (options, modifiers) {
        _super.prototype.accept.call(this, options, modifiers);
    };
    ReferServerContext.prototype.progress = function () {
        _super.prototype.progress.call(this);
    };
    ReferServerContext.prototype.reject = function (options) {
        _super.prototype.reject.call(this, options);
    };
    /**
     * Send an in dialog NOTIFY.
     * @param body Content of body.
     */
    ReferServerContext.prototype.sendNotify = function (body) {
        // FIXME: Ported this. Clean it up. Session knows its state.
        if (this.status !== Enums_1.SessionStatus.STATUS_ANSWERED) {
            throw new Exceptions_1.Exceptions.InvalidStateError(this.status);
        }
        if (Grammar_1.Grammar.parse(body, "sipfrag") === -1) {
            throw new Error("sipfrag body is required to send notify for refer");
        }
        // NOTIFY requests sent in same dialog as in dialog REFER.
        if (this.session) {
            this.session.notify(undefined, {
                extraHeaders: [
                    "Event: refer",
                    "Subscription-State: terminated",
                ],
                body: {
                    contentDisposition: "render",
                    contentType: "message/sipfrag",
                    content: body
                }
            });
            return;
        }
        // The implicit subscription created by a REFER is the same as a
        // subscription created with a SUBSCRIBE request.  The agent issuing the
        // REFER can terminate this subscription prematurely by unsubscribing
        // using the mechanisms described in [2].  Terminating a subscription,
        // either by explicitly unsubscribing or rejecting NOTIFY, is not an
        // indication that the referenced request should be withdrawn or
        // abandoned.
        // https://tools.ietf.org/html/rfc3515#section-2.4.4
        // NOTIFY requests sent in new dialog for out of dialog REFER.
        // FIXME: TODO: This should be done in a subscribe dialog to satisfy the above.
        var request = new SIPMessage_1.OutgoingRequest(Constants_1.C.NOTIFY, this.remoteTarget, this.ua, {
            cseq: this.cseq += 1,
            callId: this.callId,
            fromUri: this.fromUri,
            fromTag: this.fromTag,
            toUri: this.toUri,
            toTag: this.toTag,
            routeSet: this.routeSet
        }, [
            "Event: refer",
            "Subscription-State: terminated",
            "Content-Type: message/sipfrag"
        ], body);
        var transport = this.ua.transport;
        if (!transport) {
            throw new Error("Transport undefined.");
        }
        var user = {
            loggerFactory: this.ua.getLoggerFactory()
        };
        var nic = new transactions_1.NonInviteClientTransaction(request, transport, user);
    };
    return ReferServerContext;
}(ReferContext_1.ReferServerContext));
exports.ReferServerContext = ReferServerContext;
