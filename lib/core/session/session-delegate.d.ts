import { IncomingAckRequest, IncomingByeRequest, IncomingInfoRequest, IncomingInviteRequest, IncomingNotifyRequest, IncomingPrackRequest, IncomingReferRequest } from "../messages";
export interface SessionDelegate {
    /**
     * Receive ACK request.
     * @param request Incoming ACK request.
     */
    onAck?(request: IncomingAckRequest): void;
    /**
     * Timeout waiting for ACK request.
     * If no handler is provided the Session will terminated with a BYE.
     * https://tools.ietf.org/html/rfc3261#section-13.3.1.4
     */
    onAckTimeout?(): void;
    /**
     * Receive BYE request.
     * https://tools.ietf.org/html/rfc3261#section-15.1.2
     * @param request Incoming BYE request.
     */
    onBye?(request: IncomingByeRequest): void;
    /**
     * Receive INFO request.
     * @param request Incoming INFO request.
     */
    onInfo?(request: IncomingInfoRequest): void;
    /**
     * Receive re-INVITE request.
     * https://tools.ietf.org/html/rfc3261#section-14.2
     * @param request Incoming INVITE request.
     */
    onInvite?(request: IncomingInviteRequest): void;
    /**
     * Receive NOTIFY request.
     * https://tools.ietf.org/html/rfc6665#section-4.1.3
     * @param request Incoming NOTIFY request.
     */
    onNotify?(request: IncomingNotifyRequest): void;
    /**
     * Receive PRACK request.
     * https://tools.ietf.org/html/rfc3262#section-3
     * @param request Incoming PRACK request.
     */
    onPrack?(request: IncomingPrackRequest): void;
    /**
     * Receive REFER request.
     * https://tools.ietf.org/html/rfc3515#section-2.4.2
     * @param request Incoming REFER request.
     */
    onRefer?(request: IncomingReferRequest): void;
}
