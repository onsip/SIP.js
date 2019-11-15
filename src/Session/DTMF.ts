import { EventEmitter } from "events";

import { C } from "../Constants";
import { IncomingRequest, IncomingResponseMessage, Logger } from "../core";
import { SessionStatus, TypeStrings } from "../Enums";
import { Exceptions } from "../Exceptions";
import { Session } from "../Session";
import { Utils } from "../Utils";
import { DTMFValidator } from "./DTMFValidator";

/**
 * @class DTMF
 * @param {SIP.Session} session
 */
export class DTMF extends EventEmitter {
  public type: TypeStrings;
  public tone: string;
  public duration: number;
  public interToneGap: number;
  private C: any = {
    MIN_DURATION:            70,
    MAX_DURATION:            6000,
    DEFAULT_DURATION:        100,
    MIN_INTER_TONE_GAP:      50,
    DEFAULT_INTER_TONE_GAP:  500
  };
  private logger: Logger;
  private owner: Session;

  constructor(session: Session, tone: string | number, options: any = {}) {
    super();
    this.type = TypeStrings.DTMF;
    if (tone === undefined) {
      throw new TypeError("Not enough arguments");
    }

    this.logger = session.ua.getLogger("sip.invitecontext.dtmf", session.id);
    this.owner = session;

    const moreThanOneTone = false;

    // If tone is invalid, it will automatically generate an exception.
    // Otherwise, it will return the tone in the correct format.
    this.tone = DTMFValidator.validate(tone, moreThanOneTone);

    let duration: any = options.duration;
    let interToneGap: any = options.interToneGap;

    // Check duration
    if (duration && !Utils.isDecimal(duration)) {
      throw new TypeError("Invalid tone duration: " + duration);
    } else if (!duration) {
      duration = this.C.DEFAULT_DURATION;
    } else if (duration < this.C.MIN_DURATION) {
      this.logger.warn("'duration' value is lower than the minimum allowed, setting it to " +
        this.C.MIN_DURATION + " milliseconds");
      duration = this.C.MIN_DURATION;
    } else if (duration > this.C.MAX_DURATION) {
      this.logger.warn("'duration' value is greater than the maximum allowed, setting it to " +
        this.C.MAX_DURATION + " milliseconds");
      duration = this.C.MAX_DURATION;
    } else {
      duration = Math.abs(duration);
    }
    this.duration = duration;

    // Check interToneGap
    if (interToneGap && !Utils.isDecimal(interToneGap)) {
      throw new TypeError("Invalid interToneGap: " + interToneGap);
    } else if (!interToneGap) {
      interToneGap = this.C.DEFAULT_INTER_TONE_GAP;
    } else if (interToneGap < this.C.MIN_INTER_TONE_GAP) {
      this.logger.warn("'interToneGap' value is lower than the minimum allowed, setting it to " +
        this.C.MIN_INTER_TONE_GAP + " milliseconds");
      interToneGap = this.C.MIN_INTER_TONE_GAP;
    } else {
      interToneGap = Math.abs(interToneGap);
    }
    this.interToneGap = interToneGap;
  }

  public send(options: any = {}): void {
    // Check RTCSession Status
    if (this.owner.status !== SessionStatus.STATUS_CONFIRMED &&
      this.owner.status !== SessionStatus.STATUS_WAITING_FOR_ACK) {
      throw new Exceptions.InvalidStateError(this.owner.status);
    }

    // Get DTMF options
    const extraHeaders: Array<string> = options.extraHeaders ? options.extraHeaders.slice() : [];

    const body = {
      contentType: "application/dtmf-relay",
      body: "Signal= " + this.tone + "\r\nDuration= " + this.duration
    };

    if (this.owner.session) {
      const request = this.owner.session.info(undefined, {
        extraHeaders,
        body: Utils.fromBodyObj(body)
      });
      this.owner.emit("dtmf", request.message, this);
      return;
    }
  }

  public init_incoming(request: IncomingRequest): void {
    request.accept();

    if (!this.tone || !this.duration) {
      this.logger.warn("invalid INFO DTMF received, discarded");
    } else {
      this.owner.emit("dtmf", request.message, this);
    }
  }

  public receiveResponse(response: IncomingResponseMessage): void {
    const statusCode: number = response && response.statusCode ? response.statusCode : 0;

    switch (true) {
      case /^1[0-9]{2}$/.test(statusCode.toString()):
        // Ignore provisional responses.
        break;

      case /^2[0-9]{2}$/.test(statusCode.toString()):
        this.emit("succeeded", {
          originator: "remote",
          response
        });
        break;

      default:
        const cause: string = Utils.sipErrorCause(statusCode);
        this.emit("failed", response, cause);
        break;
    }
  }

  public onRequestTimeout(): void {
    this.emit("failed", undefined, C.causes.REQUEST_TIMEOUT);
    this.owner.onRequestTimeout();
  }

  public onTransportError(): void {
    this.emit("failed", undefined, C.causes.CONNECTION_ERROR);
    this.owner.onTransportError();
  }

  public onDialogError(response: IncomingResponseMessage): void {
    this.emit("failed", response, C.causes.DIALOG_ERROR);
    this.owner.onDialogError(response);
  }
}
