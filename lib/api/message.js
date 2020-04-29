"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A received message (incoming MESSAGE).
 * @public
 */
class Message {
    /** @internal */
    constructor(incomingMessageRequest) {
        this.incomingMessageRequest = incomingMessageRequest;
    }
    /** Incoming MESSAGE request message. */
    get request() {
        return this.incomingMessageRequest.message;
    }
    /** Accept the request. */
    accept(options) {
        this.incomingMessageRequest.accept(options);
        return Promise.resolve();
    }
    /** Reject the request. */
    reject(options) {
        this.incomingMessageRequest.reject(options);
        return Promise.resolve();
    }
}
exports.Message = Message;
