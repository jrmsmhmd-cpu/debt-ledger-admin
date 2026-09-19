"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Device = {
  device_id: string;
  first_seen: string;
  last_seen: string;
  app_version: string | null;
  language: string | null;
  is_banned: boolean;
};

export default function DevicesPage() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
      } else {
        loadDevices();
      }
    });
  }, [router]);

  async function loadDevices() {
    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .order("last_seen", { ascending: false });

    if (!error && data) setDevices(data as Device[]);
    setLoading(false);
  }

  async function toggleBan(deviceId: string, current: boolean) {
    await supabase
      .from("devices")
      .update({ is_banned: !current })
      .eq("device_id", deviceId);
    loadDevices();
  }

  const filtered = devices.filter(
    (d) =>
      d.device_id.toLowerCase().includes(search.toLowerCase()) ||
      (d.app_version ?? "").toLowerCase().includes(search.toLowerCase())
  );

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
            <h1 className="text-3xl font-bold text-amber-400 mt-2">📱 الأجهزة المسجلة</h1>
            <p className="text-slate-400 text-sm">{devices.length} جهاز</p>
          </div>
          <button
            onClick={loadDevices}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            🔄 تحديث
          </button>
        </div>

        <input
          type="text"
          placeholder="🔍 بحث بـ device_id أو الإصدار..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white mb-4 outline-none focus:border-amber-500"
        />

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900">
              <tr className="text-slate-400 text-sm">
                <th className="p-3 text-right">معرف الجهاز</th>
                <th className="p-3 text-right">الإصدار</th>
                <th className="p-3 text-right">اللغة</th>
                <th className="p-3 text-right">آخر ظهور</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-right">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.device_id} className="border-t border-slate-700 text-sm">
                  <td className="p-3 font-mono text-xs">{d.device_id}</td>
                  <td className="p-3 text-slate-400">{d.app_version ?? "-"}</td>
                  <td className="p-3 text-slate-400">{d.language ?? "-"}</td>
                  <td className="p-3 text-slate-400 text-xs">
                    {new Date(d.last_seen).toLocaleString("ar")}
                  </td>
                  <td className="p-3">
                    {d.is_banned ? (
                      <span className="bg-red-900 text-red-300 px-2 py-1 rounded text-xs">محظور</span>
                    ) : (
                      <span className="bg-green-900 text-green-300 px-2 py-1 rounded text-xs">نشط</span>
                    )}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleBan(d.device_id, d.is_banned)}
                      className={`text-xs px-3 py-1 rounded ${
                        d.is_banned
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      {d.is_banned ? "رفع الحظر" : "حظر"}
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    لا يوجد أجهزة
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