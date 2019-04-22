/// <reference types="node" />
import { EventEmitter } from "events";
import { TypeStrings } from "./Enums";
import { Logger } from "./LoggerFactory";
import { NameAddrHeader } from "./NameAddrHeader";
import { IncomingResponse, OutgoingRequest } from "./SIPMessage";
import { UA } from "./UA";
import { URI } from "./URI";
export declare class ClientContext extends EventEmitter {
    static initializer(objToConstruct: ClientContext, ua: UA, method: string, originalTarget: string | URI, options?: any): void;
    type: TypeStrings;
    data: any;
    ua: UA;
    logger: Logger;
    request: OutgoingRequest;
    method: string;
    body: any;
    localIdentity: NameAddrHeader;
    remoteIdentity: NameAddrHeader;
    constructor(ua: UA, method: string, target: string | URI, options?: any);
    send(): this;
    receiveResponse(response: IncomingResponse): void;
    onRequestTimeout(): void;
    onTransportError(): void;
}
