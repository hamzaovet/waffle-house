"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStaff } from "@/context/StaffContext";
import { playSound } from "@/lib/sounds";
import { Plus, X, Loader2, CircleDollarSign, Calendar } from "lucide-react";
import Link from "next/link";

interface Expense {
  id: string;
  description: string;
  amount: number;
  expenseDate: string;
  category: string;
  recordedBy?: string;
  createdAt: string;
}

const CATEGORIES = ["تشغيل", "خامات", "نظافة", "توصيل", "كهرباء وغاز", "رواتب", "أخرى"];

export default function ExpensesPage() {
  const router = useRouter();
  const { isAuthenticated, permissions, loading: authLoading, currentUser } = useStaff();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    description: "", amount: "", expenseDate: new Date().toISOString().slice(0, 10), category: CATEGORIES[0],
  });

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated || !permissions.canViewExpenses) { router.push("/login"); return; }
      load();
    }
  }, [authLoading, isAuthenticated, permissions, router]);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/expenses");
    const data = await res.json();
    setExpenses(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    setSaving(true);
    try {
      await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, amount: +form.amount, recordedBy: currentUser?.name }),
      });
      playSound("success");
      setShowForm(false);
      setForm({ description: "", amount: "", expenseDate: new Date().toISOString().slice(0, 10), category: CATEGORIES[0] });
      await load();
    } finally {
      setSaving(false);
    }
  }

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const today = expenses.filter((e) => e.expenseDate === new Date().toISOString().slice(0, 10)).reduce((s, e) => s + e.amount, 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F8F4EC] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#D4954E]" size={40} />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-[#F8F4EC] p-4 sm:p-6" style={{ fontFamily: "var(--font-cairo), system-ui, sans-serif" }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFFFFF] border border-[#E8DAC8] flex items-center justify-center text-[#D4954E] shadow-sm">
            <CircleDollarSign size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#2B170E]">إدارة المصروفات</h1>
            <p className="text-xs text-[#7E5E49]">تسجيل ومتابعة نفقات ومصاريف المحل اليومية</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="px-3.5 py-2 rounded-xl bg-[#FFFFFF] border border-[#E8DAC8] text-[#7E5E49] hover:text-[#2B170E] text-xs font-bold transition-colors shadow-sm"
          >
            الداشبورد
          </Link>
          {permissions.canAddExpense && (
            <button
              onClick={() => { setShowForm(true); playSound("click"); }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4954E] to-[#C6873E] text-white text-sm font-black flex items-center gap-1.5 shadow-sm hover:opacity-95 transition-opacity"
            >
              <Plus size={16} /> مصروف جديد
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-[#FFFFFF] border border-[#E8DAC8] rounded-2xl p-4 text-center shadow-sm">
          <div className="text-2xl font-black text-red-600">{today.toLocaleString("ar-EG")} ج</div>
          <div className="text-xs text-[#7E5E49] mt-1 font-semibold">مصروفات اليوم</div>
        </div>
        <div className="bg-[#FFFFFF] border border-[#E8DAC8] rounded-2xl p-4 text-center shadow-sm">
          <div className="text-2xl font-black text-[#C6873E]">{total.toLocaleString("ar-EG")} ج</div>
          <div className="text-xs text-[#7E5E49] mt-1 font-semibold">إجمالي المصروفات</div>
        </div>
      </div>

      {/* List */}
      <div className="bg-[#FFFFFF] border border-[#E8DAC8] rounded-2xl overflow-hidden shadow-sm">
        {expenses.length === 0 ? (
          <div className="text-center py-12 text-[#7E5E49]">لا توجد مصروفات مسجلة بعد</div>
        ) : (
          <div className="divide-y divide-[#E8DAC8]">
            {expenses.map((e) => (
              <div key={e.id} className="p-4 flex items-center justify-between hover:bg-[#FAF6EE]/50 transition-colors">
                <div>
                  <p className="font-bold text-[#2B170E]">{e.description}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs bg-[#FAF6EE] border border-[#E8DAC8] px-2.5 py-0.5 rounded-lg text-[#7E5E49] font-medium">{e.category}</span>
                    <span className="text-xs text-[#7E5E49] flex items-center gap-1">
                      <Calendar size={12} className="text-[#D4954E]" /> {e.expenseDate}
                    </span>
                    {e.recordedBy && <span className="text-[11px] text-[#A88B77]">بواسطة: {e.recordedBy}</span>}
                  </div>
                </div>
                <span className="font-black text-red-600 text-lg">{e.amount.toLocaleString("ar-EG")} ج</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-[#FFFFFF] border border-[#E8DAC8] rounded-3xl p-6 max-w-md w-full shadow-2xl animate-fadeIn text-[#2B170E]">
            <button onClick={() => setShowForm(false)} className="absolute top-4 left-4 p-1.5 rounded-xl hover:bg-[#FAF6EE] text-[#7E5E49] transition-colors"><X size={18} /></button>
            <h3 className="font-black text-[#2B170E] text-lg mb-4">إضافة مصروف جديد</h3>
            <form onSubmit={save} className="space-y-3">
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="وصف المصروف *"
                required
                className="w-full h-11 rounded-xl bg-[#FAF6EE] border border-[#E8DAC8] focus:border-[#D4954E] px-3.5 text-[#2B170E] placeholder:text-[#A88B77] text-sm outline-none transition-colors"
              />
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="المبلغ (جنيه) *"
                required
                dir="ltr"
                className="w-full h-11 rounded-xl bg-[#FAF6EE] border border-[#E8DAC8] focus:border-[#D4954E] px-3.5 text-[#2B170E] placeholder:text-[#A88B77] text-sm font-mono outline-none transition-colors"
              />
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full h-11 rounded-xl bg-[#FAF6EE] border border-[#E8DAC8] focus:border-[#D4954E] px-3 text-[#2B170E] text-sm outline-none transition-colors"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input
                type="date"
                value={form.expenseDate}
                onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                dir="ltr"
                className="w-full h-11 rounded-xl bg-[#FAF6EE] border border-[#E8DAC8] focus:border-[#D4954E] px-3.5 text-[#2B170E] text-sm outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#D4954E] to-[#C6873E] text-white font-black disabled:opacity-50 hover:opacity-95 shadow-sm transition-opacity mt-4"
              >
                {saving ? "جاري الحفظ..." : "حفظ المصروف"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
