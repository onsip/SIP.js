import { EventEmitter } from "events";
import { Logger } from "../../../src/core";

type ResolveFunction = () => void;
type RejectFunction = (reason: Error) => void;

export interface EventEmitterEmitSpy extends jasmine.Spy {
  wait(event?: string): Promise<void>;
}

export function makeEventEmitterEmitSpy(emitter: EventEmitter, logger: Logger): EventEmitterEmitSpy {
  let waitingForEmitPromise: Promise<void> | undefined;
  let waitingForEmitResolve: ResolveFunction | undefined;
  let waitingForEmitReject: RejectFunction | undefined;
  let waitingForEvent: string | undefined;

  const emitHappened = (event: string): boolean => {
    if (!waitingForEmitResolve) {
      return false;
    }
    if (waitingForEvent !== undefined && waitingForEvent !== event) {
      return false;
    }
    waitingForEmitResolve();
    waitingForEmitPromise = undefined;
    waitingForEmitResolve = undefined;
    waitingForEmitReject = undefined;
    waitingForEvent = undefined;
    return true;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const emitTimeout = (): void => {
    if (waitingForEmitReject) {
      waitingForEmitReject(new Error("Timed out waiting for emit."));
    }
    waitingForEmitPromise = undefined;
    waitingForEmitResolve = undefined;
    waitingForEmitReject = undefined;
    waitingForEvent = undefined;
  };

  const spy = Object.assign(
    spyOn(emitter, "emit").and.callFake(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (name: string | number, ...args: any[]): boolean => {
        const event = String(name);
        logger.log(`Emitted ${event} [${args.length}]`);
        return emitHappened(event);
      }
    ), {
      wait: async (event?: string): Promise<void> => {
        if (waitingForEmitPromise) {
          throw new Error("Already waiting for emit.");
        }
        waitingForEmitPromise = new Promise<void>((resolve, reject) => {
          waitingForEmitResolve = resolve;
          waitingForEmitReject = reject;
        });
        waitingForEvent = event;
        return waitingForEmitPromise;
      }
    }
  );

  return spy;
}
