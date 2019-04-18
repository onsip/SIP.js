import { C } from "../../Constants";
import { Exceptions } from "../../Exceptions";
import { Logger, LoggerFactory } from "../../LoggerFactory";
import {
  IncomingResponse as IncomingResponseMessage,
  OutgoingRequest as OutgoingRequestMessage
} from "../../SIPMessage";
import {
  ClientTransaction,
  ClientTransactionUser,
  NonInviteClientTransaction,
  TransactionState
} from "../../Transactions";
import { Transport } from "../../Transport";
import {
  OutgoingRequest,
  OutgoingRequestDelegate,
  RequestOptions
} from "../messages";
import { UserAgentCore } from "../user-agent-core";

type ClientTransactionConstructor = new (
  message: OutgoingRequestMessage,
  transport: Transport,
  user: ClientTransactionUser
) => ClientTransaction;

/*
 * User Agent Client (UAC): A user agent client is a logical entity
 * that creates a new request, and then uses the client
 * transaction state machinery to send it.  The role of UAC lasts
 * only for the duration of that transaction.  In other words, if
 * a piece of software initiates a request, it acts as a UAC for
 * the duration of that transaction.  If it receives a request
 * later, it assumes the role of a user agent server for the
 * processing of that transaction.
 * https://tools.ietf.org/html/rfc3261#section-6
 */
export class UserAgentClient implements OutgoingRequest {
  protected logger: Logger;

  private _transaction: ClientTransaction | undefined;

  private credentials: any;
  private challenged = false;
  private stale = false;

  constructor(
    private transactionConstructor: ClientTransactionConstructor,
    protected core: UserAgentCore,
    public message: OutgoingRequestMessage,
    public delegate?: OutgoingRequestDelegate
  ) {
    this.logger = this.loggerFactory.getLogger("sip.user-agent-client");
    this.init();
  }

  public dispose(): void {
    this.transaction.dispose();
  }

  get loggerFactory(): LoggerFactory {
    return this.core.loggerFactory;
  }

  /** The transaction associated with this request. */
  get transaction(): ClientTransaction {
    if (!this._transaction) {
      throw new Error("Transaction undefined.");
    }
    return this._transaction;
  }

  /**
   * Since requests other than INVITE are responded to immediately, sending a
   * CANCEL for a non-INVITE request would always create a race condition.
   * A CANCEL request SHOULD NOT be sent to cancel a request other than INVITE.
   * https://tools.ietf.org/html/rfc3261#section-9.1
   * @param options Cancel options bucket.
   */
  public cancel(reason?: string, options: RequestOptions = {}): OutgoingRequestMessage {
    if (!this.transaction) {
      throw new Error("Transaction undefined.");
    }
    if (!this.message.to) {
      throw new Error("To undefined.");
    }
    if (!this.message.from) {
      throw new Error("From undefined.");
    }
    const toHeader = this.message.getHeader("To");
    if (!toHeader) {
      throw new Error("To header undefined.");
    }
    const fromHeader = this.message.getHeader("From");
    if (!fromHeader) {
      throw new Error("From header undefined.");
    }
    const message = new OutgoingRequestMessage(
      C.CANCEL,
      this.message.ruri,
      this.message.ua,
      {
        toUri: this.message.to.uri,
        fromUri: this.message.from.uri,
        callId: this.message.callId,
        cseq: this.message.cseq
      },
      options.extraHeaders
    );
    message.callId = this.message.callId;
    message.cseq = this.message.cseq;

    // TODO: Revisit this.
    // The CANCEL needs to use the same branch parameter so that
    // it matches the INVITE transaction, but this is a hacky way to do this.
    // Or at the very least not well documented. If the the branch parameter
    // is set on the outgoing request, the transaction will use it.
    // Otherwise the transaction will make a new one.
    message.branch = this.message.branch;

    if (this.message.headers.Route) {
      message.headers.Route = this.message.headers.Route;
    }

    if (reason) {
      message.setHeader("Reason", reason);
    }

    // If no provisional response has been received, the CANCEL request MUST
    // NOT be sent; rather, the client MUST wait for the arrival of a
    // provisional response before sending the request. If the original
    // request has generated a final response, the CANCEL SHOULD NOT be
    // sent, as it is an effective no-op, since CANCEL has no effect on
    // requests that have already generated a final response.
    // https://tools.ietf.org/html/rfc3261#section-9.1
    if (this.transaction.state === TransactionState.Proceeding) {
      const uac = new UserAgentClient(NonInviteClientTransaction, this.core, message);
    } else {
      this.transaction.once("stateChanged", () => {
        if (this.transaction && this.transaction.state === TransactionState.Proceeding) {
          const uac = new UserAgentClient(NonInviteClientTransaction, this.core, message);
        }
      });
    }

    return message;
  }

