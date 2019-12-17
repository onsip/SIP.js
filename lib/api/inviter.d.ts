import { Logger, NameAddrHeader, OutgoingInviteRequest, OutgoingRequestMessage, URI } from "../core";
import { InviterCancelOptions } from "./inviter-cancel-options";
import { InviterInviteOptions } from "./inviter-invite-options";
import { InviterOptions } from "./inviter-options";
import { Session } from "./session";
import { BodyAndContentType } from "./session-description-handler";
import { UserAgent } from "./user-agent";
/**
 * An inviter offers to establish a {@link Session} (outgoing INVITE).
 * @public
 */
export declare class Inviter extends Session {
    /**
     * If this Inviter was created as a result of a REFER, the referred Session. Otherwise undefined.
     * @internal
     */
    _referred: Session | undefined;
    /**
     * Logger.
     */
    protected logger: Logger;
    /** @internal */
    protected _id: string;
    /** True if dispose() has been called. */
    private disposed;
    /** True if early media use is enabled. */
    private earlyMedia;
    /** The early media session. */
    private earlyMediaDialog;
    /** The early media session description handlers. */
    private earlyMediaSessionDescriptionHandlers;
    /** Our From tag. */
    private fromTag;
    /** True if cancel() was called. */
    private isCanceled;
    /** True if initial INVITE without SDP. */
    private inviteWithoutSdp;
    /** Initial INVITE request sent by core. Undefined until sent. */
    private outgoingInviteRequest;
    /** Initial INVITE message provided to core to send. */
    private outgoingRequestMessage;
    /**
     * Constructs a new instance of the `Inviter` class.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @param targetURI - Request URI identifying the target of the message.
     * @param options - Options bucket. See {@link InviterOptions} for details.
     */
    constructor(userAgent: UserAgent, targetURI: URI, options?: InviterOptions);
    /**
     * Destructor.
     */
    dispose(): Promise<void>;
    /**
     * Initial outgoing INVITE request message body.
     */
    readonly body: BodyAndContentType | undefined;
    /**
     * The identity of the local user.
     */
    readonly localIdentity: NameAddrHeader;
    /**
     * The identity of the remote user.
     */
    readonly remoteIdentity: NameAddrHeader;
    /**
     * Initial outgoing INVITE request message.
     */
    readonly request: OutgoingRequestMessage;
    /**
     * Cancels the INVITE request.
     *
     * @remarks
     * Sends a CANCEL request.
     * Resolves once the response sent, otherwise rejects.
     *
     * After sending a CANCEL request the expectation is that a 487 final response
     * will be received for the INVITE. However a 200 final response to the INVITE
     * may nonetheless arrive (it's a race between the CANCEL reaching the UAS before
     * the UAS sends a 200) in which case an ACK & BYE will be sent. The net effect
     * is that this method will terminate the session regardless of the race.
     * @param options - Options bucket.
     */
    cancel(options?: InviterCancelOptions): Promise<void>;
    /**
     * Sends the INVITE request.
     *
     * @remarks
     * TLDR...
     *  1) Only one offer/answer exchange permitted during initial INVITE.
     *  2) No "early media" if the initial offer is in an INVITE (default behavior).
     *  3) If "early media" and the initial offer is in an INVITE, no INVITE forking.
     *
     * 1) Only one offer/answer exchange permitted during initial INVITE.
     *
     * Our implementation replaces the following bullet point...
     *
     * o  After having sent or received an answer to the first offer, the
     *    UAC MAY generate subsequent offers in requests based on rules
     *    specified for that method, but only if it has received answers
     *    to any previous offers, and has not sent any offers to which it
     *    hasn't gotten an answer.
     * https://tools.ietf.org/html/rfc3261#section-13.2.1
     *
     * ...with...
     *
     * o  After having sent or received an answer to the first offer, the
     *    UAC MUST NOT generate subsequent offers in requests based on rules
     *    specified for that method.
     *
     * ...which in combination with this bullet point...
     *
     * o  Once the UAS has sent or received an answer to the initial
     *    offer, it MUST NOT generate subsequent offers in any responses
     *    to the initial INVITE.  This means that a UAS based on this
     *    specification alone can never generate subsequent offers until
     *    completion of the initial transaction.
     * https://tools.ietf.org/html/rfc3261#section-13.2.1
     *
     * ...ensures that EXACTLY ONE offer/answer exchange will occur
     * during an initial out of dialog INVITE request made by our UAC.
     *
     *
     * 2) No "early media" if the initial offer is in an INVITE (default behavior).
     *
     * While our implementation adheres to the following bullet point...
     *
     * o  If the initial offer is in an INVITE, the answer MUST be in a
     *    reliable non-failure message from UAS back to UAC which is
     *    correlated to that INVITE.  For this specification, that is
     *    only the final 2xx response to that INVITE.  That same exact
     *    answer MAY also be placed in any provisional responses sent
     *    prior to the answer.  The UAC MUST treat the first session
     *    description it receives as the answer, and MUST ignore any
     *    session descriptions in subsequent responses to the initial
     *    INVITE.
     * https://tools.ietf.org/html/rfc3261#section-13.2.1
     *
     * We have made the following implementation decision with regard to early media...
     *
     * o  If the initial offer is in the INVITE, the answer from the
     *    UAS back to the UAC will establish a media session only
     *    only after the final 2xx response to that INVITE is received.
     *
     * The reason for this decision is rooted in a restriction currently
     * inherent in WebRTC. Specifically, while a SIP INVITE request with an
     * initial offer may fork resulting in more than one provisional answer,
     * there is currently no easy/good way to to "fork" an offer generated
     * by a peer connection. In particular, a WebRTC offer currently may only
     * be matched with one answer and we have no good way to know which
     * "provisional answer" is going to be the "final answer". So we have
     * decided to punt and not create any "early media" sessions in this case.
     *
     * The upshot is that if you want "early media", you must not put the
     * initial offer in the INVITE. Instead, force the UAS to provide the
     * initial offer by sending an INVITE without an offer. In the WebRTC
     * case this allows us to create a unique peer connection with a unique
     * answer for every provisional offer with "early media" on all of them.
     *
     *
     * 3) If "early media" and the initial offer is in an INVITE, no INVITE forking.
     *
     * The default behavior may be altered and "early media" utilized if the
     * initial offer is in the an INVITE by setting the `earlyMedia` options.
     * However in that case the INVITE request MUST NOT fork. This allows for
     * "early media" in environments where the forking behavior of the SIP
     * servers being utilized is configured to disallow forking.
     */
    invite(options?: InviterInviteOptions): Promise<OutgoingInviteRequest>;
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
    private disposeEarlyMedia;
    private notifyReferer;
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse - 2xx response.
     */
    private onAccept;
    /**
     * Handle provisional response to initial INVITE.
     * @param inviteResponse - 1xx response.
     */
    private onProgress;
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse - 3xx response.
     */
    private onRedirect;
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse - 4xx, 5xx, or 6xx response.
     */
    private onReject;
    /**
     * Handle final response to initial INVITE.
     * @param inviteResponse - 100 response.
     */
    private onTrying;
}
//# sourceMappingURL=inviter.d.ts.map