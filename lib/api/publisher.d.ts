/// <reference types="node" />
import { EventEmitter } from "events";
import { IncomingResponseMessage, OutgoingPublishRequest, URI } from "../core";
import { Emitter } from "./emitter";
import { PublisherOptions } from "./publisher-options";
import { PublisherPublishOptions } from "./publisher-publish-options";
import { PublisherState } from "./publisher-state";
import { PublisherUnpublishOptions } from "./publisher-unpublish-options";
import { UserAgent } from "./user-agent";
/**
 * A publisher publishes a publication (outgoing PUBLISH).
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
    private disposed;
    private id;
    private logger;
    private request;
    private userAgent;
    /** The publication state. */
    private _state;
    /** Emits when the registration state changes. */
    private _stateEventEmitter;
    /**
     * Constructs a new instance of the `Publisher` class.
     *
     * @param userAgent - User agent. See {@link UserAgent} for details.
     * @param targetURI - Request URI identifying the target of the message.
     * @param eventType - The event type identifying the published document.
     * @param options - Options bucket. See {@link PublisherOptions} for details.
     */
    constructor(userAgent: UserAgent, targetURI: URI, eventType: string, options?: PublisherOptions);
    /**
     * Destructor.
     */
    dispose(): Promise<void>;
    /** The publication state. */
    readonly state: PublisherState;
    /** Emits when the publisher state changes. */
    readonly stateChange: Emitter<PublisherState>;
    /**
     * Publish.
     * @param content - Body to publish
     */
    publish(content: string, options?: PublisherPublishOptions): Promise<void>;
    /**
     * Unpublish.
     */
    unpublish(options?: PublisherUnpublishOptions): Promise<void>;
    /** @internal */
    protected receiveResponse(response: IncomingResponseMessage): void;
    /** @internal */
    protected send(): OutgoingPublishRequest;
    private refreshRequest;
    private sendPublishRequest;
    /**
     * Transition publication state.
     */
    private stateTransition;
}
//# sourceMappingURL=publisher.d.ts.map