  /**
   * If a 401 (Unauthorized) or 407 (Proxy Authentication Required)
   * response is received, the UAC SHOULD follow the authorization
   * procedures of Section 22.2 and Section 22.3 to retry the request with
   * credentials.
   * https://tools.ietf.org/html/rfc3261#section-8.1.3.5
   * 22 Usage of HTTP Authentication
   * https://tools.ietf.org/html/rfc3261#section-22
   * 22.1 Framework
   * https://tools.ietf.org/html/rfc3261#section-22.1
   * 22.2 User-to-User Authentication
   * https://tools.ietf.org/html/rfc3261#section-22.2
   * 22.3 Proxy-to-User Authentication
   * https://tools.ietf.org/html/rfc3261#section-22.3
   *
   * FIXME: This "guard for and retry the request with credentials"
   * implementation is not complete and at best minimally passable.
   * @param response The incoming response to guard.
   * @returns True if the program execution is to continue in the branch in question.
   *          Otherwise the request is retried with credentials and current request processing must stop.
   */
  protected authenticationGuard(message: IncomingResponseMessage): boolean {
    const statusCode = message.statusCode;
    if (!statusCode) {
      throw new Error("Response status code undefined.");
    }

    // If a 401 (Unauthorized) or 407 (Proxy Authentication Required)
    // response is received, the UAC SHOULD follow the authorization
    // procedures of Section 22.2 and Section 22.3 to retry the request with
    // credentials.
    // https://tools.ietf.org/html/rfc3261#section-8.1.3.5
    if (statusCode !== 401 && statusCode !== 407) {
      return true;
    }

    // Get and parse the appropriate WWW-Authenticate or Proxy-Authenticate header.
    let challenge: any;
    let authorizationHeaderName: string;
    if (statusCode === 401) {
      challenge = message.parseHeader("www-authenticate");
      authorizationHeaderName = "authorization";
    } else {
      challenge = message.parseHeader("proxy-authenticate");
      authorizationHeaderName = "proxy-authorization";
    }

    // Verify it seems a valid challenge.
    if (!challenge) {
      this.logger.warn(statusCode + " with wrong or missing challenge, cannot authenticate");
      return true;
    }

    // Avoid infinite authentications.
    if (this.challenged && (this.stale || challenge.stale !== true)) {
      this.logger.warn(statusCode + " apparently in authentication loop, cannot authenticate");
      return true;
    }

    // Get credentials.
    if (!this.credentials) {
      this.credentials = this.core.configuration.authenticationFactory();
      if (!this.credentials) {
        this.logger.warn("Unable to obtain credentials, cannot authenticate");
        return true;
      }
    }

    // Verify that the challenge is really valid.
    if (!this.credentials.authenticate(this.message, challenge)) {
      return true;
    }

    this.challenged = true;
    if (challenge.stale) {
      this.stale = true;
    }

    // if (message.method === C.REGISTER) {
    //   cseq = (this.applicant as RegisterContext).cseq += 1;
    // } else if (this.message.dialog) {
    //   cseq = this.message.dialog.localSeqnum += 1;
    // } else {
    //   cseq = (this.message.cseq || 0) + 1;
    //   this.message.cseq = cseq;
    // }
    const cseq = this.message.cseq += 1;
    this.message.setHeader("cseq", cseq + " " + this.message.method);
    this.message.setHeader(authorizationHeaderName, this.credentials.toString());

    // Calling init (again) will swap out our existing client transaction with a new one.
    // FIXME: HACK: An assumption is being made here that there is nothing that needs to
    // be cleaned up beyond the client transaction which is being replaced. For example,
    // it is assumed that no early dialogs have been created.
    this.init();

    return false;
  }

