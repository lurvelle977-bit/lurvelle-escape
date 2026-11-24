"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { REGIONS } from "@/content/tours";
import type { DestinationRecord, ExperienceRecord, TierRecord } from "@/server/repositories/content.repository";
import { formData, fileField, IMAGE_TYPES, imageProblem } from "./ResourceForms";
import { adminButton, adminField, Panel } from "./ui";
import { useAdminAction } from "./useAdminAction";

type Api = "experiences" | "destinations" | "tiers";
type Base = { id: string; isActive: boolean };

const checkbox = "size-4 cursor-pointer accent-gold";

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5 text-[12px] text-muted">
      {label}
      {children}
    </label>
  );
}

function Feedback({ error, done }: { error: string; done: string }) {
  return (
    <>
      {error && <p role="alert" className="text-[13px] text-[#e8907f]">{error}</p>}
      {done && !error && <p role="status" className="text-[13px] text-[#8fcf9d]">{done}</p>}
    </>
  );
}

function Thumb({ src, alt }: { src: string | null; alt: string }) {
  if (!src) return <span aria-hidden className="size-11 shrink-0 rounded-[4px] border border-cream/14 bg-ink/50" />;
  return <Image src={src} alt={alt} width={44} height={44} unoptimized className="size-11 shrink-0 rounded-[4px] object-cover" />;
}

// Shared pieces of the three field sets
function StatusFields({ record }: { record?: { isActive: boolean } }) {
  return (
    <Field label="Status">
      <select name="isActive" defaultValue={String(record?.isActive ?? true)} className={adminField}>
        <option value="true">Active (shown on the website)</option>
        <option value="false">Inactive (hidden)</option>
      </select>
    </Field>
  );
}

function OrderField({ record }: { record?: { sortOrder: number } }) {
  return (
    <Field label="Display order (lowest first)">
      <input name="sortOrder" type="number" min={0} max={9999} step={1} defaultValue={record?.sortOrder ?? 0} className={adminField} />
    </Field>
  );
}

function PictureField({ label, current, name }: { label: string; current?: string | null; name: string }) {
  return (
    <div className="grid gap-1.5">
      <Field label={`${label} (JPEG, PNG or WebP, up to 2 MB)${current ? " — choose a file to replace the current one" : ""}`}>
        <input name="image" type="file" accept={IMAGE_TYPES.join(",")} className={fileField} />
      </Field>
      {current && <Thumb src={current} alt={`Current ${name}`} />}
    </div>
  );
}

// ---------- Field sets ----------

type FieldsProps<T> = { record?: T };

function ExperienceFields({ record }: FieldsProps<ExperienceRecord>) {
  return (
    <>
      <Field label="Title">
        <input name="title" required defaultValue={record?.title} className={adminField} />
      </Field>
      <Field label="Description">
        <textarea name="description" rows={2} maxLength={600} defaultValue={record?.description} className={adminField} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Starting price, € (blank = on request)">
          <input name="price" type="number" min={0} step="0.01" defaultValue={record?.price ?? ""} className={adminField} />
        </Field>
        <Field label="Duration, hours (blank = flexible)">
          <input name="durationHours" type="number" min={1} max={72} step={1} defaultValue={record?.durationHours ?? ""} className={adminField} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <OrderField record={record} />
        <StatusFields record={record} />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-[13px] text-sand">
        <input name="isFeatured" type="checkbox" defaultChecked={record?.isFeatured} className={checkbox} />
        Featured (shown as the large card on the home page)
      </label>
      <PictureField label="Picture" current={record?.imageUrl} name="experience picture" />
    </>
  );
}

