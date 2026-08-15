import type { SeededRandom } from "@xpath-arena/game-engine";
import { DomBuilder, type VNode } from "../dom-builder";
import { FIRST_NAMES, LAST_NAMES, ROLES, emailFor } from "../data-pools";

export interface MemberRef {
  row: VNode;
  nameNode: VNode;
  emailNode: VNode;
  roleNode: VNode;
  editButton: VNode;
  deleteButton: VNode;
  name: string;
  email: string;
  role: (typeof ROLES)[number];
  online: boolean;
}

export interface DirectoryScene {
  root: VNode;
  builder: DomBuilder;
  members: MemberRef[];
  addButton: VNode;
  filterInput: VNode;
}

export function buildDirectoryScene(rng: SeededRandom, opts: { memberCount?: number } = {}): DirectoryScene {
  const b = new DomBuilder();
  const memberCount = opts.memberCount ?? rng.int(6, 9);

  const usedNames = new Set<string>();
  const members: MemberRef[] = [];
  const rows: VNode[] = [];

  while (members.length < memberCount) {
    const first = rng.pick(FIRST_NAMES);
    const last = rng.pick(LAST_NAMES);
    const fullName = `${first} ${last}`;
    if (usedNames.has(fullName)) continue;
    usedNames.add(fullName);

    const email = emailFor(first, last);
    const role = rng.pick(ROLES);
    const online = rng.bool(0.5);

    const nameNode = b.el("span", { class: "member-name" }, [fullName]);
    const emailNode = b.el("small", { class: "member-email" }, [email]);
    const roleNode = b.el("span", { class: `role-badge role-${role.toLowerCase()}` }, [role]);
    const statusDot = b.el("span", { class: `status-dot ${online ? "online" : "offline"}` }, []);

    const editButton = b.el("button", { class: "action edit-btn", type: "button", "data-action": "edit" }, ["Edit"]);
    const deleteButton = b.el(
      "button",
      { class: "action delete-btn danger", type: "button", "data-action": "delete" },
      ["Delete"],
    );

    const row = b.el("tr", { class: "member-row", "data-role": role.toLowerCase() }, [
      b.el("td", {}, [nameNode]),
      b.el("td", {}, [emailNode]),
      b.el("td", {}, [roleNode]),
      b.el("td", { class: "status-cell" }, [statusDot, online ? " Online" : " Offline"]),
      b.el("td", { class: "actions-cell" }, [editButton, deleteButton]),
    ]);

    members.push({ row, nameNode, emailNode, roleNode, editButton, deleteButton, name: fullName, email, role, online });
    rows.push(row);
  }

  const filterInput = b.el("input", { class: "search-input", type: "text", name: "filter", placeholder: "Filter members" });
  const addButton = b.el("button", { class: "btn btn-primary", type: "button" }, ["Add Member"]);

  const table = b.el("table", { class: "member-table" }, [
    b.el("thead", {}, [
      b.el("tr", {}, [
        b.el("th", {}, ["Name"]),
        b.el("th", {}, ["Email"]),
        b.el("th", {}, ["Role"]),
        b.el("th", {}, ["Status"]),
        b.el("th", {}, ["Actions"]),
      ]),
    ]),
    b.el("tbody", {}, rows),
  ]);

  const root = b.el("div", { class: "directory" }, [
    b.el("div", { class: "toolbar" }, [filterInput, addButton]),
    table,
  ]);

  return { root, builder: b, members, addButton, filterInput };
}
