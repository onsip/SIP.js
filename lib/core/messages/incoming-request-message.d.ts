import { URI } from "../messages";
import { IncomingMessage } from "./incoming-message";
/**
 * Incoming SIP request message.
 */
export declare class IncomingRequestMessage extends IncomingMessage {
    ruri: URI | undefined;
    constructor();
}
