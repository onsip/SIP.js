import { IncomingRequestMessage } from "../core";
import { Ack } from "./ack";
import { Bye } from "./bye";
import { Info } from "./info";
import { Message } from "./message";
import { Notification } from "./notification";
import { Referral } from "./referral";
import { SessionDescriptionHandler } from "./session-description-handler";
/**
 * Delegate for {@link Session}.
 * @public
 */
export interface SessionDelegate {
    /**
     * Called upon receiving an incoming in dialog ACK request.
     * @param ack - The ack.
     */
    onAck?(ack: Ack): void;
    /**
     * Called upon receiving an incoming in dialog BYE request.
     * @param bye - The bye.
     */
    onBye?(bye: Bye): void;
    /**
     * Called upon receiving an incoming in dialog INFO request.
     * @param info - The info.
     */
    onInfo?(info: Info): void;
    /**
     * Called upon receiving an incoming in dialog INVITE request.
     * @param invite - The invite.
     */
    onInvite?(request: IncomingRequestMessage, response: string, statusCode: number): void;
    /**
     * Called upon receiving an incoming in dialog MESSAGE request.
     * @param message - The message.
     */
    onMessage?(message: Message): void;
    /**
     * Called upon receiving an incoming in dialog NOTIFY request.
     *
     * @remarks
     * If a refer is in progress notifications are delivered to the referrers delegate.
     *
     * @param notification - The notification.
     */
    onNotify?(notification: Notification): void;
    /**
     * Called upon receiving an incoming in dialog REFER request.
     * @param referral - The referral.
     */
    onRefer?(referral: Referral): void;
    /**
     * Called upon creating a SessionDescriptionHandler.
     *
     * @remarks
     * It's recommended that the SessionDescriptionHandler be accessed via the `Session.sessionDescriptionHandler` property.
     * However there are use cases where one needs access immediately after it is constructed and before it is utilized.
     * Thus this callback.
     *
     * In most scenarios a single SessionDescriptionHandler will be created per Session
     * in which case this callback will be called at most once and `provisional` will be `false`.
     *
     * However if reliable provisional responses are being supported and an INVITE is sent without SDP,
     * one or more session description handlers will be created if remote offers are received in reliable provisional responses.
     * When remote offers are received in reliable provisional responses, the `provisional` parameter will be `true`.
     * When the `provisional` paramter is `true`, this callback may (or may not) be called again.
     * If the session is ultimately established using a SessionDescriptionHandler which was not created provisionally,
     * this callback will be called again and the `provisional` parameter will be `false`.
     * If the session is ultimately established using a SessionDescriptionHandler which was created provisionally,
     * this callback will not be called again.
     * Note that if the session is ultimately established using a SessionDescriptionHandler which was created provisionally,
     * the provisional SessionDescriptionHandler being utilized will be available via the `Session.sessionDescriptionHandler` property.
     *
     * @param sessionDescriptionHandler - The handler.
     * @param provisional - True if created provisionally.
     */
    onSessionDescriptionHandler?(sessionDescriptionHandler: SessionDescriptionHandler, provisional: boolean): void;
}
//# sourceMappingURL=session-delegate.d.ts.map