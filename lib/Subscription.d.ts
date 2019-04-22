import { ClientContext } from "./ClientContext";
import { C } from "./Constants";
import { TypeStrings } from "./Enums";
import { IncomingRequest, IncomingResponse } from "./SIPMessage";
import { UA } from "./UA";
import { URI } from "./URI";
/**
 * SIP Subscriber (SIP-Specific Event Notifications RFC6665)
 * @class Class creating a SIP Subscription.
 */
export declare class Subscription extends ClientContext {
    type: TypeStrings;
    private event;
    private requestedExpires;
    private expires;
    private id;
    private state;
    private contact;
    private extraHeaders;
    private dialog;
    private timers;
    private errorCodes;
    constructor(ua: UA, target: string | URI, event: string, options?: any);
    subscribe(): Subscription;
    refresh(): void;
    receiveResponse(response: IncomingResponse): void;
    unsubscribe(): void;
    receiveRequest(request: IncomingRequest): void;
    close(): void;
    onDialogError(response: IncomingResponse): void;
    on(name: "accepted", callback: (response: any, cause: C.causes) => void): this;
    on(name: "notify", callback: (notification: {
        request: IncomingRequest;
    }) => void): this;
    on(name: "failed" | "rejected" | "terminated", callback: (messageOrResponse?: any, cause?: C.causes) => void): this;
    private timer_fire;
    private createConfirmedDialog;
    private terminateDialog;
    private failed;
    private matchEvent;
}
