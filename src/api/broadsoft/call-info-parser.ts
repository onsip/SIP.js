/**
 * Call-Info Header Parser
 *
 * Utilities for parsing BroadSoft Call-Info headers with answer-after parameter.
 */

import { IncomingRequestMessage } from "../../core/messages/incoming-request-message.js";
import { CallInfoHeader } from "./types.js";

/**
 * Parse a single Call-Info header value
 *
 * Call-Info format: <uri>; param1=value1; param2=value2
 * Example: <sip:example.com>; answer-after=1
 *
 * @param headerValue - Raw Call-Info header value
 * @returns Parsed CallInfoHeader object
 */
export function parseCallInfoHeader(headerValue: string): CallInfoHeader | undefined {
  if (!headerValue) {
    return undefined;
  }

  // Extract URI (between < and >)
  const uriMatch = headerValue.match(/<([^>]+)>/);
  if (!uriMatch) {
    return undefined;
  }

  const uri = uriMatch[1];
  const params: { [key: string]: string | number | boolean } = {};

  // Extract parameters after the URI
  const matchIndex = uriMatch.index !== undefined ? uriMatch.index : 0;
  const paramsString = headerValue.substring(matchIndex + uriMatch[0].length);

  // Split by semicolon and parse each parameter
  const paramPairs = paramsString.split(";");

  for (const pair of paramPairs) {
    const trimmed = pair.trim();
    if (!trimmed) {
      continue;
    }

    const equalIndex = trimmed.indexOf("=");
    if (equalIndex === -1) {
      // Parameter without value (flag)
      params[trimmed] = true;
    } else {
      const key = trimmed.substring(0, equalIndex).trim();
      let value: string | number = trimmed.substring(equalIndex + 1).trim();

      // Remove quotes if present
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.substring(1, value.length - 1);
      }

      // Convert to number if applicable
      if (key.toLowerCase() === "answer-after") {
        // Strict parse: a non-negative integer only. Lenient parsing (parseInt) would
        // turn malformed values like "1abc", "-5" or "1.9" into delays; if the value
        // does not conform, the parameter is ignored (no auto-answer). If the parameter
        // appears more than once in a header, the last conforming value wins.
        if (/^\d+$/.test(value)) {
          params.answerAfter = parseInt(value, 10);
        }
      } else {
        // Try to parse as number, otherwise keep as string
        const numValue = parseFloat(value as string);
        params[key] = isNaN(numValue) ? value : numValue;
      }
    }
  }

  return { uri, params };
}

/**
 * Extract all Call-Info headers from an incoming request
 *
 * @param request - Incoming SIP request message
 * @returns Array of parsed CallInfoHeader objects
 */
export function extractCallInfoHeaders(request: IncomingRequestMessage): CallInfoHeader[] {
  const headers: CallInfoHeader[] = [];

  try {
    const callInfoHeaders = request.getHeaders("call-info");

    for (const headerValue of callInfoHeaders) {
      const parsed = parseCallInfoHeader(headerValue);
      if (parsed) {
        headers.push(parsed);
      }
    }
  } catch (e) {
    // Header not present or parse error
    return headers;
  }

  return headers;
}

/**
 * Check if a request has auto-answer enabled via Call-Info header
 *
 * @param request - Incoming SIP request message
 * @returns Answer-after delay in seconds, or undefined if not present
 */
export function getAutoAnswerDelay(request: IncomingRequestMessage): number | undefined {
  const callInfoHeaders = extractCallInfoHeaders(request);

  for (const header of callInfoHeaders) {
    if (header.params.answerAfter !== undefined) {
      return header.params.answerAfter;
    }
  }

  return undefined;
}

/**
 * Check if auto-answer is requested (answer-after parameter is present)
 *
 * @param request - Incoming SIP request message
 * @returns True if auto-answer is requested
 */
export function hasAutoAnswer(request: IncomingRequestMessage): boolean {
  return getAutoAnswerDelay(request) !== undefined;
}
