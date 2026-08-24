"use client";

import { useState } from "react";
import { DEFAULT_ZONES, SQUAD_DEFINITIONS, SQUAD_KEYS, type SquadKey } from "@/lib/tw-squads";
import { isStrategyTemplateRules, type StrategyTemplateRules } from "@/lib/tw-planning-engine";

export type StrategyTemplateSummary = {
  id: string;
  name: string;
  description: string | null;
  rules: unknown;
  isBuiltIn: boolean;
};

type Draft = {
  name: string;
  description: string;
  zonePriority: Record<number, string>;
  squadPriority: Record<number, string>;
};

const EMPTY_DRAFT: Draft = { name: "", description: "", zonePriority: {}, squadPriority: {} };

function isSquadKey(value: string): value is SquadKey {
  return (SQUAD_KEYS as readonly string[]).includes(value);
}

function rulesToDraft(name: string, description: string | null, rules: unknown): Draft {
  const parsed = isStrategyTemplateRules(rules) ? rules : {};
  const zonePriority: Record<number, string> = {};
  for (const [zoneId, value] of Object.entries(parsed.zonePriority ?? {})) {
    if (value !== undefined) zonePriority[Number(zoneId)] = String(value);
  }
  const squadPriority: Record<number, string> = {};
  for (const [zoneId, keys] of Object.entries(parsed.squadPriority ?? {})) {
    if (keys) squadPriority[Number(zoneId)] = keys.join(", ");
  }
  return { name, description: description ?? "", zonePriority, squadPriority };
}

function draftToRules(draft: Draft): StrategyTemplateRules {
  const zonePriority: Record<number, number> = {};
  for (const zone of DEFAULT_ZONES) {
    const raw = draft.zonePriority[zone.id];
    if (raw === undefined || raw.trim() === "") continue;
    const num = Number(raw);
    if (Number.isFinite(num)) zonePriority[zone.id] = num;
  }
  const squadPriority: Record<number, SquadKey[]> = {};
  for (const zone of DEFAULT_ZONES) {
    const raw = draft.squadPriority[zone.id];
    if (!raw?.trim()) continue;
    const keys = raw
      .split(",")
      .map((s) => s.trim())
      .filter(isSquadKey);
    if (keys.length) squadPriority[zone.id] = keys;
  }
  const rules: StrategyTemplateRules = {};
  if (Object.keys(zonePriority).length) rules.zonePriority = zonePriority;
  if (Object.keys(squadPriority).length) rules.squadPriority = squadPriority;
  return rules;
}

