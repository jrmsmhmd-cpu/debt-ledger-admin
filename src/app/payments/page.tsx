"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Payment = {
  id: string;
  device_id: string;
  plan_type: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  proof_url: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

const PLAN_DAYS: Record<string, number> = {
  monthly: 30,
  threeMonths: 90,
  sixMonths: 180,
};

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
      } else {
        loadPayments();
      }
    });
  }, [router]);

  async function loadPayments() {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setPayments(data as Payment[]);
    setLoading(false);
  }

  async function approve(p: Payment) {
    // 1. توليد كود التفعيل
    const days = PLAN_DAYS[p.plan_type] ?? 30;
    const expiry = Date.now() + days * 24 * 60 * 60 * 1000;

    // 2. توليد التوقيع (HMAC) — نفس منطق التطبيق
    const secret = "dk7XpL9mQw2RvY5ZaB4Nc8Ef1Hs6Tg0Ju";
    const payload = `${p.device_id}-${expiry}`;
    const signature = await hmacSha256(secret, payload);

    const code = `${payload}-${signature}`;

    // 3. تسجيل الترخيص
    await supabase.from("licenses").insert({
      device_id: p.device_id,
      code,
      plan_type: p.plan_type,
      expires_at: new Date(expiry).toISOString(),
      is_active: true,
    });

    // 4. تحديث حالة الدفعة
    await supabase
      .from("payments")
      .update({
        status: "approved",
        admin_note: code,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", p.id);

    // 5. نسخ الكود للحافظة
    await navigator.clipboard.writeText(code);
    alert(`✅ تمت الموافقة\n\nكود التفعيل (تم نسخه):\n${code}`);
    loadPayments();
  }

  async function reject(p: Payment) {
    const note = prompt("سبب الرفض:", "لم يتم استلام الدفع");
    if (note === null) return;

    await supabase
      .from("payments")
      .update({
        status: "rejected",
        admin_note: note,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", p.id);

    loadPayments();
  }

  const filtered = filter === "all" ? payments : payments.filter((p) => p.status === filter);

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
            <h1 className="text-3xl font-bold text-amber-400 mt-2">💰 المدفوعات</h1>
          </div>
          <button
            onClick={loadPayments}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm"
          >
            🔄 تحديث
          </button>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { k: "pending", l: "⏳ معلقة" },
            { k: "approved", l: "✅ موافق عليها" },
            { k: "rejected", l: "❌ مرفوضة" },
            { k: "all", l: "📋 الكل" },
          ].map((f) => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              className={`px-4 py-2 rounded-lg text-sm ${
                filter === f.k
                  ? "bg-amber-500 text-slate-900 font-bold"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((p) => (
            <div key={p.id} className="bg-slate-800 rounded-xl border border-slate-700 p-4">
              <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={p.status} />
                    <span className="text-sm text-slate-400">
                      {new Date(p.created_at).toLocaleString("ar")}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-slate-400 mb-1">
                    {p.device_id}
                  </p>
                  <p className="text-sm">
                    <span className="text-amber-400 font-bold">
                      {p.plan_type}
                    </span>{" "}
                    — {p.amount} {p.currency}
                  </p>
                  {p.admin_note && (
                    <p className="text-xs text-slate-500 mt-2 break-all">
                      كود: {p.admin_note}
                    </p>
                  )}
                </div>

                {p.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => approve(p)}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-lg"
                    >
                      ✅ موافقة
                    </button>
                    <button
                      onClick={() => reject(p)}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-lg"
                    >
                      ❌ رفض
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center text-slate-500">
              لا توجد مدفوعات في هذه الفئة
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending: "bg-amber-900 text-amber-300",
    approved: "bg-green-900 text-green-300",
    rejected: "bg-red-900 text-red-300",
  } as Record<string, string>;
  const labels = {
    pending: "⏳ معلقة",
    approved: "✅ موافق عليها",
    rejected: "❌ مرفوضة",
  } as Record<string, string>;

  return (
    <span className={`text-xs px-2 py-1 rounded ${styles[status] ?? "bg-slate-700"}`}>
      {labels[status] ?? status}
    </span>
  );
}

// HMAC-SHA256 (نفس منطق التطبيق — 8 بايت = 16 حرف hex)
async function hmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  const bytes = new Uint8Array(sig).slice(0, 8);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}