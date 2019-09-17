"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = require("events");
var UA_1 = require("../UA");
var Modifiers = tslib_1.__importStar(require("./Modifiers"));
/* Simple
 * @class Simple
 */
var SimpleStatus;
(function (SimpleStatus) {
    SimpleStatus[SimpleStatus["STATUS_NULL"] = 0] = "STATUS_NULL";
    SimpleStatus[SimpleStatus["STATUS_NEW"] = 1] = "STATUS_NEW";
    SimpleStatus[SimpleStatus["STATUS_CONNECTING"] = 2] = "STATUS_CONNECTING";
    SimpleStatus[SimpleStatus["STATUS_CONNECTED"] = 3] = "STATUS_CONNECTED";
    SimpleStatus[SimpleStatus["STATUS_COMPLETED"] = 4] = "STATUS_COMPLETED";
})(SimpleStatus = exports.SimpleStatus || (exports.SimpleStatus = {}));
var Simple = /** @class */ (function (_super) {
    tslib_1.__extends(Simple, _super);
    function Simple(options) {
        var _this = _super.call(this) || this;
        /*
        *  {
        *    media: {
        *      remote: {
        *        audio: <DOM element>,
        *        video: <DOM element>
        *      },
        *      local: {
        *        video: <DOM element>
        *      }
        *    },
        *    ua: {
        *       <UA Configuration Options>
        *    }
        *  }
        */
        if (options.media.remote.video) {
            _this.video = true;
        }
        else {
            _this.video = false;
        }
        if (options.media.remote.audio) {
            _this.audio = true;
        }
        else {
            _this.audio = false;
        }
        if (!_this.audio && !_this.video) {
            // Need to do at least audio or video
            // Error
            throw new Error("At least one remote audio or video element is required for Simple.");
        }
        _this.options = options;
        // https://stackoverflow.com/questions/7944460/detect-safari-browser
        var browserUa = navigator.userAgent.toLowerCase();
        var isSafari = false;
        var isFirefox = false;
        if (browserUa.indexOf("safari") > -1 && browserUa.indexOf("chrome") < 0) {
            isSafari = true;
        }
        else if (browserUa.indexOf("firefox") > -1 && browserUa.indexOf("chrome") < 0) {
            isFirefox = true;
        }
        var sessionDescriptionHandlerFactoryOptions = {};
        if (isSafari) {
            sessionDescriptionHandlerFactoryOptions.modifiers = [Modifiers.stripG722];
        }
        if (isFirefox) {
            sessionDescriptionHandlerFactoryOptions.alwaysAcquireMediaFirst = true;
        }
        if (!_this.options.ua.uri) {
            _this.anonymous = true;
        }
        else {
            _this.anonymous = false;
        }
        _this.ua = new UA_1.UA({
            // User Configurable Options
            uri: _this.options.ua.uri,
            authorizationUser: _this.options.ua.authorizationUser,
            password: _this.options.ua.password,
            displayName: _this.options.ua.displayName,
            // Undocumented "Advanced" Options
            userAgentString: _this.options.ua.userAgentString,
            // Fixed Options
            register: true,
            sessionDescriptionHandlerFactoryOptions: sessionDescriptionHandlerFactoryOptions,
            transportOptions: {
                traceSip: _this.options.ua.traceSip,
                wsServers: _this.options.ua.wsServers
            }
        });
        _this.state = SimpleStatus.STATUS_NULL;
        _this.logger = _this.ua.getLogger("sip.simple");
        _this.ua.on("registered", function () {
            _this.emit("registered", _this.ua);
        });
        _this.ua.on("unregistered", function () {
            _this.emit("unregistered", _this.ua);
        });
        _this.ua.on("registrationFailed", function () {
            _this.emit("unregistered", _this.ua);
        });
        _this.ua.on("invite", function (session) {
            // If there is already an active session reject the incoming session
            if (_this.state !== SimpleStatus.STATUS_NULL && _this.state !== SimpleStatus.STATUS_COMPLETED) {
                _this.logger.warn("Rejecting incoming call. Simple only supports 1 call at a time");
                session.reject();
                return;
            }
            _this.session = session;
            _this.setupSession();
            _this.emit("ringing", _this.session);
        });
        _this.ua.on("message", function (message) {
            _this.emit("message", message);
        });
        return _this;
    }
    Simple.prototype.call = function (destination) {
        if (!this.ua || !this.checkRegistration()) {
            this.logger.warn("A registered UA is required for calling");
            return;
        }
        if (this.state !== SimpleStatus.STATUS_NULL && this.state !== SimpleStatus.STATUS_COMPLETED) {
            this.logger.warn("Cannot make more than a single call with Simple");
            return;
        }
        // Safari hack, because you cannot call .play() from a non user action
        if (this.options.media.remote.audio) {
            this.options.media.remote.audio.autoplay = true;
        }
        if (this.options.media.remote.video) {
            this.options.media.remote.video.autoplay = true;
        }
        if (this.options.media.local && this.options.media.local.video) {
            this.options.media.local.video.autoplay = true;
            this.options.media.local.video.volume = 0;
        }
        this.session = this.ua.invite(destination, {
            sessionDescriptionHandlerOptions: {
                constraints: {
                    audio: this.audio,
                    video: this.video
                }
            }
        });
        this.setupSession();
        return this.session;
    };
    Simple.prototype.answer = function () {
        if (this.state !== SimpleStatus.STATUS_NEW && this.state !== SimpleStatus.STATUS_CONNECTING) {
            this.logger.warn("No call to answer");
            return;
        }
        // Safari hack, because you cannot call .play() from a non user action
        if (this.options.media.remote.audio) {
            this.options.media.remote.audio.autoplay = true;
        }
        if (this.options.media.remote.video) {
            this.options.media.remote.video.autoplay = true;
        }
        return this.session.accept({
            sessionDescriptionHandlerOptions: {
                constraints: {
                    audio: this.audio,
                    video: this.video
                }
            }
        });
        // emit call is active
    };
    Simple.prototype.reject = function () {
        if (this.state !== SimpleStatus.STATUS_NEW && this.state !== SimpleStatus.STATUS_CONNECTING) {
            this.logger.warn("Call is already answered");
            return;
        }
        return this.session.reject();
    };
    Simple.prototype.hangup = function () {
        if (this.state !== SimpleStatus.STATUS_CONNECTED &&
            this.state !== SimpleStatus.STATUS_CONNECTING &&
            this.state !== SimpleStatus.STATUS_NEW) {
            this.logger.warn("No active call to hang up on");
            return;
        }
        if (this.state !== SimpleStatus.STATUS_CONNECTED) {
            return this.session.cancel();
        }
        else if (this.session) {
            return this.session.bye();
        }
    };
    Simple.prototype.hold = function () {
        if (this.state !== SimpleStatus.STATUS_CONNECTED || !this.session || this.session.localHold) {
            this.logger.warn("Cannot put call on hold");
            return;
        }
        this.mute();
        this.logger.log("Placing session on hold");
        return this.session.hold();
    };
    Simple.prototype.unhold = function () {
        if (this.state !== SimpleStatus.STATUS_CONNECTED || !this.session || !this.session.localHold) {
            this.logger.warn("Cannot unhold a call that is not on hold");
            return;
        }
        this.unmute();
        this.logger.log("Placing call off hold");
        return this.session.unhold();
    };
    Simple.prototype.mute = function () {
        if (this.state !== SimpleStatus.STATUS_CONNECTED) {
            this.logger.warn("An acitve call is required to mute audio");
            return;
        }
        this.logger.log("Muting Audio");
        this.toggleMute(true);
        this.emit("mute", this);
    };
    Simple.prototype.unmute = function () {
        if (this.state !== SimpleStatus.STATUS_CONNECTED) {
            this.logger.warn("An active call is required to unmute audio");
            return;
        }
        this.logger.log("Unmuting Audio");
        this.toggleMute(false);
        this.emit("unmute", this);
    };
    Simple.prototype.sendDTMF = function (tone) {
        if (this.state !== SimpleStatus.STATUS_CONNECTED || !this.session) {
            this.logger.warn("An active call is required to send a DTMF tone");
            return;
        }
        this.logger.log("Sending DTMF tone: " + tone);
        this.session.dtmf(tone);
    };
    Simple.prototype.message = function (destination, message) {
        if (!this.ua || !this.checkRegistration()) {
            this.logger.warn("A registered UA is required to send a message");
            return;
        }
        if (!destination || !message) {
            this.logger.warn("A destination and message are required to send a message");
            return;
        }
        this.ua.message(destination, message);
    };
    // Private Helpers
    Simple.prototype.checkRegistration = function () {
        return (this.anonymous || (this.ua && this.ua.isRegistered()));
    };
    Simple.prototype.setupRemoteMedia = function () {
        var _this = this;
        if (!this.session) {
            this.logger.warn("No session to set remote media on");
            return;
        }
        // If there is a video track, it will attach the video and audio to the same element
        var pc = this.session.sessionDescriptionHandler.peerConnection;
        var remoteStream;
        if (pc.getReceivers) {
            remoteStream = new MediaStream();
            pc.getReceivers().forEach(function (receiver) {
                var track = receiver.track;
                if (track) {
                    remoteStream.addTrack(track);
                }
            });
        }
        else {
            remoteStream = pc.getRemoteStreams()[0];
        }
        if (this.video) {
            this.options.media.remote.video.srcObject = remoteStream;
            this.options.media.remote.video.play().catch(function () {
                _this.logger.log("play was rejected");
            });
        }
        else if (this.audio) {
            this.options.media.remote.audio.srcObject = remoteStream;
            this.options.media.remote.audio.play().catch(function () {
                _this.logger.log("play was rejected");
            });
        }
    };
    Simple.prototype.setupLocalMedia = function () {
        if (!this.session) {
            this.logger.warn("No session to set local media on");
            return;
        }
        if (this.video && this.options.media.local && this.options.media.local.video) {
            var pc = this.session.sessionDescriptionHandler.peerConnection;
            var localStream_1;
            if (pc.getSenders) {
                localStream_1 = new MediaStream();
                pc.getSenders().forEach(function (sender) {
                    var track = sender.track;
                    if (track && track.kind === "video") {
                        localStream_1.addTrack(track);
                    }
                });
            }
            else {
                localStream_1 = pc.getLocalStreams()[0];
            }
            this.options.media.local.video.srcObject = localStream_1;
            this.options.media.local.video.volume = 0;
            this.options.media.local.video.play();
        }
    };
    Simple.prototype.cleanupMedia = function () {
        if (this.video) {
            this.options.media.remote.video.srcObject = null;
            this.options.media.remote.video.pause();
            if (this.options.media.local && this.options.media.local.video) {
                this.options.media.local.video.srcObject = null;
                this.options.media.local.video.pause();
            }
        }
        if (this.audio) {
            this.options.media.remote.audio.srcObject = null;
            this.options.media.remote.audio.pause();
        }
    };
    Simple.prototype.setupSession = function () {
        var _this = this;
        if (!this.session) {
            this.logger.warn("No session to set up");
            return;
        }
        this.state = SimpleStatus.STATUS_NEW;
        this.emit("new", this.session);
        this.session.on("progress", function () { return _this.onProgress(); });
        this.session.on("accepted", function () { return _this.onAccepted(); });
        this.session.on("rejected", function () { return _this.onEnded(); });
        this.session.on("failed", function () { return _this.onFailed(); });
        this.session.on("terminated", function () { return _this.onEnded(); });
    };
    Simple.prototype.destroyMedia = function () {
        if (this.session && this.session.sessionDescriptionHandler) {
            this.session.sessionDescriptionHandler.close();
        }
    };
    Simple.prototype.toggleMute = function (mute) {
        if (!this.session) {
            this.logger.warn("No session to toggle mute");
            return;
        }
        var pc = this.session.sessionDescriptionHandler.peerConnection;
        if (pc.getSenders) {
            pc.getSenders().forEach(function (sender) {
                if (sender.track) {
                    sender.track.enabled = !mute;
                }
            });
        }
        else {
            pc.getLocalStreams().forEach(function (stream) {
                stream.getAudioTracks().forEach(function (track) {
                    track.enabled = !mute;
                });
                stream.getVideoTracks().forEach(function (track) {
                    track.enabled = !mute;
                });
            });
        }
    };
    Simple.prototype.onAccepted = function () {
        var _this = this;
        if (!this.session) {
            this.logger.warn("No session for accepting");
            return;
        }
        this.state = SimpleStatus.STATUS_CONNECTED;
        this.emit("connected", this.session);
        this.setupLocalMedia();
        this.setupRemoteMedia();
        if (this.session.sessionDescriptionHandler) {
            this.session.sessionDescriptionHandler.on("addTrack", function () {
                _this.logger.log("A track has been added, triggering new remoteMedia setup");
                _this.setupRemoteMedia();
            });
            this.session.sessionDescriptionHandler.on("addStream", function () {
                _this.logger.log("A stream has been added, trigger new remoteMedia setup");
                _this.setupRemoteMedia();
            });
        }
        this.session.on("dtmf", function (request, dtmf) {
            _this.emit("dtmf", dtmf.tone);
        });
        this.session.on("bye", function () { return _this.onEnded(); });
    };
    Simple.prototype.onProgress = function () {
        this.state = SimpleStatus.STATUS_CONNECTING;
        this.emit("connecting", this.session);
    };
    Simple.prototype.onFailed = function () {
        this.onEnded();
    };
    Simple.prototype.onEnded = function () {
        this.state = SimpleStatus.STATUS_COMPLETED;
        this.emit("ended", this.session);
        this.cleanupMedia();
    };
    Simple.C = SimpleStatus;
    return Simple;
}(events_1.EventEmitter));
exports.Simple = Simple;
