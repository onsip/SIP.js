/// <reference types="node" />
import { EventEmitter } from "events";
import { IncomingResponseMessage, Logger, NameAddrHeader, OutgoingRequestMessage, URI } from "./core";
import { TypeStrings } from "./Enums";
import { BodyObj } from "./session-description-handler";
import { UA } from "./UA";
export declare namespace ClientContext {
    interface Options {
        body?: string;
        contentType?: string;
        extraHeaders?: Array<string>;
        params?: {
            fromUri?: string | URI;
            toUri?: string | URI;
            toDisplayName?: string;
        };
    }
}
export declare class ClientContext extends EventEmitter {
    static initializer(objToConstruct: ClientContext, ua: UA, method: string, originalTarget: string | URI, options?: ClientContext.Options): void;
    type: TypeStrings;
    data: any;
    ua: UA;
    logger: Logger;
    request: OutgoingRequestMessage;
    method: string;
    body: BodyObj | undefined;
    localIdentity: NameAddrHeader;
    remoteIdentity: NameAddrHeader;
    constructor(ua: UA, method: string, target: string | URI, options?: ClientContext.Options);
    send(): this;
    receiveResponse(response: IncomingResponseMessage): void;
    onRequestTimeout(): void;
    onTransportError(): void;
}
//# sourceMappingURL=ClientContext.d.ts.map