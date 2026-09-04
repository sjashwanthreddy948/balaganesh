'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FastContributionForm from '@/components/FastContributionForm';
import LandscapeCertificate, { CertificateData } from '@/components/LandscapeCertificate';
import ImageLightboxModal from '@/components/ImageLightboxModal';
import MobileBottomNav from '@/components/MobileBottomNav';
import { FESTIVAL_CONFIG, buildWhatsAppCertificateShareUrl } from '@/config/festival.config';
import {
  PlusCircle,
  Users,
  Banknote,
  Smartphone,
  Clock,
  Search,
  LogOut,
  RefreshCw,
  Eye,
  Edit2,
  Check,
  X,
  FileSpreadsheet,
  Calendar,
  Receipt,
  Trash2,
  Image as ImageIcon,
  MessageCircle,
  Scale,
  AlertTriangle,
} from 'lucide-react';

interface UserProfile {
  id: string;
  username: string;
  name: string;
  role: string;
}

interface ContributionItem {
  id: string;
  certificateNumber: string;
  fullName: string;
  mobileNumber?: string | null;
  address?: string | null;
  amount: number;
  paymentMethod: 'CASH' | 'ONLINE';
  paymentStatus: 'CASH_RECEIVED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  utr?: string | null;
  paymentScreenshot?: string | null;
  volunteerName?: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [contributions, setContributions] = useState<ContributionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // View state
  const [showAddForm, setShowAddForm] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'CASH' | 'ONLINE'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CASH_RECEIVED' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Certificate Modal
  const [viewingCertificate, setViewingCertificate] = useState<CertificateData | null>(null);

  // Screenshot Lightbox Modal
  const [viewingScreenshotUrl, setViewingScreenshotUrl] = useState<string | null>(null);
  const [viewingScreenshotTitle, setViewingScreenshotTitle] = useState<string>('');