function DestinationFields({ record }: FieldsProps<DestinationRecord>) {
  return (
    <>
      <Field label="Name">
        <input name="name" required defaultValue={record?.name} className={adminField} />
      </Field>
      <Field label="Description">
        <textarea name="description" rows={2} maxLength={600} defaultValue={record?.description} className={adminField} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Region">
          <select name="region" required defaultValue={record?.region ?? ""} className={adminField}>
            <option value="" disabled>Choose a region</option>
            {REGIONS.map((region) => <option key={region} value={region}>{region}</option>)}
          </select>
        </Field>
        <Field label="Starting price, €">
          <input name="price" type="number" min={0} step="0.01" required defaultValue={record?.price} className={adminField} />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Duration, hours">
          <input name="durationHours" type="number" min={1} max={72} step={1} required defaultValue={record?.durationHours} className={adminField} />
        </Field>
        <Field label="Latitude">
          <input name="lat" type="number" min={-90} max={90} step="any" required defaultValue={record?.lat} className={adminField} />
        </Field>
        <Field label="Longitude">
          <input name="lon" type="number" min={-180} max={180} step="any" required defaultValue={record?.lon} className={adminField} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Map label (blank = name)">
          <input name="mapLabel" maxLength={30} defaultValue={record?.mapLabel} className={adminField} />
        </Field>
        <Field label="Label side on the map">
          <select name="labelSide" defaultValue={record?.labelSide ?? "right"} className={adminField}>
            <option value="right">Right of the pin</option>
            <option value="left">Left of the pin</option>
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Mobile label offset X">
          <input name="mobileLabelDx" type="number" min={-60} max={60} step={1} defaultValue={record?.mobileLabelDx ?? 12} className={adminField} />
        </Field>
        <Field label="Mobile label offset Y">
          <input name="mobileLabelDy" type="number" min={-60} max={60} step={1} defaultValue={record?.mobileLabelDy ?? 0} className={adminField} />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <OrderField record={record} />
        <StatusFields record={record} />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-[13px] text-sand">
        <input name="isFeatured" type="checkbox" defaultChecked={record?.isFeatured} className={checkbox} />
        Featured (selected when the destinations page opens)
      </label>
      <PictureField label="Picture" current={record?.imageUrl} name="destination picture" />
    </>
  );
}

function TierFields({ record }: FieldsProps<TierRecord>) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Label, e.g. Essential">
          <input name="eyebrow" required defaultValue={record?.eyebrow} className={adminField} />
        </Field>
        <Field label="Name">
          <input name="name" required defaultValue={record?.name} className={adminField} />
        </Field>
      </div>
      <Field label="Description">
        <input name="tagline" required maxLength={120} defaultValue={record?.tagline} className={adminField} />
      </Field>
      <Field label="Price per hour, €">
        <input name="price" type="number" min={0} step="0.01" required defaultValue={record?.price} className={adminField} />
      </Field>
      <Field label="Features (one per line, up to 8)">
        <textarea name="features" rows={5} required defaultValue={record?.features.join("\n")} className={adminField} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <OrderField record={record} />
        <StatusFields record={record} />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-[13px] text-sand">
        <input name="isHighlighted" type="checkbox" defaultChecked={record?.isHighlighted} className={checkbox} />
        Highlighted (tinted card)
      </label>
    </>
  );
}

// ---------- Generic list / add / edit ----------

// One form (add or edit): sends multipart so an optional picture travels with the fields
function RecordForm({ url, method, submit, success, reset, imageLabel, children }: {
  url: string;
  method: "POST" | "PATCH";
  submit: string;
  success: string;
  reset?: boolean;
  imageLabel: string;
  children: ReactNode;
}) {
  const { run, busy, error, done } = useAdminAction();
  const [fileError, setFileError] = useState("");
  return (
    <form
      className="grid gap-3"
      onChange={() => setFileError("")}
      onSubmit={async (event) => {
        event.preventDefault();
        const element = event.currentTarget;
        const form = formData(element);
        const problem = imageProblem(form, imageLabel);
        setFileError(problem);
        if (problem) return;
        if (await run(method, url, form, success)) {
          if (reset) element.reset();
          // Never keep a chosen file after saving, so the next save does not upload it again
          const file = element.elements.namedItem("image");
          if (file instanceof HTMLInputElement) file.value = "";
        }
      }}
    >
      {children}
      <div><button type="submit" disabled={busy} className={adminButton()}>{submit}</button></div>
      <Feedback error={fileError || error} done={fileError ? "" : done} />
    </form>
  );
}

