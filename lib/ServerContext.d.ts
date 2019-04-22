/// <reference types="node" />
import { EventEmitter } from "events";
import { TypeStrings } from "./Enums";
import { Logger } from "./LoggerFactory";
import { NameAddrHeader } from "./NameAddrHeader";
import { IncomingRequest } from "./SIPMessage";
import { InviteServerTransaction, NonInviteServerTransaction } from "./Transactions";
import { UA } from "./UA";
export declare class ServerContext extends EventEmitter {
    static initializer(objectToConstruct: ServerContext, ua: UA, request: IncomingRequest): void;
    type: TypeStrings;
    ua: UA;
    logger: Logger;
    localIdentity: NameAddrHeader;
    remoteIdentity: NameAddrHeader;
    method: string;
    request: IncomingRequest;
    data: any;
    transaction: InviteServerTransaction | NonInviteServerTransaction;
    body: any;
    contentType: string | undefined;
    assertedIdentity: NameAddrHeader | undefined;
    constructor(ua: UA, request: IncomingRequest);
    progress(options?: any): any;
    accept(options?: any): any;
    reject(options?: any): any;
    reply(options?: any): any;
    onRequestTimeout(): void;
    onTransportError(): void;
}
