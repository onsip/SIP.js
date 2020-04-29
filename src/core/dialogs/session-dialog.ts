import { Logger } from "../log";
import {
  Body,
  C,
  getBody,
  IncomingRequestMessage,
  IncomingResponseMessage,
  isBody,
  NameAddrHeader,
  OutgoingAckRequest,
  OutgoingByeRequest,
  OutgoingInfoRequest,
  OutgoingInviteRequest,
  OutgoingInviteRequestDelegate,
  OutgoingMessageRequest,
  OutgoingNotifyRequest,
  OutgoingPrackRequest,
  OutgoingReferRequest,
  OutgoingRequestDelegate,
  OutgoingRequestMessage,
  RequestOptions
} from "../messages";
import {
  Session,
  SessionDelegate,
  SessionState,
  SignalingState
} from "../session";
import { Timers } from "../timers";
import {
  InviteClientTransaction,
  InviteServerTransaction,
  TransactionState
} from "../transactions";
import { UserAgentCore } from "../user-agent-core";
import { ByeUserAgentClient } from "../user-agents/bye-user-agent-client";
import { ByeUserAgentServer } from "../user-agents/bye-user-agent-server";
import { InfoUserAgentClient } from "../user-agents/info-user-agent-client";
import { InfoUserAgentServer } from "../user-agents/info-user-agent-server";
import { MessageUserAgentClient } from "../user-agents/message-user-agent-client";
import { MessageUserAgentServer } from "../user-agents/message-user-agent-server";
import { NotifyUserAgentClient } from "../user-agents/notify-user-agent-client";
import { NotifyUserAgentServer } from "../user-agents/notify-user-agent-server";
import { PrackUserAgentClient } from "../user-agents/prack-user-agent-client";
import { PrackUserAgentServer } from "../user-agents/prack-user-agent-server";
import { ReInviteUserAgentClient } from "../user-agents/re-invite-user-agent-client";
import { ReInviteUserAgentServer } from "../user-agents/re-invite-user-agent-server";
import { ReferUserAgentClient } from "../user-agents/refer-user-agent-client";
import { ReferUserAgentServer } from "../user-agents/refer-user-agent-server";
import { Dialog } from "./dialog";
import { DialogState } from "./dialog-state";

/**
 * Session Dialog.
 * @public
 */
export class SessionDialog extends Dialog implements Session {
  public delegate: SessionDelegate | undefined;

  public reinviteUserAgentClient: ReInviteUserAgentClient | undefined;
  public reinviteUserAgentServer: ReInviteUserAgentServer | undefined;

  /** The state of the offer/answer exchange. */
  private _signalingState: SignalingState = SignalingState.Initial;
  /** The current offer. Undefined unless signaling state HaveLocalOffer, HaveRemoteOffer, or Stable. */
  private _offer: Body | undefined;
  /** The current answer. Undefined unless signaling state Stable. */
  private _answer: Body | undefined;
  /** The rollback offer. Undefined unless signaling state HaveLocalOffer or HaveRemoteOffer. */
  private _rollbackOffer: Body | undefined;
  /** The rollback answer. Undefined unless signaling state HaveLocalOffer or HaveRemoteOffer. */
  private _rollbackAnswer: Body | undefined;

  /** True if waiting for an ACK to the initial transaction 2xx (UAS only). */
  private ackWait = false;
  /** Retransmission timer for 2xx response which confirmed the dialog. */
  private invite2xxTimer: any;
  /** The rseq of the last reliable response. */
  private rseq: number | undefined;

  private logger: Logger;

  constructor(
    private initialTransaction: InviteClientTransaction | InviteServerTransaction,
    core: UserAgentCore,
    state: DialogState,
    delegate?: SessionDelegate
  ) {
    super(core, state);
    this.delegate = delegate;
    if (initialTransaction instanceof InviteServerTransaction) {
      // If we're created by an invite server transaction, we're
      // going to be waiting for an ACK if are to be confirmed.
      this.ackWait = true;
    }
    // If we're confirmed upon creation start the retransmitting whatever
    // the 2xx final response was that confirmed us into existence.
    if (!this.early) {
      this.start2xxRetransmissionTimer();
    }
    this.signalingStateTransition(initialTransaction.request);
    this.logger = core.loggerFactory.getLogger("sip.invite-dialog");
    this.logger.log(`INVITE dialog ${this.id} constructed`);
  }

