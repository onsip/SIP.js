import { TypeStrings } from "./Enums";
import { InviteClientContext, InviteServerContext } from "./Session";
export declare class SessionDescriptionHandlerObserver {
    type: TypeStrings;
    constructor(session: InviteClientContext | InviteServerContext, options: any);
    trackAdded(): void;
    directionChanged(): void;
}
