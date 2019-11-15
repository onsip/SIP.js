/// <reference types="node" />
import { EventEmitter } from "events";
import { IncomingResponseMessage, URI } from "../core";
import { PublisherOptions } from "./publisher-options";
import { PublisherPublishOptions } from "./publisher-publish-options";
import { PublisherUnpublishOptions } from "./publisher-unpublish-options";
import { UserAgent } from "./user-agent";
/**
 * A publisher publishes a document (outgoing PUBLISH).
 * @public
 */
export declare class Publisher extends EventEmitter {
    private event;
    private options;
    private target;
    private pubRequestBody;
    private pubRequestExpires;
    private pubRequestEtag;
    private publishRefreshTimer;
    private logger;
    private request;
    private userAgent;
    /**
     * Constructs a new instance of the `Publisher` class.
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @param targetURI - Request URI identifying the target of the message.
     * @param eventType - The event type identifying the published document.
     * @param options - Options bucket. See {@link PublisherOptions} for details.
     */
    constructor(userAgent: UserAgent, targetURI: URI, eventType: string, options?: PublisherOptions);
    /**
     * Publish
     * @param content - Body to publish
     */
    publish(content: string, options?: PublisherPublishOptions): void;
    /**
     * Unpublish
     */
    unpublish(options?: PublisherUnpublishOptions): void;
    /**
     * Close
     * @internal
     */
    _close(): void;
    /** @internal */
    protected receiveResponse(response: IncomingResponseMessage): void;
    /** @internal */
    protected send(): this;
    private refreshRequest;
    private sendPublishRequest;
}
//# sourceMappingURL=publisher.d.ts.map