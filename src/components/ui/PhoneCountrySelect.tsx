"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Search, X, ChevronDown } from "lucide-react";

interface CountryOption { value?: string; label: string; divider?: boolean }
interface FlagIconProps  { country?: string; label?: string }

/**
 * Compact portal-based country selector for react-phone-number-input.
 * Pass as: <PhoneInput countrySelectComponent={PhoneCountrySelect} ... />
 *
 * Works in both the dashboard (CSS vars) and the register page (light fallbacks).
 */
export default function PhoneCountrySelect({ value, onChange, options, iconComponent: FlagIcon }: {
  value?:        string;
  onChange:      (v?: string) => void;
  options:       CountryOption[];
  iconComponent: React.ComponentType<FlagIconProps>;
  disabled?:     boolean;
}) {
  const [open,   setOpen]   = useState(false);
  const [search, setSearch] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);
  const [rect,  setRect]    = useState<DOMRect | null>(null);

  const openDropdown = () => {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen(true);
  };

  const close = () => { setOpen(false); setSearch(""); };

  const filtered = options.filter(
    (o) => !o.divider && o.label.toLowerCase().includes(search.toLowerCase())
  );

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative flex items-center h-full shrink-0">
      {/* Trigger */}
      <button
        ref={btnRef}
        type="button"
        onClick={openDropdown}
        className="flex items-center gap-1.5 h-full px-3 transition-colors hover:bg-black/5"
        style={{ borderRight: "1px solid var(--dash-card-border, #e5e7eb)" }}
      >
        <FlagIcon country={value} label={selected?.label ?? ""} />
        <ChevronDown className="w-3 h-3 shrink-0" style={{ color: "var(--dash-text-secondary, #6b7280)" }} />
      </button>

      {/* Portal dropdown — rendered in <body> so it's never clipped by parent overflow */}
      {open && rect && createPortal(
        <>
          {/* Backdrop */}
          <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={close} />

          {/* Dropdown */}
          <div
            className="fixed rounded-xl border shadow-2xl overflow-hidden flex flex-col"
            style={{
              zIndex:      9999,
              top:         rect.bottom + 6,
              left:        rect.left,
              width:       260,
              maxHeight:   300,
              background:  "var(--dash-card, #ffffff)",
              borderColor: "var(--dash-card-border, #e5e7eb)",
            }}
          >
            {/* Search */}
            <div className="p-2 shrink-0" style={{ borderBottom: "1px solid var(--dash-card-border, #e5e7eb)" }}>
              <div
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
                style={{ background: "var(--dash-bg, #f9fafb)" }}
              >
                <Search className="w-3 h-3 shrink-0" style={{ color: "var(--dash-text-secondary, #6b7280)" }} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search country…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 text-xs bg-transparent outline-none"
                  style={{ color: "var(--dash-text-primary, #111827)" }}
                />
                {search && (
                  <button type="button" onClick={() => setSearch("")}>
                    <X className="w-3 h-3" style={{ color: "var(--dash-text-secondary, #6b7280)" }} />
                  </button>
                )}
              </div>
            </div>

            {/* Country list */}
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <p
                  className="px-3 py-4 text-xs text-center"
                  style={{ color: "var(--dash-text-secondary, #6b7280)" }}
                >
                  No countries found
                </p>
              ) : filtered.map((o) => (
                <button
                  key={o.value ?? "intl"}
                  type="button"
                  onClick={() => { onChange(o.value); close(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-black/5 text-left"
                  style={{
                    color:      o.value === value
                      ? "var(--dash-accent, #3b82f6)"
                      : "var(--dash-text-primary, #111827)",
                    fontWeight: o.value === value ? 600 : 400,
                  }}
                >
                  <FlagIcon country={o.value} label={o.label} />
                  <span className="truncate">{o.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
