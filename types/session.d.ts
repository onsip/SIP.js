import { EventEmitter } from "./event-emitter";
import { SessionDescriptionHandler, SessionDescriptionHandlerOptions, SessionDescriptionHandlerModifiers } from "./session-description-handler";
import { UA } from "./ua";
import { NameAddrHeader } from "./name-addr-header";
import { URI } from "./uri";

/**
  * The Session interface SIP.js is providing.
  */
export class Session extends EventEmitter {

  data?: any; // This is actually an any
  endTime?: Date;
  localIdentity?: NameAddrHeader;
  remoteIdentity?: NameAddrHeader;
  method?: string;
  request?: any;
  sessionDescriptionHandler?: SessionDescriptionHandler;
  startTime?: Date;
  status: Session.C;
  ua: UA;

  bye(options?: any): Session;

  dtmf(tone: string): Session;

  hold(options?: SessionDescriptionHandlerOptions, modifiers?: SessionDescriptionHandlerModifiers): void;

  reinvite(options?: any, modifiers?: SessionDescriptionHandlerModifiers);

  refer(target: Session | String, options?: any): any; // TODO: This should take a URI

  terminate(options?: any): Session;

  unhold(options?: SessionDescriptionHandlerOptions, modifiers?: SessionDescriptionHandlerModifiers): void;

  on(name: 'referRequested', callback: (context: ReferServerContext) => void): void;
  on(name: 'reinvite', callback: (session: Session) => void): void;
  on(name: 'reinviteAccepted' | 'reinviteFailed', callback: (session: Session) => void): void;
  on(name: 'confirmed', callback: (request: any) => void): void; // TODO
  on(name: 'renegotiationError', callback: (error: any) => void): void; //TODO
  on(name: 'bye', callback: (request: any) => void): void; //TODO
  on(name: 'notify', callback: (request: any) => void): void; //TODO
  on(name: 'ack', callback: (request: any) => void): void; // TODO
  on(name: 'failed' | 'rejected', callback: (response?: any, cause?: any) => void): void;
  on(name: 'cancel', callback: () => void): void;
  on(name: 'replaced', callback: (session: Session) => void): void;
  on(name: 'accepted', callback: (response: any, cause: any) => void): void;
  on(name: 'terminated', callback: (message?: any, cause?: any) => void): void;
  on(name: 'connecting', callback: (request: any) => void): void;
  on(name: 'SessionDescriptionHandler-created', callback: (sessionDescriptionHandler: SessionDescriptionHandler) => void): void;
  on(name: 'dialog', callback: (dialog: any) => void): void;


}

export namespace Session {
  export enum C {
    STATUS_NULL =                        0,
    STATUS_INVITE_SENT =                 1,
    STATUS_1XX_RECEIVED =                2,
    STATUS_INVITE_RECEIVED =             3,
    STATUS_WAITING_FOR_ANSWER =          4,
    STATUS_ANSWERED =                    5,
    STATUS_WAITING_FOR_PRACK =           6,
    STATUS_WAITING_FOR_ACK =             7,
    STATUS_CANCELED =                    8,
    STATUS_TERMINATED =                  9,
    STATUS_ANSWERED_WAITING_FOR_PRACK = 10,
    STATUS_EARLY_MEDIA =                11,
    STATUS_CONFIRMED =                  12
  }
}

export class InviteClientContext extends Session {
  cancel(options?: any): Session;

  on(name: 'referRequested', callback: (context: ReferServerContext) => void): void;
  on(name: 'reinvite', callback: (session: Session) => void): void;
  on(name: 'reinviteAccepted' | 'reinviteFailed', callback: (session: Session) => void): void;
  on(name: 'confirmed', callback: (request: any) => void): void; // TODO
  on(name: 'renegotiationError', callback: (error: any) => void): void; //TODO
  on(name: 'bye', callback: (request: any) => void): void; //TODO
  on(name: 'notify', callback: (request: any) => void): void; //TODO
  on(name: 'ack', callback: (request: any) => void): void; // TODO
  on(name: 'failed' | 'rejected', callback: (response?: any, cause?: any) => void): void;
  on(name: 'cancel', callback: () => void): void;
  on(name: 'replaced', callback: (session: Session) => void): void;
  on(name: 'accepted', callback: (response: any, cause: any) => void): void;
  on(name: 'terminated', callback: (message?: any, cause?: any) => void): void;
  on(name: 'connecting', callback: (request: any) => void): void;
  on(name: 'SessionDescriptionHandler-created', callback: (sessionDescriptionHandler: SessionDescriptionHandler) => void): void;
  on(name: 'dialog', callback: (dialog: any) => void): void;

