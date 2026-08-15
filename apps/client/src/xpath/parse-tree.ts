export interface TreeElement {
  kind: "element";
  id: string | null;
  tag: string;
  attrs: [string, string][];
  children: TreeChild[];
}

export interface TreeText {
  kind: "text";
  value: string;
}

export type TreeChild = TreeElement | TreeText;

const HIDDEN_ATTR = "data-xa-id";

export function parseChallengeHtml(html: string): TreeElement {
  const template = document.createElement("template");
  template.innerHTML = html;
  const root = template.content.firstElementChild;
  if (!root) {
    return { kind: "element", id: null, tag: "div", attrs: [], children: [] };
  }
  return elementToTree(root);
}

function elementToTree(el: Element): TreeElement {
  const attrs: [string, string][] = [];
  for (const attr of Array.from(el.attributes)) {
    if (attr.name === HIDDEN_ATTR) continue;
    attrs.push([attr.name, attr.value]);
  }

  const children: TreeChild[] = [];
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      children.push(elementToTree(node as Element));
    } else if (node.nodeType === Node.TEXT_NODE) {
      const value = node.textContent ?? "";
      if (value.trim().length > 0) children.push({ kind: "text", value });
    }
  }

  return {
    kind: "element",
    id: el.getAttribute(HIDDEN_ATTR),
    tag: el.tagName.toLowerCase(),
    attrs,
    children,
  };
}
