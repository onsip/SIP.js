"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var tslib_1 = require("tslib");
var core_1 = require("../../core");
var TransportStatus;
(function (TransportStatus) {
    TransportStatus[TransportStatus["STATUS_CONNECTING"] = 0] = "STATUS_CONNECTING";
    TransportStatus[TransportStatus["STATUS_OPEN"] = 1] = "STATUS_OPEN";
    TransportStatus[TransportStatus["STATUS_CLOSING"] = 2] = "STATUS_CLOSING";
    TransportStatus[TransportStatus["STATUS_CLOSED"] = 3] = "STATUS_CLOSED";
})(TransportStatus = exports.TransportStatus || (exports.TransportStatus = {}));
/**
 * Transport
 */
var Transport = /** @class */ (function (_super) {
    tslib_1.__extends(Transport, _super);
    function Transport(logger, options) {
        var _this = _super.call(this, logger) || this;
        _this.servers = [];
        _this.reconnectionAttempts = 0;
        _this.status = TransportStatus.STATUS_CONNECTING;
        // initialize configuration
        _this.configuration = tslib_1.__assign(tslib_1.__assign({}, Transport.defaultOptions), options);
        // initialize WebSocket servers
        var urls = options.wsServers;
        if (typeof urls === "string") {
            urls = [urls];
        }
        for (var _i = 0, urls_1 = urls; _i < urls_1.length; _i++) {
            var url = urls_1[_i];
            var parsed = core_1.Grammar.parse(url, "absoluteURI");
            if (parsed === -1) {
                _this.logger.error("Invalid WebSocket Server URL \"" + url + "\"");
                throw new Error("Invalid WebSocket Server URL");
            }
            if (["wss", "ws", "udp"].indexOf(parsed.scheme) < 0) {
                _this.logger.error("Invalid scheme in WebSocket Server URL \"" + url + "\"");
                throw new Error("Invalid scheme in WebSocket Server URL");
            }
            var scheme = parsed.scheme.toUpperCase();
            var sipUri = "<sip:" + parsed.host +
                (parsed.port ? ":" + parsed.port : "") + ";transport=" + parsed.scheme.replace(/^wss$/i, "ws") + ";lr>";
            var wsUri = url;
            var weight = 0;
            var isError = false;
            _this.servers.push({
                scheme: scheme,
                sipUri: sipUri,
                wsUri: wsUri,
                weight: weight,
                isError: isError
            });
        }
        if (_this.servers.length === 0) {
            throw new Error("No WebSocket server.");
        }
        _this.server = _this.servers[0];
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
        for (var _i = 0, _a = this.servers; _i < _a.length; _i++) {
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
        for (var _i = 0, _a = this.servers; _i < _a.length; _i++) {
            var server = _a[_i];
            if (server.isError && !force) {
                continue;
            }
            else if (candidates.length === 0) {
                candidates.push(server);
            }
            else if (server.weight > candidates[0].weight) {
                candidates = [server];
            }
            else if (server.weight === candidates[0].weight) {
                candidates.push(server);
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
        for (var _i = 0, _a = this.servers; _i < _a.length; _i++) {
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
        // Compute an amount of time in seconds to wait before sending another keep-alive.
        var computeKeepAliveTimeout = function (upperBound) {
            var lowerBound = upperBound * 0.8;
            return 1000 * (Math.random() * (upperBound - lowerBound) + lowerBound);
        };
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
    Transport.C = TransportStatus;
    Transport.defaultOptions = {
        wsServers: [],
        connectionTimeout: 5,
        maxReconnectionAttempts: 3,
        reconnectionTimeout: 4,
        keepAliveInterval: 0,
        keepAliveDebounce: 10,
        traceSip: true
    };
    return Transport;
}(core_1.Transport));
exports.Transport = Transport;
