import { SessionDialog } from "../dialogs";
import { IncomingInviteRequest, IncomingRequestDelegate, IncomingRequestMessage, OutgoingResponse, OutgoingResponseWithSession, ResponseOptions, URI } from "../messages";
import { UserAgentServer } from "./user-agent-server";
/**
 * Re-INVITE UAS.
 * @remarks
 * 14 Modifying an Existing Session
 * https://tools.ietf.org/html/rfc3261#section-14
 * 14.2 UAS Behavior
 * https://tools.ietf.org/html/rfc3261#section-14.2
 * @public
 */
export declare class ReInviteUserAgentServer extends UserAgentServer implements IncomingInviteRequest {
    private dialog;
    constructor(dialog: SessionDialog, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
    /**
     * Update the dialog signaling state on a 2xx response.
     * @param options - Options bucket.
     */
    accept(options?: ResponseOptions): OutgoingResponseWithSession;
    /**
     * Update the dialog signaling state on a 1xx response.
     * @param options - Progress options bucket.
     */
    progress(options?: ResponseOptions): OutgoingResponseWithSession;
    /**
     * TODO: Not Yet Supported
     * @param contacts - Contacts to redirect to.
     * @param options - Redirect options bucket.
     */
    redirect(contacts: Array<URI>, options?: ResponseOptions): OutgoingResponse;
    /**
     * 3.1 Background on Re-INVITE Handling by UASs
     * An error response to a re-INVITE has the following semantics.  As
     * specified in Section 12.2.2 of RFC 3261 [RFC3261], if a re-INVITE is
     * rejected, no state changes are performed.
     * https://tools.ietf.org/html/rfc6141#section-3.1
     * @param options - Reject options bucket.
     */
    reject(options?: ResponseOptions): OutgoingResponse;
}
//# sourceMappingURL=re-invite-user-agent-server.d.ts.map