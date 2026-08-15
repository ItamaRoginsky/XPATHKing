import type { SeededRandom } from "@xpath-arena/game-engine";
import { DomBuilder, type VNode } from "../dom-builder";
import { CATEGORIES, PRODUCT_NAMES, STATUSES, priceFor } from "../data-pools";

export interface ProductRef {
  node: VNode;
  nameNode: VNode;
  priceNode: VNode;
  statusNode: VNode;
  buyButton: VNode;
  name: string;
  price: string;
  category: string;
  status: (typeof STATUSES)[number];
  featured: boolean;
}

export interface EcommerceScene {
  root: VNode;
  builder: DomBuilder;
  products: ProductRef[];
  loginButton: VNode;
  searchInput: VNode;
  cartButton: VNode;
  navLinks: VNode[];
}

function randomHex(rng: SeededRandom, len: number): string {
  let out = "";
  const chars = "0123456789abcdef";
  for (let i = 0; i < len; i++) out += chars[rng.int(0, chars.length - 1)];
  return out;
}

export function buildEcommerceScene(
  rng: SeededRandom,
  opts: { productCount?: number; useDynamicIds?: boolean; forceStatus?: { index: number; status: (typeof STATUSES)[number] } } = {},
): EcommerceScene {
  const b = new DomBuilder();
  const productCount = opts.productCount ?? rng.int(5, 8);
  const useDynamicIds = opts.useDynamicIds ?? false;

  const names = rng.shuffle(PRODUCT_NAMES).slice(0, productCount);
  const categories = CATEGORIES;

  const featuredIndex = rng.int(0, names.length - 1);

  const productRefs: ProductRef[] = [];
  const byCategory = new Map<string, VNode[]>();

  names.forEach((name, i) => {
    const category = rng.pick(categories);
    const status = opts.forceStatus && opts.forceStatus.index === i ? opts.forceStatus.status : rng.pick(STATUSES);
    const price = priceFor(rng);
    const featured = i === featuredIndex;

    const nameNode = b.el("h3", { class: "product-name" }, [name]);
    const priceNode = b.el("span", { class: "price" }, [price]);
    const statusClass = status.toLowerCase().replace(/\s+/g, "-");
    const statusNode = b.el("span", { class: `badge badge-${statusClass}` }, [status]);
    const buyDisabled = status === "Sold Out";
    const buyButton = b.el(
      "button",
      {
        class: `btn buy-btn${buyDisabled ? " disabled" : ""}`,
        type: "button",
        "data-action": "buy",
        disabled: buyDisabled ? "disabled" : undefined,
      },
      ["Buy Now"],
    );

    const cardAttrs: Record<string, string | undefined> = {
      class: `product-card${featured ? " featured" : ""}`,
      "data-status": statusClass,
    };
    if (useDynamicIds) cardAttrs.id = `product-${randomHex(rng, 8)}`;

    const card = b.el("article", cardAttrs, [nameNode, priceNode, statusNode, buyButton]);

    productRefs.push({
      node: card,
      nameNode,
      priceNode,
      statusNode,
      buyButton,
      name,
      price,
      category,
      status,
      featured,
    });

    const bucket = byCategory.get(category) ?? [];
    bucket.push(card);
    byCategory.set(category, bucket);
  });

  const sections = [...byCategory.entries()].map(([category, cards]) =>
    b.el("section", { class: "category", "data-category": category }, [
      b.el("h2", {}, [category]),
      b.el("div", { class: "products" }, cards),
    ]),
  );

  const navLinks = ["Home", "Deals", "Support"].map((label) =>
    b.el("a", { href: "#", class: "nav-link" }, [label]),
  );

  const searchInput = b.el("input", {
    class: "search-input",
    type: "text",
    name: "search",
    placeholder: "Search products",
  });

  const loginButton = b.el("button", { id: "login-btn", class: "btn btn-primary", type: "button" }, ["Login"]);
  const cartButton = b.el("button", { class: "cart-icon", type: "button", "data-action": "cart" }, ["Cart (0)"]);

  const header = b.el("header", { class: "site-header" }, [
    b.el("div", { class: "brand" }, ["NovaCart"]),
    b.el("nav", { class: "nav-links" }, navLinks),
    searchInput,
    loginButton,
    cartButton,
  ]);

  const footer = b.el("footer", { class: "site-footer" }, [
    b.el("a", { href: "#", class: "footer-link" }, ["Privacy"]),
    b.el("a", { href: "#", class: "footer-link" }, ["Terms"]),
  ]);

  const root = b.el("div", { class: "storefront" }, [
    header,
    b.el("main", { class: "catalog" }, sections),
    footer,
  ]);

  return { root, builder: b, products: productRefs, loginButton, searchInput, cartButton, navLinks };
}
