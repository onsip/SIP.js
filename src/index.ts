export {
  DigestAuthentication,
  IncomingRequestMessage as IncomingRequest,
  IncomingResponseMessage as IncomingResponse,
  NameAddrHeader,
  OutgoingRequestMessage as OutgoingRequest,
  Timers,
  Transport,
  URI
} from "./core";

export { ClientContext } from "./ClientContext";
export { C } from "./Constants";
export {
  DialogStatus,
  SessionStatus,
  TypeStrings,
  UAStatus
} from "./Enums";
export { Exceptions } from "./Exceptions";
export { Grammar } from "./Grammar";
export { LoggerFactory } from "./LoggerFactory";
export { Parser } from "./Parser";
export { PublishContext } from "./PublishContext";
export {
  ReferClientContext,
  ReferServerContext
} from "./ReferContext";
export { RegisterContext } from "./RegisterContext";
export { ServerContext } from "./ServerContext";
export {
  InviteClientContext,
  InviteServerContext,
  Session
} from "./Session";
export {
  SessionDescriptionHandlerFactory,
  SessionDescriptionHandlerFactoryOptions
} from "./session-description-handler-factory";
export {
  SessionDescriptionHandler,
  SessionDescriptionHandlerModifier,
  SessionDescriptionHandlerModifiers,
  SessionDescriptionHandlerOptions
} from "./session-description-handler";
export { Subscription } from "./Subscription";

import {
  InviteClientTransaction,
  InviteServerTransaction,
  NonInviteClientTransaction,
  NonInviteServerTransaction
} from "./core/transactions";
const Transactions = {
  InviteClientTransaction,
  InviteServerTransaction,
  NonInviteClientTransaction,
  NonInviteServerTransaction
};
export { Transactions };

export { makeUserAgentCoreConfigurationFromUA, UA } from "./UA";
export { Utils } from "./Utils";

import * as Web from "./Web/index";
export { Web };

// tslint:disable-next-line:no-var-requires
const pkg = require("../package.json");
const name = pkg.title;
const version = pkg.version;

export {
  name,
  version
};

import * as Core from "./core/index";
export { Core };
