'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FastContributionForm from '@/components/FastContributionForm';
import LandscapeCertificate, { CertificateData } from '@/components/LandscapeCertificate';
import ImageLightboxModal from '@/components/ImageLightboxModal';
import MobileBottomNav from '@/components/MobileBottomNav';
import {
  FESTIVAL_CONFIG,
  buildWhatsAppCertificateMessage,
  buildWhatsAppPayLaterReminderMessage,
} from '@/config/festival.config';
import { normalizeIndianMobileForWhatsApp } from '@/lib/validation';
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
  Settings,
  Shield,
  Copy,
  Bell,
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
  paymentMethod: 'CASH' | 'ONLINE' | 'PAY_LATER';
  paymentStatus: 'CASH_RECEIVED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'PAY_LATER';
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
  const [methodFilter, setMethodFilter] = useState<'ALL' | 'CASH' | 'ONLINE' | 'PAY_LATER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CASH_RECEIVED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'PAY_LATER'>('ALL');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Certificate Modal
  const [viewingCertificate, setViewingCertificate] = useState<CertificateData | null>(null);

  // Screenshot Lightbox Modal (ONLINE payments)
  const [viewingScreenshotUrl, setViewingScreenshotUrl] = useState<string | null>(null);
  const [viewingScreenshotTitle, setViewingScreenshotTitle] = useState<string>('');

  // Edit Modal (Admin only)
  const [editingContribution, setEditingContribution] = useState<ContributionItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editMethod, setEditMethod] = useState<'CASH' | 'ONLINE' | 'PAY_LATER'>('CASH');
  const [editStatus, setEditStatus] = useState<'CASH_RECEIVED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | 'PAY_LATER'>('CASH_RECEIVED');

  // Admin Settings Modal (Admin only)
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [newVolunteerPassword, setNewVolunteerPassword] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsStatus, setSettingsStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedUpi, setCopiedUpi] = useState(false);

  const handleUpdateVolunteerPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVolunteerPassword || newVolunteerPassword.length < 6) {
      setSettingsStatus({ type: 'error', message: 'Password must be at least 6 characters.' });
      return;
    }
    setSettingsLoading(true);
    setSettingsStatus(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newVolunteerPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setSettingsStatus({ type: 'error', message: data.error || 'Failed to update volunteer password.' });
      } else {
        setSettingsStatus({ type: 'success', message: 'Volunteer password updated successfully!' });
        setNewVolunteerPassword('');
      }
    } catch {
      setSettingsStatus({ type: 'error', message: 'Network error updating settings.' });
    } finally {
      setSettingsLoading(false);
    }
  };

  const copyUpiToClipboard = () => {
    navigator.clipboard.writeText(FESTIVAL_CONFIG.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

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

  // Status Update (Verify/Reject/Cash Paid)
  const handleStatusUpdate = async (
    id: string,
    newStatus: 'VERIFIED' | 'REJECTED' | 'PENDING' | 'CASH_RECEIVED' | 'PAY_LATER'
  ) => {
    try {
      const res = await fetch(`/api/contributions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setContributions((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  paymentStatus: newStatus,
                  paymentMethod: newStatus === 'CASH_RECEIVED' ? 'CASH' : c.paymentMethod,
                }
              : c
          )
        );
        const statsRes = await fetch('/api/admin/stats');
        if (statsRes.ok) {
          setStats((await statsRes.json()).stats);
        }
        const finRes = await fetch('/api/admin/financial-summary');
        if (finRes.ok) {
          setFinancialSummary((await finRes.json()).summary);
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDashboardWhatsAppShare = (c: ContributionItem) => {
    const phoneResult = normalizeIndianMobileForWhatsApp(c.mobileNumber);
    const phoneParam = phoneResult ? `phone=${phoneResult.whatsappPhone}&` : '';

    const isPayLater = c.paymentMethod === 'PAY_LATER' || c.paymentStatus === 'PAY_LATER';

    const message = isPayLater
      ? buildWhatsAppPayLaterReminderMessage({
          fullName: c.fullName,
          amount: c.amount,
          certificateNumber: c.certificateNumber,
        })
      : buildWhatsAppCertificateMessage({
          fullName: c.fullName,
          amount: c.amount,
          paymentMethod: c.paymentMethod,
          certificateNumber: c.certificateNumber,
        });

    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      try {
        navigator.clipboard.writeText(message);
      } catch {}
    }

    const url = `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(message)}`;

    const isMobile =
      typeof navigator !== 'undefined' &&
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = url;
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
          paymentMethod: editMethod,
          paymentStatus: editStatus,
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
              <>
                <button
                  onClick={() => {
                    setSettingsStatus(null);
                    setShowSettingsModal(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-devotional-blue-900 hover:bg-devotional-blue-800 border border-devotional-gold-500/30 text-devotional-gold-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                  title="Manage System & Volunteer Settings"
                >
                  <Settings className="w-4 h-4 text-devotional-gold-400" />
                  <span className="hidden sm:inline">Settings</span>
                </button>

                <a
                  href="/api/admin/export"
                  download
                  className="px-3 py-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-devotional-gold-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">Export Chanda CSV</span>
                </a>
              </>
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
        {/* CHANDA ACTIVITY OVERVIEW ONLY (SECTION 9 STRICTLY)          */}
        {/* ============================================================ */}
        <div className="space-y-3">
          {/* TIER 1: TOTAL CHANDA OVERVIEW (NO EXPENSES ON DASHBOARD) */}
          <div className="rounded-3xl border-2 border-devotional-gold-500/50 bg-gradient-to-br from-devotional-blue-900/95 to-[#08153a]/95 p-5 sm:p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-devotional-gold-400 mb-1">
                  <span className="text-xs font-extrabold uppercase tracking-wider">
                    Total Chanda Collection
                  </span>
                  <span className="text-base">🕉️</span>
                </div>
                <p className="text-3xl sm:text-4xl font-black text-devotional-gold-300">
                  ₹{(financialSummary?.income?.totalChanda ?? stats?.totalAmount ?? 0).toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  {stats?.totalContributions || 0} total contributions recorded
                </p>
              </div>

              {/* Dedicated link to separate Expenses tracker */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push('/expenses')}
                  className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-devotional-blue-950/90 hover:bg-devotional-blue-900 border border-devotional-gold-500/40 text-devotional-gold-200 hover:text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Receipt className="w-4 h-4 text-rose-400" />
                  <span>View Expense Tracker & Balance →</span>
                </button>
              </div>
            </div>
          </div>

          {/* TIER 2: PAYMENT METHOD BREAKDOWN (CASH, ONLINE & PAY LATER PLEDGES) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            {/* Cash Chanda */}
            <div className="rounded-2xl border border-emerald-500/40 bg-devotional-blue-950/80 p-4 space-y-1 shadow-sm">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Cash Chanda</span>
                <Banknote className="w-4 h-4" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-emerald-300">
                ₹{(financialSummary?.income?.cashChanda ?? stats?.cashAmount ?? 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-emerald-300/70">
                Physical cash received
              </p>
            </div>

            {/* Online Chanda */}
            <div className="rounded-2xl border border-devotional-gold-500/40 bg-devotional-blue-950/80 p-4 space-y-1 shadow-sm">
              <div className="flex items-center justify-between text-devotional-gold-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Online Chanda</span>
                <Smartphone className="w-4 h-4" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-devotional-gold-300">
                ₹{(financialSummary?.income?.onlineChanda ?? stats?.onlineAmount ?? 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-devotional-gold-300/70">
                UPI & QR payments
              </p>
            </div>

            {/* Pay Later Pledges */}
            <div
              onClick={() => {
                setMethodFilter('PAY_LATER');
              }}
              className="col-span-2 sm:col-span-1 rounded-2xl border border-amber-500/40 bg-amber-950/30 p-4 space-y-1 shadow-sm cursor-pointer hover:bg-amber-950/50 transition-colors"
              title="Click to view Pay Later contributions"
            >
              <div className="flex items-center justify-between text-amber-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Pay Later Pledges</span>
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-xl sm:text-2xl font-black text-amber-300">
                ₹{(financialSummary?.income?.payLaterChanda ?? stats?.payLaterAmount ?? 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-amber-200/70">
                {financialSummary?.income?.payLaterCount ?? stats?.payLaterContributions ?? 0} pledges to collect
              </p>
            </div>
          </div>

          {/* TIER 3: TODAY'S ACTIVITY & PENDING VERIFICATIONS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Today's Chanda Collection */}
            <div className="rounded-2xl border border-devotional-gold-500/30 bg-devotional-blue-950/70 p-3.5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-bold uppercase text-devotional-gold-400 block">
                  Today&apos;s Chanda Collection
                </span>
                <span className="text-lg sm:text-xl font-black text-devotional-gold-300">
                  ₹{(stats?.todayAmount || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  {stats?.todayContributions || 0} entries recorded today
                </span>
              </div>
              <Calendar className="w-6 h-6 text-devotional-gold-400/60" />
            </div>

            {/* Pending Online Verifications */}
            <div
              onClick={() => {
                setStatusFilter('PENDING');
                setMethodFilter('ONLINE');
              }}
              className="rounded-2xl border border-amber-500/40 bg-amber-950/30 p-3.5 flex items-center justify-between shadow-sm cursor-pointer hover:bg-amber-950/50 transition-colors"
              title="Click to filter pending contributions"
            >
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-400 block">
                  Pending Online Verification
                </span>
                <span className="text-lg sm:text-xl font-black text-amber-300">
                  {stats?.pendingOnlinePayments || 0} Online Chanda
                </span>
                <span className="text-[10px] text-amber-200/70 block mt-0.5">
                  {isAdmin ? 'Tap to review & verify' : 'Awaiting admin verification'}
                </span>
              </div>
              <Clock className="w-6 h-6 text-amber-400 shrink-0" />
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
                {(['ALL', 'CASH', 'ONLINE', 'PAY_LATER'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethodFilter(m)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      methodFilter === m
                        ? 'bg-devotional-gold-500 text-devotional-blue-950 shadow-sm'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    {m === 'PAY_LATER' ? 'PAY LATER' : m}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-devotional-blue-950 p-1 rounded-xl border border-devotional-gold-500/20 overflow-x-auto">
                <span className="text-[10px] text-gray-400 px-2 font-semibold">STATUS:</span>
                {(['ALL', 'CASH_RECEIVED', 'PENDING', 'VERIFIED', 'PAY_LATER'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                      statusFilter === s
                        ? 'bg-devotional-gold-500 text-devotional-blue-950 shadow-sm'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    {s === 'PAY_LATER' ? 'PAY LATER' : s.replace('_', ' ')}
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
                    const isPayLater = c.paymentMethod === 'PAY_LATER' || c.paymentStatus === 'PAY_LATER';
                    const isPending = c.paymentStatus === 'PENDING';

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
                                isPayLater
                                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                                  : isCash
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-devotional-blue-950 text-devotional-gold-300 border border-devotional-gold-500/30'
                              }`}
                            >
                              {c.paymentMethod === 'PAY_LATER' ? '⏱ PAY LATER' : c.paymentMethod}
                            </span>

                            {/* Status */}
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                                c.paymentStatus === 'PAY_LATER'
                                  ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                                  : c.paymentStatus === 'VERIFIED' || c.paymentStatus === 'CASH_RECEIVED'
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                                  : c.paymentStatus === 'REJECTED'
                                  ? 'bg-red-950/80 text-red-300 border border-red-500/40'
                                  : 'bg-amber-950/80 text-amber-300 border border-amber-500/40 animate-pulse'
                              }`}
                            >
                              {c.paymentStatus === 'PAY_LATER'
                                ? '⏱ PAY LATER'
                                : c.paymentStatus === 'CASH_RECEIVED'
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
                        {!isCash && !isPayLater && c.utr && (
                          <div className="text-[11px] text-gray-300 bg-devotional-blue-950/60 px-2.5 py-1 rounded-lg border border-devotional-gold-500/15 flex items-center justify-between">
                            <span className="text-gray-400">UTR:</span>
                            <span className="font-mono text-devotional-gold-200 font-bold">{c.utr}</span>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="space-y-2 pt-2 border-t border-devotional-gold-500/15">
                          {/* 🖼 VIEW PAYMENT SCREENSHOT (ONLINE ONLY with screenshot) */}
                          {!isCash && !isPayLater && c.paymentScreenshot && (
                            <button
                              type="button"
                              onClick={() => {
                                setViewingScreenshotUrl(c.paymentScreenshot!);
                                setViewingScreenshotTitle(`Payment Screenshot: ${c.fullName} (₹${c.amount})`);
                              }}
                              className="w-full py-2.5 px-3 rounded-xl bg-devotional-blue-900/90 hover:bg-devotional-blue-800 border border-devotional-gold-400/50 text-devotional-gold-200 font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                            >
                              <ImageIcon className="w-4 h-4 text-devotional-gold-400" />
                              <span>🖼 VIEW PAYMENT SCREENSHOT</span>
                            </button>
                          )}

                          {/* 📱 SEND VIA WHATSAPP (for CASH / ONLINE) vs 🔔 SEND REMINDER & MARK PAID (for PAY LATER) */}
                          {isPayLater ? (
                            <div className="space-y-2">
                              <button
                                type="button"
                                onClick={() => handleDashboardWhatsAppShare(c)}
                                className="w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                              >
                                <Bell className="w-4 h-4" />
                                <span>🔔 SEND REMINDER VIA WHATSAPP</span>
                              </button>

                              <button
                                type="button"
                                onClick={async () => {
                                  if (confirm(`Mark ₹${c.amount} from "${c.fullName}" as Paid? This will generate their official Certificate.`)) {
                                    await handleStatusUpdate(c.id, 'CASH_RECEIVED');
                                    setViewingCertificate({
                                      certificateNumber: c.certificateNumber,
                                      fullName: c.fullName,
                                      mobileNumber: c.mobileNumber,
                                      amount: c.amount,
                                      paymentMethod: 'CASH',
                                      paymentStatus: 'CASH_RECEIVED',
                                      createdAt: c.createdAt,
                                      volunteerName: c.volunteerName,
                                      paymentScreenshot: c.paymentScreenshot,
                                    });
                                  }
                                }}
                                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                              >
                                <Check className="w-4 h-4" />
                                <span>✓ MARK AS PAID (GENERATE CERTIFICATE)</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDashboardWhatsAppShare(c)}
                              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                            >
                              <Smartphone className="w-4 h-4" />
                              <span>📱 SEND VIA WHATSAPP</span>
                            </button>
                          )}

                          {/* Secondary Row: Certificate & Admin Controls */}
                          <div className="flex items-center gap-2 flex-wrap pt-0.5">
                            {/* Certificate (Available once paid) */}
                            {!isPayLater ? (
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
                                    paymentScreenshot: c.paymentScreenshot,
                                  })
                                }
                                className="flex-1 min-w-[90px] py-2 px-2.5 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                              >
                                <Eye className="w-3.5 h-3.5 text-devotional-gold-400" />
                                <span>Certificate</span>
                              </button>
                            ) : (
                              <div className="flex-1 min-w-[90px] py-1.5 px-2 rounded-xl bg-amber-950/40 border border-amber-500/20 text-amber-400 text-[11px] font-semibold flex items-center justify-center gap-1.5">
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>Certificate unlocks after payment</span>
                              </div>
                            )}

                            {/* Admin Pay Later Collected Cash inline */}
                            {isAdmin && isPayLater && (
                              <button
                                type="button"
                                onClick={() => handleStatusUpdate(c.id, 'CASH_RECEIVED')}
                                className="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                                title="Devotee paid cash - Mark Cash Received"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Paid Cash</span>
                              </button>
                            )}

                            {/* Admin Verify/Reject inline */}
                            {isAdmin && !isCash && !isPayLater && isPending && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleStatusUpdate(c.id, 'VERIFIED')}
                                  className="px-2.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                                >
                                  Verify
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStatusUpdate(c.id, 'REJECTED')}
                                  className="px-2.5 py-2 rounded-xl bg-red-950 border border-red-500/40 text-red-400 hover:bg-red-900 font-bold text-xs"
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
                                  setEditMethod(c.paymentMethod);
                                  setEditStatus(c.paymentStatus);
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
                        const isPayLater = c.paymentMethod === 'PAY_LATER' || c.paymentStatus === 'PAY_LATER';
                        const isPending = c.paymentStatus === 'PENDING';

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
                                  isPayLater
                                    ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                                    : isCash
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                    : 'bg-devotional-blue-950 text-devotional-gold-300 border border-devotional-gold-500/30'
                                }`}
                              >
                                {c.paymentMethod === 'PAY_LATER' ? '⏱ PAY LATER' : c.paymentMethod}
                              </span>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              {isPayLater && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                                  <Clock className="w-3 h-3" /> PAY LATER
                                </span>
                              )}
                              {!isPayLater && isCash && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                                  <Check className="w-3 h-3" /> RECEIVED
                                </span>
                              )}
                              {!isPayLater && !isCash && isPending && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                                  <Clock className="w-3 h-3" /> PENDING
                                </span>
                              )}
                              {!isPayLater && !isCash && c.paymentStatus === 'VERIFIED' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                                  <Check className="w-3 h-3" /> VERIFIED
                                </span>
                              )}
                              {!isPayLater && !isCash && c.paymentStatus === 'REJECTED' && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/60 px-2 py-0.5 rounded-full border border-red-500/30">
                                  <X className="w-3 h-3" /> REJECTED
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                              {/* WhatsApp Reminder (Pay Later) vs WhatsApp Certificate (Cash/Online) */}
                              {isPayLater ? (
                                <button
                                  type="button"
                                  onClick={() => handleDashboardWhatsAppShare(c)}
                                  className="px-2 py-1 rounded-lg bg-amber-950 border border-amber-500/40 text-amber-300 hover:text-white inline-flex items-center gap-1 font-bold text-[10px]"
                                  title="Send Payment Reminder via WhatsApp"
                                >
                                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Reminder</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleDashboardWhatsAppShare(c)}
                                  className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-500/30 text-emerald-300 hover:text-white inline-flex items-center"
                                  title="Share on WhatsApp"
                                >
                                  <Smartphone className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* View Certificate (Only available when paid) */}
                              {!isPayLater && (
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
                                      paymentScreenshot: c.paymentScreenshot,
                                    })
                                  }
                                  className="p-1.5 rounded-lg bg-devotional-blue-950 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white inline-flex items-center"
                                  title="View White & Gold Certificate"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Screenshot Lightbox (ONLINE ONLY with screenshot) */}
                              {!isCash && !isPayLater && c.paymentScreenshot && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setViewingScreenshotUrl(c.paymentScreenshot!);
                                    setViewingScreenshotTitle(`Payment Screenshot: ${c.fullName} (₹${c.amount})`);
                                  }}
                                  className="p-1.5 rounded-lg bg-devotional-blue-950 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white inline-flex items-center"
                                  title="View Payment Screenshot"
                                >
                                  <ImageIcon className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Pay Later: Click Paid -> Updates as paid & Generates Certificate */}
                              {isPayLater && (
                                <button
                                  onClick={async () => {
                                    if (confirm(`Mark ₹${c.amount} from "${c.fullName}" as Paid? This will generate their official Certificate.`)) {
                                      await handleStatusUpdate(c.id, 'CASH_RECEIVED');
                                      setViewingCertificate({
                                        certificateNumber: c.certificateNumber,
                                        fullName: c.fullName,
                                        mobileNumber: c.mobileNumber,
                                        amount: c.amount,
                                        paymentMethod: 'CASH',
                                        paymentStatus: 'CASH_RECEIVED',
                                        createdAt: c.createdAt,
                                        volunteerName: c.volunteerName,
                                        paymentScreenshot: c.paymentScreenshot,
                                      });
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] inline-flex items-center gap-1 shadow-sm"
                                  title="Mark Paid & Generate Certificate"
                                >
                                  <Check className="w-3 h-3" />
                                  <span>Paid</span>
                                </button>
                              )}

                              {/* Admin Verify / Reject */}
                              {isAdmin && !isCash && !isPayLater && isPending && (
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
                                    setEditMethod(c.paymentMethod);
                                    setEditStatus(c.paymentStatus);
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

              <LandscapeCertificate
                data={viewingCertificate}
                showStatusShare={false}
                showGroupLink={false}
                showCertificateLink={true}
              />
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

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold">Payment Method</label>
                    <select
                      value={editMethod}
                      onChange={(e) => {
                        const newM = e.target.value as 'CASH' | 'ONLINE' | 'PAY_LATER';
                        setEditMethod(newM);
                        if (newM === 'CASH') setEditStatus('CASH_RECEIVED');
                        else if (newM === 'PAY_LATER') setEditStatus('PAY_LATER');
                        else if (newM === 'ONLINE' && editStatus === 'CASH_RECEIVED') setEditStatus('PENDING');
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-white"
                    >
                      <option value="CASH">CASH</option>
                      <option value="ONLINE">ONLINE (UPI)</option>
                      <option value="PAY_LATER">PAY LATER</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-300 mb-1 font-semibold">Payment Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-white"
                    >
                      <option value="CASH_RECEIVED">CASH RECEIVED</option>
                      <option value="VERIFIED">VERIFIED</option>
                      <option value="PENDING">PENDING</option>
                      <option value="PAY_LATER">PAY LATER</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>
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

        {/* MODAL: ADMIN SETTINGS MODAL */}
        {showSettingsModal && isAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md bg-[#071338] border-2 border-devotional-gold-500/50 rounded-3xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-devotional-gold-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-devotional-gold-500/20 border border-devotional-gold-400 flex items-center justify-center">
                    <Settings className="w-4 h-4 text-devotional-gold-400" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-devotional-gold-300">
                      Association & Security Settings
                    </h3>
                    <p className="text-[10px] text-gray-300">
                      Committee Admin Controls
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* UPI ID Configuration View */}
              <div className="p-3.5 rounded-2xl bg-devotional-blue-950 border border-devotional-gold-500/30 space-y-1.5">
                <span className="text-[10px] font-bold text-devotional-gold-300 uppercase tracking-wider block">
                  Active Chanda UPI ID
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-black text-white truncate">
                    {FESTIVAL_CONFIG.upiId}
                  </span>
                  <button
                    type="button"
                    onClick={copyUpiToClipboard}
                    className="px-2.5 py-1 rounded-lg bg-devotional-blue-900 border border-devotional-gold-500/40 text-[11px] font-bold text-devotional-gold-200 flex items-center gap-1 hover:text-white shrink-0"
                  >
                    {copiedUpi ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-gray-400">
                  Payee: {FESTIVAL_CONFIG.upiPayeeName} • {FESTIVAL_CONFIG.associationAddress}
                </p>
              </div>

              {/* Shared Volunteer Password Manager */}
              <div className="p-3.5 rounded-2xl bg-devotional-blue-950 border border-devotional-gold-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-devotional-gold-300 block">
                      Shared Volunteer Account
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Login ID: <b className="font-mono text-white">balaganesh</b>
                    </span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                    Active
                  </span>
                </div>

                <form onSubmit={handleUpdateVolunteerPassword} className="space-y-2">
                  <label className="block text-[11px] font-semibold text-gray-300">
                    Set New Volunteer Password:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={newVolunteerPassword}
                      onChange={(e) => setNewVolunteerPassword(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-white text-xs focus:outline-none focus:border-devotional-gold-400"
                    />
                    <button
                      type="submit"
                      disabled={settingsLoading || !newVolunteerPassword}
                      className="px-3 py-2 rounded-xl btn-gold text-devotional-blue-950 font-bold text-xs disabled:opacity-50 shrink-0"
                    >
                      {settingsLoading ? 'Saving...' : 'Update'}
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Changes take effect immediately for all volunteers logging in with balaganesh.
                  </p>
                </form>

                {settingsStatus && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      settingsStatus.type === 'success'
                        ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
                        : 'bg-red-950/80 border border-red-500/50 text-red-200'
                    }`}
                  >
                    {settingsStatus.type === 'success' ? (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    <span>{settingsStatus.message}</span>
                  </div>
                )}
              </div>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="w-full py-2.5 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-devotional-gold-200 font-bold text-xs hover:text-white"
                >
                  Close Settings
                </button>
              </div>
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
