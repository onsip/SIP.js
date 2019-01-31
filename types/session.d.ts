import { EventEmitter } from "events";

import { ClientContext } from "./client-context";
import { C } from "./constants";
import { Dialog } from "./dialogs";
import { DTMF } from "./Session/dtmf";
import { Logger } from "./logger-factory";
import { NameAddrHeader } from "./name-addr-header";
import { ServerContext } from "./server-context";
import {
  SessionDescriptionHandler,
  SessionDescriptionHandlerOptions,
  SessionDescriptionHandlerModifiers
} from "./session-description-handler";
import { IncomingRequest, IncomingResponse, OutgoingRequest } from "./sip-message";
import { InviteServerTransaction, NonInviteServerTransaction } from "./transactions";
import { UA } from "./ua";
import { URI } from "./uri";

import { SessionStatus, TypeStrings } from "./enums";

/**
  * The Session interface SIP.js is providing.
  */
export declare abstract class Session extends EventEmitter {
  static readonly C: SessionStatus;

  // inheritted from (Server/ClientContext)
  type: TypeStrings;
  ua: UA;
  logger: Logger;
  method: string;
  body: any;
  status: SessionStatus;
  contentType: string;
  localIdentity: NameAddrHeader;
  remoteIdentity: NameAddrHeader;
  data: any;
  assertedIdentity: NameAddrHeader | undefined;
  id: string;

  contact: string | undefined;
  replacee: InviteClientContext | InviteServerContext | undefined;
  dialog: Dialog | undefined;
  localHold: boolean;
  sessionDescriptionHandler: SessionDescriptionHandler | undefined;
  startTime: Date | undefined;
  endTime: Date | undefined;

  dtmf(tones: string| number, options?: Session.DtmfOptions): this
  bye(options?: any): this
  refer(target: string | InviteClientContext | InviteServerContext, options?: any): ReferClientContext;
  sendRequest(method: string, options: any): this;
  close(): this;
  createDialog(message: IncomingRequest | IncomingResponse, type: "UAS" | "UAC", early?: boolean): boolean;
  hold(options?: SessionDescriptionHandlerOptions, modifiers?: SessionDescriptionHandlerModifiers): void;
  unhold(options?: SessionDescriptionHandlerOptions, modifiers?: SessionDescriptionHandlerModifiers): void;
  reinvite(options?: any, modifiers?: SessionDescriptionHandlerModifiers): void;
  receiveRequest(request: IncomingRequest): void;
  onTransportError(): void;
  onRequestTimeout(): void;
  onDialogError(response: IncomingResponse): void;
  terminate(options?: any): this;

  on(event: 'referRequested', listener: (context: ReferServerContext) => void): this;
  on(event: 'reinvite', listener: (session: Session) => void): this;
  on(event: 'reinviteAccepted' | 'reinviteFailed', listener: (session: Session) => void): this;
  on(event: 'confirmed', listener: (request: any) => void): this; // TODO
  on(event: 'renegotiationError', listener: (error: any) => void): this; // TODO
  on(event: 'bye', listener: (request: any) => void): this; // TODO
  on(event: 'notify', listener: (request: any) => void): this; // TODO
  on(event: 'ack', listener: (request: any) => void): this //  TODO
  on(event: 'failed' | 'rejected', listener: (response?: any, cause?: C.causes) => void): this;
  on(event: 'cancel', listener: () => void): this;
  on(event: 'replaced', listener: (session: Session) => void): this;
  on(event: 'accepted', listener: (response: any, cause: C.causes) => void): this;
  on(event: 'terminated', listener: (message?: any, cause?: C.causes) => void): this;
  on(event: 'connecting', listener: (request: any) => void): this;
  on(event: 'dtmf', listener: (request: IncomingRequest | OutgoingRequest, dtmf: DTMF) => void): this;
  on(event: 'SessionDescriptionHandler-created', listener: (sessionDescriptionHandler: SessionDescriptionHandler) => void): this;
  on(event: 'referRequestProgress' | 'referRequestAccepted' | 'referRequestRejected', listener: (session: this) => void): this;
  on(event: 'referInviteSent' | 'referProgress' | 'referAccepted' | 'referRejected', listener: (session: this) => void): this;
  on(event: 'dialog', listener: (dialog: any) => void): this;
  on(event: 'progress', listener: (response: IncomingRequest, reasonPhrase?: any) => void): this;
  on(event: 'trackAdded' | 'directionChanged', listener: () => void): this;
}

