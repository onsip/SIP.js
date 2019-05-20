import { ClientContext } from "./ClientContext";
import { C } from "./Constants";
import { IncomingRequest } from "./Core/messages";
import { TypeStrings } from "./Enums";
import { IncomingRequest as IncomingRequestMessage, IncomingResponse as IncomingResponseMessage } from "./SIPMessage";
import { UA } from "./UA";
import { URI } from "./URI";
/**
 * SIP Subscriber (SIP-Specific Event Notifications RFC6665)
 * @class Class creating a SIP Subscription.
 */
export declare class SubscriptionOriginal extends ClientContext {
    type: TypeStrings;
    protected event: string;
    protected requestedExpires: number;
    protected expires: number;
    protected id: string | undefined;
    protected state: string;
    protected contact: string;
    protected extraHeaders: Array<string>;
    protected timers: any;
    protected errorCodes: Array<number>;
    private subscription;
    constructor(ua: UA, target: string | URI, event: string, options?: any);
    subscribe(): SubscriptionOriginal;
    refresh(): void;
    receiveResponse(response: IncomingResponseMessage): void;
    unsubscribe(): void;
    receiveRequest(request: IncomingRequest): void;
    close(): void;
    onDialogError(response: IncomingResponseMessage): void;
    on(name: "accepted", callback: (response: any, cause: C.causes) => void): this;
    on(name: "notify", callback: (notification: {
        request: IncomingRequestMessage;
    }) => void): this;
    on(name: "failed" | "rejected" | "terminated", callback: (messageOrResponse?: any, cause?: C.causes) => void): this;
    send(): this;
    protected timer_fire(): void;
    protected failed(response: IncomingResponseMessage, cause?: string): this;
    protected matchEvent(request: IncomingRequest): boolean;
}
