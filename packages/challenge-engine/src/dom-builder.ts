export interface VNode {
  id: string;
  tag: string;
  attrs: Record<string, string>;
  children: (VNode | string)[];
}

const VOID_TAGS = new Set(["input", "img", "br", "hr"]);

/**
 * Small hyperscript-style DOM builder. Every element gets a unique,
 * hidden `data-xa-id` so generated challenges can identify "the" target
 * node without the player ever seeing or being able to reference that id.
 */
export class DomBuilder {
  private counter = 0;

  el(tag: string, attrs: Record<string, string | undefined | false> = {}, children: (VNode | string | false | undefined)[] = []): VNode {
    this.counter += 1;
    const cleanAttrs: Record<string, string> = {};
    for (const [k, v] of Object.entries(attrs)) {
      if (typeof v === "string") cleanAttrs[k] = v;
    }
    return {
      id: `n${this.counter}`,
      tag,
      attrs: cleanAttrs,
      children: children.filter((c): c is VNode | string => c !== false && c !== undefined),
    };
  }

  render(root: VNode): string {
    return this.serialize(root);
  }

  private serialize(node: VNode): string {
    const attrPairs = Object.entries(node.attrs)
      .map(([k, v]) => `${k}="${escapeAttr(v)}"`)
      .join(" ");
    const attrString = attrPairs ? ` ${attrPairs}` : "";
    const openTag = `<${node.tag} data-xa-id="${node.id}"${attrString}>`;

    if (VOID_TAGS.has(node.tag)) return openTag.replace(/>$/, " />");

    const inner = node.children
      .map((c) => (typeof c === "string" ? escapeText(c) : this.serialize(c)))
      .join("");
    return `${openTag}${inner}</${node.tag}>`;
  }
}

export function textOf(node: VNode | string): string {
  if (typeof node === "string") return node;
  return node.children.map(textOf).join("");
}

export function findAll(root: VNode, predicate: (n: VNode) => boolean): VNode[] {
  const results: VNode[] = [];
  const walk = (n: VNode) => {
    if (predicate(n)) results.push(n);
    for (const c of n.children) if (typeof c !== "string") walk(c);
  };
  walk(root);
  return results;
}

export function find(root: VNode, predicate: (n: VNode) => boolean): VNode | undefined {
  return findAll(root, predicate)[0];
}

export function descendants(root: VNode): VNode[] {
  return findAll(root, () => true).filter((n) => n.id !== root.id);
}

function escapeAttr(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeText(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
