import { C, InviteServerContext, ReferServerContext } from ".";
import { EventEmitter } from "./event-emitter";
import { InviteClientContext, Session } from "./session";
import { SessionDescriptionHandlerFactory, SessionDescriptionHandlerFactoryOptions} from "./session-description-handler-factory";
import { SessionDescriptionHandlerOptions, SessionDescriptionHandlerModifiers } from "./session-description-handler";
import { URI } from "./uri";

export class UA extends EventEmitter {

  contact: any; // TODO: Fix this
  transport: any; // TODO: Should be "trasnport" type
  sessions: Array<Session>;

  constructor(options: UA.Options);

  invite(target: URI, options?: InviteClientContext.Options, modifiers?: SessionDescriptionHandlerModifiers): InviteClientContext;

  isRegistered(): boolean;

  message(target: URI, body: string, options?: any);

  register(options?: any): UA;

  request(method: string, target: URI, options?: any): any; //Returns a SIP.ClientContext

  subscribe(target: URI, eventPackage: string, options?: any): any;

  unregister(options?: any): UA;

  start(): UA;

  stop(): UA;

  on(name: 'transportCreated', callback: (transport: any) => void): void;
  on(name: 'newTransaction' | 'transactionDestroyed', callback: (transaction: any) => void): void;
  on(name: 'message', callback: (message: any) => void): void;
  on(name: 'invite', callback: (session: InviteServerContext) => void): void;
  on(name: 'notify', callback: (request: any) => void): void;
  on(name: 'outOfDialogReferRequested', callback: (context: ReferServerContext) => void): void;
  on(name: 'registered', callback: (response?: any) => void): void;
  on(name: 'unregistered' | 'registrationFailed', callback: (response?: any, cause?: any) => void): void;
  on(name: 'inviteSent', callback: (session: InviteClientContext) => void): void;

}

export namespace UA {
  export interface Options {
    uri?: string;
    allowLegacyNotifications?: boolean;
    allowOutOfDialogRefers?: boolean;
    authorizationUser?: string;
    autostart?: boolean;
    displayName?: string;
    dtmfType?: DtmfType;
    hackIpInContact?: boolean;
    hackViaTcp?: boolean;
    hackWssInTransport?: boolean;
    log?: any; // TODO
    noAnswerTimeout?: number;
    password?: string;
    register?: boolean;
    registerOptions?: RegisterOptions;
    rel100?: C.supported;
    replaces?: C.supported;
    sessionDescriptionHandlerFactory?: SessionDescriptionHandlerFactory;
    sessionDescriptionHandlerFactoryOptions?: SessionDescriptionHandlerFactoryOptions;
    transportConstructor?: (logger: any, options: any) => any; // TODO
    transportOptions?: any; // TODO
    userAgentString?: string;
  }

  export interface RegisterOptions {
    expires?: number;
    extraContactHeaderParams?: Array<string>;
    instanceId?: string;
    params?: any;
    regId?: number;
    registrar?: string;
  }

  export enum DtmfType {
    RTP = 'rtp',
    INFO = 'info'
  }
}
