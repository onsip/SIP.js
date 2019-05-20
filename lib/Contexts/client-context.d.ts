import { ClientContext as ClientContextBase } from "../ClientContext";
import { IncomingResponse as IncomingResponseMessage } from "../SIPMessage";
import { UA } from "../UA";
import { URI } from "../URI";
export declare class ClientContext extends ClientContextBase {
    constructor(ua: UA, method: string, target: string | URI, options?: any);
    onRequestTimeout(): void;
    onTransportError(): void;
    receiveResponse(message: IncomingResponseMessage): void;
    send(): this;
}
