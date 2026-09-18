"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  PROPERTY_CATEGORIES,
  PROPERTY_TYPES_BY_CATEGORY,
  type PropertyCategory,
  SIZE_UNITS,
  AUTHORITY_STATUSES,
  labelize,
  type PropertyType,
} from "@/lib/property-options";
import { parsePakistaniPrice } from "@/lib/parse-price";
import { PropertyCard } from "@/components/PropertyCard";
import { createProperty, type ActionResult } from "./actions";

// Faithful rebuild of the PostProperty screen from the Claude Design
// artifact (6-step wizard + live preview + "Property Published!"
// screen), reconciled with a few places where the design's fields
// don't line up with the schema:
//
// - No Title field exists anywhere in the design's 6 steps. The
//   title is generated from size/type/purpose/area at publish time
//   rather than adding a field the design doesn't have.
// - Area/Society/Phase/Block/Street are free-text inputs in the
//   design, not selects — properties.area_id/society_id are lookup
//   FKs. On publish, the typed Area/Society text is matched
//   case-insensitively against the real areas/societies tables; a
//   match sets the FK, a miss just leaves it null and folds the text
//   into the address field instead.
// - Price is a free-text field ("e.g. 5.25 Crore") parsed via
//   parsePakistaniPrice rather than a number input.
// - Possession options (Immediate / Within 3 Months / Within 6
//   Months / On Completion) don't match possession_status's enum
//   values — mapped to the closest ones.
// - "Floors" is a single field, mapped to total_floors (there's no
//   separate floor-number-of-a-unit field in this flow).
// - The Approval/Authority chips are rendered here as single-select
//   (authority_status is one enum value, not a set).
type LookupRow = { id: string; name: string };
type AreaRow = { id: string; city_id: string; name: string };

const CATEGORY_OPTIONS = PROPERTY_CATEGORIES.filter((c) => c !== "OTHER");

const POSSESSION_OPTIONS = ["Immediate", "Within 3 Months", "Within 6 Months", "On Completion"] as const;
const POSSESSION_MAP: Record<(typeof POSSESSION_OPTIONS)[number], string> = {
  Immediate: "AVAILABLE",
  "Within 3 Months": "POSSESSION_PENDING",
  "Within 6 Months": "POSSESSION_PENDING",
  "On Completion": "UNDER_CONSTRUCTION",
};

const TOTAL_STEPS = 5;
const STEP_LABELS = [
  "Step 1 of 5 — What are you listing?",
  "Step 2 of 5 — Location",
  "Step 3 of 5 — Details & Price",
  "Step 4 of 5 — Photos",
  "Step 5 of 5 — Preview & Publish",
];

function bigBtn(active: boolean) {
  return active
    ? "flex-1 h-[50px] rounded-xl font-display text-sm font-extrabold bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white border-none"
    : "flex-1 h-[50px] rounded-xl font-display text-sm font-extrabold bg-white text-[#334155] border-[1.5px] border-[#E4E9F2]";
}
function typeBtn(active: boolean) {
  return active
    ? "px-2 py-3 rounded-xl font-display text-[13px] font-bold bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] text-white border-none"
    : "px-2 py-3 rounded-xl font-display text-[13px] font-bold bg-white text-[#334155] border-[1.5px] border-[#E4E9F2]";
}
function chipBtn(active: boolean) {
  return active
    ? "px-4 py-2.5 rounded-full font-display text-[12.5px] font-bold bg-gradient-to-br from-[#F59E0B] to-[#EA7D0B] text-white border-none"
    : "px-4 py-2.5 rounded-full font-display text-[12.5px] font-bold bg-[#F1F5F9] text-[#475467] border-none";
}
function segBtn(active: boolean) {
  return active
    ? "flex-1 py-2.5 rounded-[10px] font-display text-[13px] font-bold bg-[#0B2545] text-white border-none"
    : "flex-1 py-2.5 rounded-[10px] font-display text-[13px] font-bold bg-white text-[#334155] border-[1.5px] border-[#E4E9F2]";
}
const inputClass =
  "w-full rounded-[10px] border-[1.5px] border-[#E4E9F2] px-3.5 py-2.5 text-sm text-[#101828] outline-none";
const labelClass = "mb-1.5 block text-xs font-semibold text-[#667085]";

