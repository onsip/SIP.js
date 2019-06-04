import { SubscriptionDialog } from "../dialogs";
import { IncomingResponseMessage, OutgoingRequestDelegate, OutgoingSubscribeRequest, RequestOptions } from "../messages";
import { UserAgentClient } from "./user-agent-client";
export declare class ReSubscribeUserAgentClient extends UserAgentClient implements OutgoingSubscribeRequest {
    private dialog;
    constructor(dialog: SubscriptionDialog, delegate?: OutgoingRequestDelegate, options?: RequestOptions);
    waitNotifyStop(): void;
    /**
     * Receive a response from the transaction layer.
     * @param message Incoming response message.
     */
    protected receiveResponse(message: IncomingResponseMessage): void;
}