export default function TwTemplates({
  templates,
  activeTemplateId,
  busy,
  onCreate,
  onUpdate,
  onDelete,
  onApply,
}: {
  templates: StrategyTemplateSummary[];
  activeTemplateId: string | null;
  busy: boolean;
  onCreate: (input: { name: string; description: string | null; rules: unknown }) => void;
  onUpdate: (id: string, input: { name: string; description: string | null; rules: unknown }) => void;
  onDelete: (id: string) => void;
  onApply: (templateId: string | null) => void;
}) {
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);

  function startCreate() {
    setEditingId("new");
    setDraft(EMPTY_DRAFT);
  }

  function startEdit(template: StrategyTemplateSummary) {
    setEditingId(template.id);
    setDraft(rulesToDraft(template.name, template.description, template.rules));
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  }

  function submit() {
    if (!draft.name.trim()) return;
    const rules = draftToRules(draft);
    if (editingId === "new") {
      onCreate({ name: draft.name.trim(), description: draft.description.trim() || null, rules });
    } else if (editingId) {
      onUpdate(editingId, { name: draft.name.trim(), description: draft.description.trim() || null, rules });
    }
    cancelEdit();
  }

  return (
    <div className="twc-templates">
      <section className="twc-panel">
        <header>
          <h3>Strategy templates</h3>
          <span className="twc-tab-badge">{templates.length}</span>
        </header>
        <p>
          Templates override the default zone-fill order and preferred squads per zone for &ldquo;Generate
          Recommendations&rdquo; in Defence mode. Apply one to this plan, or leave none active to use the
          built-in strategy.
        </p>

        <ul className="twc-template-list">
          <li className={`twc-template-row${activeTemplateId === null ? " is-active" : ""}`}>
            <div>
              <strong>Built-in strategy</strong>
              <small>Default purpose/zoneHint-based ordering, no overrides.</small>
            </div>
            <button type="button" disabled={busy || activeTemplateId === null} onClick={() => onApply(null)}>
              {activeTemplateId === null ? "Active" : "Use for this plan"}
            </button>
          </li>
          {templates.map((template) => (
            <li key={template.id} className={`twc-template-row${activeTemplateId === template.id ? " is-active" : ""}`}>
              <div>
                <strong>{template.name}</strong>
                {template.description ? <small>{template.description}</small> : null}
              </div>
              <div className="twc-template-actions">
                <button type="button" disabled={busy || activeTemplateId === template.id} onClick={() => onApply(template.id)}>
                  {activeTemplateId === template.id ? "Active" : "Use for this plan"}
                </button>
                <button type="button" className="twc-icon-btn" disabled={busy} onClick={() => startEdit(template)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="twc-icon-btn twc-danger"
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(`Delete template "${template.name}"?`)) onDelete(template.id);
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>

        {editingId === null ? (
          <button type="button" className="twc-primary-btn" disabled={busy} onClick={startCreate}>
            New template
          </button>
        ) : null}
      </section>

      {editingId !== null ? (
        <section className="twc-panel">
          <header>
            <h3>{editingId === "new" ? "New template" : "Edit template"}</h3>
          </header>

          <form
            className="twc-template-form"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <label>
              <span>Name</span>
              <input
                value={draft.name}
                onChange={(event) => setDraft((d) => ({ ...d, name: event.target.value }))}
                disabled={busy}
                required
              />
            </label>
            <label>
              <span>Description (optional)</span>
              <input
                value={draft.description}
                onChange={(event) => setDraft((d) => ({ ...d, description: event.target.value }))}
                disabled={busy}
              />
            </label>

            <div className="twc-template-rules">
              <p className="twc-muted">
                Zone priority: lower fills first (blank = default). Squad priority: comma-separated squad keys to
                prefer, in order — {SQUAD_KEYS.map((key) => `${key} (${SQUAD_DEFINITIONS[key].label})`).join(", ")}.
              </p>
              <div className="twc-template-zone-grid">
                {DEFAULT_ZONES.map((zone) => (
                  <div key={zone.id} className="twc-template-zone-row">
                    <strong>{zone.name}</strong>
                    <label>
                      <span>Priority</span>
                      <input
                        type="number"
                        value={draft.zonePriority[zone.id] ?? ""}
                        disabled={busy}
                        onChange={(event) =>
                          setDraft((d) => ({
                            ...d,
                            zonePriority: { ...d.zonePriority, [zone.id]: event.target.value },
                          }))
                        }
                      />
                    </label>
                    <label>
                      <span>Preferred squads</span>
                      <input
                        value={draft.squadPriority[zone.id] ?? ""}
                        placeholder="e.g. jabba, rey"
                        disabled={busy}
                        onChange={(event) =>
                          setDraft((d) => ({
                            ...d,
                            squadPriority: { ...d.squadPriority, [zone.id]: event.target.value },
                          }))
                        }
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="twc-template-form-actions">
              <button type="submit" className="twc-primary-btn" disabled={busy || !draft.name.trim()}>
                {editingId === "new" ? "Create template" : "Save changes"}
              </button>
              <button type="button" disabled={busy} onClick={cancelEdit}>
                Cancel
              </button>
            </div>
          </form>
        </section>
      ) : null}
    </div>
  );
}
