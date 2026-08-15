import type { SeededRandom } from "@xpath-arena/game-engine";
import { DomBuilder, type VNode } from "../dom-builder";

export interface FieldRef {
  wrapper: VNode;
  label: VNode;
  input: VNode;
  labelText: string;
  inputType: string;
  required: boolean;
  name: string;
}

export interface FormScene {
  root: VNode;
  builder: DomBuilder;
  fields: FieldRef[];
  submitButton: VNode;
  secondaryButton: VNode;
}

const FIELD_DEFS = [
  { label: "Full Name", name: "fullname", type: "text", required: true },
  { label: "Username", name: "username", type: "text", required: true },
  { label: "Email", name: "email", type: "email", required: true },
  { label: "Password", name: "password", type: "password", required: true },
  { label: "Phone Number", name: "phone", type: "tel", required: false },
  { label: "Promo Code", name: "promo", type: "text", required: false },
] as const;

export function buildFormScene(rng: SeededRandom, opts: { fieldCount?: number } = {}): FormScene {
  const b = new DomBuilder();
  const fieldCount = opts.fieldCount ?? rng.int(4, 5);
  const defs = rng.shuffle(FIELD_DEFS).slice(0, fieldCount);
  const alwaysInclude = FIELD_DEFS.find((d) => d.name === "password")!;
  if (!defs.some((d) => d.name === "password")) defs[defs.length - 1] = alwaysInclude;

  const fields: FieldRef[] = defs.map((def, i) => {
    const fieldId = `${def.name}-field-${i}`;
    const label = b.el("label", { for: fieldId }, [def.label]);
    const input = b.el("input", {
      id: fieldId,
      name: def.name,
      type: def.type,
      required: def.required ? "required" : undefined,
      placeholder: def.label,
    });
    const wrapper = b.el("div", { class: "field" }, [label, input]);
    return { wrapper, label, input, labelText: def.label, inputType: def.type, required: def.required, name: def.name };
  });

  const submitButton = b.el("button", { type: "submit", class: "btn btn-primary", id: "submit-btn" }, ["Login"]);
  const secondaryButton = b.el("button", { type: "button", class: "btn btn-link" }, ["Forgot password?"]);

  const root = b.el("form", { class: "login-form" }, [
    ...fields.map((f) => f.wrapper),
    b.el("div", { class: "form-actions" }, [submitButton, secondaryButton]),
  ]);

  return { root, builder: b, fields, submitButton, secondaryButton };
}
