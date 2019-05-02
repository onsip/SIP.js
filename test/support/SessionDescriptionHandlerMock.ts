import { InviteClientContext, InviteServerContext } from "../../src/Session";
import { BodyObj, SessionDescriptionHandler } from "../../src/session-description-handler";
import {
  SessionDescriptionHandlerFactory,
  SessionDescriptionHandlerFactoryOptions
} from "../../src/session-description-handler-factory";

export function makeMockSessionDescriptionHandler(name: string): jasmine.SpyObj<SessionDescriptionHandler> {
  let state: "stable" | "has-local-offer" | "has-remote-offer" = "stable";
  const sdh = jasmine.createSpyObj<SessionDescriptionHandler>("SessionDescriptionHandler", [
    "close",
    "getDescription",
    "hasDescription",
    "holdModifier",
    "setDescription",
    "sendDtmf"
  ]);
  sdh.getDescription.and.callFake(() => {
    const fromState = state;
    const contentType = "application/sdp";
    let body: string;
    switch (state) {
      case "stable":
        state = "has-local-offer";
        body = "SDP OFFER";
        break;
      case "has-local-offer":
        throw new Error(`getDescription[${name}] ${fromState} => ${state} Invalid SDH state transition`);
      case "has-remote-offer":
        state = "stable";
        body = "SDP ANSWER";
        break;
      default:
        throw new Error("Unknown SDH state");
    }
    // console.warn(`getDescription[${name}] ${fromState} => ${state}`);
    const bodyObj: BodyObj = { contentType, body};
    return Promise.resolve().then(() => {
      return bodyObj;
    });
  });
  sdh.hasDescription.and.callFake((contentType: string): boolean => contentType === "application/sdp");
  sdh.setDescription.and.callFake(() => {
    const fromState = state;
    switch (state) {
      case "stable":
        state = "has-remote-offer";
        break;
      case "has-local-offer":
        state = "stable";
        break;
      case "has-remote-offer":
        throw new Error(`setDescription[${name}] ${fromState} => ${state} Invalid SDH state transition`);
      default:
        throw new Error("Unknown SDH state");
    }
    // console.warn(`setDescription[${name}] ${fromState} => ${state}`);
    return Promise.resolve().then(() => {
      return;
    });
  });
  return sdh;
}

export function makeMockSessionDescriptionHandlerFactory(name: string): SessionDescriptionHandlerFactory {
  const factory = (
    session: InviteClientContext | InviteServerContext,
    options?: SessionDescriptionHandlerFactoryOptions
  ): jasmine.SpyObj<SessionDescriptionHandler> => {
    return makeMockSessionDescriptionHandler(name);
  };
  return factory;
}
