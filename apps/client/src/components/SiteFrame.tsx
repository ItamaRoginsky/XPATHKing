import { useEffect, useRef, useState } from "react";
import { buildFrameDocument } from "../design/site-theme";
import { NODE_ID_ATTR } from "@xpath-arena/game-engine";

interface SiteFrameProps {
  html: string;
  matchedIds: Set<string>;
  targetIds: Set<string>;
  isLocked: boolean;
  onReady: (doc: Document) => void;
  onHoverNode?: (id: string | null) => void;
}

/**
 * Renders the fictional website in a script-free sandboxed iframe.
 * `sandbox="allow-same-origin"` (no allow-scripts) means the generated
 * markup can never execute JS, while the trusted parent can still read
 * and imperatively highlight the child document via the DOM API.
 */
export function SiteFrame({ html, matchedIds, targetIds, isLocked, onReady, onHoverNode }: SiteFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [doc, setDoc] = useState<Document | null>(null);
  const srcDoc = buildFrameDocument(html);

  useEffect(() => {
    setDoc(null);
  }, [html]);

  const handleLoad = () => {
    const contentDoc = iframeRef.current?.contentDocument ?? null;
    if (!contentDoc) return;
    setDoc(contentDoc);
    onReady(contentDoc);

    if (onHoverNode) {
      contentDoc.body.addEventListener("mouseover", (e) => {
        const target = (e.target as Element)?.closest?.(`[${NODE_ID_ATTR}]`);
        onHoverNode(target ? target.getAttribute(NODE_ID_ATTR) : null);
      });
      contentDoc.body.addEventListener("mouseleave", () => onHoverNode(null));
    }
  };

  useEffect(() => {
    if (!doc) return;
    const all = doc.querySelectorAll(`[${NODE_ID_ATTR}]`);
    all.forEach((el) => el.removeAttribute("data-xa-highlight"));

    const exactMatch =
      isLocked && matchedIds.size === targetIds.size && [...matchedIds].every((id) => targetIds.has(id)) && matchedIds.size > 0;

    matchedIds.forEach((id) => {
      const el = doc.querySelector(`[${NODE_ID_ATTR}="${cssEscape(id)}"]`);
      if (!el) return;
      if (exactMatch) {
        el.setAttribute("data-xa-highlight", "target");
      } else if (matchedIds.size === 1 && !targetIds.has(id)) {
        el.setAttribute("data-xa-highlight", "wrong");
      } else {
        el.setAttribute("data-xa-highlight", "match");
      }
    });
  }, [doc, matchedIds, targetIds, isLocked]);

  return (
    <iframe
      ref={iframeRef}
      title="Simulated website"
      srcDoc={srcDoc}
      onLoad={handleLoad}
      sandbox="allow-same-origin"
      className="h-full w-full border-0 bg-[#0d1119]"
    />
  );
}

function cssEscape(id: string): string {
  return id.replace(/["\\]/g, "\\$&");
}
