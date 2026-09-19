import { useId, useState } from "react";

import {
  drugAllergySuggestions,
  isKnownDrugAllergy,
  type DrugAllergyOption,
} from "@/lib/drug-allergy-catalog";
import { cn } from "@/lib/utils";

const inputClass =
  "min-h-[48px] w-full rounded-2xl border border-sand-300 bg-white px-4 text-base text-sand-900 outline-none placeholder:text-sand-400 focus:border-teal-700 focus:ring-1 focus:ring-teal-700";

export function DrugAllergyField({
  value,
  onChange,
  notes,
  onNotesChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  notes: string;
  onNotesChange: (next: string) => void;
}) {
  const listboxId = useId();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const suggestions = drugAllergySuggestions(query, value);
  const trimmedQuery = query.trim();
  const canAddCustom =
    Boolean(trimmedQuery) &&
    !isKnownDrugAllergy(trimmedQuery) &&
    !value.some((item) => item.toLocaleLowerCase() === trimmedQuery.toLocaleLowerCase());
  const optionCount = suggestions.length + (canAddCustom ? 1 : 0);
  const safeActiveIndex = optionCount ? Math.min(activeIndex, optionCount - 1) : 0;
  const expanded = focused && Boolean(trimmedQuery) && optionCount > 0;

  function addAllergy(name: string) {
    const next = name.trim();
    if (!next || value.some((item) => item.toLocaleLowerCase() === next.toLocaleLowerCase())) return;
    onChange([...value, next]);
    setQuery("");
    setActiveIndex(0);
  }

  function selectSuggestion(option: DrugAllergyOption) {
    addAllergy(option.name);
  }

  function selectActiveOption() {
    if (safeActiveIndex < suggestions.length) {
      selectSuggestion(suggestions[safeActiveIndex]);
    } else if (canAddCustom) {
      addAllergy(trimmedQuery);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <div>
        <label htmlFor={`${listboxId}-input`} className="text-xs font-semibold text-sand-700">
          Drug or medicine name
        </label>
        <div className="relative mt-1.5">
          <input
            id={`${listboxId}-input`}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={expanded}
            aria-controls={expanded ? listboxId : undefined}
            aria-activedescendant={expanded ? `${listboxId}-option-${safeActiveIndex}` : undefined}
            autoComplete="off"
            className={inputClass}
            value={query}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 150)}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" && optionCount) {
                event.preventDefault();
                setActiveIndex((current) => (current + 1) % optionCount);
              } else if (event.key === "ArrowUp" && optionCount) {
                event.preventDefault();
                setActiveIndex((current) => (current - 1 + optionCount) % optionCount);
              } else if (event.key === "Enter" && expanded) {
                event.preventDefault();
                selectActiveOption();
              } else if (event.key === "Escape") {
                setFocused(false);
              }
            }}
            placeholder="Start typing, for example amoxicillin"
          />
          {expanded ? (
            <div
              id={listboxId}
              role="listbox"
              aria-label="Drug allergy suggestions"
              className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-2xl border border-sand-200 bg-white py-1 shadow-xl"
            >
              {suggestions.map((suggestion, index) => (
                <button
                  id={`${listboxId}-option-${index}`}
                  key={suggestion.name}
                  role="option"
                  aria-selected={safeActiveIndex === index}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectSuggestion(suggestion)}
                  className={cn(
                    "flex min-h-[48px] w-full flex-col justify-center px-4 py-2 text-left",
                    safeActiveIndex === index ? "bg-teal-50" : "active:bg-sand-100",
                  )}
                >
                  <span className="text-sm font-semibold text-sand-900">{suggestion.name}</span>
                  <span className="text-xs text-sand-500">{suggestion.category}</span>
                </button>
              ))}
              {canAddCustom ? (
                <button
                  id={`${listboxId}-option-${suggestions.length}`}
                  role="option"
                  aria-selected={safeActiveIndex === suggestions.length}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => addAllergy(trimmedQuery)}
                  className={cn(
                    "min-h-[48px] w-full border-t border-sand-100 px-4 py-2 text-left text-sm font-semibold text-teal-800",
                    safeActiveIndex === suggestions.length ? "bg-teal-50" : "active:bg-sand-100",
                  )}
                >
                  Add &ldquo;{trimmedQuery}&rdquo; as entered
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
        <p className="mt-1.5 text-xs leading-5 text-sand-600">
          Choose a suggestion or add the exact name if it is not listed.
        </p>
      </div>

      {value.length > 0 ? (
        <div aria-label="Selected drug allergies" className="flex flex-wrap gap-2">
          {value.map((allergy) => (
            <span
              key={allergy}
              className="inline-flex min-h-[44px] items-center gap-1 rounded-full bg-teal-50 pl-3 text-sm font-semibold text-teal-950 ring-1 ring-inset ring-teal-200"
            >
              {allergy}
              <button
                type="button"
                onClick={() => onChange(value.filter((item) => item !== allergy))}
                aria-label={`Remove ${allergy}`}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-lg text-teal-800 active:bg-teal-100"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <label className="block">
        <span className="text-xs font-semibold text-sand-700">Reaction details (optional)</span>
        <textarea
          className={cn(inputClass, "mt-1.5 min-h-20 py-3")}
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="For example: hives, swelling or breathing difficulty"
        />
      </label>
    </div>
  );
}
