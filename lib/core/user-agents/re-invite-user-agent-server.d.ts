import { SessionDialog } from "../dialogs";
import { IncomingInviteRequest, IncomingRequestDelegate, IncomingRequestMessage, OutgoingResponseWithSession, ResponseOptions } from "../messages";
import { UserAgentServer } from "./user-agent-server";
/**
 * 14 Modifying an Existing Session
 * https://tools.ietf.org/html/rfc3261#section-14
 * 14.2 UAS Behavior
 * https://tools.ietf.org/html/rfc3261#section-14.2
 */
export declare class ReInviteUserAgentServer extends UserAgentServer implements IncomingInviteRequest {
    private dialog;
    constructor(dialog: SessionDialog, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
    /**
     * Update the dialog signaling state on a 2xx response.
     * @param options Options bucket.
     */
    accept(options?: ResponseOptions): OutgoingResponseWithSession;
    /**
     * Update the dialog signaling state on a 1xx response.
     * @param options Progress options bucket.
     */
    progress(options?: ResponseOptions): OutgoingResponseWithSession;
}
