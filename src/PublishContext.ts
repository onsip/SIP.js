import { ClientContext } from "./ClientContext";
import { C } from "./Constants";
import { Body, IncomingResponseMessage, URI } from "./core";
import { Transport } from "./core/transport";
import { TypeStrings } from "./Enums";
import { Exceptions } from "./Exceptions";
import { BodyObj } from "./session-description-handler";
import { UA } from "./UA";
import { Utils } from "./Utils";

/**
 * SIP Publish (SIP Extension for Event State Publication RFC3903)
 * @class Class creating a SIP PublishContext.
 */
export class PublishContext extends ClientContext {
  public type: TypeStrings;

  private options: any;
  private event: string;
  private target: string | URI;
  private pubRequestBody: any;
  private pubRequestExpires: number;
  private pubRequestEtag: string | undefined;
  private publishRefreshTimer: any | undefined;

  constructor(ua: UA, target: string | URI, event: string, options: any = {}) {
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

    if (target === undefined || target === null || target === "") {
      throw new Exceptions.MethodParameterError("Publish", "Target", target);
    } else {
      target = ua.normalizeTarget(target) as URI;
      if (target === undefined) {
        throw new Exceptions.MethodParameterError("Publish", "Target", target);
      }
    }

    super(ua, C.PUBLISH, target, options);
    this.type = TypeStrings.PublishContext;

    this.options = options;
    this.target = target;

    if (event === undefined || event === null || event === "") {
      throw new Exceptions.MethodParameterError("Publish", "Event", event);
    } else {
      this.event = event;
    }

    this.logger = ua.getLogger("sip.publish");

    this.pubRequestExpires = this.options.expires;
  }

  /**
   * Publish
   * @param {string} Event body to publish, optional
   */
  public publish(body: string): void {
    // Clean up before the run
    if (this.publishRefreshTimer) {
      clearTimeout(this.publishRefreshTimer);
      this.publishRefreshTimer = undefined;
    }

    // is Inital or Modify request
    this.options.body = body;
    this.pubRequestBody = this.options.body;

    if (this.pubRequestExpires === 0) {
      // This is Initial request after unpublish
      this.pubRequestExpires = this.options.expires;
      this.pubRequestEtag = undefined;
    }

    if (!(this.ua.publishers[this.target.toString() + ":" + this.event])) {
      this.ua.publishers[this.target.toString() + ":" + this.event] = this;
    }

    this.sendPublishRequest();
  }

  /**
   * Unpublish
   */
  public unpublish(): void {
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

  /**
   * Close
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

    if (this.ua.publishers[this.target.toString() + ":" + this.event]) {
      delete this.ua.publishers[this.target.toString() + ":" + this.event];
    }
  }

  public onRequestTimeout(): void {
    super.onRequestTimeout();
    this.emit("unpublished", undefined, C.causes.REQUEST_TIMEOUT);
  }

  public onTransportError(): void {
    super.onTransportError();
    this.emit("unpublished", undefined, C.causes.CONNECTION_ERROR);
  }

  public receiveResponse(response: IncomingResponseMessage): void {
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

  public send(): this {
    this.ua.userAgentCore.publish(this.request, {
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

    const ruri = this.target instanceof URI ? this.target : this.ua.normalizeTarget(this.target);
    if (!ruri) {
      throw new Error("ruri undefined.");
    }
    const params = this.options.params || {};
    let bodyObj: BodyObj | undefined;
    if (this.pubRequestBody !== undefined) {
      bodyObj = {
        body: this.pubRequestBody,
        contentType: this.options.contentType
      };
    }
    let body: Body | undefined;
    if (bodyObj) {
      body = Utils.fromBodyObj(bodyObj);
    }

    this.request = this.ua.userAgentCore.makeOutgoingRequestMessage(
      C.PUBLISH,
      ruri,
      params.fromUri ? params.fromUri : this.ua.userAgentCore.configuration.aor,
      params.toUri ? params.toUri : this.target,
      params,
      reqOptions.extraHeaders,
      body
    );

    this.send();
  }
}
