import { NameAddrHeader } from "../../grammar/name-addr-header.js";
import { Logger } from "../log/logger.js";
import { Body, getBody, isBody } from "../messages/body.js";
import { C } from "../messages/methods/constants.js";
import { IncomingRequestMessage } from "../messages/incoming-request-message.js";
import { IncomingResponseMessage } from "../messages/incoming-response-message.js";
import { OutgoingAckRequest } from "../messages/methods/ack.js";
import { OutgoingByeRequest } from "../messages/methods/bye.js";
import { OutgoingInfoRequest } from "../messages/methods/info.js";
import { OutgoingInviteRequest, OutgoingInviteRequestDelegate } from "../messages/methods/invite.js";
import { OutgoingMessageRequest } from "../messages/methods/message.js";
import { OutgoingNotifyRequest } from "../messages/methods/notify.js";
import { OutgoingPrackRequest } from "../messages/methods/prack.js";
import { OutgoingReferRequest } from "../messages/methods/refer.js";
import { OutgoingRequestDelegate, RequestOptions } from "../messages/outgoing-request.js";
import { OutgoingRequestMessage } from "../messages/outgoing-request-message.js";
import { Session, SessionState } from "../session/session.js";
import { SessionDelegate } from "../session/session-delegate.js";
import { SignalingState } from "../session/session.js";
import { Timers } from "../timers.js";
import { InviteClientTransaction } from "../transactions/invite-client-transaction.js";
import { InviteServerTransaction } from "../transactions/invite-server-transaction.js";
import { TransactionState } from "../transactions/transaction-state.js";
import { UserAgentCore } from "../user-agent-core/user-agent-core.js";
import { ByeUserAgentClient } from "../user-agents/bye-user-agent-client.js";
import { ByeUserAgentServer } from "../user-agents/bye-user-agent-server.js";
import { InfoUserAgentClient } from "../user-agents/info-user-agent-client.js";
import { InfoUserAgentServer } from "../user-agents/info-user-agent-server.js";
import { MessageUserAgentClient } from "../user-agents/message-user-agent-client.js";
import { MessageUserAgentServer } from "../user-agents/message-user-agent-server.js";
import { NotifyUserAgentClient } from "../user-agents/notify-user-agent-client.js";
import { NotifyUserAgentServer } from "../user-agents/notify-user-agent-server.js";
import { PrackUserAgentClient } from "../user-agents/prack-user-agent-client.js";
import { PrackUserAgentServer } from "../user-agents/prack-user-agent-server.js";
import { ReInviteUserAgentClient } from "../user-agents/re-invite-user-agent-client.js";
import { ReInviteUserAgentServer } from "../user-agents/re-invite-user-agent-server.js";
import { ReferUserAgentClient } from "../user-agents/refer-user-agent-client.js";
import { ReferUserAgentServer } from "../user-agents/refer-user-agent-server.js";
import { UpdateUserAgentServer } from "../user-agents/update-user-agent-server.js";
import { Dialog } from "./dialog.js";
import { DialogState } from "./dialog-state.js";

/**
 * Session Dialog.
 * @public
 */
export class SessionDialog extends Dialog implements Session {
  public delegate: SessionDelegate | undefined;

