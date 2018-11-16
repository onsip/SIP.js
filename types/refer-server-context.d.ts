import { Session, InviteClientContext } from "./session";
import { SessionDescriptionHandlerModifiers } from "./session-description-handler";
import { UA } from "./ua";
import { URI } from "./uri";
import { EventEmitter } from "./event-emitter";

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
