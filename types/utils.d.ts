import { SessionDescriptionHandlerModifier } from "./session-description-handler";
import { URI } from "./uri";

export declare namespace Utils {
  export interface Deferred<T> {
    promise: Promise<T>;
    resolve: () => T;
    reject: () => T;
  }

  export function reducePromises(arr: Array<SessionDescriptionHandlerModifier>, val: any): Promise<any>;
  export function str_utf8_length(str: string): number;
  export function generateFakeSDP(body: string): string | undefined;
  export function isDecimal(num: string): boolean;
  export function createRandomToken(size: number, base?: number): string;
  export function newTag(): string;
  export function newUUID(): string;
  export function normalizeTarget(target: string | URI, domain?: string): URI | undefined;
  export function escapeUser(user: string): string;
  export function headerize(str: string): string;
  export function sipErrorCause(statusCode: number): string;
  export function getReasonPhrase(code: number, specific?: string): string;
  export function getReasonHeaderValue(code: number, reason?: string): string;
  export function getCancelReason(code: number, reason: string): string | undefined;
  export function buildStatusLine(code: number, reason?: string): string;
}