export declare namespace Session {
  export interface DtmfOptions {
    extraHeaders?: string[],
    duration?: number;
    interToneGap?: number;
  }
}

export declare class InviteServerContext extends Session implements ServerContext {
  transaction: InviteServerTransaction | NonInviteServerTransaction;
  request: IncomingRequest;

  ua: UA;
  logger: Logger;
  method: string;
  localIdentity: NameAddrHeader;
  remoteIdentity: NameAddrHeader;
  data: any;

  constructor(ua: UA, request: IncomingRequest);
  reject(options?: InviteServerContext.Options): this;
  reply(options?: InviteServerContext.Options): this;
  terminate(options?: any): this;
  progress(options?: InviteServerContext.Options): this;
  accept(options?: InviteServerContext.Options, modifiers?: SessionDescriptionHandlerModifiers): this;
  receiveRequest(request: IncomingRequest): void;
}

export declare namespace InviteServerContext {
  export interface Options {  // TODO: This may be incorrect
      /** Array of extra headers added to the INVITE. */
      extraHeaders?: Array<string>;
      /** Options to pass to SessionDescriptionHandler's getDescription() and setDescription(). */
      sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
      modifiers?: SessionDescriptionHandlerModifiers;
      onInfo?: ((request: IncomingRequest) => void);
      statusCode?: number;
      reasonPhrase?: string;
      body?: any;
      rel100?: boolean;
  }
}

export declare class InviteClientContext extends Session implements ClientContext {
  request: OutgoingRequest;

  constructor(ua: UA, target: string | URI, options?: any, modifiers?: any);
  receiveNonInviteResponse(response: IncomingResponse): void;
  receiveResponse(response: IncomingResponse): void;
  send(): this;
  invite(): this;
  receiveInviteResponse(response: IncomingResponse): void;
  cancel(options?: any): this;
  terminate(options?: any): this;
  receiveRequest(request: IncomingRequest): void;
}

export declare namespace InviteClientContext {
  export interface Options {
    /** Array of extra headers added to the INVITE. */
    extraHeaders?: Array<string>;
    /** If true, send INVITE without SDP. */
    inviteWithoutSdp?: boolean;
    /** Deprecated */
    params?: {
      toUri?: string;
      toDisplayName: string;
    }
    /** Options to pass to SessionDescriptionHandler's getDescription() and setDescription(). */
    sessionDescriptionHandlerOptions?: SessionDescriptionHandlerOptions;
  }
}

export declare class ReferClientContext extends ClientContext {
  constructor(
    ua: UA,
    applicant: InviteClientContext | InviteServerContext,
    target: InviteClientContext | InviteServerContext | string,
    options?: any
  );
  refer(options?: any): ReferClientContext;
  receiveNotify(request: IncomingRequest): void;
}

export declare class ReferServerContext extends EventEmitter {

  /** Parsed Refer-to header. */
  referTo: NameAddrHeader;
  /** If followRefer is was true, the new Session post accepting REFER request. */
  targetSession: InviteClientContext | InviteServerContext | undefined;

  constructor(ua: UA, request: IncomingRequest);

  receiveNonInviteResponse(response: IncomingResponse): void

  /** Send a "100 Trying" reply. */
  progress(): void;

  /** Reject the REFER request. */
  reject(options?: ReferServerContext.RejectOptions): void;

  /** Accept the REFER request with a "202 Accepted" reply. */
  accept(options?: ReferServerContext.AcceptOptions, modifiers?: SessionDescriptionHandlerModifiers): void;

  sendNotify(body: string): void;

  on(name: 'referRequestRejected', callback: (referServerContext: ReferServerContext) => void): this;
  on(name: 'referRequestAccepted', callback: (referServerContext: ReferServerContext) => void): this;
  on(name: 'referInviteSent', callback: (referServerContext: ReferServerContext) => void): this;
  on(name: 'referProgress', callback: (referServerContext: ReferServerContext) => void): this;
  on(name: 'referAccepted', callback: (referServerContext: ReferServerContext) => void): this;
  on(name: 'referRejected', callback: (referServerContext: ReferServerContext) => void): this;
}

export declare namespace ReferServerContext {

  export interface AcceptOptions {
    /** If true, accept REFER request and automatically attempt to follow it. */
    followRefer?: boolean;
    /** If followRefer is true, options to following INVITE request. */
    inviteOptions?: InviteClientContext.Options;
  }

  export interface RejectOptions {
  }
}