  public dispose(): void {
    super.dispose();
    this._signalingState = SignalingState.Closed;
    this._offer = undefined;
    this._answer = undefined;
    if (this.invite2xxTimer) {
      clearTimeout(this.invite2xxTimer);
      this.invite2xxTimer = undefined;
    }

    // The UAS MUST still respond to any pending requests received for that
    // dialog.  It is RECOMMENDED that a 487 (Request Terminated) response
    // be generated to those pending requests.
    // https://tools.ietf.org/html/rfc3261#section-15.1.2

    // TODO:
    // this.userAgentServers.forEach((uas) => uas.reply(487));

    this.logger.log(`INVITE dialog ${this.id} destroyed`);
  }

  // FIXME: Need real state machine
  get sessionState(): SessionState {
    if (this.early) {
      return SessionState.Early;
    } else if (this.ackWait) {
      return SessionState.AckWait;
    } else if (this._signalingState === SignalingState.Closed) {
      return SessionState.Terminated;
    } else {
      return SessionState.Confirmed;
    }
  }

  /** The state of the offer/answer exchange. */
  get signalingState(): SignalingState {
    return this._signalingState;
  }

  /** The current offer. Undefined unless signaling state HaveLocalOffer, HaveRemoteOffer, of Stable. */
  get offer(): Body | undefined {
    return this._offer;
  }

  /** The current answer. Undefined unless signaling state Stable. */
  get answer(): Body | undefined {
    return this._answer;
  }

  /** Confirm the dialog. Only matters if dialog is currently early. */
  public confirm(): void {
    // When we're confirmed start the retransmitting whatever
    // the 2xx final response that may have confirmed us.
    if (this.early) {
      this.start2xxRetransmissionTimer();
    }
    super.confirm();
  }

