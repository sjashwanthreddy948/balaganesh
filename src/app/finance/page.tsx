'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FESTIVAL_CONFIG } from '@/config/festival.config';
import { useRouter } from 'next/navigation';
import {
  FileText,
  IndianRupee,
  Banknote,
  Smartphone,
  Download,
  Printer,
  ArrowLeft,
  PieChart,
  Users,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Scale,
  RefreshCw,
} from 'lucide-react';

interface FinancialData {
  income: {
    totalChanda: number;
    cashChanda: number;
    onlineChanda: number;
    pendingOnlineChanda: number;
    totalContributors: number;
  };
  expenses: {
    totalExpenses: number;
    cashExpenses: number;
    onlineExpenses: number;
    totalExpenseCount: number;
  };
  balance: {
    remainingBalance: number;
    estimatedCashBalance: number;
    onlineBalance: number;
  };
  categoryBreakdown: Array<{
    category: string;
    totalAmount: number;
    count: number;
    percentage: number;
  }>;
}

export default function FinancialSummaryPage() {
  const router = useRouter();
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/financial-summary');
      if (res.ok) {
        const json = await res.json();
        setData(json.summary);
      }
    } catch (err) {
      console.error('Error fetching financial summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between">
      <div className="print:hidden">
        <Header />
      </div>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Navigation & Action Bar (Hidden in Print) */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-devotional-gold-500/20 pb-4 print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white transition-colors"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-devotional-gold-400">
                Official Festival Accounts
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white">
                FINANCIAL SUMMARY
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSummary}
              className="p-2.5 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-gray-200 hover:text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Printer className="w-4 h-4 text-devotional-gold-400" />
              <span>Print Statement</span>
            </button>

            <a
              href="/api/admin/export-financial"
              download
              className="px-4 py-2 rounded-xl btn-gold text-devotional-blue-950 text-xs font-black flex items-center gap-1.5 shadow-gold-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV Report</span>
            </a>
          </div>
        </div>

        {/* Printable Executive Statement Header */}
        <div className="text-center space-y-1 pb-2">
          <p className="text-xs font-bold text-devotional-gold-400 uppercase tracking-widest">
            {FESTIVAL_CONFIG.associationName}
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
            Ganesh Festival {FESTIVAL_CONFIG.festivalYear} — Balance Sheet
          </h2>
          <p className="text-xs text-gray-400">
            Official Audit & Fund Utilization Statement • {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {loading || !data ? (
          <div className="p-16 text-center text-devotional-gold-300 space-y-3">
            <div className="w-9 h-9 border-3 border-devotional-gold-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold">Calculating festival financials...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* HERO CARD: REMAINING BALANCE */}
            <div className="rounded-3xl border-2 border-devotional-gold-500/50 bg-gradient-to-br from-[#0c1e54] via-[#071338] to-[#050b1d] p-6 sm:p-8 text-center shadow-2xl space-y-4">
              <span className="text-xs sm:text-sm font-black tracking-widest text-devotional-gold-400 uppercase">
                REMAINING FESTIVAL BALANCE
              </span>

              <div className="text-4xl sm:text-6xl font-black text-devotional-gold-300 tracking-tight">
                ₹{data.balance.remainingBalance.toLocaleString('en-IN')}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-gray-300 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Total Chanda: <b className="text-white">₹{data.income.totalChanda.toLocaleString('en-IN')}</b></span>
                </div>
                <span className="text-devotional-gold-400 font-bold">−</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-400" />
                  <span>Total Expenses: <b className="text-white">₹{data.expenses.totalExpenses.toLocaleString('en-IN')}</b></span>
                </div>
              </div>
            </div>

            {/* THREE COLUMN SUMMARY: INCOME vs EXPENSES vs CASH/ONLINE BALANCES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. INCOME COLUMN */}
              <div className="rounded-2xl border border-emerald-500/30 bg-devotional-blue-900/50 p-5 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2.5">
                  <h3 className="font-extrabold text-emerald-400 text-sm uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>CHANDA INCOME</span>
                  </h3>
                  <span className="text-xs text-gray-400 font-bold">
                    {data.income.totalContributors} Donors
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Total Chanda Collected</span>
                    <span className="text-2xl font-black text-emerald-300">
                      ₹{data.income.totalChanda.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-devotional-gold-500/10">
                    <div className="bg-devotional-blue-950 p-2.5 rounded-xl border border-devotional-gold-500/10">
                      <span className="text-[10px] text-gray-400 block font-semibold">Cash Chanda</span>
                      <span className="text-sm font-black text-white">
                        ₹{data.income.cashChanda.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-devotional-blue-950 p-2.5 rounded-xl border border-devotional-gold-500/10">
                      <span className="text-[10px] text-gray-400 block font-semibold">Online Chanda</span>
                      <span className="text-sm font-black text-white">
                        ₹{data.income.onlineChanda.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {data.income.pendingOnlineChanda > 0 && (
                    <div className="text-[11px] text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-500/30">
                      ⏳ Pending Verification: <b>₹{data.income.pendingOnlineChanda.toLocaleString('en-IN')}</b> (excluded from balance until approved)
                    </div>
                  )}
                </div>
              </div>

              {/* 2. EXPENSES COLUMN */}
              <div className="rounded-2xl border border-rose-500/30 bg-devotional-blue-900/50 p-5 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-rose-500/20 pb-2.5">
                  <h3 className="font-extrabold text-rose-400 text-sm uppercase tracking-wider flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    <span>TOTAL EXPENSES</span>
                  </h3>
                  <span className="text-xs text-gray-400 font-bold">
                    {data.expenses.totalExpenseCount} Bills
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Total Expenses Incurred</span>
                    <span className="text-2xl font-black text-rose-300">
                      ₹{data.expenses.totalExpenses.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-devotional-gold-500/10">
                    <div className="bg-devotional-blue-950 p-2.5 rounded-xl border border-devotional-gold-500/10">
                      <span className="text-[10px] text-gray-400 block font-semibold">Cash Expenses</span>
                      <span className="text-sm font-black text-white">
                        ₹{data.expenses.cashExpenses.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="bg-devotional-blue-950 p-2.5 rounded-xl border border-devotional-gold-500/10">
                      <span className="text-[10px] text-gray-400 block font-semibold">Online Expenses</span>
                      <span className="text-sm font-black text-white">
                        ₹{data.expenses.onlineExpenses.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-gray-400 pt-1">
                    Receipt copies stored with committee auditor.
                  </p>
                </div>
              </div>

              {/* 3. CASH & BANK LIQUIDITY */}
              <div className="rounded-2xl border border-devotional-gold-500/40 bg-devotional-blue-900/50 p-5 space-y-4 shadow-lg">
                <div className="flex items-center justify-between border-b border-devotional-gold-500/20 pb-2.5">
                  <h3 className="font-extrabold text-devotional-gold-300 text-sm uppercase tracking-wider flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    <span>LIQUIDITY STATUS</span>
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Cash in Hand */}
                  <div className="bg-devotional-blue-950 p-3 rounded-xl border border-emerald-500/30 space-y-1">
                    <div className="flex items-center justify-between text-emerald-400 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5" /> Cash in Hand
                      </span>
                      <span className="text-base font-black">
                        ₹{data.balance.estimatedCashBalance.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      ₹{data.income.cashChanda.toLocaleString('en-IN')} received − ₹{data.expenses.cashExpenses.toLocaleString('en-IN')} spent
                    </p>
                  </div>

                  {/* Online / Bank Balance */}
                  <div className="bg-devotional-blue-950 p-3 rounded-xl border border-devotional-gold-500/30 space-y-1">
                    <div className="flex items-center justify-between text-devotional-gold-300 font-bold">
                      <span className="flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5" /> Online Bank Balance
                      </span>
                      <span className="text-base font-black">
                        ₹{data.balance.onlineBalance.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      ₹{data.income.onlineChanda.toLocaleString('en-IN')} received − ₹{data.expenses.onlineExpenses.toLocaleString('en-IN')} spent
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* EXPENSE BREAKDOWN BY CATEGORY */}
            <div className="rounded-3xl border border-devotional-gold-500/30 bg-devotional-blue-900/40 p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-devotional-gold-500/20 pb-3">
                <div>
                  <h3 className="font-black text-devotional-gold-300 text-base flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-devotional-gold-400" />
                    <span>SPENDING BREAKDOWN BY CATEGORY</span>
                  </h3>
                  <p className="text-xs text-gray-400">
                    Distribution of funds across pandal festival requirements
                  </p>
                </div>
                <span className="text-xs font-bold text-devotional-gold-400">
                  Total: ₹{data.expenses.totalExpenses.toLocaleString('en-IN')}
                </span>
              </div>

              {data.categoryBreakdown.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">
                  No expenses categorized yet.
                </p>
              ) : (
                <div className="space-y-4">
                  {data.categoryBreakdown.map((cat) => (
                    <div key={cat.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-white flex items-center gap-2">
                          <span>{cat.category}</span>
                          <span className="text-[10px] text-gray-400 font-normal">
                            ({cat.count} {cat.count === 1 ? 'bill' : 'bills'})
                          </span>
                        </span>
                        <div className="space-x-3">
                          <span className="text-devotional-gold-300">
                            ₹{cat.totalAmount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            {cat.percentage}%
                          </span>
                        </div>
                      </div>

                      {/* Visual Bar */}
                      <div className="w-full h-2.5 rounded-full bg-devotional-blue-950 overflow-hidden border border-devotional-gold-500/20">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-devotional-gold-500 to-amber-400 transition-all duration-500"
                          style={{ width: `${Math.max(cat.percentage, 2)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* COMMITTEE AUDIT FOOTER */}
            <div className="text-center text-xs text-gray-400 border-t border-devotional-gold-500/20 pt-6 space-y-1">
              <p className="font-semibold text-devotional-gold-200">
                {FESTIVAL_CONFIG.associationName} Executive Committee
              </p>
              <p className="text-[11px]">
                {FESTIVAL_CONFIG.associationAddress} • Contact: {FESTIVAL_CONFIG.contactNumber}
              </p>
              <p className="text-[10px] font-mono pt-1 text-gray-500">
                Generated from verified tamper-evident ledger records.
              </p>
            </div>
          </div>
        )}
      </main>

      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
}
