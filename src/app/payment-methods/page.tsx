"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type PaymentMethod = {
  id: string;
  name: string;
  name_en: string | null;
  type: string;
  icon: string;
  is_active: boolean;
  display_order: number;
  config: Record<string, string>;
  description_ar: string | null;
  description_en: string | null;
};

export default function PaymentMethodsPage() {
  const router = useRouter();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
      } else {
        loadMethods();
      }
    });
  }, [router]);

  async function loadMethods() {
    const { data, error } = await supabase
      .from("payment_methods")
      .select("*")
      .order("display_order", { ascending: true });
    if (!error && data) setMethods(data as PaymentMethod[]);
    setLoading(false);
  }

  async function toggleActive(m: PaymentMethod) {
    await supabase
      .from("payment_methods")
      .update({ is_active: !m.is_active })
      .eq("id", m.id);
    loadMethods();
  }

  async function deleteMethod(id: string) {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    await supabase.from("payment_methods").delete().eq("id", id);
    loadMethods();
  }

  async function saveMethod(m: Partial<PaymentMethod>) {
    const payload = {
      name: m.name,
      name_en: m.name_en,
      type: m.type ?? "manual",
      icon: m.icon ?? "💳",
      display_order: m.display_order ?? 0,
      config: m.config ?? {},
      description_ar: m.description_ar,
      description_en: m.description_en,
      updated_at: new Date().toISOString(),
    };

    if (m.id) {
      await supabase.from("payment_methods").update(payload).eq("id", m.id);
    } else {
      await supabase.from("payment_methods").insert(payload);
    }
    setEditing(null);
    setShowAdd(false);
    loadMethods();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        جاري التحميل...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link href="/" className="text-amber-400 text-sm hover:underline">
              ← العودة للوحة
            </Link>
            <h1 className="text-3xl font-bold text-amber-400 mt-2">💳 طرق الدفع</h1>
            <p className="text-slate-400 text-sm">{methods.length} طريقة</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-4 py-2 rounded-lg"
          >
            ➕ إضافة طريقة
          </button>
        </div>

        <div className="space-y-3">
          {methods.map((m) => (
            <div
              key={m.id}
              className={`bg-slate-800 rounded-xl border p-4 ${
                m.is_active ? "border-slate-700" : "border-red-800 opacity-60"
              }`}
            >
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{m.icon}</span>
                    <h3 className="font-bold text-lg">{m.name}</h3>
                    {m.name_en && (
                      <span className="text-slate-400 text-sm">({m.name_en})</span>
                    )}
                    <span className="bg-slate-700 text-xs px-2 py-1 rounded">
                      {m.type === "manual" ? "يدوي" : "إلكتروني"}
                    </span>
                    {!m.is_active && (
                      <span className="bg-red-900 text-red-300 text-xs px-2 py-1 rounded">
                        معطّل
                      </span>
                    )}
                  </div>
                  {m.description_ar && (
                    <p className="text-sm text-slate-400 mb-2">{m.description_ar}</p>
                  )}
                  <div className="text-xs text-slate-500 font-mono bg-slate-900 p-2 rounded">
                    {Object.entries(m.config).map(([k, v]) => (
                      <div key={k}>
                        {k}: {String(v)}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => toggleActive(m)}
                    className={`text-xs px-3 py-1 rounded ${
                      m.is_active
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-green-600 hover:bg-green-700"
                    }`}
                  >
                    {m.is_active ? "تعطيل" : "تفعيل"}
                  </button>
                  <button
                    onClick={() => setEditing(m)}
                    className="text-xs px-3 py-1 rounded bg-blue-600 hover:bg-blue-700"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => deleteMethod(m.id)}
                    className="text-xs px-3 py-1 rounded bg-red-700 hover:bg-red-800"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(editing || showAdd) && (
          <MethodEditor
            method={editing}
            onSave={saveMethod}
            onCancel={() => {
              setEditing(null);
              setShowAdd(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

function MethodEditor({
  method,
  onSave,
  onCancel,
}: {
  method: PaymentMethod | null;
  onSave: (m: Partial<PaymentMethod>) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(method?.name ?? "");
  const [nameEn, setNameEn] = useState(method?.name_en ?? "");
  const [icon, setIcon] = useState(method?.icon ?? "💳");
  const [type, setType] = useState(method?.type ?? "manual");
  const [displayOrder, setDisplayOrder] = useState(method?.display_order ?? 0);
  const [description, setDescription] = useState(method?.description_ar ?? "");
  const [configJson, setConfigJson] = useState(
    JSON.stringify(method?.config ?? {}, null, 2)
  );

  function handleSave() {
    let parsedConfig: Record<string, string> = {};
    try {
      parsedConfig = JSON.parse(configJson);
    } catch {
      alert("JSON غير صالح في حقل Config");
      return;
    }
    onSave({
      id: method?.id,
      name,
      name_en: nameEn || null,
      icon,
      type,
      display_order: displayOrder,
      description_ar: description || null,
      config: parsedConfig,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-lg my-8">
        <h2 className="text-xl font-bold text-amber-400 mb-4">
          {method ? "تعديل طريقة" : "إضافة طريقة جديدة"}
        </h2>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-300">الاسم (عربي) *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300">الاسم (إنجليزي)</label>
            <input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-slate-300">الأيقونة</label>
              <input
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300">الترتيب</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-300">النوع</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="manual">يدوي</option>
              <option value="online">إلكتروني</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-300">الوصف</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="text-sm text-slate-300">
              الإعدادات (JSON) — مثال: رقم، بريد، رابط
            </label>
            <textarea
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              rows={4}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono text-xs"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleSave}
            disabled={!name}
            className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-bold py-2 rounded-lg"
          >
            حفظ
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}