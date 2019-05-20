import { PublishContext as PublishClientContextBase } from "../PublishContext";
import { IncomingResponse as IncomingResponseMessage } from "../SIPMessage";
import { UA } from "../UA";
import { URI } from "../URI";
export declare class PublishClientContext extends PublishClientContextBase {
    constructor(ua: UA, target: string | URI, event: string, options?: any);
    onRequestTimeout(): void;
    onTransportError(): void;
    receiveResponse(message: IncomingResponseMessage): void;
    send(): this;
    publish(body: string): void;
    unpublish(): void;
    close(): void;
}
