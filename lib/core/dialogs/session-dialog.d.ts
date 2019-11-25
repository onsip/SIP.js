import { Body, IncomingRequestMessage, IncomingResponseMessage, OutgoingAckRequest, OutgoingByeRequest, OutgoingInfoRequest, OutgoingInviteRequest, OutgoingInviteRequestDelegate, OutgoingNotifyRequest, OutgoingPrackRequest, OutgoingReferRequest, OutgoingRequestDelegate, OutgoingRequestMessage, RequestOptions } from "../messages";
import { Session, SessionDelegate, SessionState, SignalingState } from "../session";
import { InviteClientTransaction, InviteServerTransaction } from "../transactions";
import { UserAgentCore } from "../user-agent-core";
import { ReInviteUserAgentClient } from "../user-agents/re-invite-user-agent-client";
import { ReInviteUserAgentServer } from "../user-agents/re-invite-user-agent-server";
import { Dialog } from "./dialog";
import { DialogState } from "./dialog-state";
/**
 * Session Dialog.
 * @public
 */
export declare class SessionDialog extends Dialog implements Session {
    private initialTransaction;
    delegate: SessionDelegate | undefined;
    reinviteUserAgentClient: ReInviteUserAgentClient | undefined;
    reinviteUserAgentServer: ReInviteUserAgentServer | undefined;
    /** The state of the offer/answer exchange. */
    private _signalingState;
    /** The current offer. Undefined unless signaling state HaveLocalOffer, HaveRemoteOffer, or Stable. */
    private _offer;
    /** The current answer. Undefined unless signaling state Stable. */
    private _answer;
    /** The rollback offer. Undefined unless signaling state HaveLocalOffer or HaveRemoteOffer. */
    private _rollbackOffer;
    /** The rollback answer. Undefined unless signaling state HaveLocalOffer or HaveRemoteOffer. */
    private _rollbackAnswer;
    /** True if waiting for an ACK to the initial transaction 2xx (UAS only). */
    private ackWait;
    /** Retransmission timer for 2xx response which confirmed the dialog. */
    private invite2xxTimer;
    /** The rseq of the last reliable response. */
    private rseq;
    private logger;
    constructor(initialTransaction: InviteClientTransaction | InviteServerTransaction, core: UserAgentCore, state: DialogState, delegate?: SessionDelegate);
    dispose(): void;
    readonly sessionState: SessionState;
    /** The state of the offer/answer exchange. */
    readonly signalingState: SignalingState;
    /** The current offer. Undefined unless signaling state HaveLocalOffer, HaveRemoteOffer, of Stable. */
    readonly offer: Body | undefined;
    /** The current answer. Undefined unless signaling state Stable. */
    readonly answer: Body | undefined;
    /** Confirm the dialog. Only matters if dialog is currently early. */
    confirm(): void;
    /** Re-confirm the dialog. Only matters if handling re-INVITE request. */
    reConfirm(): void;
    /**
     * The UAC core MUST generate an ACK request for each 2xx received from
     * the transaction layer.  The header fields of the ACK are constructed
     * in the same way as for any request sent within a dialog (see Section
     * 12) with the exception of the CSeq and the header fields related to
     * authentication.  The sequence number of the CSeq header field MUST be
     * the same as the INVITE being acknowledged, but the CSeq method MUST
     * be ACK.  The ACK MUST contain the same credentials as the INVITE.  If
     * the 2xx contains an offer (based on the rules above), the ACK MUST
     * carry an answer in its body.  If the offer in the 2xx response is not
     * acceptable, the UAC core MUST generate a valid answer in the ACK and
     * then send a BYE immediately.
     * https://tools.ietf.org/html/rfc3261#section-13.2.2.4
     * @param options - ACK options bucket.
     */
    ack(options?: RequestOptions): OutgoingAckRequest;
    /**
     * Terminating a Session
     *
     * This section describes the procedures for terminating a session
     * established by SIP.  The state of the session and the state of the
     * dialog are very closely related.  When a session is initiated with an
     * INVITE, each 1xx or 2xx response from a distinct UAS creates a
     * dialog, and if that response completes the offer/answer exchange, it
     * also creates a session.  As a result, each session is "associated"
     * with a single dialog - the one which resulted in its creation.  If an
     * initial INVITE generates a non-2xx final response, that terminates
     * all sessions (if any) and all dialogs (if any) that were created
     * through responses to the request.  By virtue of completing the
     * transaction, a non-2xx final response also prevents further sessions
     * from being created as a result of the INVITE.  The BYE request is
     * used to terminate a specific session or attempted session.  In this
     * case, the specific session is the one with the peer UA on the other
     * side of the dialog.  When a BYE is received on a dialog, any session
     * associated with that dialog SHOULD terminate.  A UA MUST NOT send a
     * BYE outside of a dialog.  The caller's UA MAY send a BYE for either
     * confirmed or early dialogs, and the callee's UA MAY send a BYE on
     * confirmed dialogs, but MUST NOT send a BYE on early dialogs.
     *
     * However, the callee's UA MUST NOT send a BYE on a confirmed dialog
     * until it has received an ACK for its 2xx response or until the server
     * transaction times out.  If no SIP extensions have defined other
     * application layer states associated with the dialog, the BYE also
     * terminates the dialog.
     *
     * https://tools.ietf.org/html/rfc3261#section-15
     * FIXME: Make these proper Exceptions...
     * @param options - BYE options bucket.
     * @returns
     * Throws `Error` if callee's UA attempts a BYE on an early dialog.
     * Throws `Error` if callee's UA attempts a BYE on a confirmed dialog
     *                while it's waiting on the ACK for its 2xx response.
     */
    bye(delegate?: OutgoingRequestDelegate, options?: RequestOptions): OutgoingByeRequest;
    /**
     * An INFO request can be associated with an Info Package (see
     * Section 5), or associated with a legacy INFO usage (see Section 2).
     *
     * The construction of the INFO request is the same as any other
     * non-target refresh request within an existing invite dialog usage as
     * described in Section 12.2 of RFC 3261.
     * https://tools.ietf.org/html/rfc6086#section-4.2.1
     * @param options - Options bucket.
     */
    info(delegate?: OutgoingRequestDelegate, options?: RequestOptions): OutgoingInfoRequest;
    /**
     * Modifying an Existing Session
     *
     * A successful INVITE request (see Section 13) establishes both a
     * dialog between two user agents and a session using the offer-answer
     * model.  Section 12 explains how to modify an existing dialog using a
     * target refresh request (for example, changing the remote target URI
     * of the dialog).  This section describes how to modify the actual
     * session.  This modification can involve changing addresses or ports,
     * adding a media stream, deleting a media stream, and so on.  This is
     * accomplished by sending a new INVITE request within the same dialog
     * that established the session.  An INVITE request sent within an
     * existing dialog is known as a re-INVITE.
     *
     *    Note that a single re-INVITE can modify the dialog and the
     *    parameters of the session at the same time.
     *
     * Either the caller or callee can modify an existing session.
     * https://tools.ietf.org/html/rfc3261#section-14
     * @param options - Options bucket
     */
    invite(delegate?: OutgoingInviteRequestDelegate, options?: RequestOptions): OutgoingInviteRequest;
    /**
     * The NOTIFY mechanism defined in [2] MUST be used to inform the agent
     * sending the REFER of the status of the reference.
     * https://tools.ietf.org/html/rfc3515#section-2.4.4
     * @param options - Options bucket.
     */
    notify(delegate?: OutgoingRequestDelegate, options?: RequestOptions): OutgoingNotifyRequest;
    /**
     * Assuming the response is to be transmitted reliably, the UAC MUST
     * create a new request with method PRACK.  This request is sent within
     * the dialog associated with the provisional response (indeed, the
     * provisional response may have created the dialog).  PRACK requests
     * MAY contain bodies, which are interpreted according to their type and
     * disposition.
     * https://tools.ietf.org/html/rfc3262#section-4
     * @param options - Options bucket.
     */
    prack(delegate?: OutgoingRequestDelegate, options?: RequestOptions): OutgoingPrackRequest;
    /**
     * REFER is a SIP request and is constructed as defined in [1].  A REFER
     * request MUST contain exactly one Refer-To header field value.
     * https://tools.ietf.org/html/rfc3515#section-2.4.1
     * @param options - Options bucket.
     */
    refer(delegate?: OutgoingRequestDelegate, options?: RequestOptions): OutgoingReferRequest;
    /**
     * Requests sent within a dialog, as any other requests, are atomic.  If
     * a particular request is accepted by the UAS, all the state changes
     * associated with it are performed.  If the request is rejected, none
     * of the state changes are performed.
     * https://tools.ietf.org/html/rfc3261#section-12.2.2
     * @param message - Incoming request message within this dialog.
     */
    receiveRequest(message: IncomingRequestMessage): void;
    reliableSequenceGuard(message: IncomingResponseMessage): boolean;
    /**
     * If not in a stable signaling state, rollback to prior stable signaling state.
     */
    signalingStateRollback(): void;
    /**
     * Update the signaling state of the dialog.
     * @param message - The message to base the update off of.
     */
    signalingStateTransition(message: IncomingRequestMessage | IncomingResponseMessage | OutgoingRequestMessage | Body): void;
    private start2xxRetransmissionTimer;
    private startReInvite2xxRetransmissionTimer;
}
//# sourceMappingURL=session-dialog.d.ts.map