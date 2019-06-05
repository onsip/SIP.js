import { IncomingMessage } from "./incoming-message";
/**
 * Incoming SIP response message.
 */
export declare class IncomingResponseMessage extends IncomingMessage {
    statusCode: number | undefined;
    reasonPhrase: string | undefined;
    constructor();
}
