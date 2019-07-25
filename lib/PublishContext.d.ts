import { ClientContext } from "./ClientContext";
import { IncomingResponseMessage, URI } from "./core";
import { TypeStrings } from "./Enums";
import { UA } from "./UA";
/**
 * SIP Publish (SIP Extension for Event State Publication RFC3903)
 * @class Class creating a SIP PublishContext.
 */
export declare class PublishContext extends ClientContext {
    type: TypeStrings;
    private options;
    private event;
    private target;
    private pubRequestBody;
    private pubRequestExpires;
    private pubRequestEtag;
    private publishRefreshTimer;
    constructor(ua: UA, target: string | URI, event: string, options?: any);
    /**
     * Publish
     * @param {string} Event body to publish, optional
     */
    publish(body: string): void;
    /**
     * Unpublish
     */
    unpublish(): void;
    /**
     * Close
     */
    close(): void;
    onRequestTimeout(): void;
    onTransportError(): void;
    receiveResponse(response: IncomingResponseMessage): void;
    send(): this;
    private refreshRequest;
    private sendPublishRequest;
}
//# sourceMappingURL=PublishContext.d.ts.map