  // Edit Modal (Admin only)
  const [editingContribution, setEditingContribution] = useState<ContributionItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editAmount, setEditAmount] = useState<number>(0);

  // Load Session & Chanda Data
  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Session check - STRICT LOGIN REQUIRED
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.replace('/login?redirect=/dashboard');
        return;
      }
      const meJson = await meRes.json();
      setUser(meJson.user);

      // 2. Fetch Chanda stats
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        setStats(statsJson.stats);
      }

      // 3. Fetch Full Financial Summary (Total Chanda, Total Expenses, Remaining Balance)
      try {
        const finRes = await fetch('/api/admin/financial-summary');
        if (finRes.ok) {
          const finJson = await finRes.json();
          setFinancialSummary(finJson.summary);
        }
      } catch (finErr) {
        console.error('Financial summary load error:', finErr);
      }

      // 4. Fetch contributions with filters
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (methodFilter !== 'ALL') params.append('method', methodFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (dateFilter !== 'all') params.append('dateRange', dateFilter);

      const listRes = await fetch(`/api/contributions?${params.toString()}`);
      if (listRes.ok) {
        const listJson = await listRes.json();
        setContributions(listJson.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [router, searchQuery, methodFilter, statusFilter, dateFilter]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Admin Delete Contribution
  const handleDeleteContribution = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete the contribution for "${name}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/contributions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setContributions((prev) => prev.filter((c) => c.id !== id));
        loadDashboardData();
      } else {
        const json = await res.json();
        alert(json.error || 'Failed to delete contribution');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete contribution');
    }
  };

  // Status Update (Verify/Reject)
  const handleStatusUpdate = async (id: string, newStatus: 'VERIFIED' | 'REJECTED' | 'PENDING') => {
    try {
      const res = await fetch(`/api/contributions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setContributions((prev) =>
          prev.map((c) => (c.id === id ? { ...c, paymentStatus: newStatus } : c))
        );
        const statsRes = await fetch('/api/admin/stats');
        if (statsRes.ok) {
          setStats((await statsRes.json()).stats);
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Edit Save
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContribution) return;
    try {
      const res = await fetch(`/api/contributions/${editingContribution.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editName,
          mobileNumber: editMobile || undefined,
          address: editAddress || undefined,
          amount: editAmount,
        }),
      });
      if (res.ok) {
        setEditingContribution(null);
        loadDashboardData();
      }
    } catch (err) {
      console.error('Edit error:', err);
    }
  };

  // Logout
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-devotional-gold-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="min-h-screen flex flex-col justify-between pb-24 md:pb-8">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-devotional-gold-500/20 pb-4">
          <div>
            <span className="text-[11px] font-bold tracking-widest text-devotional-gold-400 uppercase">
              🕉️ Chanda Management Portal
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Welcome, <span className="text-devotional-gold-300">{user.name}</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => loadDashboardData()}
              className="p-2.5 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Link to Expenses page */}
            <button
              onClick={() => router.push('/expenses')}
              className="px-3 py-2 rounded-xl bg-devotional-blue-900 hover:bg-devotional-blue-800 border border-devotional-gold-500/30 text-devotional-gold-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Receipt className="w-4 h-4 text-rose-400" />
              <span>Expenses & Balance →</span>
            </button>

            {isAdmin && (
              <a
                href="/api/admin/export"
                download
                className="px-3 py-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-devotional-gold-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Export Chanda CSV</span>
              </a>
            )}

            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-xl bg-red-950/50 border border-red-500/30 text-red-300 hover:text-red-100 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* PRIMARY ACTION: [ + ADD CONTRIBUTION ] */}
        <div>
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-4 px-6 rounded-2xl btn-gold text-devotional-blue-950 font-black text-lg sm:text-xl tracking-wide shadow-gold-md flex items-center justify-center gap-3 transition-transform active:scale-[0.99]"
          >
            <PlusCircle className="w-6 h-6 text-devotional-blue-950" />
            <span>+ ADD CONTRIBUTION</span>
          </button>
        </div>

        {/* ============================================================ */}
        {/* MOBILE DASHBOARD STATS (TIERED HIERARCHY AS PER SECTION 6)   */}
        {/* ============================================================ */}
        <div className="space-y-3">
          {/* TIER 1: PRIMARY OVERVIEW (Total Chanda, Total Expenses, Remaining Balance) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Total Chanda */}
            <div className="rounded-2xl border border-devotional-gold-500/40 bg-gradient-to-br from-devotional-blue-900/90 to-[#0c1e54]/90 p-4 space-y-1 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between text-devotional-gold-400">
                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                  Total Chanda
                </span>
                <span className="text-base">🕉️</span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-devotional-gold-300">
                ₹{((financialSummary?.income?.totalChanda ?? stats?.totalAmount) || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-gray-300">
                {stats?.totalContributions || 0} total contributions
              </p>
            </div>

            {/* Total Expenses */}
            <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-950/40 to-devotional-blue-950/80 p-4 space-y-1 shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between text-rose-400">
                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                  Total Expenses
                </span>
                <Receipt className="w-4 h-4" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-rose-300">
                ₹{(financialSummary?.expenses?.totalExpenses || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-gray-300">
                {financialSummary?.expenses?.totalExpenseCount || 0} expenses recorded
              </p>
            </div>

            {/* Remaining Balance */}
            <div className="rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-950/50 to-[#041a1a]/90 p-4 space-y-1 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                  Remaining Balance
                </span>
                <Scale className="w-4 h-4" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-300">
                ₹{(financialSummary?.balance?.remainingBalance ?? (((financialSummary?.income?.totalChanda ?? stats?.totalAmount) || 0) - (financialSummary?.expenses?.totalExpenses || 0))).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-emerald-200/80 font-medium">
                Net available festival funds
              </p>
            </div>
          </div>

          {/* TIER 2: PAYMENT METHOD BREAKDOWN (Cash Chanda, Online Chanda, Cash Expenses, Online Expenses) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs">
            {/* Cash Chanda */}
            <div className="rounded-2xl border border-emerald-500/30 bg-devotional-blue-950/70 p-3 space-y-0.5 shadow-sm">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-[10px] font-bold uppercase">Cash Chanda</span>
                <Banknote className="w-3.5 h-3.5" />
              </div>
              <p className="text-lg sm:text-xl font-black text-emerald-300">
                ₹{((financialSummary?.income?.cashChanda ?? stats?.cashAmount) || 0).toLocaleString('en-IN')}
              </p>
            </div>

            {/* Online Chanda */}
            <div className="rounded-2xl border border-devotional-gold-500/30 bg-devotional-blue-950/70 p-3 space-y-0.5 shadow-sm">
              <div className="flex items-center justify-between text-devotional-gold-400">
                <span className="text-[10px] font-bold uppercase">Online Chanda</span>
                <Smartphone className="w-3.5 h-3.5" />
              </div>
              <p className="text-lg sm:text-xl font-black text-devotional-gold-300">
                ₹{((financialSummary?.income?.onlineChanda ?? stats?.onlineAmount) || 0).toLocaleString('en-IN')}
              </p>
            </div>

            {/* Cash Expenses */}
            <div className="rounded-2xl border border-rose-500/30 bg-devotional-blue-950/70 p-3 space-y-0.5 shadow-sm">
              <div className="flex items-center justify-between text-rose-400">
                <span className="text-[10px] font-bold uppercase">Cash Expenses</span>
                <Receipt className="w-3.5 h-3.5" />
              </div>
              <p className="text-lg sm:text-xl font-black text-rose-300">
                ₹{(financialSummary?.expenses?.cashExpenses || 0).toLocaleString('en-IN')}
              </p>
            </div>

            {/* Online Expenses */}
            <div className="rounded-2xl border border-rose-500/30 bg-devotional-blue-950/70 p-3 space-y-0.5 shadow-sm">
              <div className="flex items-center justify-between text-rose-400">
                <span className="text-[10px] font-bold uppercase">Online Expenses</span>
                <Smartphone className="w-3.5 h-3.5" />
              </div>
              <p className="text-lg sm:text-xl font-black text-rose-300">
                ₹{(financialSummary?.expenses?.onlineExpenses || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          {/* TIER 3: DAILY & PENDING INSIGHTS */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
            {/* Pending Online Payments */}
            <div className="rounded-2xl border border-amber-500/40 bg-amber-950/30 p-3 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-400 block">
                  Pending Verification
                </span>
                <span className="text-lg font-black text-amber-300">
                  {stats?.pendingOnlinePayments || 0} Online Chanda
                </span>
              </div>
              <Clock className="w-5 h-5 text-amber-400 shrink-0" />
            </div>

            {/* Today's Chanda */}
            <div className="rounded-2xl border border-devotional-gold-500/30 bg-devotional-blue-950/70 p-3 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-bold uppercase text-devotional-gold-400 block">
                  Today&apos;s Chanda
                </span>
                <span className="text-lg font-black text-devotional-gold-300">
                  ₹{(stats?.todayAmount || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <span className="text-xs text-gray-400 font-bold">
                {stats?.todayContributions || 0} entries
              </span>
            </div>

            {/* Today's Expenses */}
            <div className="rounded-2xl border border-rose-500/30 bg-devotional-blue-950/70 p-3 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-bold uppercase text-rose-400 block">
                  Today&apos;s Expenses
                </span>
                <span className="text-lg font-black text-rose-300">
                  ₹{(stats?.todayExpenses || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <Receipt className="w-5 h-5 text-rose-400 shrink-0" />
            </div>
          </div>
        </div>

        {/* CONTRIBUTIONS LIST */}
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="bg-devotional-blue-900/50 border border-devotional-gold-500/20 p-3.5 rounded-2xl space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by donor name, mobile, cert #, or UTR..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/20 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-devotional-gold-400"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
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

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-devotional-blue-950 p-1 rounded-xl border border-devotional-gold-500/20 overflow-x-auto">
                <span className="text-[10px] text-gray-400 px-2 font-semibold">STATUS:</span>
                {(['ALL', 'CASH_RECEIVED', 'PENDING', 'VERIFIED'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                      statusFilter === s
                        ? 'bg-devotional-gold-500 text-devotional-blue-950 shadow-sm'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    {s.replace('_', ' ')}
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

          {/* Contributions Table */}
          <div className="rounded-2xl border border-devotional-gold-500/30 bg-devotional-blue-900/40 overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-12 text-center text-devotional-gold-300 space-y-2">
                <div className="w-8 h-8 border-2 border-devotional-gold-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs">Loading records...</p>
              </div>
            ) : contributions.length === 0 ? (
              <div className="p-12 text-center text-gray-400 space-y-2">
                <Users className="w-8 h-8 mx-auto text-gray-500" />
                <p className="text-sm font-semibold">No contributions recorded yet.</p>
                <p className="text-xs text-gray-500">
                  Click &quot;+ ADD CONTRIBUTION&quot; above to record your first donor.
                </p>
              </div>
            ) : (
              <div>
                {/* 1. MOBILE CARDS VIEW (md:hidden) */}
                <div className="md:hidden space-y-3 p-3">
                  {contributions.map((c) => {
                    const isCash = c.paymentMethod === 'CASH';
                    const isPending = c.paymentStatus === 'PENDING';
                    const whatsAppShareUrl = buildWhatsAppCertificateShareUrl({
                      fullName: c.fullName,
                      amount: c.amount,
                      paymentMethod: c.paymentMethod,
                      certificateNumber: c.certificateNumber,
                      mobileNumber: c.mobileNumber,
                    });

                    return (
                      <div
                        key={c.id}
                        className="rounded-2xl border border-devotional-gold-500/30 bg-[#06102f]/90 p-4 space-y-3 shadow-lg"
                      >
                        {/* Donor Name & Amount */}
                        <div className="flex items-start justify-between gap-2 border-b border-devotional-gold-500/15 pb-2.5">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-extrabold text-base text-white truncate">
                              {c.fullName}
                            </h4>
                            {c.mobileNumber && (
                              <p className="text-xs text-gray-300 font-mono mt-0.5">
                                📱 +91 {c.mobileNumber}
                              </p>
                            )}
                            {c.address && (
                              <p className="text-[11px] text-gray-400 truncate mt-0.5">
                                {c.address}
                              </p>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-lg font-black text-devotional-gold-300 block">
                              ₹{c.amount.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {new Date(c.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Badges: Payment Method, Status & Cert Number */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Method */}
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                                isCash
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-devotional-blue-950 text-devotional-gold-300 border border-devotional-gold-500/30'
                              }`}
                            >
                              {c.paymentMethod}
                            </span>

                            {/* Status */}
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                                c.paymentStatus === 'VERIFIED' || c.paymentStatus === 'CASH_RECEIVED'
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                                  : c.paymentStatus === 'REJECTED'
                                  ? 'bg-red-950/80 text-red-300 border border-red-500/40'
                                  : 'bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse'
                              }`}
                            >
                              {c.paymentStatus === 'CASH_RECEIVED'
                                ? '✓ CASH RECEIVED'
                                : c.paymentStatus === 'VERIFIED'
                                ? '✓ VERIFIED'
                                : c.paymentStatus === 'REJECTED'
                                ? '✕ REJECTED'
                                : '⏳ PENDING'}
                            </span>
                          </div>

                          {/* Cert Number */}
                          <span className="font-mono text-[11px] text-devotional-gold-400 font-bold bg-devotional-blue-950 px-2 py-0.5 rounded-md border border-devotional-gold-500/20">
                            {c.certificateNumber}
                          </span>
                        </div>

                        {/* UTR Info (if online) */}
                        {!isCash && c.utr && (
                          <div className="text-[11px] text-gray-300 bg-devotional-blue-950/60 px-2.5 py-1 rounded-lg border border-devotional-gold-500/15 flex items-center justify-between">
                            <span className="text-gray-400">UTR:</span>
                            <span className="font-mono text-devotional-gold-200 font-bold">{c.utr}</span>
                          </div>
                        )}

                        {/* Action Buttons Row */}
                        <div className="flex items-center gap-1.5 pt-1 border-t border-devotional-gold-500/15 flex-wrap">
                          {/* WhatsApp */}
                          {c.mobileNumber && (
                            <a
                              href={whatsAppShareUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 min-w-[90px] py-2 px-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </a>
                          )}

                          {/* Certificate */}
                          <button
                            type="button"
                            onClick={() =>
                              setViewingCertificate({
                                certificateNumber: c.certificateNumber,
                                fullName: c.fullName,
                                mobileNumber: c.mobileNumber,
                                amount: c.amount,
                                paymentMethod: c.paymentMethod,
                                paymentStatus: c.paymentStatus,
                                createdAt: c.createdAt,
                                volunteerName: c.volunteerName,
                              })
                            }
                            className="flex-1 min-w-[85px] py-2 px-2.5 rounded-xl bg-devotional-blue-800 hover:bg-devotional-blue-700 border border-devotional-gold-400/50 text-devotional-gold-200 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                          >
                            <Eye className="w-3.5 h-3.5 text-devotional-gold-400" />
                            <span>Certificate</span>
                          </button>

                          {/* Screenshot Lightbox */}
                          {c.paymentScreenshot && (
                            <button
                              type="button"
                              onClick={() => {
                                setViewingScreenshotUrl(c.paymentScreenshot!);
                                setViewingScreenshotTitle(`Payment Proof: ${c.fullName} (₹${c.amount})`);
                              }}
                              className="py-2 px-2.5 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>Proof</span>
                            </button>
                          )}

                          {/* Admin Verify/Reject inline */}
                          {isAdmin && !isCash && isPending && (
                            <div className="flex items-center gap-1 ml-auto">
                              <button
                                type="button"
                                onClick={() => handleStatusUpdate(c.id, 'VERIFIED')}
                                className="px-2 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                              >
                                Verify
                              </button>
                              <button
                                type="button"
                                onClick={() => handleStatusUpdate(c.id, 'REJECTED')}
                                className="px-2 py-1.5 rounded-lg bg-red-950 border border-red-500/40 text-red-400 hover:bg-red-900 font-bold text-[10px]"
                              >
                                Reject
                              </button>
                            </div>
                          )}

                          {/* Admin Edit */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingContribution(c);
                                setEditName(c.fullName);
                                setEditMobile(c.mobileNumber || '');
                                setEditAddress(c.address || '');
                                setEditAmount(c.amount);
                              }}
                              className="p-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white text-xs active:scale-95 transition-all"
                              title="Edit Contribution"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Admin Delete */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteContribution(c.id, c.fullName)}
                              className="p-2 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 hover:text-white text-xs active:scale-95 transition-all"
                              title="Delete Contribution"
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
                      <tr className="border-b border-devotional-gold-500/20 bg-devotional-blue-950/70 text-[11px] font-extrabold tracking-wider text-devotional-gold-300 uppercase">
                        <th className="py-3 px-4">Cert No</th>
                        <th className="py-3 px-4">Donor</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Method</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-devotional-gold-500/10 text-xs">
                      {contributions.map((c) => {
                        const isCash = c.paymentMethod === 'CASH';
                        const isPending = c.paymentStatus === 'PENDING';
                        const whatsAppShareUrl = buildWhatsAppCertificateShareUrl({
                          fullName: c.fullName,
                          amount: c.amount,
                          paymentMethod: c.paymentMethod,
                          certificateNumber: c.certificateNumber,
                          mobileNumber: c.mobileNumber,
                        });

                        return (
                          <tr
                            key={c.id}
                            className="hover:bg-devotional-blue-900/60 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono font-bold text-devotional-gold-200 whitespace-nowrap">
                              {c.certificateNumber}
                            </td>
                            <td className="py-3 px-4">
                              <p className="font-bold text-white">{c.fullName}</p>
                              {c.mobileNumber && (
                                <p className="text-[11px] text-gray-400">{c.mobileNumber}</p>
                              )}
                            </td>
                            <td className="py-3 px-4 font-black text-devotional-gold-300 text-sm whitespace-nowrap">
                              ₹{c.amount.toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  isCash
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-devotional-blue-950 text-devotional-gold-300 border border-devotional-gold-500/30'
                                }`}
                              >
                                {c.paymentMethod}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {isCash && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                                  <Check className="w-3 h-3" /> RECEIVED
                                </span>
                              )}
                              {!isCash && isPending && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                                  <Clock className="w-3 h-3" /> PENDING
                                </span>
                              )}
                              {!isCash && c.paymentStatus === 'VERIFIED' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                  <Check className="w-3 h-3" /> VERIFIED
                                </span>
                              )}
                              {!isCash && c.paymentStatus === 'REJECTED' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded-full border border-red-500/30">
                                  <X className="w-3 h-3" /> REJECTED
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                              {/* WhatsApp */}
                              {c.mobileNumber && (
                                <a
                                  href={whatsAppShareUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-500/30 text-emerald-300 hover:text-white inline-flex items-center"
                                  title="Share on WhatsApp"
                                >
                                  <Smartphone className="w-3.5 h-3.5" />
                                </a>
                              )}

                              {/* View Certificate */}
                              <button
                                onClick={() =>
                                  setViewingCertificate({
                                    certificateNumber: c.certificateNumber,
                                    fullName: c.fullName,
                                    mobileNumber: c.mobileNumber,
                                    amount: c.amount,
                                    paymentMethod: c.paymentMethod,
                                    paymentStatus: c.paymentStatus,
                                    createdAt: c.createdAt,
                                    volunteerName: c.volunteerName,
                                  })
                                }
                                className="p-1.5 rounded-lg bg-devotional-blue-950 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white inline-flex items-center"
                                title="View White & Gold Certificate"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Screenshot Lightbox */}
                              {c.paymentScreenshot && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewingScreenshotUrl(c.paymentScreenshot!);
                                    setViewingScreenshotTitle(`Payment Proof: ${c.fullName} (₹${c.amount})`);
                                  }}
                                  className="p-1.5 rounded-lg bg-devotional-blue-950 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white inline-flex items-center"
                                  title="View Payment Screenshot"
                                >
                                  <ImageIcon className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Admin Verify / Reject */}
                              {isAdmin && !isCash && isPending && (
                                <>
                                  <button
                                    onClick={() => handleStatusUpdate(c.id, 'VERIFIED')}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px]"
                                  >
                                    Verify
                                  </button>
                                  <button
                                    onClick={() => handleStatusUpdate(c.id, 'REJECTED')}
                                    className="px-2.5 py-1 rounded-lg bg-red-950 border border-red-500/40 text-red-400 hover:bg-red-900 font-bold text-[10px]"
                                  >
                                    Reject
                                  </button>
                                </>
                              )}

                              {/* Admin Edit */}
                              {isAdmin && (
                                <button
                                  onClick={() => {
                                    setEditingContribution(c);
                                    setEditName(c.fullName);
                                    setEditMobile(c.mobileNumber || '');
                                    setEditAddress(c.address || '');
                                    setEditAmount(c.amount);
                                  }}
                                  className="p-1.5 rounded-lg bg-devotional-blue-950 border border-devotional-gold-500/20 text-gray-300 hover:text-white inline-flex items-center"
                                  title="Edit Contribution"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Admin Delete */}
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteContribution(c.id, c.fullName)}
                                  className="p-1.5 rounded-lg bg-red-950/70 border border-red-500/40 text-red-300 hover:text-white inline-flex items-center"
                                  title="Delete Contribution"
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
        </div>

        {/* MODAL: FAST CONTRIBUTION FORM */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
            <div className="w-full max-w-xl my-auto">
              <FastContributionForm
                onSuccess={() => {
                  loadDashboardData();
                }}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          </div>
        )}

        {/* MODAL: VIEW LANDSCAPE CERTIFICATE (White, Gold & Blue Theme) */}
        {viewingCertificate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
            <div className="w-full max-w-2xl bg-white border-2 border-devotional-gold-500 rounded-3xl p-5 shadow-2xl space-y-4 my-auto">
              <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                <span className="text-sm font-black text-devotional-blue-950">
                  Official Certificate Preview • {viewingCertificate.certificateNumber}
                </span>
                <button
                  onClick={() => setViewingCertificate(null)}
                  className="p-1 rounded-lg text-gray-500 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <LandscapeCertificate data={viewingCertificate} />
            </div>
          </div>
        )}

        {/* MODAL: ADMIN EDIT CONTRIBUTION */}
        {editingContribution && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md rounded-3xl border-2 border-devotional-gold-500/40 bg-devotional-blue-950 p-6 shadow-2xl space-y-4 text-white">
              <div className="flex items-center justify-between border-b border-devotional-gold-500/20 pb-2">
                <h3 className="font-bold text-devotional-gold-300 text-sm">
                  Edit Contribution ({editingContribution.certificateNumber})
                </h3>
                <button
                  onClick={() => setEditingContribution(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Donor Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Mobile Number</label>
                  <input
                    type="tel"
                    value={editMobile}
                    onChange={(e) => setEditMobile(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 font-semibold">Address</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-white"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingContribution(null)}
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

        {/* MODAL: IMAGE LIGHTBOX FOR SCREENSHOTS */}
        <ImageLightboxModal
          isOpen={!!viewingScreenshotUrl}
          onClose={() => setViewingScreenshotUrl(null)}
          imageUrl={viewingScreenshotUrl}
          title={viewingScreenshotTitle}
        />
      </main>

      <Footer />
      <MobileBottomNav userRole={user?.role} userName={user?.name} />
    </div>
  );
}
