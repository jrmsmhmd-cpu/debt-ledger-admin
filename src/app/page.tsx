"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase, type RemoteSettings } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [settings, setSettings] = useState<RemoteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
      } else {
        setUserEmail(data.user.email ?? "");
        fetchSettings();
      }
    });
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  async function fetchSettings() {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) {
      setMessage("خطأ في جلب الإعدادات: " + error.message);
    } else {
      setSettings(data as RemoteSettings);
    }
    setLoading(false);
  }

  async function saveSettings() {
    if (!settings) return;
    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("admin_settings")
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
      })
      .eq("id", 1);

    if (error) {
      setMessage("❌ خطأ: " + error.message);
    } else {
      setMessage("✅ تم الحفظ بنجاح");
    }
    setSaving(false);
  }

  function update<K extends keyof RemoteSettings>(key: K, value: RemoteSettings[K]) {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-red-400">
        <div className="text-xl">{message || "فشل تحميل الإعدادات"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-amber-400">
              لوحة تحكم دفتر الديون
            </h1>
            <p className="text-slate-400">إدارة كاملة للإعدادات من مكان واحد</p>
          </div>
          <div className="text-left">
            <p className="text-xs text-slate-400 mb-1">{userEmail}</p>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-lg"
            >
              🚪 خروج
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.startsWith("✅") 
              ? "bg-green-900/40 text-green-300 border border-green-700" 
              : "bg-red-900/40 text-red-300 border border-red-700"
          }`}>
            {message}
          </div>
        )}

        <Section title="📊 الحدود المجانية">
          <NumberField
            label="حد العملاء"
            value={settings.free_max_customers}
            onChange={(v) => update("free_max_customers", v)}
          />
          <NumberField
            label="حد المعاملات"
            value={settings.free_max_transactions}
            onChange={(v) => update("free_max_transactions", v)}
          />
          <NumberField
            label="حد تصدير PDF شهرياً"
            value={settings.free_max_pdf}
            onChange={(v) => update("free_max_pdf", v)}
          />
          <NumberField
            label="حد رسائل المساعد يومياً"
            value={settings.free_max_assistant}
            onChange={(v) => update("free_max_assistant", v)}
          />
        </Section>

        <Section title="🎛️ الميزات">
          <ToggleField
            label="عرض الإعلانات للمستخدم المجاني"
            value={settings.show_ads}
            onChange={(v) => update("show_ads", v)}
          />
          <ToggleField
            label="السماح بالمزامنة السحابية للمجاني"
            value={settings.allow_cloud_sync_free}
            onChange={(v) => update("allow_cloud_sync_free", v)}
          />
          <ToggleField
            label="السماح بالبصمة للمجاني"
            value={settings.allow_biometric_free}
            onChange={(v) => update("allow_biometric_free", v)}
          />
        </Section>

        <Section title="💰 الأسعار (USD)">
          <NumberField
            label="سعر شهري"
            value={settings.price_monthly}
            onChange={(v) => update("price_monthly", v)}
            step={0.5}
          />
          <NumberField
            label="سعر 3 أشهر"
            value={settings.price_3months}
            onChange={(v) => update("price_3months", v)}
            step={0.5}
          />
          <NumberField
            label="سعر 6 أشهر"
            value={settings.price_6months}
            onChange={(v) => update("price_6months", v)}
            step={0.5}
          />
        </Section>

        <Section title="📱 بيانات الدفع">
          <TextField
            label="رقم الدفع"
            value={settings.payment_number}
            onChange={(v) => update("payment_number", v)}
          />
          <TextField
            label="رقم واتساب"
            value={settings.whatsapp_number}
            onChange={(v) => update("whatsapp_number", v)}
          />
          <NumberField
            label="أيام التجربة المجانية"
            value={settings.trial_days}
            onChange={(v) => update("trial_days", v)}
          />
        </Section>

        <div className="flex gap-4 mt-8">
          <button
            onClick={saveSettings}
            disabled={saving}
            className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-bold px-8 py-3 rounded-lg"
          >
            {saving ? "جاري الحفظ..." : "💾 حفظ التغييرات"}
          </button>
          <button
            onClick={fetchSettings}
            className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-8 py-3 rounded-lg"
          >
            🔄 إعادة تحميل
          </button>
        </div>

        {settings.updated_at && (
          <p className="text-slate-500 text-sm mt-4">
            آخر تحديث: {new Date(settings.updated_at).toLocaleString("ar")}
          </p>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800 rounded-xl p-6 mb-6 border border-slate-700">
      <h2 className="text-xl font-bold mb-4 text-amber-300">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  const [text, setText] = useState(String(value));
  const focusedRef = useRef(false);

  useEffect(() => {
    if (!focusedRef.current) {
      setText(String(value));
    }
  }, [value]);

  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1">{label}</label>
      <input
        type="text"
        inputMode="decimal"
        value={text}
        onFocus={() => { focusedRef.current = true; }}
        onChange={(e) => {
          const raw = e.target.value;
          setText(raw);
          if (raw === "" || raw === "-") return;
          const num = Number(raw);
          if (!isNaN(num)) {
            onChange(num);
          }
        }}
        onBlur={() => {
          focusedRef.current = false;
          if (text === "" || isNaN(Number(text))) {
            setText(String(value));
          } else {
            onChange(Number(text));
          }
        }}
        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm text-slate-300 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-amber-500 outline-none"
      />
    </div>
  );
}

function ToggleField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between bg-slate-900 rounded-lg px-4 py-3">
      <span className="text-sm text-slate-300">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-14 h-7 rounded-full transition ${
          value ? "bg-green-600" : "bg-slate-600"
        }`}
      >
        <span
          className={`absolute top-1 w-5 h-5 bg-white rounded-full transition ${
            value ? "right-1" : "right-8"
          }`}
        />
      </button>
    </div>
  );
}