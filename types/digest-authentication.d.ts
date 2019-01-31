import { OutgoingRequest } from "./sip-message";
import { UA } from "./ua";
import { URI } from "./uri";

import { TypeStrings } from "./enums";

export declare class DigestAuthentication {
  type: TypeStrings;
  stale: boolean | undefined;

  constructor(ua: UA);
  authenticate(request: OutgoingRequest, challenge: any, body?: string): boolean;
  toString(): string;
}