  on(name: 'progress', callback: (response: any) => void): void;
}

export namespace InviteClientContext {
  export interface Options {
    /** Array of extra headers added to the INVITE. */
    extraHeaders?: Array<string>;
    /** If true, send INVITE without SDP. */
    inviteWithoutSdp?: boolean;
    /** Deprecated */
    params?: {
      to_uri?: string;
      to_displayName: string;
    }
    /** Options to pass to SessionDescriptionHandler's getDescription() and setDescription(). */
    sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
  }
}

export class InviteServerContext extends Session {

  accept(options?: InviteServerContext.Options, modifiers?: SessionDescriptionHandlerModifiers): InviteServerContext;

  progress(options?: InviteServerContext.Options): InviteServerContext;

  reject(options?: InviteServerContext.Options): InviteServerContext;

  reply(options?: InviteServerContext.Options): InviteServerContext;

  on(name: 'referRequested', callback: (context: ReferServerContext) => void): void;
  on(name: 'reinvite', callback: (session: Session) => void): void;
  on(name: 'reinviteAccepted' | 'reinviteFailed', callback: (session: Session) => void): void;
  on(name: 'confirmed', callback: (request: any) => void): void; // TODO
  on(name: 'renegotiationError', callback: (error: any) => void): void; //TODO
  on(name: 'bye', callback: (request: any) => void): void; //TODO
  on(name: 'notify', callback: (request: any) => void): void; //TODO
  on(name: 'ack', callback: (request: any) => void): void; // TODO
  on(name: 'failed' | 'rejected', callback: (response?: any, cause?: any) => void): void;
  on(name: 'cancel', callback: () => void): void;
  on(name: 'replaced', callback: (session: Session) => void): void;
  on(name: 'accepted', callback: (response: any, cause: any) => void): void;
  on(name: 'terminated', callback: (message?: any, cause?: any) => void): void;
  on(name: 'connecting', callback: (request: any) => void): void;
  on(name: 'SessionDescriptionHandler-created', callback: (sessionDescriptionHandler: SessionDescriptionHandler) => void): void;
  on(name: 'dialog', callback: (dialog: any) => void): void;

  on(name: 'progress', callback: (response: any, reasonPhrase?: any) => void): void;
}

export namespace InviteServerContext {
  export interface Options {  // TODO: This may be incorrect
      /** Array of extra headers added to the INVITE. */
      extraHeaders?: Array<string>;
      /** Options to pass to SessionDescriptionHandler's getDescription() and setDescription(). */
      sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
  }
}

export class ReferServerContext extends EventEmitter {

  /** Parsed Refer-to header. */
  referTo?: any;

  /** If followRefer is was true, the new Session post accepting REFER request. */
  targetSession?: Session;

  /** Accept the REFER request with a "202 Accepted" reply. */
  accept(options?: ReferServerContext.AcceptOptions, modifiers?: SessionDescriptionHandlerModifiers): void;

  /** Send a "100 Trying" reply. */
  progress(): void;

  /** Reject the REFER request. */
  reject(options?: ReferServerContext.RejectOptions)

  on(name: 'referRequestRejected', callback: (referServerContext: ReferServerContext) => void): void;
  on(name: 'referRequestAccepted', callback: (referServerContext: ReferServerContext) => void): void;
  on(name: 'referInviteSent', callback: (referServerContext: ReferServerContext) => void): void;
  on(name: 'referProgress', callback: (referServerContext: ReferServerContext) => void): void;
  on(name: 'referAccepted', callback: (referServerContext: ReferServerContext) => void): void;
  on(name: 'referRejected', callback: (referServerContext: ReferServerContext) => void): void;
}

export namespace ReferServerContext {

  export interface AcceptOptions {
    /** If true, accept REFER request and automatically attempt to follow it. */
    followRefer?: boolean;
    /** If followRefer is true, options to following INVITE request. */
    inviteOptions: InviteClientContext.Options;
  }

  export interface RejectOptions {
  }
}
