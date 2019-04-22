import { TypeStrings } from "./Enums";
import { LoggerFactory } from "./LoggerFactory";
import { IncomingResponse, OutgoingRequest } from "./SIPMessage";
import { InviteClientTransaction, NonInviteClientTransaction } from "./Transactions";
import { UA } from "./UA";
export declare namespace RequestSender {
    interface StreamlinedApplicant {
        request: OutgoingRequest;
        onRequestTimeout: () => void;
        onTransportError: () => void;
        receiveResponse: (response: IncomingResponse) => void;
    }
}
/**
 * @class Class creating a request sender.
 * @param {Object} applicant
 * @param {SIP.UA} ua
 */
export declare class RequestSender {
    type: TypeStrings;
    ua: UA;
    clientTransaction: InviteClientTransaction | NonInviteClientTransaction | undefined;
    applicant: RequestSender.StreamlinedApplicant;
    loggerFactory: LoggerFactory;
    private logger;
    private method;
    private request;
    private credentials;
    private challenged;
    private staled;
    constructor(applicant: RequestSender.StreamlinedApplicant, ua: UA);
    /**
     * Create the client transaction and send the message.
     */
    send(): InviteClientTransaction | NonInviteClientTransaction;
    /**
     * Callback fired when receiving a request timeout error from the client transaction.
     * To be re-defined by the applicant.
     * @event
     */
    onRequestTimeout(): void;
    /**
     * Callback fired when receiving a transport error from the client transaction.
     * To be re-defined by the applicant.
     * @event
     */
    onTransportError(): void;
    /**
     * Called from client transaction when receiving a correct response to the request.
     * Authenticate request if needed or pass the response back to the applicant.
     * @param {SIP.IncomingResponse} response
     */
    receiveResponse(response: IncomingResponse): void;
}
