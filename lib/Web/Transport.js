"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var core_1 = require("../core");
var Enums_1 = require("../Enums");
var Exceptions_1 = require("../Exceptions");
var Transport_1 = require("../Transport");
var Utils_1 = require("../Utils");
var TransportStatus;
(function (TransportStatus) {
    TransportStatus[TransportStatus["STATUS_CONNECTING"] = 0] = "STATUS_CONNECTING";
    TransportStatus[TransportStatus["STATUS_OPEN"] = 1] = "STATUS_OPEN";
    TransportStatus[TransportStatus["STATUS_CLOSING"] = 2] = "STATUS_CLOSING";
    TransportStatus[TransportStatus["STATUS_CLOSED"] = 3] = "STATUS_CLOSED";
})(TransportStatus = exports.TransportStatus || (exports.TransportStatus = {}));
/**
 * Compute an amount of time in seconds to wait before sending another
 * keep-alive.
 * @returns {Number}
 */
var computeKeepAliveTimeout = function (upperBound) {
    var lowerBound = upperBound * 0.8;
    return 1000 * (Math.random() * (upperBound - lowerBound) + lowerBound);
};
/**
 * @class Transport
 * @param {Object} options
 */
var Transport = /** @class */ (function (_super) {
    tslib_1.__extends(Transport, _super);
    function Transport(logger, options) {
        if (options === void 0) { options = {}; }
        var _this = _super.call(this, logger) || this;
        _this.type = Enums_1.TypeStrings.Transport;
        _this.reconnectionAttempts = 0;
        _this.status = TransportStatus.STATUS_CONNECTING;
        _this.configuration = _this.loadConfig(options);
        _this.server = _this.configuration.wsServers[0];
        return _this;
    }
    /**
     * @returns {Boolean}
     */
    Transport.prototype.isConnected = function () {
        return this.status === TransportStatus.STATUS_OPEN;
    };
    /**
     * Send a message.
     * @param message - Outgoing message.
     * @param options - Options bucket.
     */
    Transport.prototype.sendPromise = function (message, options) {
        if (options === void 0) { options = {}; }
        if (this.ws === undefined) {
            this.onError("unable to send message - WebSocket undefined");
            return Promise.reject(new Error("WebSocket undefined."));
        }
        // FIXME: This check is likely not necessary as WebSocket.send() will
        // throw INVALID_STATE_ERR if the connection is not currently open
        // which could happen regardless of what we thing the state is.
        if (!this.statusAssert(TransportStatus.STATUS_OPEN, options.force)) {
            this.onError("unable to send message - WebSocket not open");
            return Promise.reject(new Error("WebSocket not open."));
        }
        if (this.configuration.traceSip === true) {
            this.logger.log("sending WebSocket message:\n\n" + message + "\n");
        }
        // WebSocket.send() can throw.
        // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
        try {
            this.ws.send(message);
        }
        catch (error) {
            if (error instanceof error) {
                Promise.reject(error);
            }
            return Promise.reject(new Error("Failed to send message."));
        }
        return Promise.resolve({ msg: message });
    };
    /**
     * Disconnect socket.
     */
    Transport.prototype.disconnectPromise = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        if (this.disconnectionPromise) { // Already disconnecting. Just return this.
            return this.disconnectionPromise;
        }
        options.code = options.code || 1000;
        if (!this.statusTransition(TransportStatus.STATUS_CLOSING, options.force)) {
            if (this.status === TransportStatus.STATUS_CLOSED) { // Websocket is already closed
                return Promise.resolve({ overrideEvent: true });
            }
            else if (this.connectionPromise) { // Websocket is connecting, cannot move to disconneting yet
                return this.connectionPromise.then(function () { return Promise.reject("The websocket did not disconnect"); })
                    .catch(function () { return Promise.resolve({ overrideEvent: true }); });
            }
            else {
                // Cannot move to disconnecting, but not in connecting state.
                return Promise.reject("The websocket did not disconnect");
            }
        }
        this.emit("disconnecting");
        this.disconnectionPromise = new Promise(function (resolve, reject) {
            _this.disconnectDeferredResolve = resolve;
            if (_this.reconnectTimer) {
                clearTimeout(_this.reconnectTimer);
                _this.reconnectTimer = undefined;
            }
            if (_this.ws) {
                _this.stopSendingKeepAlives();
                _this.logger.log("closing WebSocket " + _this.server.wsUri);
                _this.ws.close(options.code, options.reason);
            }
            else {
                reject("Attempted to disconnect but the websocket doesn't exist");
            }
        });
        return this.disconnectionPromise;
    };
    /**
     * Connect socket.
     */
    Transport.prototype.connectPromise = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        if (this.status === TransportStatus.STATUS_CLOSING && !options.force) {
            return Promise.reject("WebSocket " + this.server.wsUri + " is closing");
        }
        if (this.connectionPromise) {
            return this.connectionPromise;
        }
        this.server = this.server || this.getNextWsServer(options.force);
        this.connectionPromise = new Promise(function (resolve, reject) {
            if ((_this.status === TransportStatus.STATUS_OPEN || _this.status === TransportStatus.STATUS_CLOSING)
                && !options.force) {
                _this.logger.warn("WebSocket " + _this.server.wsUri + " is already connected");
                reject("Failed status check - attempted to open a connection but already open/closing");
                return;
            }
            _this.connectDeferredResolve = resolve;
            _this.connectDeferredReject = reject;
            _this.status = TransportStatus.STATUS_CONNECTING;
            _this.emit("connecting");
            _this.logger.log("connecting to WebSocket " + _this.server.wsUri);
            _this.disposeWs();
            try {
                _this.ws = new WebSocket(_this.server.wsUri, "sip");
            }
            catch (e) {
                _this.ws = undefined;
                _this.statusTransition(TransportStatus.STATUS_CLOSED, true);
                _this.onError("error connecting to WebSocket " + _this.server.wsUri + ":" + e);
                reject("Failed to create a websocket");
                _this.connectDeferredResolve = undefined;
                _this.connectDeferredReject = undefined;
                return;
            }
            if (!_this.ws) {
                reject("Unexpected instance websocket not set");
                _this.connectDeferredResolve = undefined;
                _this.connectDeferredReject = undefined;
                return;
            }
            _this.connectionTimeout = setTimeout(function () {
                _this.statusTransition(TransportStatus.STATUS_CLOSED);
                _this.logger.warn("took too long to connect - exceeded time set in configuration.connectionTimeout: " +
                    _this.configuration.connectionTimeout + "s");
                _this.emit("disconnected", { code: 1000 });
                _this.connectionPromise = undefined;
                reject("Connection timeout");
                _this.connectDeferredResolve = undefined;
                _this.connectDeferredReject = undefined;
                var ws = _this.ws;
                _this.disposeWs();
                if (ws) {
                    ws.close(1000);
                }
            }, _this.configuration.connectionTimeout * 1000);
            _this.boundOnOpen = _this.onOpen.bind(_this);
            _this.boundOnMessage = _this.onMessage.bind(_this);
            _this.boundOnClose = _this.onClose.bind(_this);
            _this.boundOnError = _this.onWebsocketError.bind(_this);
            _this.ws.addEventListener("open", _this.boundOnOpen);
            _this.ws.addEventListener("message", _this.boundOnMessage);
            _this.ws.addEventListener("close", _this.boundOnClose);
            _this.ws.addEventListener("error", _this.boundOnError);
        });
        return this.connectionPromise;
    };
    /**
     * @event
     * @param {event} e
     */
    Transport.prototype.onMessage = function (e) {
        var data = e.data;
        var finishedData;
        // CRLF Keep Alive response from server. Clear our keep alive timeout.
        if (/^(\r\n)+$/.test(data)) {
            this.clearKeepAliveTimeout();
            if (this.configuration.traceSip === true) {
                this.logger.log("received WebSocket message with CRLF Keep Alive response");
            }
            return;
        }
        else if (!data) {
            this.logger.warn("received empty message, message discarded");
            return;
        }
        else if (typeof data !== "string") { // WebSocket binary message.
            try {
                // the UInt8Data was here prior to types, and doesn't check
                finishedData = String.fromCharCode.apply(null, new Uint8Array(data));
            }
            catch (err) {
                this.logger.warn("received WebSocket binary message failed to be converted into string, message discarded");
                return;
            }
            if (this.configuration.traceSip === true) {
                this.logger.log("received WebSocket binary message:\n\n" + data + "\n");
            }
        }
        else { // WebSocket text message.
            if (this.configuration.traceSip === true) {
                this.logger.log("received WebSocket text message:\n\n" + data + "\n");
            }
            finishedData = data;
        }
        this.emit("message", finishedData);
    };
    // Transport Event Handlers
    /**
     * @event
     * @param {event} e
     */
    Transport.prototype.onOpen = function () {
        if (this.status === TransportStatus.STATUS_CLOSED) { // Indicated that the transport thinks the ws is dead already
            var ws = this.ws;
            this.disposeWs();
            if (ws) {
                ws.close(1000);
            }
            return;
        }
        this.statusTransition(TransportStatus.STATUS_OPEN, true);
        this.emit("connected");
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
            this.connectionTimeout = undefined;
        }
        this.logger.log("WebSocket " + this.server.wsUri + " connected");
        // Clear reconnectTimer since we are not disconnected
        if (this.reconnectTimer !== undefined) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = undefined;
        }
        // Reset reconnectionAttempts
        this.reconnectionAttempts = 0;
        // Reset disconnection promise so we can disconnect from a fresh state
        this.disconnectionPromise = undefined;
        this.disconnectDeferredResolve = undefined;
        // Start sending keep-alives
        this.startSendingKeepAlives();
        if (this.connectDeferredResolve) {
            this.connectDeferredResolve({ overrideEvent: true });
            this.connectDeferredResolve = undefined;
            this.connectDeferredReject = undefined;
        }
        else {
            this.logger.warn("Unexpected websocket.onOpen with no connectDeferredResolve");
        }
    };
    /**
     * @event
     * @param {event} e
     */
    Transport.prototype.onClose = function (e) {
        this.logger.log("WebSocket disconnected (code: " + e.code + (e.reason ? "| reason: " + e.reason : "") + ")");
        if (this.status !== TransportStatus.STATUS_CLOSING) {
            this.logger.warn("WebSocket closed without SIP.js requesting it");
            this.emit("transportError");
        }
        this.stopSendingKeepAlives();
        // Clean up connection variables so we can connect again from a fresh state
        if (this.connectionTimeout) {
            clearTimeout(this.connectionTimeout);
        }
        if (this.connectDeferredReject) {
            this.connectDeferredReject("Websocket Closed");
        }
        this.connectionTimeout = undefined;
        this.connectionPromise = undefined;
        this.connectDeferredResolve = undefined;
        this.connectDeferredReject = undefined;
        // Check whether the user requested to close.
        if (this.disconnectDeferredResolve) {
            this.disconnectDeferredResolve({ overrideEvent: true });
            this.statusTransition(TransportStatus.STATUS_CLOSED);
            this.disconnectDeferredResolve = undefined;
            return;
        }
        this.statusTransition(TransportStatus.STATUS_CLOSED, true);
        this.emit("disconnected", { code: e.code, reason: e.reason });
        this.disposeWs();
        this.reconnect();
    };
    /**
     * Removes event listeners and clears the instance ws
     */
    Transport.prototype.disposeWs = function () {
        if (this.ws) {
            this.ws.removeEventListener("open", this.boundOnOpen);
            this.ws.removeEventListener("message", this.boundOnMessage);
            this.ws.removeEventListener("close", this.boundOnClose);
            this.ws.removeEventListener("error", this.boundOnError);
            this.ws = undefined;
        }
    };
    /**
     * @event
     * @param {string} e
     */
    Transport.prototype.onError = function (e) {
        this.logger.warn("Transport error: " + e);
        this.emit("transportError");
    };
    /**
     * @event
     * @private
     */
    Transport.prototype.onWebsocketError = function () {
        this.onError("The Websocket had an error");
    };
    /**
     * Reconnection attempt logic.
     */
    Transport.prototype.reconnect = function () {
        var _this = this;
        if (this.reconnectionAttempts > 0) {
            this.logger.log("Reconnection attempt " + this.reconnectionAttempts + " failed");
        }
        if (this.noAvailableServers()) {
            this.logger.warn("attempted to get next ws server but there are no available ws servers left");
            this.logger.warn("no available ws servers left - going to closed state");
            this.statusTransition(TransportStatus.STATUS_CLOSED, true);
            this.emit("closed");
            this.resetServerErrorStatus();
            return;
        }
        if (this.isConnected()) {
            this.logger.warn("attempted to reconnect while connected - forcing disconnect");
            this.disconnect({ force: true });
        }
        this.reconnectionAttempts += 1;
        if (this.reconnectionAttempts > this.configuration.maxReconnectionAttempts) {
            this.logger.warn("maximum reconnection attempts for WebSocket " + this.server.wsUri);
            this.logger.log("transport " + this.server.wsUri + " failed | connection state set to 'error'");
            this.server.isError = true;
            this.emit("transportError");
            if (!this.noAvailableServers()) {
                this.server = this.getNextWsServer();
            }
            // When there are no available servers, the reconnect function ends on the next recursive call
            // after checking for no available servers again.
            this.reconnectionAttempts = 0;
            this.reconnect();
        }
        else {
            this.logger.log("trying to reconnect to WebSocket " +
                this.server.wsUri + " (reconnection attempt " + this.reconnectionAttempts + ")");
            this.reconnectTimer = setTimeout(function () {
                _this.connect();
                _this.reconnectTimer = undefined;
            }, (this.reconnectionAttempts === 1) ? 0 : this.configuration.reconnectionTimeout * 1000);
        }
    };
    /**
     * Resets the error state of all servers in the configuration
     */
    Transport.prototype.resetServerErrorStatus = function () {
        for (var _i = 0, _a = this.configuration.wsServers; _i < _a.length; _i++) {
            var websocket = _a[_i];
            websocket.isError = false;
        }
    };
    /**
     * Retrieve the next server to which connect.
     * @param {Boolean} force allows bypass of server error status checking
     * @returns {Object} WsServer
     */
    Transport.prototype.getNextWsServer = function (force) {
        if (force === void 0) { force = false; }
        if (this.noAvailableServers()) {
            this.logger.warn("attempted to get next ws server but there are no available ws servers left");
            throw new Error("Attempted to get next ws server, but there are no available ws servers left.");
        }
        // Order servers by weight
        var candidates = [];
        for (var _i = 0, _a = this.configuration.wsServers; _i < _a.length; _i++) {
            var wsServer = _a[_i];
            if (wsServer.isError && !force) {
                continue;
            }
            else if (candidates.length === 0) {
                candidates.push(wsServer);
            }
            else if (wsServer.weight > candidates[0].weight) {
                candidates = [wsServer];
            }
            else if (wsServer.weight === candidates[0].weight) {
                candidates.push(wsServer);
            }
        }
        var idx = Math.floor(Math.random() * candidates.length);
        return candidates[idx];
    };
    /**
     * Checks all configuration servers, returns true if all of them have isError: true and false otherwise
     * @returns {Boolean}
     */
    Transport.prototype.noAvailableServers = function () {
        for (var _i = 0, _a = this.configuration.wsServers; _i < _a.length; _i++) {
            var server = _a[_i];
            if (!server.isError) {
                return false;
            }
        }
        return true;
    };
    // ==============================
    // KeepAlive Stuff
    // ==============================
    /**
     * Send a keep-alive (a double-CRLF sequence).
     * @returns {Boolean}
     */
    Transport.prototype.sendKeepAlive = function () {
        var _this = this;
        if (this.keepAliveDebounceTimeout) {
            // We already have an outstanding keep alive, do not send another.
            return;
        }
        this.keepAliveDebounceTimeout = setTimeout(function () {
            _this.emit("keepAliveDebounceTimeout");
            _this.clearKeepAliveTimeout();
        }, this.configuration.keepAliveDebounce * 1000);
        return this.send("\r\n\r\n");
    };
    Transport.prototype.clearKeepAliveTimeout = function () {
        if (this.keepAliveDebounceTimeout) {
            clearTimeout(this.keepAliveDebounceTimeout);
        }
        this.keepAliveDebounceTimeout = undefined;
    };
    /**
     * Start sending keep-alives.
     */
    Transport.prototype.startSendingKeepAlives = function () {
        var _this = this;
        if (this.configuration.keepAliveInterval && !this.keepAliveInterval) {
            this.keepAliveInterval = setInterval(function () {
                _this.sendKeepAlive();
                _this.startSendingKeepAlives();
            }, computeKeepAliveTimeout(this.configuration.keepAliveInterval));
        }
    };
    /**
     * Stop sending keep-alives.
     */
    Transport.prototype.stopSendingKeepAlives = function () {
        if (this.keepAliveInterval) {
            clearInterval(this.keepAliveInterval);
        }
        if (this.keepAliveDebounceTimeout) {
            clearTimeout(this.keepAliveDebounceTimeout);
        }
        this.keepAliveInterval = undefined;
        this.keepAliveDebounceTimeout = undefined;
    };
    // ==============================
    // Status Stuff
    // ==============================
    /**
     * Checks given status against instance current status. Returns true if they match
     * @param {Number} status
     * @param {Boolean} [force]
     * @returns {Boolean}
     */
    Transport.prototype.statusAssert = function (status, force) {
        if (status === this.status) {
            return true;
        }
        else {
            if (force) {
                this.logger.warn("Attempted to assert " +
                    Object.keys(TransportStatus)[this.status] + " as " +
                    Object.keys(TransportStatus)[status] + "- continuing with option: 'force'");
                return true;
            }
            else {
                this.logger.warn("Tried to assert " +
                    Object.keys(TransportStatus)[status] + " but is currently " +
                    Object.keys(TransportStatus)[this.status]);
                return false;
            }
        }
    };
    /**
     * Transitions the status. Checks for legal transition via assertion beforehand
     * @param {Number} status
     * @param {Boolean} [force]
     * @returns {Boolean}
     */
    Transport.prototype.statusTransition = function (status, force) {
        if (force === void 0) { force = false; }
        this.logger.log("Attempting to transition status from " +
            Object.keys(TransportStatus)[this.status] + " to " +
            Object.keys(TransportStatus)[status]);
        if ((status === TransportStatus.STATUS_CONNECTING && this.statusAssert(TransportStatus.STATUS_CLOSED, force)) ||
            (status === TransportStatus.STATUS_OPEN && this.statusAssert(TransportStatus.STATUS_CONNECTING, force)) ||
            (status === TransportStatus.STATUS_CLOSING && this.statusAssert(TransportStatus.STATUS_OPEN, force)) ||
            (status === TransportStatus.STATUS_CLOSED)) {
            this.status = status;
            return true;
        }
        else {
            this.logger.warn("Status transition failed - result: no-op - reason:" +
                " either gave an nonexistent status or attempted illegal transition");
            return false;
        }
    };
    // ==============================
    // Configuration Handling
    // ==============================
    /**
     * Configuration load.
     * returns {Configuration}
     */
    Transport.prototype.loadConfig = function (configuration) {
        var settings = {
            wsServers: [{
                    scheme: "WSS",
                    sipUri: "<sip:edge.sip.onsip.com;transport=ws;lr>",
                    weight: 0,
                    wsUri: "wss://edge.sip.onsip.com",
                    isError: false
                }],
            connectionTimeout: 5,
            maxReconnectionAttempts: 3,
            reconnectionTimeout: 4,
            keepAliveInterval: 0,
            keepAliveDebounce: 10,
            // Logging
            traceSip: false
        };
        var configCheck = this.getConfigurationCheck();
        // Check Mandatory parameters
        for (var parameter in configCheck.mandatory) {
            if (!configuration.hasOwnProperty(parameter)) {
                throw new Exceptions_1.Exceptions.ConfigurationError(parameter);
            }
            else {
                var value = configuration[parameter];
                var checkedValue = configCheck.mandatory[parameter](value);
                if (checkedValue !== undefined) {
                    settings[parameter] = checkedValue;
                }
                else {
                    throw new Exceptions_1.Exceptions.ConfigurationError(parameter, value);
                }
            }
        }
        // Check Optional parameters
        for (var parameter in configCheck.optional) {
            if (configuration.hasOwnProperty(parameter)) {
                var value = configuration[parameter];
                // If the parameter value is an empty array, but shouldn't be, apply its default value.
                // If the parameter value is null, empty string, or undefined then apply its default value.
                // If it's a number with NaN value then also apply its default value.
                // NOTE: JS does not allow "value === NaN", the following does the work:
                if ((value instanceof Array && value.length === 0) ||
                    (value === null || value === "" || value === undefined) ||
                    (typeof (value) === "number" && isNaN(value))) {
                    continue;
                }
                var checkedValue = configCheck.optional[parameter](value);
                if (checkedValue !== undefined) {
                    settings[parameter] = checkedValue;
                }
                else {
                    throw new Exceptions_1.Exceptions.ConfigurationError(parameter, value);
                }
            }
        }
        var skeleton = {}; // Fill the value of the configuration_skeleton
        for (var parameter in settings) {
            if (settings.hasOwnProperty(parameter)) {
                skeleton[parameter] = {
                    value: settings[parameter],
                };
            }
        }
        var returnConfiguration = Object.defineProperties({}, skeleton);
        this.logger.log("configuration parameters after validation:");
        for (var parameter in settings) {
            if (settings.hasOwnProperty(parameter)) {
                this.logger.log("· " + parameter + ": " + JSON.stringify(settings[parameter]));
            }
        }
        return returnConfiguration;
    };
    /**
     * Configuration checker.
     * @return {Boolean}
     */
    Transport.prototype.getConfigurationCheck = function () {
        return {
            mandatory: {},
            optional: {
                // Note: this function used to call 'this.logger.error' but calling 'this' with anything here is invalid
                wsServers: function (wsServers) {
                    /* Allow defining wsServers parameter as:
                     *  String: "host"
                     *  Array of Strings: ["host1", "host2"]
                     *  Array of Objects: [{wsUri:"host1", weight:1}, {wsUri:"host2", weight:0}]
                     *  Array of Objects and Strings: [{wsUri:"host1"}, "host2"]
                     */
                    if (typeof wsServers === "string") {
                        wsServers = [{ wsUri: wsServers }];
                    }
                    else if (wsServers instanceof Array) {
                        for (var idx = 0; idx < wsServers.length; idx++) {
                            if (typeof wsServers[idx] === "string") {
                                wsServers[idx] = { wsUri: wsServers[idx] };
                            }
                        }
                    }
                    else {
                        return;
                    }
                    if (wsServers.length === 0) {
                        return false;
                    }
                    for (var _i = 0, wsServers_1 = wsServers; _i < wsServers_1.length; _i++) {
                        var wsServer = wsServers_1[_i];
                        if (!wsServer.wsUri) {
                            return;
                        }
                        if (wsServer.weight && !Number(wsServer.weight)) {
                            return;
                        }
                        var url = core_1.Grammar.parse(wsServer.wsUri, "absoluteURI");
                        if (url === -1) {
                            return;
                        }
                        else if (["wss", "ws", "udp"].indexOf(url.scheme) < 0) {
                            return;
                        }
                        else {
                            wsServer.sipUri = "<sip:" + url.host +
                                (url.port ? ":" + url.port : "") + ";transport=" + url.scheme.replace(/^wss$/i, "ws") + ";lr>";
                            if (!wsServer.weight) {
                                wsServer.weight = 0;
                            }
                            wsServer.isError = false;
                            wsServer.scheme = url.scheme.toUpperCase();
                        }
                    }
                    return wsServers;
                },
                keepAliveInterval: function (keepAliveInterval) {
                    if (Utils_1.Utils.isDecimal(keepAliveInterval)) {
                        var value = Number(keepAliveInterval);
                        if (value > 0) {
                            return value;
                        }
                    }
                },
                keepAliveDebounce: function (keepAliveDebounce) {
                    if (Utils_1.Utils.isDecimal(keepAliveDebounce)) {
                        var value = Number(keepAliveDebounce);
                        if (value > 0) {
                            return value;
                        }
                    }
                },
                traceSip: function (traceSip) {
                    if (typeof traceSip === "boolean") {
                        return traceSip;
                    }
                },
                connectionTimeout: function (connectionTimeout) {
                    if (Utils_1.Utils.isDecimal(connectionTimeout)) {
                        var value = Number(connectionTimeout);
                        if (value > 0) {
                            return value;
                        }
                    }
                },
                maxReconnectionAttempts: function (maxReconnectionAttempts) {
                    if (Utils_1.Utils.isDecimal(maxReconnectionAttempts)) {
                        var value = Number(maxReconnectionAttempts);
                        if (value >= 0) {
                            return value;
                        }
                    }
                },
                reconnectionTimeout: function (reconnectionTimeout) {
                    if (Utils_1.Utils.isDecimal(reconnectionTimeout)) {
                        var value = Number(reconnectionTimeout);
                        if (value > 0) {
                            return value;
                        }
                    }
                }
            }
        };
    };
    Transport.C = TransportStatus;
    return Transport;
}(Transport_1.Transport));
exports.Transport = Transport;
