import { useMemo, useState } from "react";
import { parseChallengeHtml, type TreeChild, type TreeElement } from "../xpath/parse-tree";

interface DomExplorerProps {
  html: string;
  matchedIds: Set<string>;
  targetIds: Set<string>;
  isLocked: boolean;
  hoveredId: string | null;
  onHoverNode?: (id: string | null) => void;
}

export function DomExplorer({ html, matchedIds, targetIds, isLocked, hoveredId, onHoverNode }: DomExplorerProps) {
  const tree = useMemo(() => parseChallengeHtml(html), [html]);

  const exactMatch =
    isLocked && matchedIds.size === targetIds.size && matchedIds.size > 0 && [...matchedIds].every((id) => targetIds.has(id));

  return (
    <div className="overflow-auto px-3 py-3 font-mono text-[12.5px] leading-[1.65]">
      <ElementRow
        node={tree}
        depth={0}
        matchedIds={matchedIds}
        exactMatch={exactMatch}
        hoveredId={hoveredId}
        onHoverNode={onHoverNode}
      />
    </div>
  );
}

interface RowProps {
  node: TreeElement;
  depth: number;
  matchedIds: Set<string>;
  exactMatch: boolean;
  hoveredId: string | null;
  onHoverNode?: (id: string | null) => void;
}

function ElementRow({ node, depth, matchedIds, exactMatch, hoveredId, onHoverNode }: RowProps) {
  const [expanded, setExpanded] = useState(true);
  const elementChildren = node.children.filter((c): c is TreeElement => c.kind === "element");
  const textChildren = node.children.filter((c): c is Extract<TreeChild, { kind: "text" }> => c.kind === "text");
  const hasOnlyText = elementChildren.length === 0 && node.children.length > 0;
  const isEmpty = node.children.length === 0;
  const isMatched = node.id !== null && matchedIds.has(node.id);
  const isHovered = node.id !== null && hoveredId === node.id;

  let highlightClass = "";
  if (isMatched && exactMatch) highlightClass = "bg-green/15 text-green rounded px-1 -mx-1";
  else if (isMatched && matchedIds.size === 1) highlightClass = "bg-red/15 text-red rounded px-1 -mx-1";
  else if (isMatched) highlightClass = "bg-amber/15 text-amber rounded px-1 -mx-1";

  const indent = { paddingLeft: depth * 14 };

  const handleMouseEnter = () => {
    if (node.id) onHoverNode?.(node.id);
  };
  const handleMouseLeave = () => onHoverNode?.(null);

  if (isEmpty) {
    return (
      <div
        style={indent}
        className={`whitespace-pre rounded ${isHovered ? "bg-white/5" : ""}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <TagOpen node={node} selfClose highlightClass={highlightClass} />
      </div>
    );
  }

  if (hasOnlyText) {
    return (
      <div
        style={indent}
        className={`whitespace-pre-wrap break-words rounded ${isHovered ? "bg-white/5" : ""}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <TagOpen node={node} highlightClass={highlightClass} />
        <span className="text-text-primary">{textChildren.map((t) => t.value).join("")}</span>
        <TagClose tag={node.tag} />
      </div>
    );
  }

  return (
    <div>
      <div
        style={indent}
        className={`flex cursor-pointer items-start whitespace-pre rounded ${isHovered ? "bg-white/5" : ""}`}
        onClick={() => setExpanded((e) => !e)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span className="mr-1 w-3 shrink-0 text-text-tertiary select-none">{expanded ? "▾" : "▸"}</span>
        <TagOpen node={node} highlightClass={highlightClass} />
      </div>
      {expanded && (
        <>
          {elementChildren.map((child, i) => (
            <ElementRow
              key={child.id ?? i}
              node={child}
              depth={depth + 1}
              matchedIds={matchedIds}
              exactMatch={exactMatch}
              hoveredId={hoveredId}
              onHoverNode={onHoverNode}
            />
          ))}
          <div style={{ paddingLeft: (depth + 1) * 14 }} className="whitespace-pre text-text-tertiary">
            <TagClose tag={node.tag} indentless />
          </div>
        </>
      )}
    </div>
  );
}

function TagOpen({ node, selfClose = false, highlightClass = "" }: { node: TreeElement; selfClose?: boolean; highlightClass?: string }) {
  return (
    <span className={highlightClass}>
      <span className="text-text-tertiary">{"<"}</span>
      <span className="text-violet">{node.tag}</span>
      {node.attrs.map(([k, v]) => (
        <span key={k}>
          {" "}
          <span className="text-cyan">{k}</span>
          <span className="text-text-tertiary">=</span>
          <span className="text-green">"{v}"</span>
        </span>
      ))}
      <span className="text-text-tertiary">{selfClose ? " />" : ">"}</span>
    </span>
  );
}

function TagClose({ tag, indentless = false }: { tag: string; indentless?: boolean }) {
  return (
    <span className={indentless ? "" : "whitespace-pre"}>
      <span className="text-text-tertiary">{"</"}</span>
      <span className="text-violet">{tag}</span>
      <span className="text-text-tertiary">{">"}</span>
    </span>
  );
}
