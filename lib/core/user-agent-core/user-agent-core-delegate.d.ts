import { IncomingInviteRequest, IncomingMessageRequest, IncomingNotifyRequest, IncomingReferRequest, IncomingRegisterRequest, IncomingSubscribeRequest } from "../messages";
/**
 * User Agent Core delegate.
 * @public
 */
export interface UserAgentCoreDelegate {
    /**
     * Receive INVITE request.
     * @param request - Incoming INVITE request.
     */
    onInvite?(request: IncomingInviteRequest): void;
    /**
     * Receive MESSAGE request.
     * @param request - Incoming MESSAGE request.
     */
    onMessage?(request: IncomingMessageRequest): void;
    /**
     * DEPRECATED. Receive NOTIFY request.
     * @param message - Incoming NOTIFY request.
     */
    onNotify?(request: IncomingNotifyRequest): void;
    /**
     * Receive REFER request.
     * @param request - Incoming REFER request.
     */
    onRefer?(request: IncomingReferRequest): void;
    /**
     * Receive REGISTER request.
     * @param request - Incoming REGISTER request.
     */
    onRegister?(request: IncomingRegisterRequest): void;
    /**
     * Receive SUBSCRIBE request.
     * @param request - Incoming SUBSCRIBE request.
     */
    onSubscribe?(request: IncomingSubscribeRequest): void;
}
//# sourceMappingURL=user-agent-core-delegate.d.ts.map