  /**
   * Receive a response from the transaction layer.
   * @param message Incoming response message.
   */
  protected receiveResponse(message: IncomingResponseMessage): void {
    const statusCode = message.statusCode ? message.statusCode.toString() : "";
    if (!statusCode) {
      throw new Error("Response status code undefined.");
    }

    switch (true) {
      case /^100$/.test(statusCode):
        if (this.delegate && this.delegate.onTrying) {
          this.delegate.onTrying({ message });
        }
        break;
      case /^1[0-9]{2}$/.test(statusCode):
        if (this.delegate && this.delegate.onProgress) {
          this.delegate.onProgress({ message });
        }
        break;
      case /^2[0-9]{2}$/.test(statusCode):
        if (this.delegate && this.delegate.onAccept) {
          this.delegate.onAccept({ message });
        }
        break;
      case /^3[0-9]{2}$/.test(statusCode):
        if (this.delegate && this.delegate.onRedirect) {
          this.delegate.onRedirect({ message });
        }
        break;
      case /^[4-6][0-9]{2}$/.test(statusCode):
        if (this.delegate && this.delegate.onReject) {
          this.delegate.onReject({ message });
        }
        break;
      default:
        throw new Error(`Invalid status code ${statusCode}`);
    }
  }

  private init(): void {
    // We are the transaction user.
    const user: ClientTransactionUser = {
      loggerFactory: this.loggerFactory,
      onRequestTimeout: () => this.onRequestTimeout(),
      onStateChange: (newState) => {
        if (newState === TransactionState.Terminated) {
          // Remove the terminated transaction from the core.
          this.core.userAgentClients.delete(userAgentClientId);
          // FIXME: HACK: Our transaction may have been swapped out with a new one
          // post authentication (see above), so make sure to only to dispose of
          // ourselves if this terminating transaction is our current transaction.
          if (transaction === this._transaction) {
            this.dispose();
          }
        }
      },
      onTransportError: (error) => this.onTransportError(error),
      receiveResponse: (message) => this.receiveResponse(message)
    };
    // Create a new transaction with us as the user.
    const transaction = new this.transactionConstructor(this.message, this.core.transport, user);
    this._transaction = transaction;
    // Add the new transaction to the core.
    const userAgentClientId = transaction.id + transaction.request.method;
    this.core.userAgentClients.set(userAgentClientId, this);
  }

  /**
   * 8.1.3.1 Transaction Layer Errors
   * In some cases, the response returned by the transaction layer will
   * not be a SIP message, but rather a transaction layer error.  When a
   * timeout error is received from the transaction layer, it MUST be
   * treated as if a 408 (Request Timeout) status code has been received.
   * If a fatal transport error is reported by the transport layer
   * (generally, due to fatal ICMP errors in UDP or connection failures in
   * TCP), the condition MUST be treated as a 503 (Service Unavailable)
   * status code.
   * https://tools.ietf.org/html/rfc3261#section-8.1.3.1
   */
  private onRequestTimeout(): void {
    this.logger.warn("User agent client request timed out. Generating internal 408 Request Timeout.");
    const message = this.core.configuration.onRequestTimeoutResponseMessageFactory();
    this.receiveResponse(message);
    return;
  }

  /**
   * 8.1.3.1 Transaction Layer Errors
   * In some cases, the response returned by the transaction layer will
   * not be a SIP message, but rather a transaction layer error.  When a
   * timeout error is received from the transaction layer, it MUST be
   * treated as if a 408 (Request Timeout) status code has been received.
   * If a fatal transport error is reported by the transport layer
   * (generally, due to fatal ICMP errors in UDP or connection failures in
   * TCP), the condition MUST be treated as a 503 (Service Unavailable)
   * status code.
   * https://tools.ietf.org/html/rfc3261#section-8.1.3.1
   */
  private onTransportError(error: Exceptions.TransportError): void {
    this.logger.error(error.message);
    this.logger.error("User agent client request transport error. Generating internal 503 Service Unavailable.");
    const message = this.core.configuration.onTransportErrorResponseMessageFactory();
    this.receiveResponse(message);
  }
}
