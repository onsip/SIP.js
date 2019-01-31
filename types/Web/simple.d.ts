import { EventEmitter } from "events";

import { Logger } from "../logger-factory";
import { InviteClientContext, InviteServerContext } from "../session";
import { UA } from "../ua";
import { WebSessionDescriptionHandler as SessionDescriptionHandler } from "./session-description-handler";

export const SimpleStatus: {[name: string]: number};
export type SimpleStatus = any;


export class Simple extends EventEmitter {
  static readonly C: SimpleStatus;

  video: boolean;
  audio: boolean;
  anonymous: boolean;
  options: any;
  ua: UA;
  state: SimpleStatus;
  logger: Logger;
  session: InviteClientContext | InviteServerContext | undefined;

  constructor(options: any);

  call(destination: string): InviteClientContext | InviteServerContext | void;
  answer(): InviteServerContext | void;
  reject(): InviteServerContext | undefined;
  hangup(): InviteClientContext | InviteServerContext | undefined;
  hold(): InviteClientContext | InviteServerContext | void;
  unhold(): InviteClientContext | InviteServerContext | void;
  mute(): void;
  unmute(): void;
  sendDTMF(tone: string): void;
  message(destination: string, message: string): void;
}
