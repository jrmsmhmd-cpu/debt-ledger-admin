"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type License = {
  id: string;
  device_id: string;
  code: string;
  plan_type: string;
  expires_at: string;
  activated_at: string;
  is_active: boolean;
};

export default function LicensesPage() {
  const router = useRouter();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
      } else {
        loadLicenses();
      }
    });
  }, [router]);

  async function loadLicenses() {
    const { data, error } = await supabase
      .from("licenses")
      .select("*")
      .order("activated_at", { ascending: false });
    if (!error && data) setLicenses(data as License[]);
    setLoading(false);
  }

  async function toggleLicense(id: string, current: boolean) {
    await supabase.from("licenses").update({ is_active: !current }).eq("id", id);
    loadLicenses();
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
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Link href="/" className="text-amber-400 text-sm hover:underline">
              ← العودة للوحة
            </Link>
            <h1 className="text-3xl font-bold text-amber-400 mt-2">🔑 التراخيص</h1>
            <p className="text-slate-400 text-sm">{licenses.length} ترخيص</p>
          </div>
          <button
            onClick={loadLicenses}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            🔄 تحديث
          </button>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900">
              <tr className="text-slate-400 text-sm">
                <th className="p-3 text-right">الجهاز</th>
                <th className="p-3 text-right">الخطة</th>
                <th className="p-3 text-right">ينتهي في</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-right">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {licenses.map((l) => {
                const expired = new Date(l.expires_at) < new Date();
                return (
                  <tr key={l.id} className="border-t border-slate-700 text-sm">
                    <td className="p-3 font-mono text-xs">{l.device_id}</td>
                    <td className="p-3">{l.plan_type}</td>
                    <td className="p-3 text-xs">
                      {new Date(l.expires_at).toLocaleDateString("ar")}
                      {expired && <span className="text-red-400 mr-1">(منتهي)</span>}
                    </td>
                    <td className="p-3">
                      {l.is_active && !expired ? (
                        <span className="bg-green-900 text-green-300 px-2 py-1 rounded text-xs">
                          نشط
                        </span>
                      ) : (
                        <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs">
                          معطّل
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => toggleLicense(l.id, l.is_active)}
                        className={`text-xs px-3 py-1 rounded ${
                          l.is_active
                            ? "bg-red-600 hover:bg-red-700"
                            : "bg-green-600 hover:bg-green-700"
                        }`}
                      >
                        {l.is_active ? "تعطيل" : "تفعيل"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {licenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    لا توجد تراخيص
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}