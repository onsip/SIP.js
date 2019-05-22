import { TypeStrings } from "../Enums";
import { InviteClientContext, InviteServerContext } from "../Session";
import { SessionDescriptionHandlerObserver as SessionDescriptionHandlerObserverDefinition } from "../session-description-handler-observer";
export declare class SessionDescriptionHandlerObserver implements SessionDescriptionHandlerObserverDefinition {
    type: TypeStrings;
    private session;
    private options;
    constructor(session: InviteClientContext | InviteServerContext, options: any);
    trackAdded(): void;
    directionChanged(): void;
}