  /** Re-confirm the dialog. Only matters if handling re-INVITE request. */
  public reConfirm(): void {
    // When we're confirmed start the retransmitting whatever
    // the 2xx final response that may have confirmed us.
    if (this.reinviteUserAgentServer) {
      this.startReInvite2xxRetransmissionTimer();
    }
  }

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
  public ack(options: RequestOptions = {}): OutgoingAckRequest {
    this.logger.log(`INVITE dialog ${this.id} sending ACK request`);
    let transaction: InviteClientTransaction;
    if (this.reinviteUserAgentClient) {
      // We're sending ACK for a re-INVITE
      if (!(this.reinviteUserAgentClient.transaction instanceof InviteClientTransaction)) {
        throw new Error("Transaction not instance of InviteClientTransaction.");
      }
      transaction = this.reinviteUserAgentClient.transaction;
      this.reinviteUserAgentClient = undefined;
    } else {
      // We're sending ACK for the initial INVITE
      if (!(this.initialTransaction instanceof InviteClientTransaction)) {
        throw new Error("Initial transaction not instance of InviteClientTransaction.");
      }
      transaction = this.initialTransaction;
    }
    (options as any).cseq = transaction.request.cseq; // ACK cseq is INVITE cseq
    const message = this.createOutgoingRequestMessage(C.ACK, options);
    transaction.ackResponse(message); // See InviteClientTransaction for details.
    this.signalingStateTransition(message);
    return { message };
  }

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
  public bye(delegate?: OutgoingRequestDelegate, options?: RequestOptions): OutgoingByeRequest {
    this.logger.log(`INVITE dialog ${this.id} sending BYE request`);

    // The caller's UA MAY send a BYE for either
    // confirmed or early dialogs, and the callee's UA MAY send a BYE on
    // confirmed dialogs, but MUST NOT send a BYE on early dialogs.
    //
    // However, the callee's UA MUST NOT send a BYE on a confirmed dialog
    // until it has received an ACK for its 2xx response or until the server
    // transaction times out.
    // https://tools.ietf.org/html/rfc3261#section-15
    if (this.initialTransaction instanceof InviteServerTransaction) {
      if (this.early) {
        // FIXME: TODO: This should throw a proper exception.
        throw new Error("UAS MUST NOT send a BYE on early dialogs.");
      }
      if (this.ackWait && this.initialTransaction.state !== TransactionState.Terminated) {
        // FIXME: TODO: This should throw a proper exception.
        throw new Error(
          "UAS MUST NOT send a BYE on a confirmed dialog " +
          "until it has received an ACK for its 2xx response " +
          "or until the server transaction times out."
        );
      }
    }

    // A BYE request is constructed as would any other request within a
    // dialog, as described in Section 12.
    //
    // Once the BYE is constructed, the UAC core creates a new non-INVITE
    // client transaction, and passes it the BYE request.  The UAC MUST
    // consider the session terminated (and therefore stop sending or
    // listening for media) as soon as the BYE request is passed to the
    // client transaction.  If the response for the BYE is a 481
    // (Call/Transaction Does Not Exist) or a 408 (Request Timeout) or no
    // response at all is received for the BYE (that is, a timeout is
    // returned by the client transaction), the UAC MUST consider the
    // session and the dialog terminated.
    // https://tools.ietf.org/html/rfc3261#section-15.1.1
    return new ByeUserAgentClient(this, delegate, options);
  }

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
  public info(delegate?: OutgoingRequestDelegate, options?: RequestOptions): OutgoingInfoRequest {
    this.logger.log(`INVITE dialog ${this.id} sending INFO request`);
    if (this.early) {
      // FIXME: TODO: This should throw a proper exception.
      throw new Error("Dialog not confirmed.");
    }
    return new InfoUserAgentClient(this, delegate, options);
  }

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
  public invite(delegate?: OutgoingInviteRequestDelegate, options?: RequestOptions): OutgoingInviteRequest {
    this.logger.log(`INVITE dialog ${this.id} sending INVITE request`);
    if (this.early) {
      // FIXME: TODO: This should throw a proper exception.
      throw new Error("Dialog not confirmed.");
    }

    // Note that a UAC MUST NOT initiate a new INVITE transaction within a
    // dialog while another INVITE transaction is in progress in either
    // direction.
    //
    //    1. If there is an ongoing INVITE client transaction, the TU MUST
    //       wait until the transaction reaches the completed or terminated
    //       state before initiating the new INVITE.
    //
    //    2. If there is an ongoing INVITE server transaction, the TU MUST
    //       wait until the transaction reaches the confirmed or terminated
    //       state before initiating the new INVITE.
    //
    // However, a UA MAY initiate a regular transaction while an INVITE
    // transaction is in progress.  A UA MAY also initiate an INVITE
    // transaction while a regular transaction is in progress.
    // https://tools.ietf.org/html/rfc3261#section-14.1
    if (this.reinviteUserAgentClient) {
      // FIXME: TODO: This should throw a proper exception.
      throw new Error("There is an ongoing re-INVITE client transaction.");
    }
    if (this.reinviteUserAgentServer) {
      // FIXME: TODO: This should throw a proper exception.
      throw new Error("There is an ongoing re-INVITE server transaction.");
    }
    return new ReInviteUserAgentClient(this, delegate, options);
  }

  /**
   * A UAC MAY associate a MESSAGE request with an existing dialog.  If a
   * MESSAGE request is sent within a dialog, it is "associated" with any
   * media session or sessions associated with that dialog.
   * https://tools.ietf.org/html/rfc3428#section-4
   * @param options - Options bucket.
   */
  public message(delegate: OutgoingRequestDelegate, options?: RequestOptions): OutgoingMessageRequest {
    this.logger.log(`INVITE dialog ${this.id} sending MESSAGE request`);
    if (this.early) {
      // FIXME: TODO: This should throw a proper exception.
      throw new Error("Dialog not confirmed.");
    }
    const message = this.createOutgoingRequestMessage(C.MESSAGE, options);
    return new MessageUserAgentClient(this.core, message, delegate);
  }

