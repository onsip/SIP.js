import { Body } from "./core/messages/body";
import { URI } from "./core/messages/uri";
import { BodyObj, SessionDescriptionHandlerModifier } from "./session-description-handler";
export declare namespace Utils {
    interface Deferred<T> {
        promise: Promise<T>;
        resolve: () => T;
        reject: () => T;
    }
    function defer(): Deferred<any>;
    function reducePromises(arr: Array<SessionDescriptionHandlerModifier>, val: any): Promise<any>;
    function str_utf8_length(str: string): number;
    function generateFakeSDP(body: string): string | undefined;
    function isDecimal(num: string): boolean;
    function createRandomToken(size: number, base?: number): string;
    function newTag(): string;
    function newUUID(): string;
    function normalizeTarget(target: string | URI, domain?: string): URI | undefined;
    function escapeUser(user: string): string;
    function headerize(str: string): string;
    function sipErrorCause(statusCode: number): string;
    function getReasonPhrase(code: number, specific?: string): string;
    function getReasonHeaderValue(code: number, reason?: string): string;
    function getCancelReason(code: number, reason: string): string | undefined;
    function buildStatusLine(code: number, reason?: string): string;
    /**
     * Create a Body given a BodyObj.
     * @param bodyObj Body Object
     */
    function fromBodyObj(bodyObj: BodyObj): Body;
    /**
     * Create a BodyObj given a Body.
     * @param bodyObj Body Object
     */
    function toBodyObj(body: Body): BodyObj;
}
//# sourceMappingURL=Utils.d.ts.map