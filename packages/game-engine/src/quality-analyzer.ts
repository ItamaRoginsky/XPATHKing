import type { QualityReport, QualityTier } from "@xpath-arena/shared";

const STABLE_ATTR_PATTERN = /@(data-testid|data-test|data-qa|id|name|aria-[\w-]+|role|type|href)\b/g;
const GENERATED_LOOKING_VALUE = /['"]([a-f0-9]{8,}|[a-z0-9]+-[a-f0-9]{6,}|\d{6,})['"]/i;
const INDEX_PATTERN = /\[\s*(\d+)\s*\]/g;
const TEXT_ANCHOR_PATTERN = /\b(text\(\)|normalize-space\(|contains\(\s*\.?,|contains\(\s*text\(\))/;
const CLASS_ATTR_PATTERN = /@class\b/g;

export interface QualityInput {
  xpath: string;
  /** true when the challenge explicitly forbids one or more attributes/patterns that were used */
  ruleViolations?: string[];
}

/**
 * Heuristic (not "provably optimal") scoring of a XPath expression's
 * real-world robustness. Mirrors the intuition a senior test-automation
 * engineer would apply during code review.
 */
export function analyzeXPathQuality(input: QualityInput): QualityReport {
  const xpath = input.xpath.trim();
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 68;

  const isAbsolute = /^\/(html|body)\b/i.test(xpath) || /^\/[a-zA-Z]/.test(xpath);
  if (isAbsolute) {
    score -= 28;
    warnings.push("Absolute DOM path — breaks if page structure shifts");
  } else if (xpath.startsWith("//")) {
    reasons.push("Anchored with // instead of a brittle absolute path");
    score += 6;
  }

  const indexMatches = [...xpath.matchAll(INDEX_PATTERN)];
  if (indexMatches.length > 0) {
    const penalty = Math.min(30, indexMatches.length * 15);
    score -= penalty;
    warnings.push(
      indexMatches.length === 1
        ? "Uses a positional index — depends on element order"
        : "Uses multiple positional indexes — very order-dependent",
    );
  }

  const stableAttrMatches = [...xpath.matchAll(STABLE_ATTR_PATTERN)];
  if (stableAttrMatches.length > 0) {
    score += Math.min(18, stableAttrMatches.length * 9);
    reasons.push("Uses a stable, semantic attribute");
  }

  if (CLASS_ATTR_PATTERN.test(xpath) && stableAttrMatches.length === 0) {
    score += 3;
    reasons.push("Uses class as a selector anchor");
    warnings.push("Class names can change with styling refactors");
  }

  if (TEXT_ANCHOR_PATTERN.test(xpath)) {
    score += 12;
    reasons.push("Anchors on visible text content");
  }

  const generatedValueMatch = xpath.match(GENERATED_LOOKING_VALUE);
  if (generatedValueMatch) {
    score -= 20;
    warnings.push("Value looks auto-generated — may not be stable across runs");
  }

  const wildcardCount = (xpath.match(/\/\/\*/g) ?? []).length;
  if (wildcardCount > 0) {
    score -= wildcardCount * 6;
    warnings.push("Broad wildcard (//*) widens the search unnecessarily");
  }

  if (xpath.length <= 45) {
    score += 6;
    reasons.push("Short, readable expression");
  } else if (xpath.length > 110) {
    score -= 10;
    warnings.push("Long expression — harder to maintain");
  }

  const ancestryDepth = (xpath.match(/\//g) ?? []).length;
  if (ancestryDepth >= 8) {
    score -= 8;
    warnings.push("Deep ancestry chain — fragile to DOM restructuring");
  }

  if (input.ruleViolations && input.ruleViolations.length > 0) {
    score -= 30;
    warnings.push(...input.ruleViolations);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  if (reasons.length === 0) reasons.push("Selector works, but leans on structural position");

  return { score, tier: tierFor(score), reasons, warnings };
}

function tierFor(score: number): QualityTier {
  if (score >= 90) return "legendary";
  if (score >= 75) return "excellent";
  if (score >= 60) return "clean";
  if (score >= 40) return "valid";
  return "fragile";
}
