import { EventEmitter } from "events";

import {
  Body,
  C,
  IncomingResponseMessage,
  Logger,
  OutgoingRequestMessage,
  URI
} from "../core";
import { Exceptions } from "../Exceptions";
import { Utils } from "../Utils";

import { PublisherOptions } from "./publisher-options";
import { PublisherPublishOptions } from "./publisher-publish-options";
import { PublisherUnpublishOptions } from "./publisher-unpublish-options";
import { BodyAndContentType } from "./session-description-handler";
import { UserAgent } from "./user-agent";

/**
 * A publisher publishes a document (outgoing PUBLISH).
 * @public
 */
export class Publisher extends EventEmitter {
  private event: string;
  private options: any;
  private target: URI;
  private pubRequestBody: any;
  private pubRequestExpires: number;
  private pubRequestEtag: string | undefined;
  private publishRefreshTimer: any | undefined;

  private logger: Logger;
  private request: OutgoingRequestMessage;
  private userAgent: UserAgent;

  /**
   * Constructs a new instance of the `Publisher` class.
   * @param userAgent - User agent. See {@link UserAgent} for details.
   * @param targetURI - Request URI identifying the target of the message.
   * @param eventType - The event type identifying the published document.
   * @param options - Options bucket. See {@link PublisherOptions} for details.
   */
  constructor(userAgent: UserAgent, targetURI: URI, eventType: string, options: PublisherOptions = {}) {
    super();

    options.extraHeaders = (options.extraHeaders || []).slice();
    options.contentType = (options.contentType || "text/plain");

    if (typeof options.expires !== "number" || (options.expires % 1) !== 0) {
      options.expires = 3600;
    } else {
      options.expires = Number(options.expires);
    }

    if (typeof(options.unpublishOnClose) !== "boolean") {
      options.unpublishOnClose = true;
    }

    this.target = targetURI;
    this.event = eventType;
    this.options = options;
    this.pubRequestExpires = this.options.expires;

    this.logger = userAgent.getLogger("sip.publisher");

    const params = options.params || {};
    const fromURI = params.fromUri ? params.fromUri : userAgent.userAgentCore.configuration.aor;
    const toURI = params.toUri ? params.toUri : targetURI;
    let body: Body | undefined;
    if (options.body && options.contentType) {
      const contentDisposition = "render";
      const contentType = options.contentType as string;
      const content = options.body as string;
      body = {
        contentDisposition,
        contentType,
        content,
      };
    }
    const extraHeaders = (options.extraHeaders || []).slice();

    // Build the request
    this.request = userAgent.userAgentCore.makeOutgoingRequestMessage(
      C.PUBLISH,
      targetURI,
      fromURI,
      toURI,
      params,
      extraHeaders,
      body
    );

    this.userAgent = userAgent;
  }

  /**
   * Close
   * @internal
   */
  public close(): void {
    // Send unpublish, if requested
    if (this.options.unpublishOnClose) {
      this.unpublish();
    } else {
      if (this.publishRefreshTimer) {
        clearTimeout(this.publishRefreshTimer);
        this.publishRefreshTimer = undefined;
      }

      this.pubRequestBody = undefined;
      this.pubRequestExpires = 0;
      this.pubRequestEtag = undefined;
    }

    if (this.userAgent.publishers[this.target.toString() + ":" + this.event]) {
      delete this.userAgent.publishers[this.target.toString() + ":" + this.event];
    }
  }

  /**
   * Publish
   * @param content - Body to publish
   */
  public publish(content: string, options: PublisherPublishOptions = {}): void {
    // Clean up before the run
    if (this.publishRefreshTimer) {
      clearTimeout(this.publishRefreshTimer);
      this.publishRefreshTimer = undefined;
    }

    // is Initial or Modify request
    this.options.body = content;
    this.pubRequestBody = this.options.body;

    if (this.pubRequestExpires === 0) {
      // This is Initial request after unpublish
      this.pubRequestExpires = this.options.expires;
      this.pubRequestEtag = undefined;
    }

    if (!(this.userAgent.publishers[this.target.toString() + ":" + this.event])) {
      this.userAgent.publishers[this.target.toString() + ":" + this.event] = this;
    }

    this.sendPublishRequest();
  }

  /**
   * Unpublish
   */
  public unpublish(options: PublisherUnpublishOptions = {}): void {
    // Clean up before the run
    if (this.publishRefreshTimer) {
      clearTimeout(this.publishRefreshTimer);
      this.publishRefreshTimer = undefined;
    }

    this.pubRequestBody = undefined;
    this.pubRequestExpires = 0;

    if (this.pubRequestEtag !== undefined) {
      this.sendPublishRequest();
    }
  }

