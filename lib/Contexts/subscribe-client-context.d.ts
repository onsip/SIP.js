import { IncomingRequest as IncomingRequestMessage, IncomingResponse as IncomingResponseMessage } from "../SIPMessage";
import { Subscription as SubscribeClientContextBase } from "../Subscription";
import { UA } from "../UA";
import { URI } from "../URI";
export declare class SubscribeClientContext extends SubscribeClientContextBase {
    private subscription;
    constructor(ua: UA, target: string | URI, event: string, options?: any);
    onRequestTimeout(): void;
    onTransportError(): void;
    receiveResponse(message: IncomingResponseMessage): void;
    send(): this;
    refresh(): void;
    subscribe(): SubscribeClientContextBase;
    unsubscribe(): void;
    close(): void;
    protected sendSubscribeRequest(options?: any): void;
    protected createConfirmedDialog(message: IncomingRequestMessage, type: "UAC" | "UAS"): boolean;
}
