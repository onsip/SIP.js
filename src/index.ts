export { ClientContext } from "./ClientContext";
export { C } from "./Constants";
export { Dialog } from "./Dialogs";
export { DigestAuthentication } from "./DigestAuthentication";
export {
  DialogStatus,
  SessionStatus,
  TransactionStatus,
  TypeStrings,
  UAStatus
} from "./Enums";
export { Exceptions } from "./Exceptions";
export { Grammar } from "./Grammar";
export { LoggerFactory } from "./LoggerFactory";
export { NameAddrHeader } from "./NameAddrHeader";
export { Parser } from "./Parser";
export { PublishContext } from "./PublishContext";
export { RegisterContext } from "./RegisterContext";
export { RequestSender } from "./RequestSender";

import { SanityCheck } from "./SanityCheck";
const sanityCheck = SanityCheck.sanityCheck;
export { sanityCheck };

export { ServerContext } from "./ServerContext";
export { InviteClientContext, InviteServerContext, ReferClientContext, ReferServerContext, Session } from "./Session";
export { IncomingRequest, IncomingResponse, OutgoingRequest } from "./SIPMessage";
export { Subscription } from "./Subscription";
export { Timers } from "./Timers";

import {
  AckClientTransaction,
  checkTransaction,
  InviteClientTransaction,
  InviteServerTransaction,
  NonInviteClientTransaction,
  NonInviteServerTransaction
} from "./Transactions";
const Transactions = {
  AckClientTransaction,
  checkTransaction,
  InviteClientTransaction,
  InviteServerTransaction,
  NonInviteClientTransaction,
  NonInviteServerTransaction
};
export { Transactions };

export { Transport } from "./Transport";
export { UA } from "./UA";
export { URI } from "./URI";
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
