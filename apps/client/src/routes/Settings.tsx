import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useProfileStore } from "../state/profile-store";
import { Button, Panel } from "../design/primitives";
import { Logo } from "../design/Logo";
import type { Difficulty } from "@xpath-arena/shared";

const DIFFICULTIES: (Difficulty | "adaptive")[] = ["adaptive", "beginner", "intermediate", "advanced", "expert"];

export function Settings() {
  const navigate = useNavigate();
  const settings = useProfileStore((s) => s.settings);
  const updateSettings = useProfileStore((s) => s.updateSettings);
  const resetProfile = useProfileStore((s) => s.resetProfile);
  const name = useProfileStore((s) => s.name);
  const setName = useProfileStore((s) => s.setName);

  return (
    <div className="h-screen w-screen overflow-y-auto bg-void px-6 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 flex items-center justify-between">
          <button onClick={() => navigate("/")} className="opacity-80 transition-opacity hover:opacity-100">
            <Logo size="md" />
          </button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            Main Menu
          </Button>
        </div>

        <Panel className="mb-4 px-5 py-5">
          <h2 className="mb-3 font-mono text-xs font-semibold tracking-widest text-text-tertiary">PLAYER</h2>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-text-primary outline-none focus:border-cyan"
            placeholder="Player name"
          />
        </Panel>

        <Panel className="mb-4 px-5 py-5">
          <h2 className="mb-3 font-mono text-xs font-semibold tracking-widest text-text-tertiary">GAMEPLAY</h2>
          <Row label="Difficulty">
            <div className="flex flex-wrap gap-1.5">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d}
                  onClick={() => updateSettings({ difficulty: d })}
                  className={`rounded-lg border px-2.5 py-1 font-mono text-xs capitalize transition-colors ${
                    settings.difficulty === d
                      ? "border-cyan/40 bg-cyan/10 text-cyan"
                      : "border-border-subtle text-text-secondary hover:border-border-strong"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </Row>
          <ToggleRow
            label="Live match highlighting"
            checked={settings.liveHighlighting}
            onChange={(v) => updateSettings({ liveHighlighting: v })}
          />
          <ToggleRow label="Autocomplete" checked={settings.autocomplete} onChange={(v) => updateSettings({ autocomplete: v })} />
        </Panel>

        <Panel className="mb-4 px-5 py-5">
          <h2 className="mb-3 font-mono text-xs font-semibold tracking-widest text-text-tertiary">INTERFACE</h2>
          <ToggleRow
            label="Reduced motion"
            checked={settings.reducedMotion}
            onChange={(v) => updateSettings({ reducedMotion: v })}
          />
        </Panel>

        <Panel className="mb-4 px-5 py-5">
          <h2 className="mb-3 font-mono text-xs font-semibold tracking-widest text-text-tertiary">AUDIO</h2>
          <SliderRow label="Master" value={settings.masterVolume} onChange={(v) => updateSettings({ masterVolume: v })} />
          <SliderRow label="Music" value={settings.musicVolume} onChange={(v) => updateSettings({ musicVolume: v })} />
          <SliderRow label="Effects" value={settings.fxVolume} onChange={(v) => updateSettings({ fxVolume: v })} />
          <p className="mt-2 text-xs text-text-tertiary">The game works perfectly muted — audio is entirely optional.</p>
        </Panel>

        <Panel className="px-5 py-5">
          <h2 className="mb-3 font-mono text-xs font-semibold tracking-widest text-text-tertiary">DEVELOPER</h2>
          <ToggleRow
            label="Show XPath evaluation details"
            checked={settings.showEvaluationDetails}
            onChange={(v) => updateSettings({ showEvaluationDetails: v })}
          />
          <div className="mt-4 border-t border-border-subtle pt-4">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (confirm("Reset all progress and stats? This can't be undone.")) resetProfile();
              }}
            >
              Reset Profile
            </Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4">
      <span className="text-sm text-text-secondary">{label}</span>
      {children}
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row label={label}>
      <button
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-cyan" : "bg-white/10"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-void transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </button>
    </Row>
  );
}

function SliderRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <Row label={label}>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-40 accent-cyan"
      />
    </Row>
  );
}
