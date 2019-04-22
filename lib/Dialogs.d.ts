import { DialogStatus, TypeStrings } from "./Enums";
import { InviteClientContext, InviteServerContext } from "./Session";
import { SessionDescriptionHandler } from "./session-description-handler";
import { DTMF } from "./Session/DTMF";
import { IncomingRequest, IncomingResponse, OutgoingRequest } from "./SIPMessage";
import { Subscription } from "./Subscription";
import { URI } from "./URI";
export declare class Dialog {
    static readonly C: typeof DialogStatus;
    type: TypeStrings;
    localSeqnum: number;
    inviteSeqnum: number;
    localUri: URI;
    remoteUri: URI;
    remoteTarget: string;
    id: {
        callId: string;
        localTag: string;
        remoteTag: string;
        toString: () => string;
    };
    routeSet: Array<string>;
    pracked: Array<string>;
    sessionDescriptionHandler: SessionDescriptionHandler | undefined;
    owner: InviteClientContext | InviteServerContext | Subscription;
    state: DialogStatus;
    uacPendingReply: boolean;
    error: any;
    private uasPendingReply;
    private callId;
    private localTag;
    private remoteTag;
    private remoteSeqnum;
    private logger;
    constructor(owner: InviteClientContext | InviteServerContext | Subscription, message: IncomingRequest | IncomingResponse, type: "UAC" | "UAS", state?: DialogStatus);
    /**
     * @param {SIP.IncomingMessage} message
     * @param {Enum} UAC/UAS
     */
    update(message: IncomingRequest | IncomingResponse, type: "UAC" | "UAS"): void;
    terminate(): void;
    /**
     * @param {String} method request method
     * @param {Object} extraHeaders extra headers
     * @returns {SIP.OutgoingRequest}
     */
    createRequest(method: string, extraHeaders: string[] | undefined, body: string): OutgoingRequest;
    /**
     * @param {SIP.IncomingRequest} request
     * @returns {Boolean}
     */
    checkInDialogRequest(request: IncomingRequest): boolean;
    sendRequest(applicant: InviteClientContext | Subscription | DTMF, method: string, options?: any): OutgoingRequest;
    /**
     * @param {SIP.IncomingRequest} request
     */
    receiveRequest(request: IncomingRequest): void;
}
