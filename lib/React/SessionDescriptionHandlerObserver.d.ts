import { TypeStrings } from "../Enums";
import { InviteClientContext, InviteServerContext } from "../Session";
export declare class SessionDescriptionHandlerObserver {
    type: TypeStrings;
    private session;
    private options;
    constructor(session: InviteClientContext | InviteServerContext, options: any);
    trackAdded(): void;
    directionChanged(): void;
}
//# sourceMappingURL=SessionDescriptionHandlerObserver.d.ts.map