  /**
   * The NOTIFY mechanism defined in [2] MUST be used to inform the agent
   * sending the REFER of the status of the reference.
   * https://tools.ietf.org/html/rfc3515#section-2.4.4
   * @param options - Options bucket.
   */
  public notify(delegate?: OutgoingRequestDelegate, options?: RequestOptions): OutgoingNotifyRequest {
    this.logger.log(`INVITE dialog ${this.id} sending NOTIFY request`);
    if (this.early) {
      // FIXME: TODO: This should throw a proper exception.
      throw new Error("Dialog not confirmed.");
    }
    return new NotifyUserAgentClient(this, delegate, options);
  }

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
  public prack(delegate?: OutgoingRequestDelegate, options?: RequestOptions): OutgoingPrackRequest {
    this.logger.log(`INVITE dialog ${this.id} sending PRACK request`);
    return new PrackUserAgentClient(this, delegate, options);
  }

  /**
   * REFER is a SIP request and is constructed as defined in [1].  A REFER
   * request MUST contain exactly one Refer-To header field value.
   * https://tools.ietf.org/html/rfc3515#section-2.4.1
   * @param options - Options bucket.
   */
  public refer(delegate?: OutgoingRequestDelegate, options?: RequestOptions): OutgoingReferRequest {
    this.logger.log(`INVITE dialog ${this.id} sending REFER request`);
    if (this.early) {
      // FIXME: TODO: This should throw a proper exception.
      throw new Error("Dialog not confirmed.");
    }
    // FIXME: TODO: Validate Refer-To header field value.
    return new ReferUserAgentClient(this, delegate, options);
  }

