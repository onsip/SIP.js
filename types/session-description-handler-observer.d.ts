import { Session, InviteClientContext, InviteServerContext } from "./session";

import { TypeStrings } from "./enums";

export declare class SessionDescriptionHandlerObserver {
  type: TypeStrings;

  constructor(session: InviteClientContext | InviteServerContext, options: any);

  trackAdded(): void;
  directionChanged(): void;
}