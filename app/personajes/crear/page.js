"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

const steps = ["Datos", "Raza", "Subraza", "Clase", "Resumen"];

const initialForm = {
  name: "",
  level: 1,
  raceId: "",
  subraceId: "",
  classId: "",
  backstory: "",
  attributes: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
};

const attributeLabels = {
  strength: "Fuerza",
  dexterity: "Destreza",
  constitution: "Constitucion",
  intelligence: "Inteligencia",
  wisdom: "Sabiduria",
  charisma: "Carisma",
};

const primaryStatLabels = {
  strength: "Fuerza",
  dexterity: "Destreza",
  constitution: "Constitucion",
  intelligence: "Inteligencia",
  wisdom: "Sabiduria",
  charisma: "Carisma",
};

export default function CreateCharacterPage() {
  const { status } = useSession();
  const [step, setStep] = useState(0);
  const [races, setRaces] = useState([]);
  const [classes, setClasses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [createdCharacter, setCreatedCharacter] = useState(null);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [racesResponse, classesResponse] = await Promise.all([
          fetch("/api/razas"),
          fetch("/api/clases"),
        ]);

        if (!racesResponse.ok || !classesResponse.ok) {
          throw new Error("No se pudieron cargar las opciones.");
        }

        const [raceData, classData] = await Promise.all([
          racesResponse.json(),
          classesResponse.json(),
        ]);

        setRaces(raceData);
        setClasses(classData);
      } catch (loadError) {
        setError(loadError.message);
      } finally {
        setLoading(false);
      }
    }

    loadOptions();
  }, []);

  const selectedRace = useMemo(
    () => races.find((race) => race.id === form.raceId),
    [form.raceId, races]
  );

  const selectedSubrace = useMemo(
    () => selectedRace?.subraces?.find((subrace) => subrace.id === form.subraceId),
    [form.subraceId, selectedRace]
  );

  const selectedClass = useMemo(
    () => classes.find((characterClass) => characterClass.id === form.classId),
    [classes, form.classId]
  );

  const maxHp = selectedClass ? selectedClass.hitDie + 2 + (Number(form.level) - 1) * 4 : 0;

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateAttribute(attribute, value) {
    setForm((current) => ({
      ...current,
      attributes: {
        ...current.attributes,
        [attribute]: Number(value),
      },
    }));
  }

  function canContinue() {
    if (step === 0) {
      return form.name.trim() && Number(form.level) > 0;
    }

    if (step === 1) {
      return Boolean(form.raceId);
    }

    if (step === 2) {
      return !selectedRace?.subraces?.length || Boolean(form.subraceId);
    }

    if (step === 3) {
      return Boolean(form.classId);
    }

    return true;
  }

  async function submitCharacter() {
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/personajes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          subraceId: form.subraceId || null,
          level: Number(form.level),
          maxHp,
          currentHp: maxHp,
          traits: {
            race: selectedRace?.traits || {},
            subrace: selectedSubrace?.traits || {},
          },
          inventory: [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo crear el personaje.");
      }

      setCreatedCharacter(data);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="rounded-md border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Verificando sesion...
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Necesitas iniciar sesion</h1>
          <p className="mt-2 text-sm text-zinc-600">Los personajes se guardan asociados a tu usuario.</p>
          <Link
            href="/login?callbackUrl=/personajes/crear"
            className="mt-5 inline-flex h-10 items-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white"
          >
            Ir a login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 px-4 py-8 text-zinc-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-3 border-b border-zinc-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
              Personajes
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-normal sm:text-4xl">Crear personaje</h1>
          </div>
          <div className="flex gap-2" aria-label="Pasos del wizard">
            {steps.map((label, index) => (
              <span
                key={label}
                className={`h-2 w-10 rounded-full ${index <= step ? "bg-amber-700" : "bg-zinc-200"}`}
                title={label}
              />
            ))}
          </div>
        </header>

        {loading ? (
          <div className="rounded-md border border-zinc-200 bg-white p-6 text-zinc-700">
            Cargando opciones...
          </div>
        ) : (
          <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
              {error ? (
                <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {createdCharacter ? (
                <CreatedState character={createdCharacter} />
              ) : (
                <>
                  <StepContent
                    step={step}
                    races={races}
                    classes={classes}
                    form={form}
                    selectedRace={selectedRace}
                    selectedClass={selectedClass}
                    updateField={updateField}
                    updateAttribute={updateAttribute}
                  />

                  <div className="mt-8 flex flex-col-reverse gap-3 border-t border-zinc-200 pt-5 sm:flex-row sm:justify-between">
                    <button
                      type="button"
                      onClick={() => setStep((current) => Math.max(current - 1, 0))}
                      disabled={step === 0 || saving}
                      className="h-11 rounded-md border border-zinc-300 px-5 text-sm font-semibold text-zinc-900 disabled:cursor-not-allowed disabled:opacity-45"
                    >
                      Anterior
                    </button>

                    {step < steps.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setStep((current) => Math.min(current + 1, steps.length - 1))}
                        disabled={!canContinue() || saving}
                        className="h-11 rounded-md bg-zinc-950 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        Siguiente
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={submitCharacter}
                        disabled={saving || !canContinue()}
                        className="h-11 rounded-md bg-amber-700 px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        {saving ? "Creando..." : "Crear personaje"}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            <aside className="rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold">Resumen</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <SummaryItem label="Nombre" value={form.name || "Sin nombre"} />
                <SummaryItem label="Nivel" value={form.level} />
                <SummaryItem label="Raza" value={selectedRace?.name || "Pendiente"} />
                <SummaryItem label="Subraza" value={selectedSubrace?.name || "Pendiente"} />
                <SummaryItem label="Clase" value={selectedClass?.name || "Pendiente"} />
                <SummaryItem label="Vida inicial" value={maxHp || "Pendiente"} />
              </dl>
            </aside>
          </section>
        )}
      </div>
    </main>
  );
}

function StepContent({
  step,
  races,
  classes,
  form,
  selectedRace,
  selectedClass,
  updateField,
  updateAttribute,
}) {
  if (step === 0) {
    return (
      <div className="space-y-5">
        <StepTitle title="Datos basicos" subtitle="Identidad y punto de partida." />
        <TextInput label="Nombre del personaje" value={form.name} onChange={(value) => updateField("name", value)} />
        <label className="block">
          <span className="text-sm font-medium text-zinc-800">Nivel</span>
          <input
            type="number"
            min="1"
            value={form.level}
            onChange={(event) => updateField("level", event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-amber-700"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-800">Historia</span>
          <textarea
            value={form.backstory}
            onChange={(event) => updateField("backstory", event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none transition focus:border-amber-700"
          />
        </label>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div>
        <StepTitle title="Raza" subtitle="Las opciones vienen desde la base de datos." />
        <OptionGrid
          options={races}
          selectedId={form.raceId}
          onSelect={(id) => {
            updateField("raceId", id);
            updateField("subraceId", "");
          }}
          detail={(race) => `${race.speed} pies de velocidad`}
        />
      </div>
    );
  }

  if (step === 2) {
    const subraces = selectedRace?.subraces || [];

    return (
      <div>
        <StepTitle title="Subraza" subtitle={selectedRace ? selectedRace.name : "Selecciona una raza primero."} />
        {subraces.length ? (
          <OptionGrid
            options={subraces}
            selectedId={form.subraceId}
            onSelect={(id) => updateField("subraceId", id)}
          />
        ) : (
          <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
            Esta raza no tiene subrazas en el catalogo inicial.
          </div>
        )}
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="space-y-6">
        <StepTitle title="Clase" subtitle="El dado de golpe se usa para calcular la vida inicial." />
        <OptionGrid
          options={classes}
          selectedId={form.classId}
          onSelect={(id) => updateField("classId", id)}
          detail={(characterClass) => `d${characterClass.hitDie} - ${primaryStatLabels[characterClass.primaryStat] || characterClass.primaryStat}`}
        />
        {selectedClass ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(form.attributes).map(([attribute, value]) => (
              <label key={attribute} className="block">
                <span className="text-sm font-medium text-zinc-800">{attributeLabels[attribute]}</span>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={value}
                  onChange={(event) => updateAttribute(attribute, event.target.value)}
                  className="mt-2 h-10 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-amber-700"
                />
              </label>
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <StepTitle title="Resumen" subtitle="Revisa la ficha antes de guardarla." />
      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryBox label="Nombre" value={form.name} />
        <SummaryBox label="Nivel" value={form.level} />
        <SummaryBox label="Raza" value={selectedRace?.name} />
        <SummaryBox label="Clase" value={selectedClass?.name} />
      </div>
    </div>
  );
}

function StepTitle({ title, subtitle }) {
  return (
    <div className="mb-5">
      <h2 className="text-2xl font-bold tracking-normal">{title}</h2>
      <p className="mt-1 text-sm text-zinc-600">{subtitle}</p>
    </div>
  );
}

function TextInput({ label, value, onChange, required = true }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <input
        type="text"
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none transition focus:border-amber-700"
      />
    </label>
  );
}

function OptionGrid({ options, selectedId, onSelect, detail }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onSelect(option.id)}
          className={`min-h-32 rounded-md border p-4 text-left transition ${
            selectedId === option.id
              ? "border-amber-700 bg-amber-50"
              : "border-zinc-200 bg-white hover:border-zinc-400"
          }`}
        >
          <span className="block text-base font-semibold text-zinc-950">{option.name}</span>
          <span className="mt-2 block text-sm leading-6 text-zinc-600">{option.description}</span>
          {detail ? <span className="mt-3 block text-xs font-semibold uppercase text-amber-700">{detail(option)}</span> : null}
        </button>
      ))}
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-2">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right font-medium text-zinc-950">{value}</dd>
    </div>
  );
}

function SummaryBox({ label, value }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-xs font-semibold uppercase text-zinc-500">{label}</p>
      <p className="mt-2 text-base font-semibold">{value || "Pendiente"}</p>
    </div>
  );
}

function CreatedState({ character }) {
  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50 p-5">
      <h2 className="text-xl font-bold text-emerald-950">Personaje creado</h2>
      <p className="mt-2 text-sm text-emerald-800">
        {character.name} quedo guardado con {character.currentHp}/{character.maxHp} puntos de vida.
      </p>
      <a
        href={`/personajes/${character.id}`}
        className="mt-4 inline-flex h-10 items-center rounded-md bg-emerald-800 px-4 text-sm font-semibold text-white"
      >
        Ver ficha
      </a>
    </div>
  );
}