  public reinviteUserAgentClient: ReInviteUserAgentClient | undefined;
  public reinviteUserAgentServer: ReInviteUserAgentServer | undefined;
  public updateUserAgentServer: UpdateUserAgentServer | undefined;

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
  /** True if processing an ACK to the initial transaction 2xx (UAS only). */
  private ackProcessing = false;
  /** Retransmission timer for 2xx response which confirmed the dialog. */
  private invite2xxTimer: number | undefined;
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
    const message = this.createOutgoingRequestMessage(C.ACK, {
      cseq: transaction.request.cseq, // ACK cseq is INVITE cseq
      extraHeaders: options.extraHeaders,
      body: options.body
    });
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
        const promiseOrVoid = this.delegate.onAck({ message });
        if (promiseOrVoid instanceof Promise) {
          this.ackProcessing = true; // make sure this is always reset to false
          promiseOrVoid.then(() => (this.ackProcessing = false)).catch(() => (this.ackProcessing = false));
        }
      }
      return;
    }

    // Request within a dialog out of sequence guard.
    // https://tools.ietf.org/html/rfc3261#section-12.2.2
    if (!this.sequenceGuard(message)) {
      this.logger.log(`INVITE dialog ${this.id} rejected out of order ${message.method} request.`);
      return;
    }

    // Request within a dialog common processing.
    // https://tools.ietf.org/html/rfc3261#section-12.2.2
    super.receiveRequest(message);

    // Handle various INVITE related cross-over, glare and race conditions
    if (message.method === C.INVITE) {
      // Hopefully this message is helpful...
      const warning = (): void => {
        const reason = this.ackWait ? "waiting for initial ACK" : "processing initial ACK";
        this.logger.warn(`INVITE dialog ${this.id} received re-INVITE while ${reason}`);
        let msg = "RFC 5407 suggests the following to avoid this race condition... ";
        msg += " Note: Implementation issues are outside the scope of this document,";
        msg += " but the following tip is provided for avoiding race conditions of";
        msg += " this type.  The caller can delay sending re-INVITE F6 for some period";
        msg += " of time (2 seconds, perhaps), after which the caller can reasonably";
        msg += " assume that its ACK has been received.  Implementors can decouple the";
        msg += " actions of the user (e.g., pressing the hold button) from the actions";
        msg += " of the protocol (the sending of re-INVITE F6), so that the UA can";
        msg += " behave like this.  In this case, it is the implementor's choice as to";
        msg += " how long to wait.  In most cases, such an implementation may be";
        msg += " useful to prevent the type of race condition shown in this section.";
        msg += " This document expresses no preference about whether or not they";
        msg += " should wait for an ACK to be delivered.  After considering the impact";
        msg += " on user experience, implementors should decide whether or not to wait";
        msg += " for a while, because the user experience depends on the";
        msg += " implementation and has no direct bearing on protocol behavior.";
        this.logger.warn(msg);
        return; // drop re-INVITE request message
      };

      // A UAS that receives a second INVITE before it sends the final
      // response to a first INVITE with a lower CSeq sequence number on the
      // same dialog MUST return a 500 (Server Internal Error) response to the
      // second INVITE and MUST include a Retry-After header field with a
      // randomly chosen value of between 0 and 10 seconds.
      // https://tools.ietf.org/html/rfc3261#section-14.2
      const retryAfter = Math.floor(Math.random() * 10) + 1;
      const extraHeaders = [`Retry-After: ${retryAfter}`];

      // There may be ONLY ONE offer/answer negotiation in progress for a
      // single dialog at any point in time.  Section 4 explains how to ensure
      // this.
      // https://tools.ietf.org/html/rfc6337#section-2.2
      if (this.ackProcessing) {
        // UAS-IsI:  While an INVITE server transaction is incomplete or ACK
        //           transaction associated with an offer/answer is incomplete,
        //           a UA must reject another INVITE request with a 500
        //           response.
        // https://tools.ietf.org/html/rfc6337#section-4.3
        this.core.replyStateless(message, { statusCode: 500, extraHeaders });
        warning();
        return;
      }

      // 3.1.4.  Callee Receives re-INVITE (Established State)  While in the
      // Moratorium State (Case 1)
      // https://tools.ietf.org/html/rfc5407#section-3.1.4
      // 3.1.5.  Callee Receives re-INVITE (Established State) While in the
      // Moratorium State (Case 2)
      // https://tools.ietf.org/html/rfc5407#section-3.1.5
      if (this.ackWait && this.signalingState !== SignalingState.Stable) {
        // This scenario is basically the same as that of Section 3.1.4, but
        // differs in sending an offer in the 200 and an answer in the ACK.  In
        // contrast to the previous case, the offer in the 200 (F3) and the
        // offer in the re-INVITE (F6) collide with each other.
        //
        // Bob sends a 491 to the re-INVITE (F6) since he is not able to
        // properly handle a new request until he receives an answer.  (Note:
        // 500 with a Retry-After header may be returned if the 491 response is
        // understood to indicate request collision.  However, 491 is
        // recommended here because 500 applies to so many cases that it is
        // difficult to determine what the real problem was.)
        // https://tools.ietf.org/html/rfc5407#section-3.1.5

        // UAS-IsI:  While an INVITE server transaction is incomplete or ACK
        //           transaction associated with an offer/answer is incomplete,
        //           a UA must reject another INVITE request with a 500
        //           response.
        // https://tools.ietf.org/html/rfc6337#section-4.3
        this.core.replyStateless(message, { statusCode: 500, extraHeaders });
        warning();
        return;
      }

      // A UAS that receives a second INVITE before it sends the final
      // response to a first INVITE with a lower CSeq sequence number on the
      // same dialog MUST return a 500 (Server Internal Error) response to the
      // second INVITE and MUST include a Retry-After header field with a
      // randomly chosen value of between 0 and 10 seconds.
      // https://tools.ietf.org/html/rfc3261#section-14.2
      if (this.reinviteUserAgentServer) {
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
      if (!contact) {
        // TODO: Review to make sure this will never happen
        throw new Error("Contact undefined.");
      }
      if (!(contact instanceof NameAddrHeader)) {
        throw new Error("Contact not instance of NameAddrHeader.");
      }
      this.dialogState.remoteTarget = contact.uri;
    }

    if (message.method === C.UPDATE) {
      const retryAfter = Math.floor(Math.random() * 10) + 1;
      const extraHeaders = [`Retry-After: ${retryAfter}`];

      const body = getBody(message);
      const hasOffer = body && body.contentDisposition === "session";

      if (hasOffer && this._signalingState === SignalingState.HaveLocalOffer) {
        // If an UPDATE is received that contains an offer, and the UAS has
        // generated an offer (in an UPDATE, PRACK or INVITE) to which it has
        // not yet received an answer, the UAS MUST reject the UPDATE with a 491
        // response
        // https://datatracker.ietf.org/doc/html/rfc3311#section-5.2
        this.core.replyStateless(message, { statusCode: 491 });
        return;
      }

      if (hasOffer && this._signalingState === SignalingState.HaveRemoteOffer) {
        // Similarly, if an UPDATE is received that contains an
        // offer, and the UAS has received an offer (in an UPDATE, PRACK, or
        // INVITE) to which it has not yet generated an answer, the UAS MUST
        // reject the UPDATE with a 500 response, and MUST include a Retry-After
        // header field with a randomly chosen value between 0 and 10 seconds.
        // https://datatracker.ietf.org/doc/html/rfc3311#section-5.2
        this.core.replyStateless(message, { statusCode: 500, extraHeaders });
        return;
      }

      if (this.updateUserAgentServer) {
        // A UAS that receives an UPDATE before it has generated a final
        // response to a previous UPDATE on the same dialog MUST return a 500
        // response to the new UPDATE, and MUST include a Retry-After header
        // field with a randomly chosen value between 0 and 10 seconds.
        // https://datatracker.ietf.org/doc/html/rfc3311#section-5.2
        this.core.replyStateless(message, { statusCode: 500, extraHeaders });
        return;
      }
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
          this.delegate && this.delegate.onBye ? this.delegate.onBye(uas) : uas.accept();
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
          this.delegate && this.delegate.onInfo
            ? this.delegate.onInfo(uas)
            : uas.reject({
                statusCode: 469,
                extraHeaders: ["Recv-Info:"]
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
          this.delegate && this.delegate.onInvite ? this.delegate.onInvite(uas) : uas.reject({ statusCode: 488 }); // TODO: Warning header field.
        }
        break;
      case C.MESSAGE:
        {
          const uas = new MessageUserAgentServer(this.core, message);
          this.delegate && this.delegate.onMessage ? this.delegate.onMessage(uas) : uas.accept();
        }
        break;
      case C.NOTIFY:
        // https://tools.ietf.org/html/rfc3515#section-2.4.4
        {
          const uas = new NotifyUserAgentServer(this, message);
          this.delegate && this.delegate.onNotify ? this.delegate.onNotify(uas) : uas.accept();
        }
        break;
      case C.PRACK:
        // https://tools.ietf.org/html/rfc3262#section-4
        {
          const uas = new PrackUserAgentServer(this, message);
          this.delegate && this.delegate.onPrack ? this.delegate.onPrack(uas) : uas.accept();
        }
        break;
      case C.REFER:
        // https://tools.ietf.org/html/rfc3515#section-2.4.2
        {
          const uas = new ReferUserAgentServer(this, message);
          this.delegate && this.delegate.onRefer ? this.delegate.onRefer(uas) : uas.reject();
        }
        break;
      case C.UPDATE:
        // However, unlike a re-INVITE, the UPDATE MUST be
        // responded to promptly, and therefore the user cannot generally be
        // prompted to approve the session changes. If the UAS cannot change
        // the session parameters without prompting the user, it SHOULD reject
        // the request with a 504 response.
        // https://datatracker.ietf.org/doc/html/rfc3311#section-5.2
        {
          const uas = new UpdateUserAgentServer(this, message);
          this.signalingStateTransition(message);
          this.delegate && this.delegate.onUpdate ? this.delegate.onUpdate(uas) : uas.reject({ statusCode: 504 });
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

  /**
   * Guard against out of order reliable provisional responses and retransmissions.
   * Returns false if the response should be discarded, otherwise true.
   * @param message - Incoming response message within this dialog.
   */
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
        this.rseq = this.rseq ? this.rseq + 1 : rseq;
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
      this.signalingState === SignalingState.HaveRemoteOffer
    ) {
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
      const retransmission = (): void => {
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
      const stateChanged = (): void => {
        if (transaction.state === TransactionState.Terminated) {
          transaction.removeStateChangeListener(stateChanged);
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
      transaction.addStateChangeListener(stateChanged);
    }
  }

  // FIXME: Refactor
  private startReInvite2xxRetransmissionTimer(): void {
    if (this.reinviteUserAgentServer && this.reinviteUserAgentServer.transaction instanceof InviteServerTransaction) {
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
      const retransmission = (): void => {
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
      const stateChanged = (): void => {
        if (transaction.state === TransactionState.Terminated) {
          transaction.removeStateChangeListener(stateChanged);
          if (this.invite2xxTimer) {
            clearTimeout(this.invite2xxTimer);
            this.invite2xxTimer = undefined;
          }
          if (this.reinviteUserAgentServer) {
            // FIXME: TODO: What to do here
          }
        }
      };
      transaction.addStateChangeListener(stateChanged);
    }
  }
}
