import { Logger } from "../types/logger-factory";
import { RegisterContext } from "../types/register-context";
import { RequestSender as RequestSenderDefinition } from "../types/request-sender";
import { IncomingResponse, OutgoingRequest } from "../types/sip-message";
import { UA } from "../types/ua";

import { C } from "./Constants";
import { TypeStrings, UAStatus } from "./Enums";
import { AckClientTransaction, InviteClientTransaction, NonInviteClientTransaction } from "./Transactions";

/**
 * @class Class creating a request sender.
 * @param {Object} applicant
 * @param {SIP.UA} ua
 */
export class RequestSender implements RequestSenderDefinition {
  public type: TypeStrings;
  public ua: UA;
  public clientTransaction: InviteClientTransaction | NonInviteClientTransaction | AckClientTransaction | undefined;
  public applicant: RequestSenderDefinition.StreamlinedApplicant;
  private logger: Logger;
  private method: string;
  private request: OutgoingRequest;
  private credentials: any;
  private challenged: boolean;
  private staled: boolean;

  constructor(applicant: RequestSenderDefinition.StreamlinedApplicant, ua: UA) {
    this.type = TypeStrings.RequestSender;
    this.logger = ua.getLogger("sip.requestsender");
    this.ua = ua;
    this.applicant = applicant;
    this.method = applicant.request.method;
    this.request = applicant.request;
    this.credentials = undefined;
    this.challenged = false;
    this.staled = false;

    // If ua is in closing process or even closed just allow sending Bye and ACK
    if (ua.status === UAStatus.STATUS_USER_CLOSED && (this.method !== C.BYE && this.method !== C.ACK)) {
      this.onTransportError();
    }
  }

  /**
   * Create the client transaction and send the message.
   */
  public send(): InviteClientTransaction | NonInviteClientTransaction | AckClientTransaction {
    if (!this.ua.transport) {
      throw new Error("No transport to make transaction");
    }
    switch (this.method) {
      case "INVITE":
        this.clientTransaction = new InviteClientTransaction(this, this.request, this.ua.transport);
        break;
      case "ACK":
        this.clientTransaction = new AckClientTransaction(this, this.request, this.ua.transport);
        break;
      default:
        this.clientTransaction = new NonInviteClientTransaction(this, this.request, this.ua.transport);
    }
    this.clientTransaction.send();

    return this.clientTransaction;
  }

  /**
   * Callback fired when receiving a request timeout error from the client transaction.
   * To be re-defined by the applicant.
   * @event
   */
  public onRequestTimeout(): void {
    this.applicant.onRequestTimeout();
  }

  /**
   * Callback fired when receiving a transport error from the client transaction.
   * To be re-defined by the applicant.
   * @event
   */
  public onTransportError(): void {
    this.applicant.onTransportError();
  }

  /**
   * Called from client transaction when receiving a correct response to the request.
   * Authenticate request if needed or pass the response back to the applicant.
   * @param {SIP.IncomingResponse} response
   */
  public receiveResponse(response: IncomingResponse): void {
    const statusCode: number = response && response.statusCode ? response.statusCode : 0;

    /*
    * Authentication
    * Authenticate once. _challenged_ flag used to avoid infinite authentications.
    */
    if (statusCode === 401 || statusCode === 407) {
      let challenge: any;
      let authorizationHeaderName: string;

      // Get and parse the appropriate WWW-Authenticate or Proxy-Authenticate header.
      if (statusCode === 401) {
        challenge = response.parseHeader("www-authenticate");
        authorizationHeaderName = "authorization";
      } else {
        challenge = response.parseHeader("proxy-authenticate");
        authorizationHeaderName = "proxy-authorization";
      }

      // Verify it seems a valid challenge.
      if (!challenge) {
        this.logger.warn(statusCode + " with wrong or missing challenge, cannot authenticate");
        this.applicant.receiveResponse(response);
        return;
      }

      if (!this.challenged || (!this.staled && challenge.stale === true)) {
        if (!this.credentials && this.ua.configuration.authenticationFactory) {
          this.credentials = this.ua.configuration.authenticationFactory(this.ua);
        }

        // Verify that the challenge is really valid.
        if (!this.credentials.authenticate(this.request, challenge)) {
          this.applicant.receiveResponse(response);
          return;
        }
        this.challenged = true;

        if (challenge.stale) {
          this.staled = true;
        }

        let cseq: number;

        if (response.method === C.REGISTER) {
          cseq = (this.applicant as RegisterContext).cseq += 1;
        } else if (this.request.dialog) {
          cseq = this.request.dialog.localSeqnum += 1;
        } else {
          cseq = (this.request.cseq || 0) + 1;
          this.request.cseq = cseq;
        }
        this.request.setHeader("cseq", cseq + " " + this.method);

        this.request.setHeader(authorizationHeaderName, this.credentials.toString());
        this.send();
      } else {
        this.applicant.receiveResponse(response);
      }
    } else {
      this.applicant.receiveResponse(response);
    }
  }
}
