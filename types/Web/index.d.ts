import { SessionDescriptionHandlerModifier } from "../session-description-handler";

export * from "./session-description-handler";

export namespace Web {
  export namespace Modifiers {
    export const addMidLines: SessionDescriptionHandlerModifier;
  }
}