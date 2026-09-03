'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FastContributionForm from '@/components/FastContributionForm';
import LandscapeCertificate, { CertificateData } from '@/components/LandscapeCertificate';
import { FESTIVAL_CONFIG } from '@/config/festival.config';
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

      // 2. Fetch Chanda stats only
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        setStats(statsJson.stats);
      }

      // 3. Fetch contributions with filters
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
    <div className="min-h-screen flex flex-col justify-between">
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

        {/* CHANDA ONLY SUMMARY METRICS */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-2xl border border-devotional-gold-500/30 bg-devotional-blue-900/50 p-4 space-y-1 shadow-md">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-devotional-gold-400">
                Today&apos;s Count
              </span>
              <p className="text-2xl sm:text-3xl font-black text-white">
                {stats.todayContributions || 0}
              </p>
              <p className="text-[10px] text-gray-400">
                Total: {stats.totalContributions || 0} entries
              </p>
            </div>

            <div className="rounded-2xl border border-devotional-gold-500/30 bg-devotional-blue-900/50 p-4 space-y-1 shadow-md">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-devotional-gold-400">
                Today&apos;s Amount
              </span>
              <p className="text-2xl sm:text-3xl font-black text-devotional-gold-300">
                ₹{(stats.todayAmount || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-gray-400">
                Total: ₹{(stats.totalAmount || 0).toLocaleString('en-IN')}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-1 shadow-md">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                  Cash Collected
                </span>
                <Banknote className="w-4 h-4" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-300">
                ₹{(stats.cashAmount || stats.todayCash || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-gray-400">
                {stats.cashContributions || 0} cash contributions
              </p>
            </div>

            <div className="rounded-2xl border border-devotional-gold-500/30 bg-devotional-blue-900/50 p-4 space-y-1 shadow-md">
              <div className="flex items-center justify-between text-devotional-gold-400">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                  Online / UPI
                </span>
                <Smartphone className="w-4 h-4" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-devotional-gold-300">
                ₹{(stats.onlineAmount || stats.todayOnline || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-amber-400 font-medium">
                {stats.pendingOnlinePayments || 0} pending verification
              </p>
            </div>
          </div>
        )}

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
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-devotional-gold-500/20 bg-devotional-blue-950/70 text-[10px] sm:text-[11px] font-extrabold tracking-wider text-devotional-gold-300 uppercase">
                      <th className="py-3 px-3 sm:px-4">Cert No</th>
                      <th className="py-3 px-3 sm:px-4">Donor</th>
                      <th className="py-3 px-3 sm:px-4">Amount</th>
                      <th className="py-3 px-3 sm:px-4">Method</th>
                      <th className="py-3 px-3 sm:px-4">Status</th>
                      <th className="py-3 px-3 sm:px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-devotional-gold-500/10 text-xs">
                    {contributions.map((c) => {
                      const isCash = c.paymentMethod === 'CASH';
                      const isPending = c.paymentStatus === 'PENDING';

                      return (
                        <tr
                          key={c.id}
                          className="hover:bg-devotional-blue-900/60 transition-colors"
                        >
                          <td className="py-3 px-3 sm:px-4 font-mono font-bold text-devotional-gold-200 whitespace-nowrap">
                            {c.certificateNumber}
                          </td>
                          <td className="py-3 px-3 sm:px-4">
                            <p className="font-bold text-white">{c.fullName}</p>
                            {c.mobileNumber && (
                              <p className="text-[11px] text-gray-400">{c.mobileNumber}</p>
                            )}
                          </td>
                          <td className="py-3 px-3 sm:px-4 font-black text-devotional-gold-300 text-sm whitespace-nowrap">
                            ₹{c.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-3 sm:px-4">
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
                          <td className="py-3 px-3 sm:px-4 whitespace-nowrap">
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
                          <td className="py-3 px-3 sm:px-4 text-right space-x-1.5 whitespace-nowrap">
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
                              className="p-1.5 rounded-lg bg-devotional-blue-950 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white"
                              title="View White & Gold Certificate"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

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

                            {isAdmin && (
                              <button
                                onClick={() => {
                                  setEditingContribution(c);
                                  setEditName(c.fullName);
                                  setEditMobile(c.mobileNumber || '');
                                  setEditAddress(c.address || '');
                                  setEditAmount(c.amount);
                                }}
                                className="p-1.5 rounded-lg bg-devotional-blue-950 border border-devotional-gold-500/20 text-gray-300 hover:text-white"
                                title="Edit Contribution"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
      </main>

      <Footer />
    </div>
  );
}
