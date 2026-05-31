"use client";

import { useEffect, useState } from "react";

const itemTypes = ["WEAPON", "ARMOR", "POTION", "TOOL", "TREASURE", "DOCUMENT", "MAGIC", "OTHER"];
const itemRarities = ["COMMON", "UNCOMMON", "RARE", "EPIC", "LEGENDARY"];

const emptyForm = {
  name: "",
  description: "",
  quantity: 1,
  type: "OTHER",
  rarity: "COMMON",
  isEquipped: false,
  weight: "",
  value: "",
};

export default function InventoryManager({ characterId, compact = false }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadItems() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/personajes/${characterId}/inventario`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "No se pudo cargar el inventario.");
        }

        setItems(data);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadItems();
  }, [characterId]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description || "",
      quantity: item.quantity,
      type: item.type,
      rarity: item.rarity,
      isEquipped: item.isEquipped,
      weight: item.weight ?? "",
      value: item.value ?? "",
    });
  }

  function resetForm() {
    setEditingId("");
    setForm(emptyForm);
  }

  async function saveItem(event) {
    event.preventDefault();
    setError("");

    const url = editingId ? `/api/inventario/${editingId}` : `/api/personajes/${characterId}/inventario`;
    const method = editingId ? "PATCH" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudo guardar el objeto.");
      return;
    }

    setItems((current) =>
      editingId ? current.map((item) => (item.id === data.id ? data : item)) : [data, ...current]
    );
    resetForm();
  }

  async function toggleEquipped(item) {
    const response = await fetch(`/api/inventario/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isEquipped: !item.isEquipped }),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudo marcar equipado.");
      return;
    }

    setItems((current) => current.map((row) => (row.id === data.id ? data : row)));
  }

  async function deleteItem(itemId) {
    setError("");
    const response = await fetch(`/api/inventario/${itemId}`, { method: "DELETE" });
    const data = await response.json();

    if (!response.ok) {
      setError(data.error || "No se pudo eliminar el objeto.");
      return;
    }

    setItems((current) => current.filter((item) => item.id !== itemId));
    if (editingId === itemId) {
      resetForm();
    }
  }

  return (
    <div className={compact ? "space-y-4" : "grid gap-6 lg:grid-cols-[360px_1fr]"}>
      <form onSubmit={saveItem} className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
        <h3 className="font-semibold">{editingId ? "Editar objeto" : "Agregar objeto"}</h3>
        {error ? (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          <TextInput label="Nombre" value={form.name} onChange={(value) => updateField("name", value)} />
          <TextArea label="Descripcion" value={form.description} onChange={(value) => updateField("description", value)} />
          <div className="grid grid-cols-2 gap-3">
            <TextInput label="Cantidad" type="number" value={form.quantity} onChange={(value) => updateField("quantity", value)} />
            <TextInput label="Peso" type="number" value={form.weight} onChange={(value) => updateField("weight", value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SelectInput label="Tipo" value={form.type} options={itemTypes} onChange={(value) => updateField("type", value)} />
            <SelectInput label="Rareza" value={form.rarity} options={itemRarities} onChange={(value) => updateField("rarity", value)} />
          </div>
          <TextInput label="Valor" type="number" value={form.value} onChange={(value) => updateField("value", value)} />
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-800">
            <input
              type="checkbox"
              checked={form.isEquipped}
              onChange={(event) => updateField("isEquipped", event.target.checked)}
            />
            Equipado
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button type="submit" className="h-10 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white">
            {editingId ? "Guardar" : "Agregar"}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-semibold"
            >
              Cancelar
            </button>
          ) : null}
        </div>
      </form>

      <section className="rounded-md border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 p-4">
          <h3 className="font-semibold">Inventario</h3>
        </div>
        {loading ? (
          <p className="p-4 text-sm text-zinc-600">Cargando inventario...</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {items.map((item) => (
              <article key={item.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="font-semibold">{item.name}</h4>
                      {item.isEquipped ? (
                        <span className="rounded-sm bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                          Equipado
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-zinc-600">
                      {item.type} - {item.rarity} - cantidad {item.quantity}
                    </p>
                    {item.description ? <p className="mt-2 text-sm text-zinc-700">{item.description}</p> : null}
                    <p className="mt-2 text-xs text-zinc-500">
                      {item.weight !== null && item.weight !== undefined ? `Peso ${item.weight}` : "Sin peso"} ·{" "}
                      {item.value !== null && item.value !== undefined ? `Valor ${item.value}` : "Sin valor"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleEquipped(item)}
                      className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-semibold"
                    >
                      {item.isEquipped ? "Desequipar" : "Equipar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="h-9 rounded-md border border-zinc-300 px-3 text-sm font-semibold"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteItem(item.id)}
                      className="h-9 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {!items.length ? <p className="p-4 text-sm text-zinc-600">Todavia no hay objetos.</p> : null}
          </div>
        )}
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

function SelectInput({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-zinc-500">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-amber-700"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
