import { IncomingAckRequest, IncomingByeRequest, IncomingInfoRequest, IncomingInviteRequest, IncomingMessageRequest, IncomingNotifyRequest, IncomingPrackRequest, IncomingReferRequest } from "../messages";
/**
 * Session delegate.
 * @public
 */
export interface SessionDelegate {
    /**
     * Receive ACK request.
     * @param request - Incoming ACK request.
     * @returns
     * The callback MUST return a promise if it asynchronously handles answers.
     * For example, an ACK with an answer (offer in the 200 Ok) may require
     * asynchronous processing in which case the callback MUST return a Promise
     * which resolves when the answer handling is complete.
     * @privateRemarks
     * Unlike INVITE handling where we can rely on the generation of a response
     * to indicate when offer/answer processing has been completed, ACK handling
     * requires some indication from the handler that answer processing is complete
     * so that we can avoid some race conditions (see comments in code for more details).
     * Having the handler return a Promise provides said indication.
     */
    onAck?(request: IncomingAckRequest): Promise<void> | void;
    /**
     * Timeout waiting for ACK request.
     * If no handler is provided the Session will terminated with a BYE.
     * https://tools.ietf.org/html/rfc3261#section-13.3.1.4
     */
    onAckTimeout?(): void;
    /**
     * Receive BYE request.
     * https://tools.ietf.org/html/rfc3261#section-15.1.2
     * @param request - Incoming BYE request.
     */
    onBye?(request: IncomingByeRequest): void;
    /**
     * Receive INFO request.
     * @param request - Incoming INFO request.
     */
    onInfo?(request: IncomingInfoRequest): void;
    /**
     * Receive re-INVITE request.
     * https://tools.ietf.org/html/rfc3261#section-14.2
     * @param request - Incoming INVITE request.
     */
    onInvite?(request: IncomingInviteRequest): void;
    /**
     * Receive MESSAGE request.
     * https://tools.ietf.org/html/rfc3428#section-7
     * @param request - Incoming MESSAGE request.
     */
    onMessage?(request: IncomingMessageRequest): void;
    /**
     * Receive NOTIFY request.
     * https://tools.ietf.org/html/rfc6665#section-4.1.3
     * @param request - Incoming NOTIFY request.
     */
    onNotify?(request: IncomingNotifyRequest): void;
    /**
     * Receive PRACK request.
     * https://tools.ietf.org/html/rfc3262#section-3
     * @param request - Incoming PRACK request.
     */
    onPrack?(request: IncomingPrackRequest): void;
    /**
     * Receive REFER request.
     * https://tools.ietf.org/html/rfc3515#section-2.4.2
     * @param request - Incoming REFER request.
     */
    onRefer?(request: IncomingReferRequest): void;
}
//# sourceMappingURL=session-delegate.d.ts.map