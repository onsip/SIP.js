import { EventEmitter } from "events";

import { ClientContext } from "./client-context";
import { C } from "./constants";
import { Dialog } from "./dialogs";
import { DigestAuthentication } from "./digest-authentication";
import { Logger } from "./logger-factory";
import { PublishContext } from "./publish-context";
import { InviteClientContext, Session, InviteServerContext, ReferServerContext } from "./session";
import { SessionDescriptionHandlerFactory, SessionDescriptionHandlerFactoryOptions} from "./session-description-handler-factory";
import { SessionDescriptionHandlerOptions, SessionDescriptionHandlerModifiers } from "./session-description-handler";
import { IncomingRequest } from "./sip-message";
import { Subscription } from "./subscription";
import { InviteClientTransaction, InviteServerTransaction, NonInviteClientTransaction, NonInviteServerTransaction } from "./transactions";
import { Transport } from "./transport";
import { URI } from "./uri";

import { TypeStrings, UAStatus } from "./enums";

export declare class UA extends EventEmitter {
  static readonly C: any;
  type: TypeStrings;
  configuration: UA.Options;
  applicants: {[id: string]: InviteClientContext};
  publishers: {[id: string]: PublishContext};
  contact: any | undefined; //TODO fix this
  status: UAStatus;
  transport: Transport | undefined;
  transactions: {
    nist: {[id: string]: NonInviteServerTransaction}
    nict: {[id: string]: NonInviteClientTransaction}
    ist: {[id: string]: InviteServerTransaction}
    ict: {[id: string]: InviteClientTransaction}
  };;
  sessions: {[id: string]: InviteClientContext | InviteServerContext};
  dialogs: {[id: string]: Dialog};
  data: any;
  logger: Logger;
  earlySubscriptions: {[id: string]: Subscription};
  subscriptions: {[id: string]: Subscription};

  transactionsCount: number;
  nictTransactionsCount: number;
  nistTransactionsCount: number;
  ictTransactionsCount: number;
  istTransactionsCount: number

  constructor(options: UA.Options);

  register(options?: any): this;

  unregister(options?: any): this;

  isRegistered(): boolean;

  invite(target: string | URI, options?: InviteClientContext.Options, modifiers?: SessionDescriptionHandlerModifiers): InviteClientContext;

  subscribe(target: string | URI, eventPackage: string, options?: any): Subscription;

  publish(target: string, event: string, body: string, options?: any): PublishContext;

  message(target: string | URI, body: string, options?: any): ClientContext;

  request(method: string, target: string | URI, options?: any): ClientContext;

  stop(): this;

  start(): this;

  normalizeTarget(target: string | URI): URI | undefined;

  getLogger(category: string, label?: string): Logger;

  newTransaction(
    transaction: NonInviteClientTransaction |
      InviteClientTransaction |
      InviteServerTransaction |
      NonInviteServerTransaction
  ): void;

  destroyTransaction(
    transaction: NonInviteClientTransaction |
      InviteClientTransaction |
      InviteServerTransaction |
      NonInviteServerTransaction): void;

  findSession(request: IncomingRequest): InviteClientContext | InviteServerContext | undefined

  on(name: 'transportCreated', callback: (transport: any) => void): this;
  on(name: 'newTransaction' | 'transactionDestroyed', callback: (transaction: any) => void): this;
  on(name: 'message', callback: (message: any) => void): this;
  on(name: 'invite', callback: (session: InviteServerContext) => void): this;
  on(name: 'notify', callback: (request: any) => void): this;
  on(name: 'outOfDialogReferRequested', callback: (context: ReferServerContext) => void): this;
  on(name: 'registered', callback: (response?: any) => void): this;
  on(name: 'unregistered' | 'registrationFailed', callback: (response?: any, cause?: any) => void): this;
  on(name: 'inviteSent', callback: (session: InviteClientContext) => void): this;
}

export declare namespace UA {
  interface Options {
    uri?: string | URI;
    allowLegacyNotifications?: boolean;
    allowOutOfDialogRefers?: boolean;
    authenticationFactory?: (ua: UA) => DigestAuthentication | any; // any for custom ones
    authorizationUser?: string;
    autostart?: boolean;
    autostop?: boolean;
    displayName?: string;
    dtmfType?: DtmfType;
    extraSupported?: Array<string>;
    forceRport?: boolean;
    hackIpInContact?: boolean;
    hackAllowUnregisteredOptionTags?: boolean;
    hackViaTcp?: boolean;
    hackWssInTransport?: boolean;
    hostportParams?: any;
    log?: any; // TODO
    noAnswerTimeout?: number;
    password?: string;
    register?: boolean;
    registerOptions?: RegisterOptions;
    rel100?: C.supported;
    replaces?: C.supported;
    sessionDescriptionHandlerFactory?: SessionDescriptionHandlerFactory;
    sessionDescriptionHandlerFactoryOptions?: SessionDescriptionHandlerFactoryOptions;
    sipjsId?: string;
    transportConstructor?: new (logger: any, options: any) => Transport; // TODO
    transportOptions?: any; // TODO
    userAgentString?: string;
    usePreloadedRoute?: boolean;
    viaHost?: string;
  }

  interface RegisterOptions {
    expires?: number;
    extraContactHeaderParams?: Array<string>;
    instanceId?: string;
    params?: any;
    regId?: number;
    registrar?: string;
  }

  enum DtmfType {
    RTP = 'rtp',
    INFO = 'info'
  }
}
