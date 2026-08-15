import type { Challenge, SubmissionResult } from "@xpath-arena/shared";
import { evaluateXPath } from "./xpath-evaluator";
import { analyzeXPathQuality } from "./quality-analyzer";

export function checkRuleViolations(xpath: string, challenge: Challenge): string[] {
  const violations: string[] = [];
  for (const rule of challenge.rules) {
    switch (rule.kind) {
      case "forbid-attribute": {
        const pattern = new RegExp(`@${escapeRegex(rule.attribute)}\\b`);
        if (pattern.test(xpath)) violations.push(rule.reason);
        break;
      }
      case "forbid-index": {
        if (/\[\s*\d+\s*\]/.test(xpath)) violations.push(rule.reason);
        break;
      }
      case "forbid-absolute-path": {
        if (/^\/(html|body)\b/i.test(xpath)) violations.push(rule.reason);
        break;
      }
      case "max-length": {
        if (xpath.trim().length > rule.length) violations.push(rule.reason);
        break;
      }
      case "require-axis": {
        const pattern = new RegExp(`\\b${escapeRegex(rule.axis)}::`);
        if (!pattern.test(xpath)) violations.push(rule.reason);
        break;
      }
    }
  }
  return violations;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function gradeSubmission(
  doc: Document,
  contextNode: Node,
  xpath: string,
  challenge: Challenge,
): SubmissionResult {
  const evaluation = evaluateXPath(doc, contextNode, xpath);

  if (!evaluation.ok) {
    return {
      correct: false,
      exactMatch: false,
      matchedNodeIds: [],
      quality: analyzeXPathQuality({ xpath }),
      ruleViolations: [],
    };
  }

  const ruleViolations = checkRuleViolations(xpath, challenge);

  const matchedSet = new Set(evaluation.matchedNodeIds);
  const targetSet = new Set(challenge.targetNodeIds);
  const exactMatch =
    matchedSet.size === targetSet.size && [...matchedSet].every((id) => targetSet.has(id));

  const correct = exactMatch && ruleViolations.length === 0;

  return {
    correct,
    exactMatch,
    matchedNodeIds: evaluation.matchedNodeIds,
    quality: analyzeXPathQuality({ xpath, ruleViolations }),
    ruleViolations,
  };
}