function Manager<T extends Base>({ api, noun, records, describe, Fields, imageLabel = "Picture" }: {
  api: Api;
  noun: string;
  records: T[];
  describe: (record: T) => { title: string; meta: string; image?: string | null };
  Fields: (props: FieldsProps<T>) => ReactNode;
  imageLabel?: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const action = useAdminAction();
  const base = `/api/admin/${api}`;

  return (
    <div className="grid content-start gap-5">
      <Panel title={`${noun}s (${records.length})`}>
        {records.length === 0 ? <p className="text-[13px] text-muted">No {noun.toLowerCase()}s yet.</p> : (
          <ul className="grid gap-4 text-[13.5px] text-cream">
            {records.map((record) => {
              const { title, meta, image } = describe(record);
              const editing = editingId === record.id;
              return (
                <li key={record.id} className="grid gap-3 border-b border-cream/10 pb-4 last:border-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-3">
                    {image !== undefined && <Thumb src={image} alt={title} />}
                    <span className="min-w-0 flex-1">
                      {title}
                      <span className="block text-[12px] text-muted">{meta}{record.isActive ? "" : " · inactive"}</span>
                    </span>
                    <span className="flex flex-wrap gap-2">
                      <button type="button" className={adminButton("plain")} onClick={() => setEditingId(editing ? null : record.id)}>{editing ? "Close" : "Edit"}</button>
                      <button
                        type="button"
                        disabled={action.busy}
                        className={adminButton("plain")}
                        onClick={() => action.run("PATCH", `${base}/${record.id}`, { isActive: !record.isActive }, record.isActive ? `${noun} deactivated` : `${noun} activated`)}
                      >
                        {record.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        disabled={action.busy}
                        className={adminButton("danger")}
                        onClick={() => {
                          if (window.confirm(`Permanently delete “${title}”? This cannot be undone. Use Deactivate to just hide it.`)) {
                            action.run("DELETE", `${base}/${record.id}`, undefined, `${noun} deleted`);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </span>
                  </div>
                  {editing && (
                    <RecordForm url={`${base}/${record.id}`} method="PATCH" submit="Save changes" success={`${noun} updated`} imageLabel={imageLabel}>
                      <Fields record={record} />
                    </RecordForm>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-3"><Feedback error={action.error} done={action.done} /></div>
      </Panel>

      <Panel title={`Add ${noun.toLowerCase()}`}>
        <RecordForm url={base} method="POST" submit={`Add ${noun.toLowerCase()}`} success={`${noun} added`} reset imageLabel={imageLabel}>
          <Fields />
        </RecordForm>
      </Panel>
    </div>
  );
}

// ---------- The three sections ----------

export function ExperiencesManager({ records }: { records: ExperienceRecord[] }) {
  return (
    <Manager
      api="experiences"
      noun="Experience"
      records={records}
      imageLabel="Experience picture"
      Fields={ExperienceFields}
      describe={(e) => ({
        title: e.title,
        image: e.imageUrl,
        meta: `${e.price === null ? "On request" : `From €${e.price}`} · ${e.durationHours === null ? "Flexible" : `${e.durationHours} h`} · order ${e.sortOrder}${e.isFeatured ? " · featured" : ""}`,
      })}
    />
  );
}

export function DestinationsManager({ records }: { records: DestinationRecord[] }) {
  return (
    <Manager
      api="destinations"
      noun="Destination"
      records={records}
      imageLabel="Destination picture"
      Fields={DestinationFields}
      describe={(d) => ({
        title: d.name,
        image: d.imageUrl,
        meta: `${d.region} · From €${d.price} · ${d.durationHours} h · order ${d.sortOrder}${d.isFeatured ? " · featured" : ""}`,
      })}
    />
  );
}

export function TiersManager({ records }: { records: TierRecord[] }) {
  return (
    <Manager
      api="tiers"
      noun="Tier"
      records={records}
      Fields={TierFields}
      describe={(t) => ({ title: `${t.name} — ${t.eyebrow}`, meta: `€${t.price} / hour · ${t.features.length} features · order ${t.sortOrder}${t.isHighlighted ? " · highlighted" : ""}` })}
    />
  );
}