  /**
   * Requests sent within a dialog, as any other requests, are atomic.  If
   * a particular request is accepted by the UAS, all the state changes
   * associated with it are performed.  If the request is rejected, none
   * of the state changes are performed.
   * https://tools.ietf.org/html/rfc3261#section-12.2.2
   * @param message - Incoming request message within this dialog.
   */
  public receiveRequest(message: IncomingRequestMessage): void {
    this.logger.log(`INVITE dialog ${this.id} received ${message.method} request`);

    // Response retransmissions cease when an ACK request for the
    // response is received.  This is independent of whatever transport
    // protocols are used to send the response.
    // https://tools.ietf.org/html/rfc6026#section-8.1
    if (message.method === C.ACK) {
      // If ackWait is true, then this is the ACK to the initial INVITE,
      // otherwise this is an ACK to an in dialog INVITE. In either case,
      // guard to make sure the sequence number of the ACK matches the INVITE.
      if (this.ackWait) {
        if (this.initialTransaction instanceof InviteClientTransaction) {
          this.logger.warn(`INVITE dialog ${this.id} received unexpected ${message.method} request, dropping.`);
          return;
        }
        if (this.initialTransaction.request.cseq !== message.cseq) {
          this.logger.warn(`INVITE dialog ${this.id} received unexpected ${message.method} request, dropping.`);
          return;
        }
        // Update before the delegate has a chance to handle the
        // message as delegate may callback into this dialog.
        this.ackWait = false;
      } else {
        if (!this.reinviteUserAgentServer) {
          this.logger.warn(`INVITE dialog ${this.id} received unexpected ${message.method} request, dropping.`);
          return;
        }
        if (this.reinviteUserAgentServer.transaction.request.cseq !== message.cseq) {
          this.logger.warn(`INVITE dialog ${this.id} received unexpected ${message.method} request, dropping.`);
          return;
        }
        this.reinviteUserAgentServer = undefined;
      }
      this.signalingStateTransition(message);
      if (this.delegate && this.delegate.onAck) {
        this.delegate.onAck({ message });
      }
      return;
    }

    // Request within a dialog out of sequence guard.
    // https://tools.ietf.org/html/rfc3261#section-12.2.2
    if (!this.sequenceGuard(message)) {
      this.logger.log(`INVITE dialog ${this.id} rejected out of order ${message.method} request.`);
      return;
    }

    if (message.method === C.INVITE) {
      // A UAS that receives a second INVITE before it sends the final
      // response to a first INVITE with a lower CSeq sequence number on the
      // same dialog MUST return a 500 (Server Internal Error) response to the
      // second INVITE and MUST include a Retry-After header field with a
      // randomly chosen value of between 0 and 10 seconds.
      // https://tools.ietf.org/html/rfc3261#section-14.2
      if (this.reinviteUserAgentServer) {
        // https://tools.ietf.org/html/rfc3261#section-20.33
        const retryAfter = Math.floor((Math.random() * 10)) + 1;
        const extraHeaders = [`Retry-After: ${retryAfter}`];
        this.core.replyStateless(message, { statusCode: 500, extraHeaders });
        return;
      }

      // A UAS that receives an INVITE on a dialog while an INVITE it had sent
      // on that dialog is in progress MUST return a 491 (Request Pending)
      // response to the received INVITE.
      // https://tools.ietf.org/html/rfc3261#section-14.2
      if (this.reinviteUserAgentClient) {
        this.core.replyStateless(message, { statusCode: 491 });
        return;
      }
    }

    // Request within a dialog common processing.
    // https://tools.ietf.org/html/rfc3261#section-12.2.2
    super.receiveRequest(message);

    // Requests within a dialog MAY contain Record-Route and Contact header
    // fields.  However, these requests do not cause the dialog's route set
    // to be modified, although they may modify the remote target URI.
    // Specifically, requests that are not target refresh requests do not
    // modify the dialog's remote target URI, and requests that are target
    // refresh requests do.  For dialogs that have been established with an
    // INVITE, the only target refresh request defined is re-INVITE (see
    // Section 14).  Other extensions may define different target refresh
    // requests for dialogs established in other ways.
    //
    //    Note that an ACK is NOT a target refresh request.
    //
    // Target refresh requests only update the dialog's remote target URI,
    // and not the route set formed from the Record-Route.  Updating the
    // latter would introduce severe backwards compatibility problems with
    // RFC 2543-compliant systems.
    // https://tools.ietf.org/html/rfc3261#section-15
    if (message.method === C.INVITE) {
      // FIXME: parser needs to be typed...
      const contact = message.parseHeader("contact");
      if (!contact) { // TODO: Review to make sure this will never happen
        throw new Error("Contact undefined.");
      }
      if (!(contact instanceof NameAddrHeader)) {
        throw new Error("Contact not instance of NameAddrHeader.");
      }
      this.dialogState.remoteTarget = contact.uri;
    }

    // Switch on method and then delegate.
    switch (message.method) {
      case C.BYE:
        // A UAS core receiving a BYE request for an existing dialog MUST follow
        // the procedures of Section 12.2.2 to process the request.  Once done,
        // the UAS SHOULD terminate the session (and therefore stop sending and
        // listening for media).  The only case where it can elect not to are
        // multicast sessions, where participation is possible even if the other
        // participant in the dialog has terminated its involvement in the
        // session.  Whether or not it ends its participation on the session,
        // the UAS core MUST generate a 2xx response to the BYE, and MUST pass
        // that to the server transaction for transmission.
        //
        // The UAS MUST still respond to any pending requests received for that
        // dialog.  It is RECOMMENDED that a 487 (Request Terminated) response
        // be generated to those pending requests.
        // https://tools.ietf.org/html/rfc3261#section-15.1.2
        {
          const uas = new ByeUserAgentServer(this, message);
          this.delegate && this.delegate.onBye ?
            this.delegate.onBye(uas) :
            uas.accept();
          this.dispose();
        }
        break;
      case C.INFO:
        // If a UA receives an INFO request associated with an Info Package that
        // the UA has not indicated willingness to receive, the UA MUST send a
        // 469 (Bad Info Package) response (see Section 11.6), which contains a
        // Recv-Info header field with Info Packages for which the UA is willing
        // to receive INFO requests.
        {
          const uas = new InfoUserAgentServer(this, message);
          this.delegate && this.delegate.onInfo ?
            this.delegate.onInfo(uas) :
            uas.reject({
              statusCode: 469,
              extraHeaders: ["Recv-Info :"]
            });
        }
        break;
      case C.INVITE:
        // If the new session description is not acceptable, the UAS can reject
        // it by returning a 488 (Not Acceptable Here) response for the re-
        // INVITE.  This response SHOULD include a Warning header field.
        // https://tools.ietf.org/html/rfc3261#section-14.2
        {
          const uas = new ReInviteUserAgentServer(this, message);
          this.signalingStateTransition(message);
          this.delegate && this.delegate.onInvite ?
            this.delegate.onInvite(uas) :
            uas.reject({ statusCode: 488 }); // TODO: Warning header field.
        }
        break;
      case C.MESSAGE:
        {
          const uas = new MessageUserAgentServer(this.core, message);
          this.delegate && this.delegate.onMessage ?
            this.delegate.onMessage(uas) :
            uas.accept();
        }
        break;
      case C.NOTIFY:
        // https://tools.ietf.org/html/rfc3515#section-2.4.4
        {
          const uas = new NotifyUserAgentServer(this, message);
          this.delegate && this.delegate.onNotify ?
            this.delegate.onNotify(uas) :
            uas.accept();
        }
        break;
      case C.PRACK:
        // https://tools.ietf.org/html/rfc3262#section-4
        {
          const uas = new PrackUserAgentServer(this, message);
          this.delegate && this.delegate.onPrack ?
            this.delegate.onPrack(uas) :
            uas.accept();
        }
        break;
      case C.REFER:
        // https://tools.ietf.org/html/rfc3515#section-2.4.2
        {
          const uas = new ReferUserAgentServer(this, message);
          this.delegate && this.delegate.onRefer ?
            this.delegate.onRefer(uas) :
            uas.reject();
        }
        break;
      default:
        {
          this.logger.log(`INVITE dialog ${this.id} received unimplemented ${message.method} request`);
          this.core.replyStateless(message, { statusCode: 501 });
        }
        break;
    }
  }

