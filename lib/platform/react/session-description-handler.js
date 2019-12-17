"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var events_1 = require("events");
var react_native_webrtc_1 = require("react-native-webrtc");
var exceptions_1 = require("../../api/exceptions");
var Modifiers = tslib_1.__importStar(require("../web/modifiers"));
function defer() {
    var deferred = {};
    deferred.promise = new Promise(function (resolve, reject) {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });
    return deferred;
}
function reducePromises(arr, val) {
    return arr.reduce(function (acc, fn) {
        acc = acc.then(fn);
        return acc;
    }, Promise.resolve(val));
}
var SessionDescriptionHandler = /** @class */ (function (_super) {
    tslib_1.__extends(SessionDescriptionHandler, _super);
    function SessionDescriptionHandler(logger, options) {
        var _this = _super.call(this) || this;
        // TODO: Validate the options
        _this.options = options || {};
        _this.logger = logger;
        _this.dtmfSender = undefined;
        _this.shouldAcquireMedia = true;
        _this.CONTENT_TYPE = "application/sdp";
        _this.C = {
            DIRECTION: {
                NULL: null,
                SENDRECV: "sendrecv",
                SENDONLY: "sendonly",
                RECVONLY: "recvonly",
                INACTIVE: "inactive"
            }
        };
        _this.logger.log("SessionDescriptionHandlerOptions: " + JSON.stringify(_this.options));
        _this.direction = _this.C.DIRECTION.NULL;
        _this.modifiers = _this.options.modifiers || [];
        if (!Array.isArray(_this.modifiers)) {
            _this.modifiers = [_this.modifiers];
        }
        _this.WebRTC = {
            MediaStream: react_native_webrtc_1.MediaStream,
            getUserMedia: react_native_webrtc_1.mediaDevices.getUserMedia,
            RTCPeerConnection: react_native_webrtc_1.RTCPeerConnection
        };
        _this.iceGatheringTimeout = false;
        _this.initPeerConnection(_this.options.peerConnectionOptions);
        _this.constraints = _this.checkAndDefaultConstraints(_this.options.constraints);
        return _this;
    }
    /**
     * @param {SIP.Session} session
     * @param {Object} [options]
     */
    SessionDescriptionHandler.defaultFactory = function (session, options) {
        var logger = session.userAgent.getLogger("sip.sessionDescriptionHandler", session.id);
        return new SessionDescriptionHandler(logger, options);
    };
    // Functions the sesssion can use
    /**
     * Destructor
     */
    SessionDescriptionHandler.prototype.close = function () {
        this.logger.log("closing PeerConnection");
        // have to check signalingState since this.close() gets called multiple times
        if (this.peerConnection && this.peerConnection.signalingState !== "closed") {
            if (this.peerConnection.getSenders) {
                this.peerConnection.getSenders().forEach(function (sender) {
                    if (sender.track) {
                        sender.track.stop();
                    }
                });
            }
            else {
                this.logger.warn("Using getLocalStreams which is deprecated");
                this.peerConnection.getLocalStreams().forEach(function (stream) {
                    stream.getTracks().forEach(function (track) {
                        track.stop();
                    });
                });
            }
            if (this.peerConnection.getReceivers) {
                this.peerConnection.getReceivers().forEach(function (receiver) {
                    if (receiver.track) {
                        receiver.track.stop();
                    }
                });
            }
            else {
                this.logger.warn("Using getRemoteStreams which is deprecated");
                this.peerConnection.getRemoteStreams().forEach(function (stream) {
                    stream.getTracks().forEach(function (track) {
                        track.stop();
                    });
                });
            }
            this.resetIceGatheringComplete();
            this.peerConnection.close();
        }
    };
    /**
     * Gets the local description from the underlying media implementation
     * @param {Object} [options] Options object to be used by getDescription
     * @param {MediaStreamConstraints} [options.constraints] MediaStreamConstraints
     *   https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamConstraints
     * @param {Object} [options.peerConnectionOptions] If this is set it will recreate the peer
     *   connection with the new options
     * @param {Array} [modifiers] Array with one time use description modifiers
     * @returns {Promise} Promise that resolves with the local description to be used for the session
     */
    SessionDescriptionHandler.prototype.getDescription = function (options, modifiers) {
        var _this = this;
        if (options === void 0) { options = {}; }
        if (modifiers === void 0) { modifiers = []; }
        if (options.peerConnectionOptions) {
            this.initPeerConnection(options.peerConnectionOptions);
        }
        // Merge passed constraints with saved constraints and save
        var newConstraints = Object.assign({}, this.constraints, options.constraints);
        newConstraints = this.checkAndDefaultConstraints(newConstraints);
        if (JSON.stringify(newConstraints) !== JSON.stringify(this.constraints)) {
            this.constraints = newConstraints;
            this.shouldAcquireMedia = true;
        }
        if (!Array.isArray(modifiers)) {
            modifiers = [modifiers];
        }
        modifiers = modifiers.concat(this.modifiers);
        return Promise.resolve().then(function () {
            if (_this.shouldAcquireMedia) {
                return _this.acquire(_this.constraints).then(function () {
                    _this.shouldAcquireMedia = false;
                });
            }
        }).then(function () { return _this.createOfferOrAnswer(options.RTCOfferOptions, modifiers); })
            .then(function (description) {
            // Recreate offer containing the ICE Candidates
            if (description.type === "offer") {
                return _this.peerConnection.createOffer()
                    .then(function (sdp) { return _this.createRTCSessionDescriptionInit(sdp); });
            }
            return description;
        }).catch(function (e) {
            var error = new exceptions_1.SessionDescriptionHandlerError("createOffer failed");
            _this.logger.error(error.toString());
            throw error;
        }).then(function (description) {
            if (description.sdp === undefined) {
                throw new exceptions_1.SessionDescriptionHandlerError("SDP undefined");
            }
            _this.emit("getDescription", description);
            return {
                body: description.sdp,
                contentType: _this.CONTENT_TYPE
            };
        });
    };
    /**
     * Check if the Session Description Handler can handle the Content-Type described by a SIP Message
     * @param {String} contentType The content type that is in the SIP Message
     * @returns {boolean}
     */
    SessionDescriptionHandler.prototype.hasDescription = function (contentType) {
        return contentType === this.CONTENT_TYPE;
    };
    /**
     * The modifier that should be used when the session would like to place the call on hold
     * @param {String} [sdp] The description that will be modified
     * @returns {Promise} Promise that resolves with modified SDP
     */
    SessionDescriptionHandler.prototype.holdModifier = function (description) {
        if (!description.sdp) {
            return Promise.resolve(description);
        }
        if (!(/a=(sendrecv|sendonly|recvonly|inactive)/).test(description.sdp)) {
            description.sdp = description.sdp.replace(/(m=[^\r]*\r\n)/g, "$1a=sendonly\r\n");
        }
        else {
            description.sdp = description.sdp.replace(/a=sendrecv\r\n/g, "a=sendonly\r\n");
            description.sdp = description.sdp.replace(/a=recvonly\r\n/g, "a=inactive\r\n");
        }
        return Promise.resolve(description);
    };
    /**
     * Set the remote description to the underlying media implementation
     * @param {String} sessionDescription The description provided by a SIP message to be set on the media implementation
     * @param {Object} [options] Options object to be used by getDescription
     * @param {MediaStreamConstraints} [options.constraints] MediaStreamConstraints
     *   https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamConstraints
     * @param {Object} [options.peerConnectionOptions] If this is set it will recreate the peer
     *   connection with the new options
     * @param {Array} [modifiers] Array with one time use description modifiers
     * @returns {Promise} Promise that resolves once the description is set
     */
    SessionDescriptionHandler.prototype.setDescription = function (sessionDescription, options, modifiers) {
        var _this = this;
        if (options === void 0) { options = {}; }
        if (modifiers === void 0) { modifiers = []; }
        options = options || {};
        if (options.peerConnectionOptions) {
            this.initPeerConnection(options.peerConnectionOptions);
        }
        if (!Array.isArray(modifiers)) {
            modifiers = [modifiers];
        }
        modifiers = modifiers.concat(this.modifiers);
        var description = {
            type: this.hasOffer("local") ? "answer" : "offer",
            sdp: sessionDescription
        };
        return Promise.resolve().then(function () {
            // Media should be acquired in getDescription unless we need to do it sooner for some reason (FF61+)
            if (_this.shouldAcquireMedia && _this.options.alwaysAcquireMediaFirst) {
                return _this.acquire(_this.constraints).then(function () {
                    _this.shouldAcquireMedia = false;
                });
            }
        }).then(function () { return reducePromises(modifiers, description); })
            .catch(function (e) {
            var error = new exceptions_1.SessionDescriptionHandlerError("The modifiers did not resolve successfully");
            _this.logger.error(error.message);
            _this.emit("peerConnection-setRemoteDescriptionFailed", error);
            throw error;
        }).then(function (modifiedDescription) {
            _this.emit("setDescription", modifiedDescription);
            return _this.peerConnection.setRemoteDescription(modifiedDescription);
        }).catch(function (e) {
            // Check the original SDP for video, and ensure that we have want to do audio fallback
            if ((/^m=video.+$/gm).test(sessionDescription) && !options.disableAudioFallback) {
                // Do not try to audio fallback again
                options.disableAudioFallback = true;
                // Remove video first, then do the other modifiers
                return _this.setDescription(sessionDescription, options, [Modifiers.stripVideo].concat(modifiers));
            }
            var error = new exceptions_1.SessionDescriptionHandlerError("setDescription");
            _this.emit("peerConnection-setRemoteDescriptionFailed", error);
            throw error;
        }).then(function () {
            if (_this.peerConnection.getReceivers) {
                _this.emit("setRemoteDescription", _this.peerConnection.getReceivers());
            }
            else {
                _this.emit("setRemoteDescription", _this.peerConnection.getRemoteStreams());
            }
            _this.emit("confirmed", _this);
        });
    };
    /**
     * Send DTMF via RTP (RFC 4733)
     * @param {String} tones A string containing DTMF digits
     * @param {Object} [options] Options object to be used by sendDtmf
     * @returns {boolean} true if DTMF send is successful, false otherwise
     */
    SessionDescriptionHandler.prototype.sendDtmf = function (tones, options) {
        if (!this.dtmfSender && this.hasBrowserGetSenderSupport()) {
            var senders = this.peerConnection.getSenders();
            if (senders.length > 0) {
                this.dtmfSender = senders[0].dtmf;
            }
        }
        if (!this.dtmfSender && this.hasBrowserTrackSupport()) {
            var streams = this.peerConnection.getLocalStreams();
            if (streams.length > 0) {
                var audioTracks = streams[0].getAudioTracks();
                if (audioTracks.length > 0) {
                    this.dtmfSender = this.peerConnection.createDTMFSender(audioTracks[0]);
                }
            }
        }
        if (!this.dtmfSender) {
            return false;
        }
        try {
            this.dtmfSender.insertDTMF(tones, options.duration, options.interToneGap);
        }
        catch (e) {
            if (e.type === "InvalidStateError" || e.type === "InvalidCharacterError") {
                this.logger.error(e);
                return false;
            }
            else {
                throw e;
            }
        }
        this.logger.log("DTMF sent via RTP: " + tones.toString());
        return true;
    };
    SessionDescriptionHandler.prototype.getDirection = function () {
        return this.direction;
    };
    // Internal functions
    SessionDescriptionHandler.prototype.createOfferOrAnswer = function (RTCOfferOptions, modifiers) {
        var _this = this;
        if (RTCOfferOptions === void 0) { RTCOfferOptions = {}; }
        RTCOfferOptions = RTCOfferOptions || {};
        var methodName = this.hasOffer("remote") ? "createAnswer" : "createOffer";
        var pc = this.peerConnection;
        this.logger.log(methodName);
        return pc[methodName](RTCOfferOptions).catch(function (e) {
            if (e.type === exceptions_1.SessionDescriptionHandlerError) {
                throw e;
            }
            var error = new exceptions_1.SessionDescriptionHandlerError("peerConnection-" + methodName + "Failed");
            _this.emit("peerConnection-" + methodName + "Failed", error);
            throw error;
        }).then(function (sdp) { return reducePromises(modifiers, _this.createRTCSessionDescriptionInit(sdp)); })
            .then(function (sdp) {
            _this.resetIceGatheringComplete();
            _this.logger.log("Setting local sdp.");
            _this.logger.log("sdp is " + sdp.sdp || "undefined");
            return pc.setLocalDescription(sdp);
        })
            .catch(function (e) {
            if (e.type === exceptions_1.SessionDescriptionHandlerError) {
                throw e;
            }
            var error = new exceptions_1.SessionDescriptionHandlerError("peerConnection-SetLocalDescriptionFailed");
            _this.emit("peerConnection-SetLocalDescriptionFailed", error);
            throw error;
        }).then(function () { return _this.waitForIceGatheringComplete(); })
            .then(function () {
            var localDescription = _this.createRTCSessionDescriptionInit(_this.peerConnection.localDescription);
            return reducePromises(modifiers, localDescription);
        }).then(function (localDescription) {
            _this.setDirection(localDescription.sdp || "");
            return localDescription;
        }).catch(function (e) {
            var error = new exceptions_1.SessionDescriptionHandlerError("createOfferOrAnswer");
            _this.logger.error(error.toString());
            throw error;
        });
    };
    // Creates an RTCSessionDescriptionInit from an RTCSessionDescription
    SessionDescriptionHandler.prototype.createRTCSessionDescriptionInit = function (RTCSessionDescription) {
        return {
            type: RTCSessionDescription.type,
            sdp: RTCSessionDescription.sdp
        };
    };
    SessionDescriptionHandler.prototype.addDefaultIceCheckingTimeout = function (peerConnectionOptions) {
        if (peerConnectionOptions.iceCheckingTimeout === undefined) {
            peerConnectionOptions.iceCheckingTimeout = 5000;
        }
        return peerConnectionOptions;
    };
    SessionDescriptionHandler.prototype.addDefaultIceServers = function (rtcConfiguration) {
        if (!rtcConfiguration.iceServers) {
            rtcConfiguration.iceServers = [{ urls: "stun:stun.l.google.com:19302" }];
        }
        return rtcConfiguration;
    };
    SessionDescriptionHandler.prototype.checkAndDefaultConstraints = function (constraints) {
        var defaultConstraints = { audio: true, video: !this.options.alwaysAcquireMediaFirst };
        constraints = constraints || defaultConstraints;
        // Empty object check
        if (Object.keys(constraints).length === 0 && constraints.constructor === Object) {
            return defaultConstraints;
        }
        return constraints;
    };
    SessionDescriptionHandler.prototype.hasBrowserTrackSupport = function () {
        return Boolean(this.peerConnection.addTrack);
    };
    SessionDescriptionHandler.prototype.hasBrowserGetSenderSupport = function () {
        return Boolean(this.peerConnection.getSenders);
    };
    SessionDescriptionHandler.prototype.initPeerConnection = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        options = this.addDefaultIceCheckingTimeout(options);
        options.rtcConfiguration = options.rtcConfiguration || {};
        options.rtcConfiguration = this.addDefaultIceServers(options.rtcConfiguration);
        this.logger.log("initPeerConnection");
        if (this.peerConnection) {
            this.logger.log("Already have a peer connection for this session. Tearing down.");
            this.resetIceGatheringComplete();
            this.peerConnection.close();
        }
        this.peerConnection = new this.WebRTC.RTCPeerConnection(options.rtcConfiguration);
        this.logger.log("New peer connection created");
        if ("ontrack" in this.peerConnection) {
            this.peerConnection.addEventListener("track", function (e) {
                _this.logger.log("track added");
                _this.emit("addTrack", e);
            });
        }
        else {
            this.logger.warn("Using onaddstream which is deprecated");
            this.peerConnection.onaddstream = function (e) {
                _this.logger.log("stream added");
                _this.emit("addStream", e);
            };
        }
        this.peerConnection.onicecandidate = function (e) {
            _this.emit("iceCandidate", e);
            if (e.candidate) {
                _this.logger.log("ICE candidate received: " +
                    (e.candidate.candidate === null ? null : e.candidate.candidate.trim()));
            }
            else if (e.candidate === null) {
                // indicates the end of candidate gathering
                _this.logger.log("ICE candidate gathering complete");
                _this.triggerIceGatheringComplete();
            }
        };
        this.peerConnection.onicegatheringstatechange = function () {
            _this.logger.log("RTCIceGatheringState changed: " + _this.peerConnection.iceGatheringState);
            switch (_this.peerConnection.iceGatheringState) {
                case "gathering":
                    _this.emit("iceGathering", _this);
                    if (!_this.iceGatheringTimer && options.iceCheckingTimeout) {
                        _this.iceGatheringTimeout = false;
                        _this.iceGatheringTimer = setTimeout(function () {
                            _this.logger.log("RTCIceChecking Timeout Triggered after " + options.iceCheckingTimeout + " milliseconds");
                            _this.iceGatheringTimeout = true;
                            _this.triggerIceGatheringComplete();
                        }, options.iceCheckingTimeout);
                    }
                    break;
                case "complete":
                    _this.triggerIceGatheringComplete();
                    break;
            }
        };
        this.peerConnection.oniceconnectionstatechange = function () {
            var stateEvent;
            switch (_this.peerConnection.iceConnectionState) {
                case "new":
                    stateEvent = "iceConnection";
                    break;
                case "checking":
                    stateEvent = "iceConnectionChecking";
                    break;
                case "connected":
                    stateEvent = "iceConnectionConnected";
                    break;
                case "completed":
                    stateEvent = "iceConnectionCompleted";
                    break;
                case "failed":
                    stateEvent = "iceConnectionFailed";
                    break;
                case "disconnected":
                    stateEvent = "iceConnectionDisconnected";
                    break;
                case "closed":
                    stateEvent = "iceConnectionClosed";
                    break;
                default:
                    _this.logger.warn("Unknown iceConnection state: " + _this.peerConnection.iceConnectionState);
                    return;
            }
            _this.logger.log("ICE Connection State changed to " + stateEvent);
            _this.emit(stateEvent, _this);
        };
    };
    SessionDescriptionHandler.prototype.acquire = function (constraints) {
        var _this = this;
        // Default audio & video to true
        constraints = this.checkAndDefaultConstraints(constraints);
        return new Promise(function (resolve, reject) {
            /*
             * Make the call asynchronous, so that ICCs have a chance
             * to define callbacks to `userMediaRequest`
             */
            _this.logger.log("acquiring local media");
            _this.emit("userMediaRequest", constraints);
            if (constraints.audio || constraints.video) {
                _this.WebRTC.getUserMedia(constraints).then(function (streams) {
                    _this.emit("userMedia", streams);
                    resolve(streams);
                }).catch(function (e) {
                    _this.emit("userMediaFailed", e);
                    reject(e);
                });
            }
            else {
                // Local streams were explicitly excluded.
                resolve([]);
            }
        }).catch(function (e) {
            var error = new exceptions_1.SessionDescriptionHandlerError("unable to acquire streams");
            _this.logger.error(error.message);
            throw error;
        }).then(function (streams) {
            _this.logger.log("acquired local media streams");
            try {
                // Remove old tracks
                if (_this.peerConnection.removeTrack) {
                    _this.peerConnection.getSenders().forEach(function (sender) {
                        _this.peerConnection.removeTrack(sender);
                    });
                }
                return streams;
            }
            catch (e) {
                return Promise.reject(e);
            }
        })
            .catch(function (e) {
            var error = new exceptions_1.SessionDescriptionHandlerError("error removing streams");
            _this.logger.error(error.message);
            throw error;
        }).then(function (streams) {
            try {
                streams = [].concat(streams);
                streams.forEach(function (stream) {
                    if (_this.peerConnection.addTrack) {
                        stream.getTracks().forEach(function (track) {
                            _this.peerConnection.addTrack(track, stream);
                        });
                    }
                    else {
                        // Chrome 59 does not support addTrack
                        _this.peerConnection.addStream(stream);
                    }
                });
            }
            catch (e) {
                return Promise.reject(e);
            }
            return Promise.resolve();
        })
            .catch(function (e) {
            var error = new exceptions_1.SessionDescriptionHandlerError("error adding stream");
            _this.logger.error(error.message);
            throw error;
        });
    };
    SessionDescriptionHandler.prototype.hasOffer = function (where) {
        var offerState = "have-" + where + "-offer";
        return this.peerConnection.signalingState === offerState;
    };
    // ICE gathering state handling
    SessionDescriptionHandler.prototype.isIceGatheringComplete = function () {
        return this.peerConnection.iceGatheringState === "complete" || this.iceGatheringTimeout;
    };
    SessionDescriptionHandler.prototype.resetIceGatheringComplete = function () {
        this.iceGatheringTimeout = false;
        this.logger.log("resetIceGatheringComplete");
        if (this.iceGatheringTimer) {
            clearTimeout(this.iceGatheringTimer);
            this.iceGatheringTimer = undefined;
        }
        if (this.iceGatheringDeferred) {
            this.iceGatheringDeferred.reject();
            this.iceGatheringDeferred = undefined;
        }
    };
    SessionDescriptionHandler.prototype.setDirection = function (sdp) {
        var match = sdp.match(/a=(sendrecv|sendonly|recvonly|inactive)/);
        if (match === null) {
            this.direction = this.C.DIRECTION.NULL;
            this.emit("directionChanged");
            return;
        }
        var direction = match[1];
        switch (direction) {
            case this.C.DIRECTION.SENDRECV:
            case this.C.DIRECTION.SENDONLY:
            case this.C.DIRECTION.RECVONLY:
            case this.C.DIRECTION.INACTIVE:
                this.direction = direction;
                break;
            default:
                this.direction = this.C.DIRECTION.NULL;
                break;
        }
        this.emit("directionChanged");
    };
    SessionDescriptionHandler.prototype.triggerIceGatheringComplete = function () {
        if (this.isIceGatheringComplete()) {
            this.emit("iceGatheringComplete", this);
            if (this.iceGatheringTimer) {
                clearTimeout(this.iceGatheringTimer);
                this.iceGatheringTimer = undefined;
            }
            if (this.iceGatheringDeferred) {
                this.iceGatheringDeferred.resolve();
                this.iceGatheringDeferred = undefined;
            }
        }
    };
    SessionDescriptionHandler.prototype.waitForIceGatheringComplete = function () {
        this.logger.log("waitForIceGatheringComplete");
        if (this.isIceGatheringComplete()) {
            this.logger.log("ICE is already complete. Return resolved.");
            return Promise.resolve();
        }
        else if (!this.iceGatheringDeferred) {
            this.iceGatheringDeferred = defer();
        }
        this.logger.log("ICE is not complete. Returning promise");
        return this.iceGatheringDeferred ? this.iceGatheringDeferred.promise : Promise.resolve();
    };
    return SessionDescriptionHandler;
}(events_1.EventEmitter));
exports.SessionDescriptionHandler = SessionDescriptionHandler;
