"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("../core");
/**
 * A request to establish a {@link Session} elsewhere (incoming REFER).
 * @public
 */
var Referral = /** @class */ (function () {
    /** @internal */
    function Referral(incomingReferRequest, session) {
        this.incomingReferRequest = incomingReferRequest;
        this.session = session;
    }
    Object.defineProperty(Referral.prototype, "referTo", {
        get: function () {
            var referTo = this.incomingReferRequest.message.parseHeader("refer-to");
            if (!(referTo instanceof core_1.NameAddrHeader)) {
                throw new Error("Failed to parse Refer-To header.");
            }
            return referTo;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Referral.prototype, "referredBy", {
        get: function () {
            return this.incomingReferRequest.message.getHeader("referred-by");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Referral.prototype, "replaces", {
        get: function () {
            return this.referTo.uri.getHeader("replaces");
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Referral.prototype, "request", {
        /** Incoming REFER request message. */
        get: function () {
            return this.incomingReferRequest.message;
        },
        enumerable: true,
        configurable: true
    });
    /** Accept the request. */
    Referral.prototype.accept = function (options) {
        if (options === void 0) { options = { statusCode: 202 }; }
        this.incomingReferRequest.accept(options);
        return Promise.resolve();
    };
    /** Reject the request. */
    Referral.prototype.reject = function (options) {
        this.incomingReferRequest.reject(options);
        return Promise.resolve();
    };
    /**
     * Creates an inviter which may be used to send an out of dialog INVITE request.
     *
     * @remarks
     * This a helper method to create an Inviter which will execute the referral
     * of the `Session` which was referred. The appropriate headers are set and
     * the referred `Session` is linked to the new `Session`. Note that only a
     * single instance of the `Inviter` will be created and returned (if called
     * more than once a reference to the same `Inviter` will be returned every time).
     *
     * @param options - Options bucket.
     * @param modifiers - Session description handler modifiers.
     */
    Referral.prototype.makeInviter = function (options) {
        if (this.inviter) {
            return this.inviter;
        }
        var targetURI = this.referTo.uri.clone();
        targetURI.clearHeaders();
        options = options || {};
        var extraHeaders = (options.extraHeaders || []).slice();
        var replaces = this.replaces;
        if (replaces) {
            // decodeURIComponent is a holdover from 2c086eb4. Not sure that it is actually necessary
            extraHeaders.push("Replaces: " + decodeURIComponent(replaces));
        }
        var referredBy = this.referredBy;
        if (referredBy) {
            extraHeaders.push("Referred-By: " + referredBy);
        }
        options.extraHeaders = extraHeaders;
        this.inviter = this.session.userAgent._makeInviter(targetURI, options);
        this.inviter._referred = this.session;
        this.session._referral = this.inviter;
        return this.inviter;
    };
    return Referral;
}());
exports.Referral = Referral;
