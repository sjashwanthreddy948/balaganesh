'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ImageLightboxModal from '@/components/ImageLightboxModal';
import MobileBottomNav from '@/components/MobileBottomNav';
import { EXPENSE_CATEGORIES } from '@/lib/validation';
import { useRouter } from 'next/navigation';
import {
  PlusCircle,
  Receipt,
  Search,
  Calendar,
  Banknote,
  Smartphone,
  Trash2,
  Edit2,
  Eye,
  Camera,
  Image as ImageIcon,
  X,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  FileSpreadsheet,
  Scale,
  User,
} from 'lucide-react';

interface ExpenseItem {
  id: string;
  expenseNumber: string;
  shopName: string;
  category: string;
  description?: string | null;
  amount: number;
  paymentMethod: 'CASH' | 'ONLINE';
  date: string;
  notes?: string | null;
  billImage?: string | null;
  enteredBy: string;
  addedByName: string;
  createdAt: string;
}

interface FinancialSummaryData {
  income: {
    totalChanda: number;
    cashChanda: number;
    onlineChanda: number;
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
  categoryBreakdown: {
    category: string;
    totalAmount: number;
    count: number;
    percentage: number;
  }[];
}

export default function ExpensesPage() {
  const router = useRouter();

  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'ADMIN' | 'VOLUNTEER' | null>(null);
  const [currentUserName, setCurrentUserName] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'CASH' | 'ONLINE'>('ALL');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null);
  const [viewingBillUrl, setViewingBillUrl] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Add Form Inputs
  const [shopName, setShopName] = useState('');
  const [enteredBy, setEnteredBy] = useState('');
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE'>('CASH');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [billFile, setBillFile] = useState<File | null>(null);
  const [billPreview, setBillPreview] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // File input refs for Camera vs Gallery
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const fetchExpensesAndSummary = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Session check
      const meRes = await fetch('/api/auth/me');
      if (meRes.ok) {
        const meJson = await meRes.json();
        setUserRole(meJson.user.role);
        setCurrentUserName(meJson.user.name || '');
      } else {
        router.replace('/login?redirect=/expenses');
        return;
      }

      // 2. Fetch Financial Summary (Remaining Balance & Totals)
      const sumRes = await fetch('/api/admin/financial-summary');
      if (sumRes.ok) {
        const sumJson = await sumRes.json();
        setFinancialSummary(sumJson.summary);
      }

      // 3. Fetch Expenses list
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (methodFilter !== 'ALL') params.append('method', methodFilter);
      if (dateFilter !== 'all') params.append('dateRange', dateFilter);

