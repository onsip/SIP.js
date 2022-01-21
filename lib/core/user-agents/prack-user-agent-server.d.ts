import { SessionDialog } from "../dialogs";
import { IncomingPrackRequest, IncomingRequestDelegate, IncomingRequestMessage, OutgoingResponse, ResponseOptions } from "../messages";
import { UserAgentServer } from "./user-agent-server";
/**
 * PRACK UAS.
 * @public
 */
export declare class PrackUserAgentServer extends UserAgentServer implements IncomingPrackRequest {
    private dialog;
    constructor(dialog: SessionDialog, message: IncomingRequestMessage, delegate?: IncomingRequestDelegate);
    /**
     * Update the dialog signaling state on a 2xx response.
     * @param options - Options bucket.
     */
    accept(options?: ResponseOptions): OutgoingResponse;
}
//# sourceMappingURL=prack-user-agent-server.d.ts.map