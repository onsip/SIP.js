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
var subscription_1 = require("../subscription");
var notify_user_agent_server_1 = require("../user-agents/notify-user-agent-server");
var re_subscribe_user_agent_client_1 = require("../user-agents/re-subscribe-user-agent-client");
var dialog_1 = require("./dialog");
/**
 * SIP-Specific Event Notification
 *
 * Abstract
 *
 *    This document describes an extension to the Session Initiation
 *    Protocol (SIP) defined by RFC 3261.  The purpose of this extension is
 *    to provide an extensible framework by which SIP nodes can request
 *    notification from remote nodes indicating that certain events have
 *    occurred.
 *
 *    Note that the event notification mechanisms defined herein are NOT
 *    intended to be a general-purpose infrastructure for all classes of
 *    event subscription and notification.
 *
 *    This document represents a backwards-compatible improvement on the
 *    original mechanism described by RFC 3265, taking into account several
 *    years of implementation experience.  Accordingly, this document
 *    obsoletes RFC 3265.  This document also updates RFC 4660 slightly to
 *    accommodate some small changes to the mechanism that were discussed
 *    in that document.
 *
 *  https://tools.ietf.org/html/rfc6665
 */
var SubscribeDialog = /** @class */ (function (_super) {
    __extends(SubscribeDialog, _super);
    function SubscribeDialog(core, state, delegate) {
        var _this = _super.call(this, core, state) || this;
        _this.delegate = delegate;
        _this.logger = core.loggerFactory.getLogger("sip.subscribe-dialog");
        _this.logger.log("SUBSCRIBE dialog " + _this.id + " constructed");
        return _this;
    }
    SubscribeDialog.prototype.dispose = function () {
        _super.prototype.dispose.call(this);
        this.logger.log("SUBSCRIBE dialog " + this.id + " destroyed");
    };
    Object.defineProperty(SubscribeDialog.prototype, "subscriptionState", {
        // FIXME: TODO:
        get: function () {
            return subscription_1.SubscriptionState.Initial;
        },
        enumerable: true,
        configurable: true
    });
    SubscribeDialog.prototype.receiveRequest = function (message) {
        this.logger.log("SUBSCRIBE dialog " + this.id + " received " + message.method + " request");
        // Request within a dialog out of sequence guard.
        // https://tools.ietf.org/html/rfc3261#section-12.2.2
        if (!this.sequenceGuard(message)) {
            this.logger.log("SUBSCRIBE dialog " + this.id + " rejected out of order " + message.method + " request.");
            return;
        }
        // Request within a dialog common processing.
        // https://tools.ietf.org/html/rfc3261#section-12.2.2
        _super.prototype.receiveRequest.call(this, message);
        // Switch on method and then delegate.
        switch (message.method) {
            case Constants_1.C.NOTIFY:
                {
                    var uas = new notify_user_agent_server_1.NotifyUserAgentServer(this, message);
                    if (this.delegate && this.delegate.onNotify) {
                        this.delegate.onNotify(uas);
                    }
                    else {
                        uas.accept();
                    }
                }
                break;
            default:
                {
                    this.logger.log("SUBSCRIBE dialog " + this.id + " received unimplemented " + message.method + " request");
                    this.core.replyStateless(message, { statusCode: 501 });
                }
                break;
        }
    };
    SubscribeDialog.prototype.subscribe = function (delegate, options) {
        this.logger.log("SUBSCRIBE dialog " + this.id + " sending SUBSCRIBE request");
        var uac = new re_subscribe_user_agent_client_1.ReSubscribeUserAgentClient(this, delegate, options);
        return uac;
    };
    return SubscribeDialog;
}(dialog_1.Dialog));
exports.SubscribeDialog = SubscribeDialog;
