import { Logger } from "../log/logger";
import { IncomingRequestMessage } from "./incoming-request-message";
import { IncomingResponseMessage } from "./incoming-response-message";
/**
 * Extract and parse every header of a SIP message.
 * @internal
 */
export declare namespace Parser {
    function getHeader(data: any, headerStart: number): number;
    function parseHeader(message: IncomingRequestMessage | IncomingResponseMessage, data: any, headerStart: number, headerEnd: number): boolean | {
        error: string;
    };
    function parseMessage(data: string, logger: Logger): IncomingRequestMessage | IncomingResponseMessage | undefined;
}
//# sourceMappingURL=parser.d.ts.map