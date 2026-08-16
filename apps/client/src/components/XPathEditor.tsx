import { useEffect, useRef } from "react";
import { EditorState, Compartment } from "@codemirror/state";
import { EditorView, keymap, placeholder as placeholderExt } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/autocomplete";
import { xpathStreamLanguage, xpathSyntaxHighlighting, xpathAutocomplete } from "../xpath/xpath-language";

export interface XPathEditorHandle {
  focus: () => void;
}

interface XPathEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onHintRequest?: () => void;
  autocompleteEnabled?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const baseTheme = EditorView.theme({
  "&": {
    fontSize: "16px",
    backgroundColor: "transparent",
    color: "#f0f3fa",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-content": {
    fontFamily: "var(--font-mono)",
    padding: "14px 4px",
    caretColor: "#4fd8ff",
  },
  ".cm-line": { padding: "0" },
  ".cm-cursor": { borderLeftColor: "#4fd8ff", borderLeftWidth: "2px" },
  ".cm-placeholder": { color: "#5c657c", fontStyle: "normal" },
  "&.cm-editor": { overflow: "hidden" },
  ".cm-scroller": { overflowX: "auto", overflowY: "hidden" },
  ".cm-tooltip-autocomplete": {
    backgroundColor: "#131a2a",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "10px",
    overflow: "hidden",
    fontFamily: "var(--font-mono)",
    fontSize: "13px",
  },
  ".cm-tooltip-autocomplete ul li[aria-selected]": {
    backgroundColor: "rgba(79,216,255,0.15)",
    color: "#f0f3fa",
  },
});

export function XPathEditor({
  value,
  onChange,
  onSubmit,
  onHintRequest,
  autocompleteEnabled = true,
  disabled = false,
  placeholder = "//",
}: XPathEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const onSubmitRef = useRef(onSubmit);
  const onHintRef = useRef(onHintRequest);
  const autocompleteCompartment = useRef(new Compartment());
  const editableCompartment = useRef(new Compartment());

  onChangeRef.current = onChange;
  onSubmitRef.current = onSubmit;
  onHintRef.current = onHintRequest;

  useEffect(() => {
    if (!containerRef.current) return;

    // stopPropagation is essential here, not just tidiness: submitting
    // correctly can synchronously mount the round-result screen's own
    // global "Enter to continue" window listener while this same physical
    // keydown is still mid-bubble. Without stopPropagation, that listener
    // catches the tail of the very keystroke that just submitted, and the
    // result screen is dismissed before the player ever sees it.
    const submitKeymap = keymap.of([
      {
        key: "Enter",
        preventDefault: true,
        stopPropagation: true,
        run: () => {
          onSubmitRef.current();
          return true;
        },
      },
      {
        key: "Mod-Enter",
        preventDefault: true,
        stopPropagation: true,
        run: () => {
          onSubmitRef.current();
          return true;
        },
      },
      {
        key: "Mod-h",
        preventDefault: true,
        stopPropagation: true,
        run: () => {
          onHintRef.current?.();
          return true;
        },
      },
    ]);

    const state = EditorState.create({
      doc: value,
      extensions: [
        xpathStreamLanguage,
        xpathSyntaxHighlighting(),
        autocompleteCompartment.current.of(autocompleteEnabled ? [xpathAutocomplete()] : []),
        editableCompartment.current.of(EditorView.editable.of(!disabled)),
        history(),
        closeBrackets(),
        submitKeymap,
        keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap]),
        placeholderExt(placeholder),
        baseTheme,
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChangeRef.current(update.state.doc.toString());
          }
        }),
        EditorView.domEventHandlers({
          keydown: (event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              // handled by submitKeymap; block newline insertion
              event.preventDefault();
            }
            return false;
          },
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });
    viewRef.current = view;
    view.focus();

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } });
    }
  }, [value]);

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: autocompleteCompartment.current.reconfigure(autocompleteEnabled ? [xpathAutocomplete()] : []),
    });
  }, [autocompleteEnabled]);

  useEffect(() => {
    viewRef.current?.dispatch({
      effects: editableCompartment.current.reconfigure(EditorView.editable.of(!disabled)),
    });
  }, [disabled]);

  return <div ref={containerRef} className="min-h-[52px] w-full" />;
}
