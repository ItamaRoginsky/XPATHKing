import { JSDOM } from "jsdom";
import { gradeSubmission } from "@xpath-arena/game-engine";
import type { Challenge, SubmissionResult } from "@xpath-arena/shared";

/**
 * Server-side authoritative grading, using the exact same gradeSubmission
 * logic the client uses for live feedback — jsdom implements the same
 * standards-compliant document.evaluate the browser does. The client's
 * own grading is only ever used for instant UI feedback; this is what
 * actually decides the round.
 */
export function gradeOnServer(challenge: Challenge, xpath: string): SubmissionResult {
  const dom = new JSDOM(`<!doctype html><html><body>${challenge.html}</body></html>`);
  const doc = dom.window.document;
  return gradeSubmission(doc, doc, xpath, challenge);
}