  public reliableSequenceGuard(message: IncomingResponseMessage): boolean {
    const statusCode = message.statusCode;
    if (!statusCode) {
      throw new Error("Status code undefined");
    }

    if (statusCode > 100 && statusCode < 200) {
      // If a provisional response is received for an initial request, and
      // that response contains a Require header field containing the option
      // tag 100rel, the response is to be sent reliably.  If the response is
      // a 100 (Trying) (as opposed to 101 to 199), this option tag MUST be
      // ignored, and the procedures below MUST NOT be used.
      // https://tools.ietf.org/html/rfc3262#section-4
      const requireHeader = message.getHeader("require");
      const rseqHeader = message.getHeader("rseq");
      const rseq = requireHeader && requireHeader.includes("100rel") && rseqHeader ? Number(rseqHeader) : undefined;
      if (rseq) {
        // Handling of subsequent reliable provisional responses for the same
        // initial request follows the same rules as above, with the following
        // difference: reliable provisional responses are guaranteed to be in
        // order.  As a result, if the UAC receives another reliable provisional
        // response to the same request, and its RSeq value is not one higher
        // than the value of the sequence number, that response MUST NOT be
        // acknowledged with a PRACK, and MUST NOT be processed further by the
        // UAC.  An implementation MAY discard the response, or MAY cache the
        // response in the hopes of receiving the missing responses.
        // https://tools.ietf.org/html/rfc3262#section-4
        if (this.rseq && this.rseq + 1 !== rseq) {
          return false;
        }

        // Once a reliable provisional response is received, retransmissions of
        // that response MUST be discarded.  A response is a retransmission when
        // its dialog ID, CSeq, and RSeq match the original response.  The UAC
        // MUST maintain a sequence number that indicates the most recently
        // received in-order reliable provisional response for the initial
        // request.  This sequence number MUST be maintained until a final
        // response is received for the initial request.  Its value MUST be
        // initialized to the RSeq header field in the first reliable
        // provisional response received for the initial request.
        // https://tools.ietf.org/html/rfc3262#section-4
        if (!this.rseq) {
          this.rseq = rseq;
        }
      }
    }

    return true;
  }