export function PostPropertyWizard({
  cityId,
  cityName,
  areas,
  societies,
}: {
  cityId: string;
  cityName: string;
  areas: AreaRow[];
  societies: AreaRow[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [published, setPublished] = useState<{ slug: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [purpose, setPurpose] = useState<"SALE" | "RENT">("SALE");
  const [category, setCategory] = useState<PropertyCategory>("RESIDENTIAL");
  const [propertyType, setPropertyType] = useState<PropertyType | null>(null);

  const [area, setArea] = useState("");
  const [society, setSociety] = useState("");
  const [phase, setPhase] = useState("");
  const [block, setBlock] = useState("");
  const [street, setStreet] = useState("");

  const [size, setSize] = useState("");
  const [unit, setUnit] = useState<(typeof SIZE_UNITS)[number]>("MARLA");
  const [priceText, setPriceText] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [floors, setFloors] = useState("");
  const [parking, setParking] = useState("");
  const [furnished, setFurnished] = useState<boolean | null>(null);
  const [possession, setPossession] = useState<(typeof POSSESSION_OPTIONS)[number]>("Immediate");
  const [constructed, setConstructed] = useState<boolean | null>(null);
  const [installments, setInstallments] = useState(false);
  const [description, setDescription] = useState("");
  const [authorityStatus, setAuthorityStatus] = useState<(typeof AUTHORITY_STATUSES)[number]>("NOT_PROVIDED");

  const [photos, setPhotos] = useState<File[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const progressColor = (i: number) => (i <= step ? "#2563EB" : "#E4E9F2");

  const isFirstStep = step === 1;
  const isLastStep = step === TOTAL_STEPS;
  const nextDisabled = useMemo(() => {
    if (step === 1) return !purpose || !propertyType;
    if (step === 3) return !priceText.trim() || !size.trim();
    return false;
  }, [step, purpose, propertyType, priceText, size]);

  function addPhotos(files: FileList | null) {
    if (!files) return;
    setPhotos((prev) => [...prev, ...Array.from(files)].slice(0, 6));
  }

  function buildTitle(): string {
    const typeLabel = propertyType ? labelize(propertyType) : "Property";
    const sizeText = size ? `${size} ${labelize(unit)}` : "";
    const purposeLabel = purpose === "SALE" ? "Sale" : "Rent";
    const location = area || society || cityName;
    return [sizeText, typeLabel].filter(Boolean).join(" ") + ` for ${purposeLabel} in ${location}`;
  }

  function matchId(rows: AreaRow[], text: string): string | null {
    const hit = rows.find((r) => r.name.toLowerCase() === text.trim().toLowerCase());
    return hit?.id ?? null;
  }

  function handlePublish() {
    if (!propertyType) return;
    const price = parsePakistaniPrice(priceText);
    if (price === null) {
      setError('Price didn\'t parse — try a plain number or "5.25 Crore" style.');
      return;
    }
    setError(null);

    const formData = new FormData();
    formData.set("title", buildTitle());
    formData.set("purpose", purpose);
    formData.set("category", category);
    formData.set("property_type", propertyType);
    formData.set("city_id", cityId);
    const areaId = matchId(areas, area);
    const societyId = matchId(societies, society);
    if (areaId) formData.set("area_id", areaId);
    if (societyId) formData.set("society_id", societyId);
    const addressParts = [!areaId ? area : null, !societyId ? society : null, phase && `Phase ${phase}`, block && `Block ${block}`, street]
      .filter(Boolean)
      .join(", ");
    if (addressParts) formData.set("address", addressParts);
    formData.set("price", String(price));
    formData.set("price_type", "TOTAL");
    formData.set("size", size);
    formData.set("size_unit", unit);
    if (beds) formData.set("bedrooms", beds);
    if (baths) formData.set("bathrooms", baths);
    if (parking) formData.set("parking_spaces", parking);
    if (floors) formData.set("total_floors", floors);
    formData.set("possession_status", POSSESSION_MAP[possession]);
    formData.set("furnished_status", furnished === null ? "NOT_SPECIFIED" : furnished ? "FURNISHED" : "UNFURNISHED");
    formData.set("construction_status", constructed === null ? "NOT_SPECIFIED" : constructed ? "READY" : "UNDER_CONSTRUCTION");
    formData.set("authority_status", authorityStatus);
    if (installments) formData.set("installment_available", "on");
    if (description) formData.set("description", description);
    formData.set("seller_type", "OWNER");
    photos.forEach((f) => formData.append("photos", f));

    startTransition(async () => {
      const result: ActionResult = await createProperty(null, formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      // createProperty redirects server-side on success; this only
      // runs if something unexpected happened without an error object.
    });
  }

  if (published) {
    return (
      <div className="mx-auto max-w-[520px] px-6 py-16 text-center">
        <div className="mx-auto mb-4.5 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-gradient-to-br from-[#22C55E] to-[#14B8A6]">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mb-2 font-display text-2xl font-extrabold text-[#101828]">Property Published!</h2>
        <p className="mb-5 text-sm text-[#667085]">Your listing is now live and buyers can contact you directly.</p>
        <button
          onClick={() => router.push(`/properties/${published.slug}`)}
          className="mb-2.5 w-full rounded-xl bg-[#2563EB] py-3.5 font-display text-sm font-extrabold text-white"
        >
          View My Listing
        </button>
        <button
          onClick={() => window.location.reload()}
          className="w-full rounded-xl border-[1.5px] border-[#2563EB] bg-white py-3.5 font-display text-sm font-extrabold text-[#2563EB]"
        >
          Post Another Property
        </button>
      </div>
    );
  }

  const previewData = {
    title: buildTitle(),
    badgeText: "OWNER DIRECT",
    areaLine: [society, area, cityName].filter(Boolean).join(", "),
    priceLabel: priceText ? `PKR ${priceText}` : "PKR —",
    specsLine: [size && `${size} ${labelize(unit)}`, beds && `${beds} Bed`, baths && `${baths} Bath`].filter(Boolean).join(" · "),
    sellerName: "You",
    sellerTypeLabel: "Owner",
    href: "#",
  };

  return (
    <div className="mx-auto w-full max-w-[720px] px-6 pb-24 pt-6">
      <div className="mb-3.5 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => (isFirstStep ? router.back() : setStep((s) => s - 1))}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4E9F2] bg-white"
        >
          ←
        </button>
        <h3 className="m-0 font-display text-lg font-bold text-[#101828]">
          Post Property — <span className="text-[#22C55E]">FREE</span>
        </h3>
      </div>
      <div className="mb-1.5 flex gap-1">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((i) => (
          <div key={i} className="h-1.5 flex-1 rounded" style={{ background: progressColor(i) }} />
        ))}
      </div>
      <div className="mb-4.5 text-xs font-semibold text-[#667085]">{STEP_LABELS[step - 1]}</div>

      {error && (
        <p className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {step === 1 && (
        <div className="rounded-2xl bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
          <h4 className="mb-3 font-display text-base font-bold text-[#101828]">What do you want to do?</h4>
          <div className="mb-6.5 flex gap-3">
            <button type="button" onClick={() => setPurpose("SALE")} className={bigBtn(purpose === "SALE")}>
              Sell Property
            </button>
            <button type="button" onClick={() => setPurpose("RENT")} className={bigBtn(purpose === "RENT")}>
              Rent Property
            </button>
          </div>
          <h4 className="mb-3 font-display text-base font-bold text-[#101828]">Category</h4>
          <div className="mb-6.5 flex flex-wrap gap-2">
            {CATEGORY_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCategory(c);
                  setPropertyType(null);
                }}
                className={chipBtn(category === c)}
              >
                {labelize(c)}
              </button>
            ))}
          </div>
          <h4 className="mb-3 font-display text-base font-bold text-[#101828]">Property Type</h4>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2.5">
            {PROPERTY_TYPES_BY_CATEGORY[category].map((t) => (
              <button key={t} type="button" onClick={() => setPropertyType(t)} className={typeBtn(propertyType === t)}>
                {labelize(t)}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3.5 rounded-2xl bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
          <div>
            <label className={labelClass}>City</label>
            <input value={cityName} disabled className={`${inputClass} bg-[#F1F5F9]`} />
          </div>
          <div>
            <label className={labelClass}>Area</label>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="e.g. DHA Phase 6"
              className={inputClass}
              list="area-suggestions"
            />
            <datalist id="area-suggestions">
              {areas.map((a) => (
                <option key={a.id} value={a.name} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={labelClass}>Society</label>
            <input
              value={society}
              onChange={(e) => setSociety(e.target.value)}
              placeholder="e.g. DHA"
              className={inputClass}
              list="society-suggestions"
            />
            <datalist id="society-suggestions">
              {societies.map((s) => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
          </div>
          <div className="flex gap-2.5">
            <div className="flex-1">
              <label className={labelClass}>Phase</label>
              <input value={phase} onChange={(e) => setPhase(e.target.value)} className={inputClass} />
            </div>
            <div className="flex-1">
              <label className={labelClass}>Block</label>
              <input value={block} onChange={(e) => setBlock(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Street / Address</label>
            <input value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} />
          </div>
          <div className="flex h-[120px] items-center justify-center rounded-[14px] bg-gradient-to-br from-[#DDE8F5] to-[#EFF6FF] text-[13px] text-[#667085]">
            📍 Tap to pin map location
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-3.5 rounded-2xl bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
          <div className="flex gap-2.5">
            <div className="flex-1">
              <label className={labelClass}>Size</label>
              <input value={size} onChange={(e) => setSize(e.target.value)} className={inputClass} />
            </div>
            <div className="flex-1">
              <label className={labelClass}>Unit</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value as (typeof SIZE_UNITS)[number])} className={inputClass}>
                {SIZE_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {labelize(u)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>Price (PKR)</label>
            <input
              value={priceText}
              onChange={(e) => setPriceText(e.target.value)}
              placeholder="e.g. 5.25 Crore"
              className={inputClass}
            />
          </div>
          <div className="flex gap-2.5">
            <div className="flex-1">
              <label className={labelClass}>Bedrooms</label>
              <input type="number" value={beds} onChange={(e) => setBeds(e.target.value)} className={inputClass} />
            </div>
            <div className="flex-1">
              <label className={labelClass}>Bathrooms</label>
              <input type="number" value={baths} onChange={(e) => setBaths(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="flex gap-2.5">
            <div className="flex-1">
              <label className={labelClass}>Floors</label>
              <input type="number" value={floors} onChange={(e) => setFloors(e.target.value)} className={inputClass} />
            </div>
            <div className="flex-1">
              <label className={labelClass}>Parking</label>
              <input type="number" value={parking} onChange={(e) => setParking(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Furnished</label>
            <div className="flex gap-2.5">
              <button type="button" onClick={() => setFurnished(true)} className={segBtn(furnished === true)}>
                Furnished
              </button>
              <button type="button" onClick={() => setFurnished(false)} className={segBtn(furnished === false)}>
                Unfurnished
              </button>
            </div>
          </div>
          <div>
            <label className={labelClass}>Possession</label>
            <select
              value={possession}
              onChange={(e) => setPossession(e.target.value as (typeof POSSESSION_OPTIONS)[number])}
              className={inputClass}
            >
              {POSSESSION_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Construction Status</label>
            <div className="flex gap-2.5">
              <button type="button" onClick={() => setConstructed(true)} className={segBtn(constructed === true)}>
                Constructed
              </button>
              <button type="button" onClick={() => setConstructed(false)} className={segBtn(constructed === false)}>
                Under Construction
              </button>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-[13.5px] text-[#344054]">
            <input type="checkbox" checked={installments} onChange={(e) => setInstallments(e.target.checked)} />
            Installments available
          </label>
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} min-h-[90px] resize-y`}
            />
          </div>

          <div className="border-t border-[#EAEFF6] pt-3.5">
            <div className="mb-0.5 font-display text-[13px] font-bold text-[#334155]">
              Approval / Authority Information
            </div>
            <p className="mb-2.5 text-[11.5px] text-[#98A2B3]">
              Seller-provided information — not independently verified by the platform.
            </p>
            <div className="flex flex-wrap gap-2">
              {AUTHORITY_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAuthorityStatus(s)}
                  className={chipBtn(authorityStatus === s)}
                >
                  {labelize(s)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="rounded-2xl bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
          <p className="mb-4 text-[13px] text-[#667085]">
            Good photos help buyers understand your property faster.
          </p>
          <div className="mb-5 grid grid-cols-3 gap-2.5">
            {photos.map((f, i) => (
              <div key={i} className="relative h-[90px] overflow-hidden rounded-xl bg-[#DDE8F5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={URL.createObjectURL(f)} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                >
                  ×
                </button>
              </div>
            ))}
            {photos.length < 6 && (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="h-[90px] rounded-xl border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] text-2xl text-[#2563EB]"
              >
                +
              </button>
            )}
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            hidden
            onChange={(e) => addPhotos(e.target.files)}
          />
        </div>
      )}

      {step === 5 && (
        <div>
          <h4 className="mb-1 font-display text-base font-bold text-[#101828]">Preview</h4>
          <p className="mb-4 text-[12.5px] text-[#667085]">This is exactly how your listing will appear publicly.</p>
          <div className="max-w-[320px]">
            <PropertyCard data={previewData} />
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#EAEFF6] bg-white px-6 py-3.5">
        <div className="mx-auto flex max-w-[720px] gap-2.5">
          <button
            type="button"
            onClick={() => (isFirstStep ? router.back() : setStep((s) => s - 1))}
            className="flex-1 rounded-xl border-[1.5px] border-[#E4E9F2] bg-white py-3.5 font-display text-sm font-bold text-[#334155]"
          >
            Back
          </button>
          {isLastStep ? (
            <button
              type="button"
              onClick={handlePublish}
              disabled={pending}
              className="flex-[2] rounded-xl bg-gradient-to-br from-[#22C55E] to-[#0F766E] py-3.5 font-display text-sm font-extrabold text-white disabled:opacity-60"
            >
              {pending ? "Publishing..." : "Publish Property — FREE"}
            </button>
          ) : (
            <button
              type="button"
              disabled={nextDisabled}
              onClick={() => setStep((s) => s + 1)}
              className="flex-[2] rounded-xl py-3.5 font-display text-sm font-extrabold text-white disabled:cursor-not-allowed"
              style={{ background: nextDisabled ? "#CBD5E1" : "linear-gradient(135deg,#2563EB,#1D4ED8)" }}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
