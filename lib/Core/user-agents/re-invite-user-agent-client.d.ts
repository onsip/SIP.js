import { IncomingResponse as IncomingResponseMessage } from "../../SIPMessage";
import { SessionDialog } from "../dialogs";
import { OutgoingInviteRequest, OutgoingInviteRequestDelegate, RequestOptions } from "../messages";
import { UserAgentClient } from "./user-agent-client";
/**
 * 14 Modifying an Existing Session
 * https://tools.ietf.org/html/rfc3261#section-14
 * 14.1 UAC Behavior
 * https://tools.ietf.org/html/rfc3261#section-14.1
 */
export declare class ReInviteUserAgentClient extends UserAgentClient implements OutgoingInviteRequest {
    delegate: OutgoingInviteRequestDelegate | undefined;
    private dialog;
    constructor(dialog: SessionDialog, delegate?: OutgoingInviteRequestDelegate, options?: RequestOptions);
    protected receiveResponse(message: IncomingResponseMessage): void;
}