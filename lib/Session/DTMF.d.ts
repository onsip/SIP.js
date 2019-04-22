/// <reference types="node" />
import { EventEmitter } from "events";
import { TypeStrings } from "../Enums";
import { Session } from "../Session";
import { IncomingRequest, IncomingResponse } from "../SIPMessage";
/**
 * @class DTMF
 * @param {SIP.Session} session
 */
export declare class DTMF extends EventEmitter {
    type: TypeStrings;
    tone: string;
    duration: number;
    interToneGap: number;
    private C;
    private logger;
    private owner;
    constructor(session: Session, tone: string | number, options?: any);
    send(options?: any): void;
    init_incoming(request: IncomingRequest): void;
    receiveResponse(response: IncomingResponse): void;
    onRequestTimeout(): void;
    onTransportError(): void;
    onDialogError(response: IncomingResponse): void;
}
