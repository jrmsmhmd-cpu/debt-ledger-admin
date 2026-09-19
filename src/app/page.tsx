"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDevices: 0,
    totalLicenses: 0,
    pendingPayments: 0,
    activeLicenses: 0,
  });
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
      } else {
        setUserEmail(data.user.email ?? "");
        loadStats();
      }
    });
  }, [router]);

  async function loadStats() {
    const [devices, licenses, pending, active] = await Promise.all([
      supabase.from("devices").select("*", { count: "exact", head: true }),
      supabase.from("licenses").select("*", { count: "exact", head: true }),
      supabase.from("payments").select("*", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("licenses").select("*", { count: "exact", head: true }).eq("is_active", true),
    ]);

    setStats({
      totalDevices: devices.count ?? 0,
      totalLicenses: licenses.count ?? 0,
      pendingPayments: pending.count ?? 0,
      activeLicenses: active.count ?? 0,
    });
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-amber-400">📊 لوحة التحكم</h1>
            <p className="text-slate-400 text-sm">نظرة عامة على النظام</p>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="الأجهزة المسجلة"
            value={stats.totalDevices}
            icon="📱"
            color="from-blue-600 to-blue-800"
          />
          <StatCard
            title="التراخيص الفعّالة"
            value={stats.activeLicenses}
            icon="🔑"
            color="from-green-600 to-green-800"
          />
          <StatCard
            title="إجمالي التراخيص"
            value={stats.totalLicenses}
            icon="📋"
            color="from-purple-600 to-purple-800"
          />
          <StatCard
            title="مدفوعات معلقة"
            value={stats.pendingPayments}
            icon="⏳"
            color="from-amber-600 to-amber-800"
            highlight={stats.pendingPayments > 0}
          />
        </div>

        {/* Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <NavCard href="/settings" title="الإعدادات" desc="حدود، أسعار، إعلانات" icon="⚙️" />
          <NavCard href="/devices" title="الأجهزة" desc="إدارة الأجهزة المسجلة" icon="📱" />
          <NavCard href="/payments" title="المدفوعات" desc="الموافقة والرفض" icon="💰" />
          <NavCard href="/licenses" title="التراخيص" desc="إدارة الأكواد" icon="🔑" />
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
  highlight,
}: {
  title: string;
  value: number;
  icon: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-gradient-to-br ${color} rounded-xl p-5 border ${
        highlight ? "border-amber-400 animate-pulse" : "border-slate-700"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-3xl">{icon}</span>
        <span className="text-4xl font-bold">{value}</span>
      </div>
      <p className="text-sm opacity-90">{title}</p>
    </div>
  );
}

function NavCard({
  href,
  title,
  desc,
  icon,
}: {
  href: string;
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <Link href={href}>
      <div className="bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-amber-500 rounded-xl p-5 cursor-pointer transition-all">
        <div className="text-4xl mb-2">{icon}</div>
        <h3 className="font-bold text-lg mb-1">{title}</h3>
        <p className="text-xs text-slate-400">{desc}</p>
      </div>
    </Link>
  );
}