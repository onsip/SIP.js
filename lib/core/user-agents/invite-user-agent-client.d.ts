import { TransportError } from "../exceptions";
import { IncomingResponseMessage, OutgoingInviteRequest, OutgoingInviteRequestDelegate, OutgoingRequestMessage } from "../messages";
import { UserAgentCore } from "../user-agent-core";
import { UserAgentClient } from "./user-agent-client";
/**
 * INVITE UAC.
 * @remarks
 * 13 Initiating a Session
 * https://tools.ietf.org/html/rfc3261#section-13
 * 13.1 Overview
 * https://tools.ietf.org/html/rfc3261#section-13.1
 * 13.2 UAC Processing
 * https://tools.ietf.org/html/rfc3261#section-13.2
 * @public
 */
export declare class InviteUserAgentClient extends UserAgentClient implements OutgoingInviteRequest {
    delegate: OutgoingInviteRequestDelegate | undefined;
    private confirmedDialogAcks;
    private confirmedDialogs;
    private earlyDialogs;
    constructor(core: UserAgentCore, message: OutgoingRequestMessage, delegate?: OutgoingInviteRequestDelegate);
    dispose(): void;
    /**
     * Special case for transport error while sending ACK.
     * @param error - Transport error
     */
    protected onTransportError(error: TransportError): void;
    /**
     * Once the INVITE has been passed to the INVITE client transaction, the
     * UAC waits for responses for the INVITE.
     * https://tools.ietf.org/html/rfc3261#section-13.2.2
     * @param incomingResponse - Incoming response to INVITE request.
     */
    protected receiveResponse(message: IncomingResponseMessage): void;
}
//# sourceMappingURL=invite-user-agent-client.d.ts.map