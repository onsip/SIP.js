import { TypeStrings } from "./Enums";
import { InviteClientContext, InviteServerContext } from "./Session";

export declare class SessionDescriptionHandlerObserver {
  public type: TypeStrings;

  constructor(session: InviteClientContext | InviteServerContext, options: any);

  public trackAdded(): void;
  public directionChanged(): void;
}