  /** @internal */
  protected receiveResponse(response: IncomingResponseMessage): void {
    const statusCode: number = response.statusCode || 0;
    const cause: string = Utils.getReasonPhrase(statusCode);

    switch (true) {
      case /^1[0-9]{2}$/.test(statusCode.toString()):
        this.emit("progress", response, cause);
        break;

      case /^2[0-9]{2}$/.test(statusCode.toString()):
        // Set SIP-Etag
        if (response.hasHeader("SIP-ETag")) {
          this.pubRequestEtag = response.getHeader("SIP-ETag");
        } else {
          this.logger.warn("SIP-ETag header missing in a 200-class response to PUBLISH");
        }

        // Update Expire
        if (response.hasHeader("Expires")) {
          const expires: number = Number(response.getHeader("Expires"));
          if (typeof expires === "number" && expires >= 0 && expires <= this.pubRequestExpires) {
            this.pubRequestExpires = expires;
          } else {
            this.logger.warn("Bad Expires header in a 200-class response to PUBLISH");
          }
        } else {
          this.logger.warn("Expires header missing in a 200-class response to PUBLISH");
        }

        if (this.pubRequestExpires !== 0) {
          // Schedule refresh
          this.publishRefreshTimer = setTimeout(() => this.refreshRequest(), this.pubRequestExpires * 900);
          this.emit("published", response, cause);
        } else {
          this.emit("unpublished", response, cause);
        }

        break;

      case /^412$/.test(statusCode.toString()):
        // 412 code means no matching ETag - possibly the PUBLISH expired
        // Resubmit as new request, if the current request is not a "remove"

        if (this.pubRequestEtag !== undefined && this.pubRequestExpires !== 0) {
          this.logger.warn("412 response to PUBLISH, recovering");
          this.pubRequestEtag = undefined;
          this.emit("progress", response, cause);
          this.publish(this.options.body);
        } else {
          this.logger.warn("412 response to PUBLISH, recovery failed");
          this.pubRequestExpires = 0;
          this.emit("failed", response, cause);
          this.emit("unpublished", response, cause);
        }

        break;

      case /^423$/.test(statusCode.toString()):
        // 423 code means we need to adjust the Expires interval up
        if (this.pubRequestExpires !== 0 && response.hasHeader("Min-Expires")) {
          const minExpires: number = Number(response.getHeader("Min-Expires"));
          if (typeof minExpires === "number" || minExpires > this.pubRequestExpires) {
            this.logger.warn("423 code in response to PUBLISH, adjusting the Expires value and trying to recover");
            this.pubRequestExpires = minExpires;
            this.emit("progress", response, cause);
            this.publish(this.options.body);
          } else {
            this.logger.warn("Bad 423 response Min-Expires header received for PUBLISH");
            this.pubRequestExpires = 0;
            this.emit("failed", response, cause);
            this.emit("unpublished", response, cause);
          }
        } else {
          this.logger.warn("423 response to PUBLISH, recovery failed");
          this.pubRequestExpires = 0;
          this.emit("failed", response, cause);
          this.emit("unpublished", response, cause);
        }

        break;

      default:
        this.pubRequestExpires = 0;
        this.emit("failed", response, cause);
        this.emit("unpublished", response, cause);

        break;
    }

    // Do the cleanup
    if (this.pubRequestExpires === 0) {
      if (this.publishRefreshTimer) {
        clearTimeout(this.publishRefreshTimer);
        this.publishRefreshTimer = undefined;
      }

      this.pubRequestBody = undefined;
      this.pubRequestEtag = undefined;
    }
  }

  /** @internal */
  protected send(): this {
    this.userAgent.userAgentCore.publish(this.request, {
      onAccept: (response): void => this.receiveResponse(response.message),
      onProgress: (response): void => this.receiveResponse(response.message),
      onRedirect: (response): void => this.receiveResponse(response.message),
      onReject: (response): void => this.receiveResponse(response.message),
      onTrying: (response): void => this.receiveResponse(response.message)
    });
    return this;
  }

  private refreshRequest(): void {
    // Clean up before the run
    if (this.publishRefreshTimer) {
      clearTimeout(this.publishRefreshTimer);
      this.publishRefreshTimer = undefined;
    }

    // This is Refresh request
    this.pubRequestBody = undefined;

    if (this.pubRequestEtag === undefined) {
      // Request not valid
      throw new Exceptions.MethodParameterError("Publish", "Body", undefined);
    }

    if (this.pubRequestExpires === 0) {
      // Request not valid
      throw new Exceptions.MethodParameterError("Publish", "Expire", this.pubRequestExpires);
    }

    this.sendPublishRequest();
  }

  private sendPublishRequest(): void {
    const reqOptions: any = Object.create(this.options || Object.prototype);
    reqOptions.extraHeaders = (this.options.extraHeaders || []).slice();

    reqOptions.extraHeaders.push("Event: " + this.event);
    reqOptions.extraHeaders.push("Expires: " + this.pubRequestExpires);

    if (this.pubRequestEtag !== undefined) {
      reqOptions.extraHeaders.push("SIP-If-Match: " + this.pubRequestEtag);
    }

    const ruri = this.target;
    const params = this.options.params || {};
    let bodyAndContentType: BodyAndContentType | undefined;
    if (this.pubRequestBody !== undefined) {
      bodyAndContentType = {
        body: this.pubRequestBody,
        contentType: this.options.contentType
      };
    }
    let body: Body | undefined;
    if (bodyAndContentType) {
      body = Utils.fromBodyObj(bodyAndContentType);
    }

    this.request = this.userAgent.userAgentCore.makeOutgoingRequestMessage(
      C.PUBLISH,
      ruri,
      params.fromUri ? params.fromUri : this.userAgent.userAgentCore.configuration.aor,
      params.toUri ? params.toUri : this.target,
      params,
      reqOptions.extraHeaders,
      body
    );

    this.send();
  }
}