  /**
   * If not in a stable signaling state, rollback to prior stable signaling state.
   */
  public signalingStateRollback(): void {
    if (
      this._signalingState === SignalingState.HaveLocalOffer ||
      this.signalingState === SignalingState.HaveRemoteOffer) {
      if (this._rollbackOffer && this._rollbackAnswer) {
        this._signalingState = SignalingState.Stable;
        this._offer = this._rollbackOffer;
        this._answer = this._rollbackAnswer;
      }
    }
  }

  /**
   * Update the signaling state of the dialog.
   * @param message - The message to base the update off of.
   */
  public signalingStateTransition(
    message: IncomingRequestMessage | IncomingResponseMessage | OutgoingRequestMessage | Body
  ): void {
    const body = getBody(message);

    // No body, no session. No, woman, no cry.
    if (!body || body.contentDisposition !== "session") {
      return;
    }

    // We've got an existing offer and answer which we may wish to rollback to
    if (this._signalingState === SignalingState.Stable) {
      this._rollbackOffer = this._offer;
      this._rollbackAnswer = this._answer;
    }

    // We're in UAS role, receiving incoming request with session description
    if (message instanceof IncomingRequestMessage) {
      switch (this._signalingState) {
        case SignalingState.Initial:
        case SignalingState.Stable:
          this._signalingState = SignalingState.HaveRemoteOffer;
          this._offer = body;
          this._answer = undefined;
          break;
        case SignalingState.HaveLocalOffer:
          this._signalingState = SignalingState.Stable;
          this._answer = body;
          break;
        case SignalingState.HaveRemoteOffer:
          // You cannot make a new offer while one is in progress.
          // https://tools.ietf.org/html/rfc3261#section-13.2.1
          // FIXME: What to do here?
          break;
        case SignalingState.Closed:
          break;
        default:
          throw new Error("Unexpected signaling state.");
      }
    }

    // We're in UAC role, receiving incoming response with session description
    if (message instanceof IncomingResponseMessage) {
      switch (this._signalingState) {
        case SignalingState.Initial:
        case SignalingState.Stable:
          this._signalingState = SignalingState.HaveRemoteOffer;
          this._offer = body;
          this._answer = undefined;
          break;
        case SignalingState.HaveLocalOffer:
          this._signalingState = SignalingState.Stable;
          this._answer = body;
          break;
        case SignalingState.HaveRemoteOffer:
          // You cannot make a new offer while one is in progress.
          // https://tools.ietf.org/html/rfc3261#section-13.2.1
          // FIXME: What to do here?
          break;
        case SignalingState.Closed:
          break;
        default:
          throw new Error("Unexpected signaling state.");
      }
    }

    // We're in UAC role, sending outgoing request with session description
    if (message instanceof OutgoingRequestMessage) {
      switch (this._signalingState) {
        case SignalingState.Initial:
        case SignalingState.Stable:
          this._signalingState = SignalingState.HaveLocalOffer;
          this._offer = body;
          this._answer = undefined;
          break;
        case SignalingState.HaveLocalOffer:
          // You cannot make a new offer while one is in progress.
          // https://tools.ietf.org/html/rfc3261#section-13.2.1
          // FIXME: What to do here?
          break;
        case SignalingState.HaveRemoteOffer:
          this._signalingState = SignalingState.Stable;
          this._answer = body;
          break;
        case SignalingState.Closed:
          break;
        default:
          throw new Error("Unexpected signaling state.");
      }
    }

    // We're in UAS role, sending outgoing response with session description
    if (isBody(message)) {
      switch (this._signalingState) {
        case SignalingState.Initial:
        case SignalingState.Stable:
          this._signalingState = SignalingState.HaveLocalOffer;
          this._offer = body;
          this._answer = undefined;
          break;
        case SignalingState.HaveLocalOffer:
          // You cannot make a new offer while one is in progress.
          // https://tools.ietf.org/html/rfc3261#section-13.2.1
          // FIXME: What to do here?
          break;
        case SignalingState.HaveRemoteOffer:
          this._signalingState = SignalingState.Stable;
          this._answer = body;
          break;
        case SignalingState.Closed:
          break;
        default:
          throw new Error("Unexpected signaling state.");
      }
    }
  }

