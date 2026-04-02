"use client";

import { useState } from "react";
import { Save, Globe, Bell, Shield, CreditCard } from "lucide-react";
import PageHeader from "@/components/dashboard/shared/PageHeader";
import { toast } from "sonner";

export default function OwnerSettings() {
  const [platform, setPlatform] = useState({
    companyName:    "Eats Platform Ltd.",
    contactEmail:   "owner@eatsplatform.co.uk",
    contactPhone:   "+44 28 0000 0000",
    defaultCurrency:"GBP",
    defaultTimezone:"Europe/London",
  });

  const [notifications, setNotifications] = useState({
    weeklySummary:     true,
    newSiteAlert:      true,
    revenueThreshold:  false,
    driverIssues:      true,
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success("Settings saved.");
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Global platform configuration" />

      <div className="space-y-6 max-w-2xl">

        {/* Platform */}
        <Section icon={Globe} title="Platform">
          <Field label="Company Name">
            <input
              value={platform.companyName}
              onChange={(e) => setPlatform((p) => ({ ...p, companyName: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="Contact Email">
            <input
              type="email"
              value={platform.contactEmail}
              onChange={(e) => setPlatform((p) => ({ ...p, contactEmail: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <Field label="Contact Phone">
            <input
              value={platform.contactPhone}
              onChange={(e) => setPlatform((p) => ({ ...p, contactPhone: e.target.value }))}
              className={inputCls}
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Default Currency">
              <select
                value={platform.defaultCurrency}
                onChange={(e) => setPlatform((p) => ({ ...p, defaultCurrency: e.target.value }))}
                className={inputCls}
              >
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
              </select>
            </Field>
            <Field label="Default Timezone">
              <select
                value={platform.defaultTimezone}
                onChange={(e) => setPlatform((p) => ({ ...p, defaultTimezone: e.target.value }))}
                className={inputCls}
              >
                <option value="Europe/London">Europe/London</option>
                <option value="Europe/Dublin">Europe/Dublin</option>
                <option value="UTC">UTC</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* Notifications */}
        <Section icon={Bell} title="Notifications">
          <Toggle label="Weekly performance summary email" checked={notifications.weeklySummary}
            onChange={(v) => setNotifications((n) => ({ ...n, weeklySummary: v }))} />
          <Toggle label="Alert when a new site goes live" checked={notifications.newSiteAlert}
            onChange={(v) => setNotifications((n) => ({ ...n, newSiteAlert: v }))} />
          <Toggle label="Revenue threshold alerts" checked={notifications.revenueThreshold}
            onChange={(v) => setNotifications((n) => ({ ...n, revenueThreshold: v }))} />
          <Toggle label="Driver issue notifications" checked={notifications.driverIssues}
            onChange={(v) => setNotifications((n) => ({ ...n, driverIssues: v }))} />
        </Section>

        {/* Security */}
        <Section icon={Shield} title="Security">
          <div className="text-sm text-gray-600 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span>Two-factor authentication</span>
              <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700 font-medium">Enabled</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span>Password last changed</span>
              <span className="font-medium text-gray-900">32 days ago</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Active sessions</span>
              <span className="font-medium text-gray-900">2 devices</span>
            </div>
          </div>
        </Section>

        {/* Billing */}
        <Section icon={CreditCard} title="Billing">
          <div className="text-sm text-gray-600 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span>Plan</span>
              <span className="font-medium text-gray-900">Enterprise</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span>Billing cycle</span>
              <span className="font-medium text-gray-900">Annual</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span>Next invoice</span>
              <span className="font-medium text-gray-900">1 Jan 2027</span>
            </div>
          </div>
        </Section>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-60"
        >
          {saving
            ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
        <Icon className="w-4 h-4 text-gray-500" />
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-600">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative rounded-full transition-colors`}
        style={{
          width: "2.5rem",
          height: "1.375rem",
          background: checked ? "#111827" : "#e5e7eb",
        }}
      >
        <span
          className="absolute top-0.5 left-0.5 bg-white rounded-full shadow transition-transform"
          style={{
            width: "1.125rem",
            height: "1.125rem",
            transform: checked ? "translateX(1.125rem)" : "translateX(0)",
          }}
        />
      </button>
    </div>
  );
}

const inputCls = "w-full h-10 px-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-gray-400 bg-white";
