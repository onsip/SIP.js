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
var ClientContext_1 = require("./ClientContext");
var Constants_1 = require("./Constants");
var Dialogs_1 = require("./Dialogs");
var Enums_1 = require("./Enums");
var Timers_1 = require("./Timers");
var Utils_1 = require("./Utils");
/**
 * SIP Subscriber (SIP-Specific Event Notifications RFC6665)
 * @class Class creating a SIP Subscription.
 */
var Subscription = /** @class */ (function (_super) {
    __extends(Subscription, _super);
    function Subscription(ua, target, event, options) {
        if (options === void 0) { options = {}; }
        var _this = this;
        if (!event) {
            throw new TypeError("Event necessary to create a subscription.");
        }
        options.extraHeaders = (options.extraHeaders || []).slice();
        var expires;
        if (typeof options.expires !== "number") {
            ua.logger.warn("expires must be a number. Using default of 3600.");
            expires = 3600;
        }
        else {
            expires = options.expires;
        }
        options.extraHeaders.push("Event: " + event);
        options.extraHeaders.push("Expires: " + expires);
        options.extraHeaders.push("Contact: " + ua.contact.toString());
        // was UA.C.ALLOWED_METHODS, removed due to circular dependency
        options.extraHeaders.push("Allow: " + [
            "ACK",
            "CANCEL",
            "INVITE",
            "MESSAGE",
            "BYE",
            "OPTIONS",
            "INFO",
            "NOTIFY",
            "REFER"
        ].toString());
        _this = _super.call(this, ua, Constants_1.C.SUBSCRIBE, target, options) || this;
        _this.type = Enums_1.TypeStrings.Subscription;
        // TODO: check for valid events here probably make a list in SIP.C; or leave it up to app to check?
        // The check may need to/should probably occur on the other side,
        _this.event = event;
        _this.requestedExpires = expires;
        _this.state = "init";
        _this.contact = ua.contact.toString();
        _this.extraHeaders = options.extraHeaders;
        _this.logger = ua.getLogger("sip.subscription");
        _this.expires = expires;
        _this.timers = { N: undefined, subDuration: undefined };
        _this.errorCodes = [404, 405, 410, 416, 480, 481, 482, 483, 484, 485, 489, 501, 604];
        return _this;
    }
    Subscription.prototype.subscribe = function () {
        // these states point to an existing subscription, no subscribe is necessary
        if (this.state === "active") {
            this.refresh();
            return this;
        }
        else if (this.state === "notify_wait") {
            return this;
        }
        clearTimeout(this.timers.subDuration);
        clearTimeout(this.timers.N);
        this.timers.N = setTimeout(this.timer_fire.bind(this), Timers_1.Timers.TIMER_N);
        if (this.request && this.request.from) {
            this.ua.earlySubscriptions[this.request.callId + this.request.from.parameters.tag + this.event] = this;
        }
        this.send();
        this.state = "notify_wait";
        return this;
    };
    Subscription.prototype.refresh = function () {
        if (this.state === "terminated" || this.state === "pending" || this.state === "notify_wait" || !this.dialog) {
            return;
        }
        this.dialog.sendRequest(this, Constants_1.C.SUBSCRIBE, {
            extraHeaders: this.extraHeaders,
            body: this.body
        });
    };
    Subscription.prototype.receiveResponse = function (response) {
        var statusCode = response.statusCode ? response.statusCode : 0;
        var cause = Utils_1.Utils.getReasonPhrase(statusCode);
        if ((this.state === "notify_wait" && statusCode >= 300) ||
            (this.state !== "notify_wait" && this.errorCodes.indexOf(statusCode) !== -1)) {
            this.failed(response, undefined);
        }
        else if (/^2[0-9]{2}$/.test(statusCode.toString())) {
            this.emit("accepted", response, cause);
            // As we don't support RFC 5839 or other extensions where the NOTIFY is optional, timer N will not be cleared
            // clearTimeout(this.timers.N);
            var expires = response.getHeader("Expires");
            if (expires && Number(expires) <= this.requestedExpires) {
                // Preserve new expires value for subsequent requests
                this.expires = Number(expires);
                this.timers.subDuration = setTimeout(this.refresh.bind(this), Number(expires) * 900);
            }
            else {
                if (!expires) {
                    this.logger.warn("Expires header missing in a 200-class response to SUBSCRIBE");
                    this.failed(response, "Expires Header Missing");
                }
                else {
                    this.logger.warn("Expires header in a 200-class response to" +
                        " SUBSCRIBE with a higher value than the one in the request");
                    this.failed(response, "Invalid Expires Header");
                }
            }
        }
        else if (statusCode > 300) {
            this.emit("failed", response, cause);
            this.emit("rejected", response, cause);
        }
    };
    Subscription.prototype.unsubscribe = function () {
        var extraHeaders = [];
        this.state = "terminated";
        extraHeaders.push("Event: " + this.event);
        extraHeaders.push("Expires: 0");
        extraHeaders.push("Contact: " + this.contact);
        // was UA.C.ALLOWED_METHODS, removed due to circular dependency
        extraHeaders.push("Allow: " + [
            "ACK",
            "CANCEL",
            "INVITE",
            "MESSAGE",
            "BYE",
            "OPTIONS",
            "INFO",
            "NOTIFY",
            "REFER"
        ].toString());
        // makes sure expires isn't set, and other typical resubscribe behavior
        this.receiveResponse = function () { };
        if (this.dialog) {
            this.dialog.sendRequest(this, Constants_1.C.SUBSCRIBE, {
                extraHeaders: extraHeaders,
                body: this.body
            });
        }
        clearTimeout(this.timers.subDuration);
        clearTimeout(this.timers.N);
        this.timers.N = setTimeout(this.timer_fire.bind(this), Timers_1.Timers.TIMER_N);
        this.emit("terminated");
    };
    Subscription.prototype.receiveRequest = function (request) {
        var _this = this;
        var subState;
        var setExpiresTimeout = function () {
            if (subState.expires) {
                clearTimeout(_this.timers.subDuration);
                subState.expires = Math.min(_this.expires, Math.max(subState.expires, 0));
                _this.timers.subDuration = setTimeout(_this.refresh.bind(_this), subState.expires * 900);
            }
        };
        if (!this.matchEvent(request)) { // checks event and subscription_state headers
            request.reply(489);
            return;
        }
        if (!this.dialog) {
            if (this.createConfirmedDialog(request, "UAS")) {
                if (this.dialog) {
                    this.id = this.dialog.id.toString();
                    if (this.request && this.request.from) {
                        delete this.ua.earlySubscriptions[this.request.callId + this.request.from.parameters.tag + this.event];
                        this.ua.subscriptions[this.id || ""] = this;
                        // UPDATE ROUTE SET TO BE BACKWARDS COMPATIBLE?
                    }
                }
            }
        }
        subState = request.parseHeader("Subscription-State");
        request.reply(200);
        clearTimeout(this.timers.N);
        this.emit("notify", { request: request });
        // if we've set state to terminated, no further processing should take place
        // and we are only interested in cleaning up after the appropriate NOTIFY
        if (this.state === "terminated") {
            if (subState.state === "terminated") {
                this.terminateDialog();
                clearTimeout(this.timers.N);
                clearTimeout(this.timers.subDuration);
                delete this.ua.subscriptions[this.id || ""];
            }
            return;
        }
        switch (subState.state) {
            case "active":
                this.state = "active";
                setExpiresTimeout();
                break;
            case "pending":
                if (this.state === "notify_wait") {
                    setExpiresTimeout();
                }
                this.state = "pending";
                break;
            case "terminated":
                clearTimeout(this.timers.subDuration);
                if (subState.reason) {
                    this.logger.log("terminating subscription with reason " + subState.reason);
                    switch (subState.reason) {
                        case "deactivated":
                        case "timeout":
                            this.subscribe();
                            return;
                        case "probation":
                        case "giveup":
                            if (subState.params && subState.params["retry-after"]) {
                                this.timers.subDuration = setTimeout(this.subscribe.bind(this), subState.params["retry-after"]);
                            }
                            else {
                                this.subscribe();
                            }
                            return;
                        case "rejected":
                        case "noresource":
                        case "invariant":
                            break;
                    }
                }
                this.close();
                break;
        }
    };
    Subscription.prototype.close = function () {
        if (this.state === "notify_wait") {
            this.state = "terminated";
            clearTimeout(this.timers.N);
            clearTimeout(this.timers.subDuration);
            this.receiveResponse = function () { };
            if (this.request && this.request.from) {
                delete this.ua.earlySubscriptions[this.request.callId + this.request.from.parameters.tag + this.event];
            }
            this.emit("terminated");
        }
        else if (this.state !== "terminated") {
            this.unsubscribe();
        }
    };
    Subscription.prototype.onDialogError = function (response) {
        this.failed(response, Constants_1.C.causes.DIALOG_ERROR);
    };
    Subscription.prototype.timer_fire = function () {
        if (this.state === "terminated") {
            this.terminateDialog();
            clearTimeout(this.timers.N);
            clearTimeout(this.timers.subDuration);
            delete this.ua.subscriptions[this.id || ""];
        }
        else if (this.state === "notify_wait" || this.state === "pending") {
            this.close();
        }
        else {
            this.refresh();
        }
    };
    Subscription.prototype.createConfirmedDialog = function (message, type) {
        this.terminateDialog();
        var dialog = new Dialogs_1.Dialog(this, message, type);
        if (this.request) {
            dialog.inviteSeqnum = this.request.cseq;
            dialog.localSeqnum = this.request.cseq;
        }
        if (!dialog.error) {
            this.dialog = dialog;
            return true;
        }
        else {
            // Dialog not created due to an errora
            return false;
        }
    };
    Subscription.prototype.terminateDialog = function () {
        if (this.dialog) {
            delete this.ua.subscriptions[this.id || ""];
            this.dialog.terminate();
            delete this.dialog;
        }
    };
    Subscription.prototype.failed = function (response, cause) {
        this.close();
        this.emit("failed", response, cause);
        this.emit("rejected", response, cause);
        return this;
    };
    Subscription.prototype.matchEvent = function (request) {
        // Check mandatory header Event
        if (!request.hasHeader("Event")) {
            this.logger.warn("missing Event header");
            return false;
        }
        // Check mandatory header Subscription-State
        if (!request.hasHeader("Subscription-State")) {
            this.logger.warn("missing Subscription-State header");
            return false;
        }
        // Check whether the event in NOTIFY matches the event in SUBSCRIBE
        var event = request.parseHeader("event").event;
        if (this.event !== event) {
            this.logger.warn("event match failed");
            request.reply(481, "Event Match Failed");
            return false;
        }
        else {
            return true;
        }
    };
    return Subscription;
}(ClientContext_1.ClientContext));
exports.Subscription = Subscription;