  private start2xxRetransmissionTimer(): void {
    if (this.initialTransaction instanceof InviteServerTransaction) {
      const transaction = this.initialTransaction;

      // Once the response has been constructed, it is passed to the INVITE
      // server transaction.  In order to ensure reliable end-to-end
      // transport of the response, it is necessary to periodically pass
      // the response directly to the transport until the ACK arrives.  The
      // 2xx response is passed to the transport with an interval that
      // starts at T1 seconds and doubles for each retransmission until it
      // reaches T2 seconds (T1 and T2 are defined in Section 17).
      // Response retransmissions cease when an ACK request for the
      // response is received.  This is independent of whatever transport
      // protocols are used to send the response.
      // https://tools.ietf.org/html/rfc6026#section-8.1
      let timeout = Timers.T1;
      const retransmission = () => {
        if (!this.ackWait) {
          this.invite2xxTimer = undefined;
          return;
        }
        this.logger.log("No ACK for 2xx response received, attempting retransmission");
        transaction.retransmitAcceptedResponse();
        timeout = Math.min(timeout * 2, Timers.T2);
        this.invite2xxTimer = setTimeout(retransmission, timeout);
      };
      this.invite2xxTimer = setTimeout(retransmission, timeout);

      // If the server retransmits the 2xx response for 64*T1 seconds without
      // receiving an ACK, the dialog is confirmed, but the session SHOULD be
      // terminated.  This is accomplished with a BYE, as described in Section 15.
      // https://tools.ietf.org/html/rfc3261#section-13.3.1.4
      const stateChanged = () => {
        if (transaction.state === TransactionState.Terminated) {
          transaction.removeListener("stateChanged", stateChanged);
          if (this.invite2xxTimer) {
            clearTimeout(this.invite2xxTimer);
            this.invite2xxTimer = undefined;
          }
          if (this.ackWait) {
            if (this.delegate && this.delegate.onAckTimeout) {
              this.delegate.onAckTimeout();
            } else {
              this.bye();
            }
          }
        }
      };
      transaction.addListener("stateChanged", stateChanged);
    }
  }

  // FIXME: Refactor
  private startReInvite2xxRetransmissionTimer(): void {
    if (this.reinviteUserAgentServer  && this.reinviteUserAgentServer.transaction instanceof InviteServerTransaction) {
      const transaction = this.reinviteUserAgentServer.transaction;

      // Once the response has been constructed, it is passed to the INVITE
      // server transaction.  In order to ensure reliable end-to-end
      // transport of the response, it is necessary to periodically pass
      // the response directly to the transport until the ACK arrives.  The
      // 2xx response is passed to the transport with an interval that
      // starts at T1 seconds and doubles for each retransmission until it
      // reaches T2 seconds (T1 and T2 are defined in Section 17).
      // Response retransmissions cease when an ACK request for the
      // response is received.  This is independent of whatever transport
      // protocols are used to send the response.
      // https://tools.ietf.org/html/rfc6026#section-8.1
      let timeout = Timers.T1;
      const retransmission = () => {
        if (!this.reinviteUserAgentServer) {
          this.invite2xxTimer = undefined;
          return;
        }
        this.logger.log("No ACK for 2xx response received, attempting retransmission");
        transaction.retransmitAcceptedResponse();
        timeout = Math.min(timeout * 2, Timers.T2);
        this.invite2xxTimer = setTimeout(retransmission, timeout);
      };
      this.invite2xxTimer = setTimeout(retransmission, timeout);

      // If the server retransmits the 2xx response for 64*T1 seconds without
      // receiving an ACK, the dialog is confirmed, but the session SHOULD be
      // terminated.  This is accomplished with a BYE, as described in Section 15.
      // https://tools.ietf.org/html/rfc3261#section-13.3.1.4
      const stateChanged = () => {
        if (transaction.state === TransactionState.Terminated) {
          transaction.removeListener("stateChanged", stateChanged);
          if (this.invite2xxTimer) {
            clearTimeout(this.invite2xxTimer);
            this.invite2xxTimer = undefined;
          }
          if (this.reinviteUserAgentServer) {
            // FIXME: TODO: What to do here
          }
        }
      };
      transaction.addListener("stateChanged", stateChanged);
    }
  }
}
