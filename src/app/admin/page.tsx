'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { FESTIVAL_CONFIG } from '@/config/festival.config';
import {
  Users,
  IndianRupee,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Eye,
  LogOut,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Download,
  Check,
  X,
} from 'lucide-react';

interface Stats {
  totalContributions: number;
  totalAmount: number;
  verifiedAmount: number;
  pendingPayments: number;
  verifiedPayments: number;
  rejectedPayments: number;
}

interface Contribution {
  id: string;
  receiptNumber: string;
  fullName: string;
  mobileNumber: string;
  address: string | null;
  amount: number;
  utr: string;
  paymentScreenshot: string | null;
  paymentStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  verifiedAt: string | null;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [stats, setStats] = useState<Stats | null>(null);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');
  const [selectedContribution, setSelectedContribution] = useState<Contribution | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Authenticate & Load initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Check session
      const authRes = await fetch('/api/admin/session');
      if (!authRes.ok) {
        router.push('/admin/login');
        return;
      }

      // 2. Fetch stats
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        setStats(statsJson.stats);
      }

      // 3. Fetch contributions
      const filterParam = statusFilter !== 'ALL' ? `&status=${statusFilter}` : '';
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const listRes = await fetch(`/api/admin/contributions?${filterParam}${searchParam}`);
      if (listRes.ok) {
        const listJson = await listRes.json();
        setContributions(listJson.data);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  }, [router, statusFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update Status Action
  const handleUpdateStatus = async (id: string, newStatus: 'VERIFIED' | 'REJECTED' | 'PENDING') => {
    setActionLoadingId(id);
    try {
      const res = await fetch('/api/admin/contributions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        const updatedJson = await res.json();
        setContributions((prev) =>
          prev.map((c) => (c.id === id ? { ...c, paymentStatus: newStatus } : c))
        );
        if (selectedContribution?.id === id) {
          setSelectedContribution((prev) => (prev ? { ...prev, paymentStatus: newStatus } : null));
        }

        // Refresh stats
        const statsRes = await fetch('/api/admin/stats');
        if (statsRes.ok) {
          const statsJson = await statsRes.json();
          setStats(statsJson.stats);
        }
      }
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#07112c]">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-devotional-gold-500/20 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-devotional-gold-300">
              Admin Chanda Dashboard
            </h1>
            <p className="text-xs text-devotional-gold-100/70">
              {FESTIVAL_CONFIG.associationName} • {FESTIVAL_CONFIG.festivalYear}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData()}
              className="p-2 rounded-xl bg-devotional-blue-900/80 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-devotional-gold-200 text-xs flex items-center gap-1.5 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 px-3 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 hover:text-red-200 text-xs flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Dashboard 4 Summary Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Contributions */}
            <div className="rounded-2xl border border-devotional-gold-500/30 bg-devotional-blue-900/50 p-4 space-y-1 shadow-md">
              <div className="flex items-center justify-between text-devotional-gold-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Contributions</span>
                <Users className="w-4 h-4" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white">{stats.totalContributions}</p>
            </div>

            {/* Total Amount */}
            <div className="rounded-2xl border border-devotional-gold-500/30 bg-devotional-blue-900/50 p-4 space-y-1 shadow-md">
              <div className="flex items-center justify-between text-devotional-gold-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Amount</span>
                <IndianRupee className="w-4 h-4" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-devotional-gold-300">
                ₹{stats.totalAmount.toLocaleString('en-IN')}
              </p>
            </div>

            {/* Pending Payments */}
            <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-4 space-y-1 shadow-md">
              <div className="flex items-center justify-between text-amber-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Pending</span>
                <Clock className="w-4 h-4" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-amber-300">{stats.pendingPayments}</p>
            </div>

            {/* Verified Payments */}
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-1 shadow-md">
              <div className="flex items-center justify-between text-emerald-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Verified</span>
                <CheckCircle className="w-4 h-4" />
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-300">{stats.verifiedPayments}</p>
            </div>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-devotional-blue-900/40 border border-devotional-gold-500/20 p-3 rounded-2xl">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, mobile, receipt #, UTR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/20 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-devotional-gold-400"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-devotional-blue-950 p-1 rounded-xl border border-devotional-gold-500/20 self-start sm:self-auto overflow-x-auto">
            {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === tab
                    ? 'bg-devotional-gold-500 text-devotional-blue-950 shadow-sm'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Contributions List / Table */}
        <div className="rounded-2xl border border-devotional-gold-500/30 bg-devotional-blue-900/40 overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-devotional-gold-300 space-y-2">
              <div className="w-8 h-8 border-2 border-devotional-gold-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Loading contributions...</p>
            </div>
          ) : contributions.length === 0 ? (
            <div className="p-12 text-center text-gray-400 space-y-2">
              <Users className="w-8 h-8 mx-auto text-gray-500" />
              <p className="text-sm font-medium">No contributions found.</p>
              <p className="text-xs text-gray-500">
                {searchQuery ? 'Try changing your search terms.' : 'Contributions will appear here as donors submit.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-devotional-gold-500/20 bg-devotional-blue-950/70 text-[11px] font-extrabold tracking-wider text-devotional-gold-300 uppercase">
                    <th className="py-3 px-4">Receipt No</th>
                    <th className="py-3 px-4">Donor Name</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">UTR / Txn ID</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-devotional-gold-500/10 text-xs">
                  {contributions.map((c) => {
                    const isPending = c.paymentStatus === 'PENDING';
                    const isVerified = c.paymentStatus === 'VERIFIED';
                    const isRejected = c.paymentStatus === 'REJECTED';

                    return (
                      <tr
                        key={c.id}
                        className="hover:bg-devotional-blue-900/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedContribution(c)}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-devotional-gold-200">
                          {c.receiptNumber}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-white">{c.fullName}</p>
                          <p className="text-[11px] text-gray-400">{c.mobileNumber}</p>
                        </td>
                        <td className="py-3 px-4 font-bold text-devotional-gold-300 text-sm">
                          ₹{c.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-300 uppercase text-[11px]">
                          {c.utr}
                        </td>
                        <td className="py-3 px-4">
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-500/40">
                              <Clock className="w-3 h-3" /> PENDING
                            </span>
                          )}
                          {isVerified && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/40">
                              <Check className="w-3 h-3" /> VERIFIED
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-950/60 text-red-400 border border-red-500/40">
                              <X className="w-3 h-3" /> REJECTED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedContribution(c)}
                            className="p-1.5 rounded-lg bg-devotional-blue-950 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isPending && (
                            <>
                              <button
                                disabled={actionLoadingId === c.id}
                                onClick={() => handleUpdateStatus(c.id, 'VERIFIED')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors"
                              >
                                Verify
                              </button>
                              <button
                                disabled={actionLoadingId === c.id}
                                onClick={() => handleUpdateStatus(c.id, 'REJECTED')}
                                className="px-2.5 py-1 rounded-lg bg-red-950 border border-red-500/40 text-red-400 hover:bg-red-900/60 font-bold text-[11px] transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {isVerified && (
                            <button
                              disabled={actionLoadingId === c.id}
                              onClick={() => handleUpdateStatus(c.id, 'PENDING')}
                              className="px-2 py-1 rounded-lg text-[10px] text-gray-400 hover:text-gray-200"
                            >
                              Reset
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

        {/* Contribution Details Modal */}
        {selectedContribution && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg rounded-3xl border-2 border-devotional-gold-500/40 bg-devotional-blue-950 p-6 shadow-2xl space-y-5 text-white max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-devotional-gold-500/20 pb-3">
                <div>
                  <h3 className="text-base font-bold text-devotional-gold-300">
                    Contribution Details
                  </h3>
                  <p className="text-xs font-mono text-gray-400">
                    {selectedContribution.receiptNumber}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedContribution(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-devotional-blue-900/60 p-3 rounded-xl border border-devotional-gold-500/20">
                  <span className="text-gray-400 block mb-0.5">Donor Name</span>
                  <span className="font-bold text-sm text-white">{selectedContribution.fullName}</span>
                </div>

                <div className="bg-devotional-blue-900/60 p-3 rounded-xl border border-devotional-gold-500/20">
                  <span className="text-gray-400 block mb-0.5">Amount</span>
                  <span className="font-black text-base text-devotional-gold-300">
                    ₹{selectedContribution.amount.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="bg-devotional-blue-900/60 p-3 rounded-xl border border-devotional-gold-500/20">
                  <span className="text-gray-400 block mb-0.5">Mobile</span>
                  <a
                    href={`tel:${selectedContribution.mobileNumber}`}
                    className="font-bold text-devotional-gold-200 hover:underline"
                  >
                    +91 {selectedContribution.mobileNumber}
                  </a>
                </div>

                <div className="bg-devotional-blue-900/60 p-3 rounded-xl border border-devotional-gold-500/20">
                  <span className="text-gray-400 block mb-0.5">UTR / Txn ID</span>
                  <span className="font-mono font-bold text-devotional-gold-400 uppercase">
                    {selectedContribution.utr}
                  </span>
                </div>

                {selectedContribution.address && (
                  <div className="col-span-2 bg-devotional-blue-900/60 p-3 rounded-xl border border-devotional-gold-500/20">
                    <span className="text-gray-400 block mb-0.5">Address</span>
                    <span className="text-gray-200">{selectedContribution.address}</span>
                  </div>
                )}
              </div>

              {/* Payment Screenshot if uploaded */}
              {selectedContribution.paymentScreenshot ? (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-devotional-gold-300">
                    Payment Screenshot Uploaded:
                  </span>
                  <div className="rounded-xl overflow-hidden border border-devotional-gold-500/30 max-h-64 bg-black/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedContribution.paymentScreenshot}
                      alt="Payment screenshot"
                      className="w-full h-auto max-h-64 object-contain"
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">No payment screenshot was attached.</p>
              )}

              {/* Status change actions */}
              <div className="pt-2 border-t border-devotional-gold-500/20 space-y-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedContribution.id, 'VERIFIED')}
                    disabled={selectedContribution.paymentStatus === 'VERIFIED'}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <Check className="w-4 h-4" />
                    <span>Mark as Verified</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(selectedContribution.id, 'REJECTED')}
                    disabled={selectedContribution.paymentStatus === 'REJECTED'}
                    className="flex-1 py-2.5 rounded-xl bg-red-900/60 hover:bg-red-800 border border-red-500/40 text-red-200 font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject Payment</span>
                  </button>
                </div>

                <a
                  href={`/receipt/${selectedContribution.receiptNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View Public Receipt & Download Image</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
