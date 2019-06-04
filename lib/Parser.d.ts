import { IncomingRequestMessage, IncomingResponseMessage, Logger } from "./core";
/**
 * Extract and parse every header of a SIP message.
 * @namespace
 */
export declare namespace Parser {
    function getHeader(data: any, headerStart: number): number;
    function parseHeader(message: IncomingRequestMessage | IncomingResponseMessage, data: any, headerStart: number, headerEnd: number): boolean | {
        error: string;
    };
    /** Parse SIP Message
     * @function
     * @param {String} message SIP message.
     * @param {Object} logger object.
     * @returns {SIP.IncomingRequest|SIP.IncomingResponse|undefined}
     */
    function parseMessage(data: string, logger: Logger): IncomingRequestMessage | IncomingResponseMessage | undefined;
}
