/// <reference types="node" />
import { EventEmitter } from "events";
import { IncomingRequest, IncomingRequestMessage, InviteServerTransaction, Logger, NameAddrHeader, NonInviteServerTransaction } from "./core";
import { TypeStrings } from "./Enums";
import { UA } from "./UA";
export declare class ServerContext extends EventEmitter {
    incomingRequest: IncomingRequest;
    static initializer(objectToConstruct: ServerContext, ua: UA, incomingRequest: IncomingRequest): void;
    type: TypeStrings;
    ua: UA;
    logger: Logger;
    localIdentity: NameAddrHeader;
    remoteIdentity: NameAddrHeader;
    method: string;
    request: IncomingRequestMessage;
    data: any;
    transaction: InviteServerTransaction | NonInviteServerTransaction;
    body: any;
    contentType: string | undefined;
    assertedIdentity: NameAddrHeader | undefined;
    constructor(ua: UA, incomingRequest: IncomingRequest);
    progress(options?: any): any;
    accept(options?: any): any;
    reject(options?: any): any;
    reply(options?: any): any;
    onRequestTimeout(): void;
    onTransportError(): void;
}
//# sourceMappingURL=ServerContext.d.ts.map