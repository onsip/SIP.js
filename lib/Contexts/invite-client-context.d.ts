import { InviteClientContext as InviteClientContextBase } from "../Session";
import { IncomingRequest as IncomingRequestMessage, IncomingResponse as IncomingResponseMessage } from "../SIPMessage";
import { UA } from "../UA";
import { URI } from "../URI";
export declare class InviteClientContext extends InviteClientContextBase {
    private earlyMediaSessionDescriptionHandlers;
    private outgoingInviteRequest;
    constructor(ua: UA, target: string | URI, options?: any, modifiers?: any);
    acceptAndTerminate(message: IncomingResponseMessage, statusCode?: number, reasonPhrase?: string): this;
    createDialog(message: IncomingRequestMessage | IncomingResponseMessage, type: "UAS" | "UAC", early?: boolean): boolean;
    /**
     * Sends in dialog request.
     * @param method Request method.
     * @param options Options bucket.
     */
    sendRequest(method: string, options?: any): this;
    setInvite2xxTimer(message: IncomingRequestMessage, body?: {
        body: string;
        contentType: string;
    }): void;
    setACKTimer(): void;
    receiveInviteResponse(message: IncomingResponseMessage): void;
    receiveNonInviteResponse(message: IncomingResponseMessage): void;
    receiveResponse(message: IncomingResponseMessage): void;
    /**
     * Cancel an unaccepted outgoing INVITE request.
     * @param options Options bucket. FIXME: This options bucket needs to be typed.
     */
    cancel(options?: any): this;
    /**
     * Create an outgoing INVITE request and send it to the target.
     */
    invite(): this;
    /**
     * This public function here in the service of a hack in a parent class. It should be protected.
     * It will, hopefully, go away altogether at somepoint. Meanwhile, please do not call it.
     */
    send(): this;
    /**
     * Cancel an unaccepted outgoing INVITE request or send BYE if established session.
     * @param options Options bucket. FIXME: This options bucket needs to be typed.
     */
    terminate(options?: any): this;
    /**
     * Incoming request handler.
     * @param message Incoming request.
     */
    receiveRequest(message: IncomingRequestMessage): void;
    /**
     * 13.2.1 Creating the Initial INVITE
     *
     * Since the initial INVITE represents a request outside of a dialog,
     * its construction follows the procedures of Section 8.1.1.  Additional
     * processing is required for the specific case of INVITE.
     *
     * An Allow header field (Section 20.5) SHOULD be present in the INVITE.
     * It indicates what methods can be invoked within a dialog, on the UA
     * sending the INVITE, for the duration of the dialog.  For example, a
     * UA capable of receiving INFO requests within a dialog [34] SHOULD
     * include an Allow header field listing the INFO method.
     *
     * A Supported header field (Section 20.37) SHOULD be present in the
     * INVITE.  It enumerates all the extensions understood by the UAC.
     *
     * An Accept (Section 20.1) header field MAY be present in the INVITE.
     * It indicates which Content-Types are acceptable to the UA, in both
     * the response received by it, and in any subsequent requests sent to
     * it within dialogs established by the INVITE.  The Accept header field
     * is especially useful for indicating support of various session
     * description formats.
     *
     * The UAC MAY add an Expires header field (Section 20.19) to limit the
     * validity of the invitation.  If the time indicated in the Expires
     * header field is reached and no final answer for the INVITE has been
     * received, the UAC core SHOULD generate a CANCEL request for the
     * INVITE, as per Section 9.
     *
     * A UAC MAY also find it useful to add, among others, Subject (Section
     * 20.36), Organization (Section 20.25) and User-Agent (Section 20.41)
     * header fields.  They all contain information related to the INVITE.
     *
     * The UAC MAY choose to add a message body to the INVITE.  Section
     * 8.1.1.10 deals with how to construct the header fields -- Content-
     * Type among others -- needed to describe the message body.
     *
     * https://tools.ietf.org/html/rfc3261#section-13.2.1
     */
    private sendInvite;
    private ackAndBye;
    private disposeEarlyMedia;
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse 2xx response.
     */
    private onAccept;
    /**
     * Handle provisional response to initial INVITE.
     * @param inviteResponse 1xx response.
     */
    private onProgress;
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse 3xx response.
     */
    private onRedirect;
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse 4xx, 5xx, or 6xx response.
     */
    private onReject;
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse 100 response.
     */
    private onTrying;
}
