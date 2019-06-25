import { IncomingInviteRequest, IncomingMessageRequest, IncomingNotifyRequest, IncomingReferRequest, IncomingSubscribeRequest } from "../messages";
/**
 * User agent core delegate.
 */
export interface UserAgentCoreDelegate {
    /**
     * Receive INVITE request.
     * @param request Incoming INVITE request.
     */
    onInvite?(request: IncomingInviteRequest): void;
    /**
     * Receive MESSAGE request.
     * @param request Incoming MESSAGE request.
     */
    onMessage?(request: IncomingMessageRequest): void;
    /**
     * DEPRECATED. Receive NOTIFY request.
     * @param message Incoming NOTIFY request.
     */
    onNotify?(request: IncomingNotifyRequest): void;
    /**
     * Receive REFER request.
     * @param request Incoming REFER request.
     */
    onRefer?(request: IncomingReferRequest): void;
    /**
     * Receive SUBSCRIBE request.
     * @param request Incoming SUBSCRIBE request.
     */
    onSubscribe?(request: IncomingSubscribeRequest): void;
}