      const res = await fetch(`/api/expenses?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setExpenses(json.data);
      }
    } catch (err) {
      console.error('Error loading expenses & summary:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, categoryFilter, methodFilter, dateFilter, router]);

  useEffect(() => {
    fetchExpensesAndSummary();
  }, [fetchExpensesAndSummary]);

  // Handle Photo selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        setFormError('Receipt image size must be less than 8MB.');
        return;
      }
      setBillFile(file);
      setBillPreview(URL.createObjectURL(file));
      setFormError(null);
    }
  };

  // Submit Add Expense
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const parsedAmount = parseInt(amount, 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid amount.');
      return;
    }

    if (!enteredBy.trim()) {
      setFormError('Please enter who is recording this expense.');
      return;
    }

    const finalCategory = category === 'Other' ? customCategory.trim() : category;
    if (!finalCategory) {
      setFormError('Please select or specify an expense category.');
      return;
    }

    setFormSubmitting(true);

    try {
      let uploadedBillUrl: string | null = null;
      if (billFile) {
        const formData = new FormData();
        formData.append('file', billFile);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadJson = await uploadRes.json();
        if (uploadRes.ok && uploadJson.url) {
          uploadedBillUrl = uploadJson.url;
        }
      }

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName,
          category: finalCategory,
          description: description || undefined,
          amount: parsedAmount,
          paymentMethod,
          date,
          notes: notes || undefined,
          billImage: uploadedBillUrl,
          enteredBy: enteredBy.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error || 'Failed to save expense');
        setFormSubmitting(false);
        return;
      }

      // Reset form & close modal
      setShowAddModal(false);
      setShopName('');
      setEnteredBy('');
      setDescription('');
      setAmount('');
      setNotes('');
      setBillFile(null);
      setBillPreview(null);
      fetchExpensesAndSummary();
    } catch {
      setFormError('Server error while saving expense.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Save Edit Expense (Admin)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    try {
      const res = await fetch(`/api/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: editingExpense.shopName,
          category: editingExpense.category,
          description: editingExpense.description || undefined,
          amount: editingExpense.amount,
          paymentMethod: editingExpense.paymentMethod,
          date: editingExpense.date,
          notes: editingExpense.notes || undefined,
          enteredBy: editingExpense.enteredBy || undefined,
        }),
      });

      if (res.ok) {
        setEditingExpense(null);
        fetchExpensesAndSummary();
      }
    } catch (err) {
      console.error('Error updating expense:', err);
    }
  };

  // Delete Expense (Admin)
  const handleDeleteExpense = async (id: string) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeletingId(null);
        fetchExpensesAndSummary();
      }
    } catch (err) {
      console.error('Error deleting expense:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between pb-24 md:pb-8">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Top Header & Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-devotional-gold-500/20 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white transition-colors"
              title="Back to Chanda Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-devotional-gold-400">
                Festival Expenditures & Net Balance
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                <Receipt className="w-6 h-6 text-devotional-gold-300" />
                <span>EXPENSES & REMAINING AMOUNT</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/admin/export-financial"
              download
              className="px-3.5 py-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-devotional-gold-200 hover:text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export Report CSV</span>
            </a>

            <button
              onClick={fetchExpensesAndSummary}
              className="p-2.5 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white"
              title="Refresh Expenses & Balance"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* PROMINENT REMAINING AMOUNT HERO CARD */}
        {financialSummary && (
          <div className="rounded-3xl border-2 border-devotional-gold-500/50 bg-gradient-to-br from-[#0c1e54] via-[#071338] to-[#050b1d] p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-devotional-gold-500/20 pb-3">
              <div>
                <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-devotional-gold-400 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-devotional-gold-400" />
                  <span>Net Festival Liquidity</span>
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">
                  REMAINING AMOUNT:{' '}
                  <span
                    className={
                      financialSummary.balance.remainingBalance >= 0
                        ? 'text-emerald-300'
                        : 'text-rose-400'
                    }
                  >
                    ₹{financialSummary.balance.remainingBalance.toLocaleString('en-IN')}
                  </span>
                </h2>
                <p className="text-xs text-gray-300 mt-1">
                  Total Chanda (₹{financialSummary.income.totalChanda.toLocaleString('en-IN')}) − Total Expenses (₹{financialSummary.expenses.totalExpenses.toLocaleString('en-IN')})
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-gray-400 block">Total Bills Recorded</span>
                <span className="text-xl font-black text-devotional-gold-300">
                  {financialSummary.expenses.totalExpenseCount}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-devotional-blue-950/80 p-3.5 rounded-2xl border border-rose-500/30 space-y-1">
                <span className="text-gray-400 block text-[11px]">Total Expenses Paid</span>
                <span className="text-lg sm:text-xl font-black text-rose-300">
                  ₹{financialSummary.expenses.totalExpenses.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-gray-400 block">All vendor expenditures</span>
              </div>

              <div className="bg-devotional-blue-950/80 p-3.5 rounded-2xl border border-emerald-500/30 space-y-1">
                <span className="text-gray-400 block text-[11px]">Cash in Hand</span>
                <span className="text-lg sm:text-xl font-black text-emerald-300">
                  ₹{financialSummary.balance.estimatedCashBalance.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-gray-400 block">
                  Cash Chanda − Cash Expenses
                </span>
              </div>

              <div className="bg-devotional-blue-950/80 p-3.5 rounded-2xl border border-devotional-gold-500/30 space-y-1">
                <span className="text-gray-400 block text-[11px]">Online Bank Balance</span>
                <span className="text-lg sm:text-xl font-black text-devotional-gold-300">
                  ₹{financialSummary.balance.onlineBalance.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-gray-400 block">
                  Verified Online − Online Exp.
                </span>
              </div>

              <div className="bg-devotional-blue-950/80 p-3.5 rounded-2xl border border-devotional-gold-500/30 space-y-1">
                <span className="text-gray-400 block text-[11px]">Total Chanda Collected</span>
                <span className="text-lg sm:text-xl font-black text-white">
                  ₹{financialSummary.income.totalChanda.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-gray-400 block">
                  {financialSummary.income.totalContributors} verified donors
                </span>
              </div>
            </div>

            {/* Category Breakdown Bars */}
            {financialSummary.categoryBreakdown.length > 0 && (
              <div className="border-t border-devotional-gold-500/15 pt-3 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-devotional-gold-300">
                  Category Spending Distribution
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
                  {financialSummary.categoryBreakdown.map((cat) => (
                    <div
                      key={cat.category}
                      className="bg-devotional-blue-950/90 p-2 rounded-xl border border-devotional-gold-500/15 flex flex-col justify-between gap-1"
                    >
                      <div className="flex justify-between items-center text-gray-300">
                        <span className="font-semibold text-white truncate">{cat.category}</span>
                        <span className="font-bold text-rose-300">₹{cat.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full bg-devotional-blue-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-devotional-gold-400 h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(5, cat.percentage))}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-gray-400 text-right">{cat.percentage}% of expenses</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* PRIMARY CTA: [ + ADD EXPENSE ] */}
        <button
          onClick={() => {
            setShowAddModal(true);
          }}
          className="w-full py-4 px-6 rounded-2xl btn-gold text-devotional-blue-950 font-black text-lg tracking-wide shadow-gold-md flex items-center justify-center gap-3 transition-transform active:scale-[0.99]"
        >
          <PlusCircle className="w-6 h-6" />
          <span>+ ADD EXPENSE</span>
        </button>

        {/* SEARCH AND FILTERS */}
        <div className="bg-devotional-blue-900/50 border border-devotional-gold-500/20 p-3.5 rounded-2xl space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by shop/vendor, entered by person, expense #, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/20 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-devotional-gold-400"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Category Filter */}
            <div className="flex items-center gap-1 bg-devotional-blue-950 p-1 rounded-xl border border-devotional-gold-500/20">
              <span className="text-[10px] text-gray-400 px-2 font-semibold">CATEGORY:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-white text-xs font-bold focus:outline-none pr-2 cursor-pointer"
              >
                <option value="ALL" className="bg-devotional-blue-950">
                  ALL CATEGORIES
                </option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-devotional-blue-950">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Method Filter */}
            <div className="flex items-center gap-1 bg-devotional-blue-950 p-1 rounded-xl border border-devotional-gold-500/20">
              <span className="text-[10px] text-gray-400 px-2 font-semibold">METHOD:</span>
              {(['ALL', 'CASH', 'ONLINE'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethodFilter(m)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    methodFilter === m
                      ? 'bg-devotional-gold-500 text-devotional-blue-950 shadow-sm'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-1 bg-devotional-blue-950 p-1 rounded-xl border border-devotional-gold-500/20">
              <Calendar className="w-3 h-3 text-gray-400 ml-1.5" />
              {(['all', 'today', 'week', 'month'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDateFilter(d)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold capitalize transition-all ${
                    dateFilter === d
                      ? 'bg-devotional-gold-500 text-devotional-blue-950 shadow-sm'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* EXPENSES TABLE */}
        <div className="rounded-2xl border border-devotional-gold-500/30 bg-devotional-blue-900/40 overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-devotional-gold-300 space-y-2">
              <div className="w-8 h-8 border-2 border-devotional-gold-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Loading expenses...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="p-12 text-center text-gray-400 space-y-2">
              <Receipt className="w-8 h-8 mx-auto text-gray-500" />
              <p className="text-sm font-semibold">No expenses recorded matching your criteria.</p>
              <p className="text-xs text-gray-500">
                Click &quot;+ ADD EXPENSE&quot; above to log your first expenditure.
              </p>
            </div>
          ) : (
            <div>
              {/* 1. MOBILE EXPENSE CARDS VIEW (md:hidden) */}
              <div className="md:hidden space-y-3 p-3">
                {expenses.map((e) => {
                  const isCash = e.paymentMethod === 'CASH';

                  return (
                    <div
                      key={e.id}
                      className="rounded-2xl border border-devotional-gold-500/30 bg-[#06102f]/90 p-4 space-y-3 shadow-lg"
                    >
                      {/* Shop / Vendor & Amount */}
                      <div className="flex items-start justify-between gap-2 border-b border-devotional-gold-500/15 pb-2.5">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-base text-white truncate">
                            {e.shopName}
                          </h4>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            Entered by: <b className="text-gray-200">{e.enteredBy || e.addedByName}</b>
                          </p>
                          {e.description && (
                            <p className="text-xs text-gray-300 line-clamp-2 mt-1">
                              {e.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-lg font-black text-rose-300 block">
                            ₹{e.amount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {new Date(e.date).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Badges: Category, Method & Expense Number */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-devotional-blue-950 border border-devotional-gold-500/30 text-devotional-gold-200">
                            {e.category}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isCash
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                : 'bg-devotional-blue-950 text-devotional-gold-300 border border-devotional-gold-500/30'
                            }`}
                          >
                            {e.paymentMethod}
                          </span>
                        </div>

                        <span className="font-mono text-[11px] text-devotional-gold-400 font-bold bg-devotional-blue-950 px-2 py-0.5 rounded-md border border-devotional-gold-500/20">
                          {e.expenseNumber}
                        </span>
                      </div>

                      {/* Notes if present */}
                      {e.notes && (
                        <p className="text-[11px] text-gray-400 italic bg-devotional-blue-950/40 px-2.5 py-1 rounded-lg border border-devotional-gold-500/10">
                          Note: {e.notes}
                        </p>
                      )}

                      {/* Action Buttons Row */}
                      <div className="flex items-center gap-2 pt-1 border-t border-devotional-gold-500/15">
                        {/* View Bill Button */}
                        {e.billImage ? (
                          <button
                            type="button"
                            onClick={() => setViewingBillUrl(e.billImage || null)}
                            className="flex-1 py-2 px-3 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/40 text-devotional-gold-200 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                            <span>View Bill</span>
                          </button>
                        ) : (
                          <span className="flex-1 py-2 px-3 rounded-xl bg-devotional-blue-950/40 border border-white/5 text-gray-500 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed">
                            <span>No Bill</span>
                          </span>
                        )}

                        {/* Admin Edit */}
                        {userRole === 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => setEditingExpense(e)}
                            className="p-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white text-xs active:scale-95 transition-all"
                            title="Edit Expense"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Admin Delete */}
                        {userRole === 'ADMIN' && (
                          <button
                            type="button"
                            onClick={() => setDeletingId(e.id)}
                            className="p-2 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 hover:text-white text-xs active:scale-95 transition-all"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 2. DESKTOP TABLE VIEW (hidden md:block) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-devotional-gold-500/20 bg-devotional-blue-950/70 text-[10px] sm:text-[11px] font-extrabold tracking-wider text-devotional-gold-300 uppercase">
                      <th className="py-3 px-3 sm:px-4">Expense No</th>
                      <th className="py-3 px-3 sm:px-4">Shop / Vendor</th>
                      <th className="py-3 px-3 sm:px-4">Category</th>
                      <th className="py-3 px-3 sm:px-4">Amount</th>
                      <th className="py-3 px-3 sm:px-4">Method</th>
                      <th className="py-3 px-3 sm:px-4">Date</th>
                      <th className="py-3 px-3 sm:px-4">Entered By</th>
                      <th className="py-3 px-3 sm:px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-devotional-gold-500/10 text-xs">
                    {expenses.map((e) => {
                      const isCash = e.paymentMethod === 'CASH';
                      return (
                        <tr
                          key={e.id}
                          className="hover:bg-devotional-blue-900/60 transition-colors"
                        >
                          <td className="py-3 px-3 sm:px-4 font-mono font-bold text-devotional-gold-200 whitespace-nowrap">
                            {e.expenseNumber}
                          </td>
                          <td className="py-3 px-3 sm:px-4">
                            <p className="font-bold text-white">{e.shopName}</p>
                            {e.description && (
                              <p className="text-[11px] text-gray-400 line-clamp-1">
                                {e.description}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-3 sm:px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-devotional-blue-950 border border-devotional-gold-500/30 text-devotional-gold-200">
                              {e.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 sm:px-4 font-black text-rose-300 text-sm whitespace-nowrap">
                            ₹{e.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 sm:px-4">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isCash
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-devotional-blue-950 text-devotional-gold-300 border border-devotional-gold-500/30'
                              }`}
                            >
                              {e.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3 px-3 sm:px-4 text-gray-300 whitespace-nowrap">
                            {new Date(e.date).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-3 px-3 sm:px-4 text-white font-semibold whitespace-nowrap">
                            {e.enteredBy || e.addedByName}
                          </td>
                          <td className="py-3 px-3 sm:px-4 text-right space-x-1.5 whitespace-nowrap">
                            {/* View Bill Button */}
                            {e.billImage ? (
                              <button
                                onClick={() => setViewingBillUrl(e.billImage || null)}
                                className="p-1.5 rounded-lg bg-devotional-blue-950 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white"
                                title="View Bill / Receipt"
                              >
                                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                              </button>
                            ) : (
                              <span className="p-1.5 inline-block text-gray-600" title="No Bill Attached">
                                <Eye className="w-3.5 h-3.5 opacity-30" />
                              </span>
                            )}

                            {/* Admin Edit */}
                            {userRole === 'ADMIN' && (
                              <button
                                onClick={() => setEditingExpense(e)}
                                className="p-1.5 rounded-lg bg-devotional-blue-950 border border-devotional-gold-500/20 text-gray-300 hover:text-white"
                                title="Edit Expense"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Admin Delete */}
                            {userRole === 'ADMIN' && (
                              <button
                                onClick={() => setDeletingId(e.id)}
                                className="p-1.5 rounded-lg bg-red-950/60 border border-red-500/30 text-red-400 hover:text-red-200"
                                title="Delete Expense"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* MODAL: [ + ADD EXPENSE ] */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
            <div className="w-full max-w-lg rounded-3xl border-2 border-devotional-gold-500/40 bg-devotional-blue-950 p-6 shadow-2xl space-y-5 my-auto text-white">
              <div className="flex items-center justify-between border-b border-devotional-gold-500/20 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-devotional-gold-300 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-devotional-gold-400" />
                    <span>ADD EXPENSE</span>
                  </h3>
                  <p className="text-[11px] text-gray-400">Record a festival expenditure</p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 flex items-start gap-2 text-xs text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSaveExpense} className="space-y-4 text-xs">
                {/* Shop / Vendor Name */}
                <div>
                  <label className="block text-devotional-gold-200 font-semibold mb-1">
                    Shop / Vendor Name <span className="text-amber-400 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Balaji Flower Stall, Sri Sound Systems"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-white placeholder-gray-500 text-base font-medium focus:outline-none focus:border-devotional-gold-400"
                    autoFocus
                  />
                </div>

                {/* Person Entering Expense (REQUIRED) */}
                <div>
                  <label className="block text-devotional-gold-200 font-semibold mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-devotional-gold-400" />
                    <span>Who is entering this expense? (Your Name) <span className="text-amber-400 font-bold">*</span></span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Reddy, Suresh, Committee Member"
                    value={enteredBy}
                    onChange={(e) => setEnteredBy(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-white placeholder-gray-500 text-base font-medium focus:outline-none focus:border-devotional-gold-400"
                  />
                  <span className="text-[10px] text-gray-400 mt-0.5 block">
                    This person will be recorded as the author of this expense.
                  </span>
                </div>

                {/* Category Selection */}
                <div>
                  <label className="block text-devotional-gold-200 font-semibold mb-1">
                    Expense Category <span className="text-amber-400 font-bold">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-white text-base font-medium focus:outline-none focus:border-devotional-gold-400"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-devotional-blue-950">
                        {cat}
                      </option>
                    ))}
                    <option value="Other" className="bg-devotional-blue-950">
                      + Other (Specify Custom)
                    </option>
                  </select>

                  {category === 'Other' && (
                    <input
                      type="text"
                      required
                      placeholder="Enter custom category name"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full mt-2 px-3.5 py-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/40 text-white placeholder-gray-500 text-base"
                    />
                  )}
                </div>

                {/* Amount & Date in 2 columns */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-devotional-gold-200 font-semibold mb-1">
                      Amount (₹) <span className="text-amber-400 font-bold">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-sm font-black text-devotional-gold-400 select-none">
                        ₹
                      </span>
                      <input
                        type="number"
                        inputMode="numeric"
                        required
                        min={1}
                        placeholder="e.g. 2500"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-white font-black text-base focus:outline-none focus:border-devotional-gold-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-devotional-gold-200 font-semibold mb-1">
                      Date <span className="text-amber-400 font-bold">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-white font-medium focus:outline-none focus:border-devotional-gold-400"
                    />
                  </div>
                </div>

                {/* Payment Method Toggle (CASH vs ONLINE) */}
                <div>
                  <label className="block text-devotional-gold-200 font-semibold mb-1.5">
                    Payment Method <span className="text-amber-400 font-bold">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CASH')}
                      className={`py-3 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                        paymentMethod === 'CASH'
                          ? 'bg-emerald-950 border-emerald-400 text-emerald-300 ring-1 ring-emerald-400/50'
                          : 'bg-devotional-blue-900 border-devotional-gold-500/20 text-gray-300'
                      }`}
                    >
                      <Banknote className="w-4 h-4 text-emerald-400" />
                      <span>CASH</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('ONLINE')}
                      className={`py-3 px-3 rounded-xl border flex items-center justify-center gap-2 font-bold transition-all ${
                        paymentMethod === 'ONLINE'
                          ? 'bg-devotional-blue-800 border-devotional-gold-400 text-devotional-gold-300 ring-1 ring-devotional-gold-400/50'
                          : 'bg-devotional-blue-900 border-devotional-gold-500/20 text-gray-300'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 text-devotional-gold-400" />
                      <span>ONLINE / UPI</span>
                    </button>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-devotional-gold-200 font-semibold mb-1">
                    Description <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Marigold garlands & stage backdrop lights"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/20 text-white placeholder-gray-500"
                  />
                </div>

                {/* Bill / Receipt Image Upload (Camera or Gallery) */}
                <div className="space-y-1.5">
                  <label className="block text-devotional-gold-200 font-semibold">
                    Bill / Receipt Photo <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>

                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {billPreview ? (
                    <div className="bg-devotional-blue-900 border border-emerald-500/40 rounded-xl p-2.5 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={billPreview}
                          alt="Bill preview"
                          className="w-12 h-12 object-cover rounded-lg border border-devotional-gold-400 shrink-0"
                        />
                        <span className="text-xs text-emerald-300 truncate font-mono">
                          {billFile?.name || 'receipt.jpg'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setBillFile(null);
                          setBillPreview(null);
                        }}
                        className="p-1.5 text-red-400 hover:text-red-200 rounded-lg hover:bg-red-950/60"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="p-2.5 rounded-xl border border-devotional-gold-500/30 bg-devotional-blue-900/70 hover:bg-devotional-blue-800 text-devotional-gold-200 flex items-center justify-center gap-1.5 text-xs font-semibold"
                      >
                        <Camera className="w-4 h-4 text-devotional-gold-400" />
                        <span>Snap Bill (Camera)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="p-2.5 rounded-xl border border-devotional-gold-500/30 bg-devotional-blue-900/70 hover:bg-devotional-blue-800 text-devotional-gold-200 flex items-center justify-center gap-1.5 text-xs font-semibold"
                      >
                        <ImageIcon className="w-4 h-4 text-devotional-gold-400" />
                        <span>From Gallery</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-devotional-gold-200 font-semibold mb-1">
                    Notes <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Paid in full, bill copy kept in pandal file"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/20 text-white placeholder-gray-500"
                  />
                </div>

                {/* Form Buttons */}
                <div className="pt-3 flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="flex-1 py-3 rounded-xl btn-gold text-devotional-blue-950 font-black shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {formSubmitting ? (
                      <div className="w-4 h-4 border-2 border-devotional-blue-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span>Save Expense</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDIT EXPENSE (Admin only) */}
        {editingExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-md rounded-3xl border-2 border-devotional-gold-500/40 bg-devotional-blue-950 p-6 shadow-2xl space-y-4 text-white">
              <div className="flex items-center justify-between border-b border-devotional-gold-500/20 pb-2">
                <h3 className="font-black text-devotional-gold-300 text-sm">
                  Edit Expense ({editingExpense.expenseNumber})
                </h3>
                <button
                  onClick={() => setEditingExpense(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Shop / Vendor *</label>
                  <input
                    type="text"
                    required
                    value={editingExpense.shopName}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, shopName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Entered By Person *</label>
                  <input
                    type="text"
                    required
                    value={editingExpense.enteredBy || ''}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, enteredBy: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Category *</label>
                  <select
                    value={editingExpense.category}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, category: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-white"
                  >
                    {EXPENSE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-devotional-blue-950">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold">Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editingExpense.amount}
                      onChange={(e) =>
                        setEditingExpense({
                          ...editingExpense,
                          amount: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold">Date *</label>
                    <input
                      type="date"
                      required
                      value={editingExpense.date.split('T')[0]}
                      onChange={(e) =>
                        setEditingExpense({ ...editingExpense, date: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Method *</label>
                  <select
                    value={editingExpense.paymentMethod}
                    onChange={(e) =>
                      setEditingExpense({
                        ...editingExpense,
                        paymentMethod: e.target.value as 'CASH' | 'ONLINE',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-white"
                  >
                    <option value="CASH">CASH</option>
                    <option value="ONLINE">ONLINE / UPI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Description</label>
                  <input
                    type="text"
                    value={editingExpense.description || ''}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, description: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/20 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Notes</label>
                  <input
                    type="text"
                    value={editingExpense.notes || ''}
                    onChange={(e) =>
                      setEditingExpense({ ...editingExpense, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/20 text-white"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingExpense(null)}
                    className="flex-1 py-2 rounded-xl bg-gray-800 text-gray-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl btn-gold text-devotional-blue-950 font-bold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: FULLSCREEN IMAGE LIGHTBOX FOR BILLS */}
        <ImageLightboxModal
          isOpen={!!viewingBillUrl}
          onClose={() => setViewingBillUrl(null)}
          imageUrl={viewingBillUrl}
          title="Expense Bill / Receipt"
        />

        {/* MODAL: DELETE EXPENSE CONFIRMATION */}
        {deletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-sm rounded-3xl border border-red-500/50 bg-devotional-blue-950 p-6 shadow-2xl space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-red-950 border border-red-500/40 mx-auto flex items-center justify-center text-red-400">
                <Trash2 className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="font-bold text-white text-base">Delete Expense?</h3>
                <p className="text-xs text-gray-400">
                  This expenditure will be permanently removed and the festival remaining balance will be updated.
                </p>
              </div>

              <div className="flex gap-2 pt-2 text-xs">
                <button
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteExpense(deletingId)}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
      <MobileBottomNav userRole={userRole || 'VOLUNTEER'} userName={currentUserName} />
    </div>
  );
}
