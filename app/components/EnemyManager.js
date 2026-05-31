"use client";

import { useState } from "react";

const emptyForm = {
  name: "",
  description: "",
  maxHp: 10,
  currentHp: 10,
  armorClass: 10,
  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,
  attacksText: "",
  notes: "",
};

export default function EnemyManager({ campaignId, initialEnemies }) {
  const [enemies, setEnemies] = useState(initialEnemies);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function enemyToForm(enemy) {
    return {
      name: enemy.name,
      description: enemy.description || "",
      maxHp: enemy.maxHp,
      currentHp: enemy.currentHp,
      armorClass: enemy.armorClass,
      strength: enemy.strength,
      dexterity: enemy.dexterity,
      constitution: enemy.constitution,
      intelligence: enemy.intelligence,
      wisdom: enemy.wisdom,
      charisma: enemy.charisma,
      attacksText: enemy.attacks ? JSON.stringify(enemy.attacks, null, 2) : "",
      notes: enemy.notes || "",
    };
  }

  function payloadFromForm() {
    let attacks = null;

    if (form.attacksText.trim()) {
      attacks = JSON.parse(form.attacksText);
    }

    return {
      ...form,
      maxHp: Number(form.maxHp),
      currentHp: Number(form.currentHp),
      armorClass: Number(form.armorClass),
      strength: Number(form.strength),
      dexterity: Number(form.dexterity),
      constitution: Number(form.constitution),
      intelligence: Number(form.intelligence),
      wisdom: Number(form.wisdom),
      charisma: Number(form.charisma),
      attacks,
    };
  }

  async function saveEnemy(event) {
    event.preventDefault();
    setError("");

    try {
      const payload = payloadFromForm();
      const url = editingId ? `/api/dm/enemigos/${editingId}` : `/api/dm/campanias/${campaignId}/enemigos`;
      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo guardar el enemigo.");
      }

      setEnemies((current) =>
        editingId ? current.map((enemy) => (enemy.id === data.id ? data : enemy)) : [data, ...current]
      );
      setForm(emptyForm);
      setEditingId("");
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  async function updateEnemyHp(enemy, currentHp) {
    setError("");
    const response = await fetch(`/api/dm/enemigos/${enemy.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentHp: Number(currentHp) }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudo modificar la vida.");
      return;
    }

    setEnemies((current) => current.map((row) => (row.id === data.id ? data : row)));
  }

  async function deleteEnemy(enemyId) {
    setError("");
    const response = await fetch(`/api/dm/enemigos/${enemyId}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudo eliminar el enemigo.");
      return;
    }

    setEnemies((current) => current.filter((enemy) => enemy.id !== enemyId));
    if (editingId === enemyId) {
      setEditingId("");
      setForm(emptyForm);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={saveEnemy} className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold">{editingId ? "Editar enemigo" : "Crear enemigo"}</h2>
        {error ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <div className="mt-5 space-y-4">
          <TextInput label="Nombre" value={form.name} onChange={(value) => updateField("name", value)} />
          <TextArea label="Descripcion" value={form.description} onChange={(value) => updateField("description", value)} />
          <div className="grid grid-cols-3 gap-3">
            <TextInput label="HP max" type="number" value={form.maxHp} onChange={(value) => updateField("maxHp", value)} />
            <TextInput label="HP actual" type="number" value={form.currentHp} onChange={(value) => updateField("currentHp", value)} />
            <TextInput label="CA" type="number" value={form.armorClass} onChange={(value) => updateField("armorClass", value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"].map((attribute) => (
              <TextInput
                key={attribute}
                label={attribute.slice(0, 3).toUpperCase()}
                type="number"
                value={form[attribute]}
                onChange={(value) => updateField(attribute, value)}
              />
            ))}
          </div>
          <TextArea label="Ataques JSON" value={form.attacksText} onChange={(value) => updateField("attacksText", value)} />
          <TextArea label="Notas" value={form.notes} onChange={(value) => updateField("notes", value)} />
        </div>
        <div className="mt-5 flex gap-2">
          <button type="submit" className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white">
            {editingId ? "Guardar cambios" : "Crear enemigo"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={() => {
                setEditingId("");
                setForm(emptyForm);
              }}
              className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-semibold"
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </form>

      <section className="rounded-md border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 p-5">
          <h2 className="text-lg font-bold">Enemigos</h2>
        </div>
        <div className="divide-y divide-zinc-100">
          {enemies.map((enemy) => (
            <article key={enemy.id} className="p-5">
              <div className="grid gap-4 sm:grid-cols-[1fr_260px]">
                <div>
                  <h3 className="font-semibold">{enemy.name}</h3>
                  <p className="mt-1 text-sm text-zinc-600">CA {enemy.armorClass}</p>
                  {enemy.description ? <p className="mt-2 text-sm text-zinc-700">{enemy.description}</p> : null}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={enemy.maxHp}
                      value={enemy.currentHp}
                      onChange={(event) =>
                        setEnemies((current) =>
                          current.map((row) =>
                            row.id === enemy.id ? { ...row, currentHp: event.target.value } : row
                          )
                        )
                      }
                      className="h-10 w-20 rounded-md border border-zinc-300 px-2 text-sm"
                    />
                    <span className="text-sm text-zinc-500">/ {enemy.maxHp} HP</span>
                    <button
                      type="button"
                      onClick={() => updateEnemyHp(enemy, enemy.currentHp)}
                      className="h-10 rounded-md bg-zinc-950 px-3 text-sm font-semibold text-white"
                    >
                      HP
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(enemy.id);
                        setForm(enemyToForm(enemy));
                      }}
                      className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-semibold"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteEnemy(enemy.id)}
                      className="h-9 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {!enemies.length ? <p className="p-5 text-sm text-zinc-600">Todavia no hay enemigos creados.</p> : null}
        </div>
      </section>
    </div>
  );
}

function TextInput({ label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-zinc-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-amber-700"
      />
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-zinc-500">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-amber-700"
      />
    </label>
  );
}
