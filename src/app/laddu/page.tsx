'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import LadduReceipt, { LadduReceiptData } from '@/components/LadduReceipt';
import ContributorProfileModal from '@/components/ContributorProfileModal';
import ImageLightboxModal from '@/components/ImageLightboxModal';
import { FESTIVAL_CONFIG, buildWhatsAppLadduReceiptShareUrl } from '@/config/festival.config';
import { cleanIndianMobile } from '@/lib/validation';
import {
  Coins,
  Search,
  PlusCircle,
  RefreshCw,
  Eye,
  Check,
  Clock,
  Smartphone,
  AlertCircle,
  X,
  FileSpreadsheet,
  User,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface LadduRecord {
  id: string;
  personName: string;
  mobileNumber?: string | null;
  address?: string | null;
  ladduYear: number;
  totalDue: number;
  totalPaid: number;
  remainingBalance: number;
  status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  notes?: string | null;
  contributorId?: string | null;
  createdAt: string;
  createdBy: { name: string };
  payments: Array<{
    id: string;
    receiptNumber: string;
    amount: number;
    paymentMethod: string;
    utr?: string | null;
    paymentScreenshot?: string | null;
    createdAt: string;
    createdBy?: { name: string };
  }>;
}

export default function LadduHubPage() {
  const router = useRouter();

  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);
  const [records, setRecords] = useState<LadduRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'PARTIALLY_PAID' | 'PAID'>('ALL');
  const [yearFilter, setYearFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [payingLaddu, setPayingLaddu] = useState<LadduRecord | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<LadduReceiptData | null>(null);
  const [selectedContributorId, setSelectedContributorId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState('');
  const [deletingLaddu, setDeletingLaddu] = useState<{ id: string; name: string; due: number } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Payment Form States (For payingLaddu)
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'CASH' | 'ONLINE'>('CASH');
  const [payUtr, setPayUtr] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // New Laddu Form States
  const [newName, setNewName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newYear, setNewYear] = useState('2025');
  const [newTotalDue, setNewTotalDue] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [hasInitialPayment, setHasInitialPayment] = useState(false);
  const [initialAmount, setInitialAmount] = useState('');
  const [initialMethod, setInitialMethod] = useState<'CASH' | 'ONLINE'>('CASH');
  const [initialUtr, setInitialUtr] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [existingDonorBadge, setExistingDonorBadge] = useState<{ name: string; address?: string } | null>(null);

  // Check auth session
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.replace('/login?redirect=/laddu');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.authenticated) {
          setUser(data.user);
        }
      })
      .catch(() => router.replace('/login?redirect=/laddu'));
  }, [router]);

  // Load Laddu list
  const fetchLadduData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '20');
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (yearFilter !== 'ALL') params.append('year', yearFilter);

      const res = await fetch(`/api/laddu?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setRecords(json.data || []);
        if (json.pagination) {
          setPage(json.pagination.page);
          setTotalPages(json.pagination.totalPages || 1);
          setTotalCount(json.pagination.total || 0);
        }
        if (json.stats) {
          setStats(json.stats);
        }
      }
    } catch (err) {
      console.error('Error loading laddu data:', err);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, statusFilter, yearFilter]);

  useEffect(() => {
    fetchLadduData();
  }, [fetchLadduData]);

  // Mobile number lookup in New Entry Form
  useEffect(() => {
    const clean = cleanIndianMobile(newMobile);
    if (clean && clean.length === 10) {
      fetch(`/api/contributors?mobile=${clean}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && d.contributor) {
            setExistingDonorBadge({
              name: d.contributor.fullName,
              address: d.contributor.address,
            });
            if (!newName) setNewName(d.contributor.fullName);
            if (!newAddress && d.contributor.address) setNewAddress(d.contributor.address);
          } else {
            setExistingDonorBadge(null);
          }
        })
        .catch(() => setExistingDonorBadge(null));
    } else {
      setExistingDonorBadge(null);
    }
  }, [newMobile, newName, newAddress]);

  // Handle Record Payment Submission
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingLaddu) return;

    const amt = parseInt(payAmount, 10);
    if (isNaN(amt) || amt <= 0) {
      setPayError('Please enter a valid payment amount.');
      return;
    }
    if (amt > payingLaddu.remainingBalance) {
      setPayError(`Payment cannot exceed remaining balance (₹${payingLaddu.remainingBalance.toLocaleString('en-IN')}).`);
      return;
    }

    setPaySubmitting(true);
    setPayError(null);

    try {
      const res = await fetch(`/api/laddu/${payingLaddu.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          paymentMethod: payMethod,
          utr: payUtr,
          notes: payNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setPayError(json.error || 'Failed to record payment.');
      } else {
        setPayingLaddu(null);
        setPayAmount('');
        setPayUtr('');
        setPayNotes('');
        await fetchLadduData();

        if (json.data?.receipt) {
          setViewingReceipt(json.data.receipt);
        }
      }
    } catch {
      setPayError('Network error while recording payment.');
    } finally {
      setPaySubmitting(false);
    }
  };

  // Handle Delete Laddu Record (Admin)
  const handleDeleteLaddu = async () => {
    if (!deletingLaddu) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/laddu/${deletingLaddu.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setDeleteError(json.error || 'Failed to delete Laddu record.');
      } else {
        setDeletingLaddu(null);
        await fetchLadduData();
      }
    } catch {
      setDeleteError('Network error while deleting Laddu record.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle New Laddu Entry Submission
  const handleNewLadduSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setAddError('Person Name is required.');
      return;
    }
    const due = parseInt(newTotalDue, 10);
    if (isNaN(due) || due <= 0) {
      setAddError('Please enter a valid total due amount.');
      return;
    }

    let initialPayment = undefined;
    if (hasInitialPayment) {
      const initAmt = parseInt(initialAmount, 10);
      if (isNaN(initAmt) || initAmt <= 0) {
        setAddError('Please enter a valid initial payment amount.');
        return;
      }
      if (initAmt > due) {
        setAddError('Initial payment cannot exceed total due amount.');
        return;
      }
      initialPayment = {
        amount: initAmt,
        paymentMethod: initialMethod,
        utr: initialUtr,
      };
    }

    setAddLoading(true);
    setAddError(null);

    try {
      const res = await fetch('/api/laddu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personName: newName.trim(),
          mobileNumber: newMobile.trim() || undefined,
          address: newAddress.trim() || undefined,
          ladduYear: parseInt(newYear, 10),
          totalDue: due,
          notes: newNotes.trim() || undefined,
          initialPayment,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setAddError(json.error || 'Failed to create Laddu record.');
      } else {
        setShowAddModal(false);
        setNewName('');
        setNewMobile('');
        setNewAddress('');
        setNewTotalDue('');
        setNewNotes('');
        setHasInitialPayment(false);
        setInitialAmount('');
        setInitialUtr('');
        await fetchLadduData();

        if (json.data?.payment) {
          setViewingReceipt({
            receiptNumber: json.data.payment.receiptNumber,
            personName: json.data.personName,
            mobileNumber: json.data.mobileNumber,
            ladduYear: json.data.ladduYear,
            amountPaid: json.data.payment.amount,
            totalPaid: json.data.totalPaid,
            totalDue: json.data.totalDue,
            remainingBalance: json.data.remainingBalance,
            paymentMethod: json.data.payment.paymentMethod,
            utr: json.data.payment.utr,
            status: json.data.status,
            date: json.data.payment.createdAt,
            volunteerName: user?.name,
          });
        }
      }
    } catch {
      setAddError('Network error creating Laddu record.');
    } finally {
      setAddLoading(false);
    }
  };

  const handleWhatsAppShare = (record: LadduRecord) => {
    const latestPayment = record.payments[0];
    const url = buildWhatsAppLadduReceiptShareUrl({
      personName: record.personName,
      ladduYear: record.ladduYear,
      amountPaid: latestPayment ? latestPayment.amount : record.totalPaid,
      totalPaid: record.totalPaid,
      totalDue: record.totalDue,
      remainingBalance: record.remainingBalance,
      status: record.status,
      receiptNumber: latestPayment ? latestPayment.receiptNumber : `LDR-${record.ladduYear}`,
      mobileNumber: record.mobileNumber,
    });
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#07112c] text-white">
      <Header />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 space-y-6 pb-28 md:pb-8">
        {/* Page Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-devotional-gold-500/20 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-amber-400">
                <Coins className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-devotional-gold-300">
                Laddu Balance & Payments
              </h1>
            </div>
            <p className="text-xs text-gray-300">
              Track auction bids, last year balances, and installment collections separately from Chanda.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="py-2.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-devotional-gold-500 text-devotional-blue-950 font-black text-xs flex items-center gap-1.5 shadow-gold-sm hover:brightness-110 active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-devotional-blue-950" />
              <span>+ New Laddu Entry</span>
            </button>

            {user?.role === 'ADMIN' && (
              <a
                href="/api/admin/export?type=laddu"
                download={`bala-ganesh-laddu-${Date.now()}.csv`}
                className="py-2.5 px-3.5 rounded-2xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                title="Download Laddu CSV"
              >
                <FileSpreadsheet className="w-4 h-4 text-devotional-gold-400" />
                <span className="hidden sm:inline">Export CSV</span>
              </a>
            )}
          </div>
        </div>

        {/* 4 Overview Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-2xl bg-devotional-blue-900/60 border border-devotional-gold-500/30">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
              Total Laddu Due
            </span>
            <span className="text-lg sm:text-xl font-black text-white mt-1 block">
              ₹{(stats?.totalDue || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-devotional-gold-400 font-semibold mt-0.5 block">
              {stats?.totalRecords || 0} Devotees Auctioned
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
              Total Collected
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-300 mt-1 block">
              ₹{(stats?.totalPaid || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-emerald-400/80 font-semibold mt-0.5 block">
              Cash: ₹{(stats?.cashCollected || 0).toLocaleString('en-IN')} • Online: ₹{(stats?.onlineCollected || 0).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
              Outstanding Balance
            </span>
            <span className="text-lg sm:text-xl font-black text-amber-300 mt-1 block">
              ₹{(stats?.remainingBalance || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-amber-400/80 font-semibold mt-0.5 block">
              {(stats?.unpaidCount || 0) + (stats?.partiallyPaidCount || 0)} Pending Settlement
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-devotional-blue-950 border border-devotional-gold-500/30">
            <span className="text-[11px] font-bold uppercase tracking-wider text-devotional-gold-400 block">
              Settlement Status
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base sm:text-lg font-black text-emerald-400">
                {stats?.paidCount || 0} Fully Paid
              </span>
            </div>
            <span className="text-[10px] text-gray-400 mt-0.5 block">
              {stats?.partiallyPaidCount || 0} Partially Paid
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-2xl bg-devotional-blue-900/60 border border-devotional-gold-500/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-devotional-gold-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Search person name, mobile, receipt #, UTR..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/40 text-white placeholder-gray-400 text-xs focus:outline-none focus:ring-1 focus:ring-devotional-gold-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Year Selector */}
            <select
              value={yearFilter}
              onChange={(e) => {
                setYearFilter(e.target.value);
                setPage(1);
              }}
              className="py-2 px-3 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/40 text-devotional-gold-200 text-xs focus:outline-none"
            >
              <option value="ALL">All Laddu Years</option>
              <option value="2025">2025 Laddu</option>
              <option value="2024">2024 Laddu</option>
              <option value="2026">2026 Laddu</option>
            </select>

            <button
              type="button"
              onClick={fetchLadduData}
              className="p-2 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white text-xs flex items-center justify-center gap-1 shrink-0"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-gray-400 mr-1">Status:</span>
            {[
              { label: 'All', value: 'ALL' },
              { label: 'Unpaid', value: 'UNPAID' },
              { label: 'Partially Paid', value: 'PARTIALLY_PAID' },
              { label: 'Fully Paid', value: 'PAID' },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.value as any);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === tab.value
                    ? 'bg-amber-500 text-devotional-blue-950 font-black shadow-sm'
                    : 'bg-devotional-blue-950/80 text-gray-300 hover:text-white border border-devotional-gold-500/20'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Laddu Records List */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-devotional-gold-300">
            <div className="w-8 h-8 border-3 border-devotional-gold-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold">Loading Laddu records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-8 rounded-3xl bg-devotional-blue-900/40 border border-devotional-gold-500/20 text-center space-y-3">
            <Coins className="w-12 h-12 text-amber-400 mx-auto opacity-70" />
            <h3 className="text-base font-black text-white">No Laddu Records Found</h3>
            <p className="text-xs text-gray-400 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'ALL'
                ? 'Try adjusting your search or filters to find Laddu records.'
                : 'Start by clicking "+ New Laddu Entry" to record last year auction balances or new winners.'}
            </p>
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl btn-gold text-devotional-blue-950 font-bold text-xs inline-flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record First Laddu</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block rounded-2xl bg-devotional-blue-900/50 border border-devotional-gold-500/30 overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-devotional-gold-500/20 bg-devotional-blue-950/90 text-devotional-gold-300 font-extrabold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">Year</th>
                    <th className="py-3 px-4">Person / Mobile</th>
                    <th className="py-3 px-4 text-right">Total Due</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4 text-right">Remaining</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-devotional-gold-500/10">
                  {records.map((r) => {
                    const isPaid = r.status === 'PAID' || r.remainingBalance <= 0;
                    return (
                      <tr key={r.id} className="hover:bg-devotional-blue-800/40 transition-colors">
                        <td className="py-3 px-4 font-black text-amber-400 whitespace-nowrap">
                          {r.ladduYear}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => r.contributorId && setSelectedContributorId(r.contributorId)}
                            className="font-bold text-white hover:text-devotional-gold-300 text-left block text-sm"
                          >
                            {r.personName}
                          </button>
                          <span className="font-mono text-gray-400 text-[11px]">
                            {r.mobileNumber ? `+91 ${r.mobileNumber}` : 'No phone'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-white whitespace-nowrap">
                          ₹{r.totalDue.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-400 whitespace-nowrap">
                          ₹{r.totalPaid.toLocaleString('en-IN')}
                          {r.payments.length > 0 && (
                            <span className="block text-[10px] text-gray-400 font-normal">
                              ({r.payments.length} payment{r.payments.length > 1 ? 's' : ''})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-black whitespace-nowrap">
                          <span className={isPaid ? 'text-emerald-400' : 'text-amber-400 text-sm'}>
                            ₹{r.remainingBalance.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                              isPaid
                                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30'
                                : r.status === 'PARTIALLY_PAID'
                                ? 'bg-amber-950/80 text-amber-300 border-amber-500/30'
                                : 'bg-red-950/80 text-red-300 border-red-500/30'
                            }`}
                          >
                            {isPaid ? <Check className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                            <span>{r.status}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center justify-center gap-1.5">
                            {!isPaid && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPayingLaddu(r);
                                  setPayAmount(r.remainingBalance.toString());
                                  setPayError(null);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-[11px] inline-flex items-center gap-1 shadow-sm transition-all"
                                title="Record Payment Installment"
                              >
                                <span>+ Pay</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleWhatsAppShare(r)}
                              className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-500/30 text-emerald-300 hover:text-white inline-flex items-center"
                              title="Send via WhatsApp to saved number"
                            >
                              <Smartphone className="w-3.5 h-3.5" />
                            </button>

                            {r.payments.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const latest = r.payments[0];
                                  setViewingReceipt({
                                    receiptNumber: latest.receiptNumber,
                                    personName: r.personName,
                                    mobileNumber: r.mobileNumber,
                                    ladduYear: r.ladduYear,
                                    amountPaid: latest.amount,
                                    totalPaid: r.totalPaid,
                                    totalDue: r.totalDue,
                                    remainingBalance: r.remainingBalance,
                                    paymentMethod: latest.paymentMethod,
                                    utr: latest.utr,
                                    status: r.status,
                                    date: latest.createdAt,
                                    volunteerName: latest.createdBy?.name || r.createdBy.name,
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-devotional-blue-950 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white inline-flex items-center"
                                title="View Official Receipt"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {r.contributorId && (
                              <button
                                type="button"
                                onClick={() => setSelectedContributorId(r.contributorId!)}
                                className="p-1.5 rounded-lg bg-devotional-blue-950 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white inline-flex items-center"
                                title="View Contributor Lifetime Profile"
                              >
                                <User className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {user?.role === 'ADMIN' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setDeletingLaddu({ id: r.id, name: r.personName, due: r.totalDue });
                                  setDeleteError(null);
                                }}
                                className="p-1.5 rounded-lg bg-red-950/60 border border-red-500/30 text-red-400 hover:text-red-200 inline-flex items-center active:scale-95 transition-all"
                                title="Delete Laddu Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-3">
              {records.map((r) => {
                const isPaid = r.status === 'PAID' || r.remainingBalance <= 0;
                return (
                  <div
                    key={r.id}
                    className="p-4 rounded-2xl bg-devotional-blue-900/60 border border-devotional-gold-500/30 space-y-3 shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-500/30">
                            {r.ladduYear} Laddu
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                              isPaid
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                                : r.status === 'PARTIALLY_PAID'
                                ? 'bg-amber-950 text-amber-300 border-amber-500/30'
                                : 'bg-red-950 text-red-300 border-red-500/30'
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-white mt-1">{r.personName}</h3>
                        <p className="font-mono text-xs text-gray-400">
                          {r.mobileNumber ? `+91 ${r.mobileNumber}` : 'No mobile registered'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Total Due</span>
                        <span className="text-sm font-black text-white block">
                          ₹{r.totalDue.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Progress Breakdown */}
                    <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-devotional-blue-950/80 border border-devotional-gold-500/20 text-xs">
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase block">Paid So Far</span>
                        <span className="font-black text-emerald-400 text-sm">
                          ₹{r.totalPaid.toLocaleString('en-IN')}
                        </span>
                        {r.payments.length > 0 && (
                          <span className="text-[10px] text-gray-400 block">
                            {r.payments.length} installment{r.payments.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400 text-[10px] uppercase block">Remaining</span>
                        <span className={`font-black text-sm ${isPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                          ₹{r.remainingBalance.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Compact Action Buttons in One Row */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {!isPaid && (
                        <button
                          type="button"
                          onClick={() => {
                            setPayingLaddu(r);
                            setPayAmount(r.remainingBalance.toString());
                            setPayError(null);
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all"
                        >
                          <span>+ Pay</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleWhatsAppShare(r)}
                        className="py-2 px-3 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
                        title="Send via WhatsApp"
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>

                      {r.payments.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const latest = r.payments[0];
                            setViewingReceipt({
                              receiptNumber: latest.receiptNumber,
                              personName: r.personName,
                              mobileNumber: r.mobileNumber,
                              ladduYear: r.ladduYear,
                              amountPaid: latest.amount,
                              totalPaid: r.totalPaid,
                              totalDue: r.totalDue,
                              remainingBalance: r.remainingBalance,
                              paymentMethod: latest.paymentMethod,
                              utr: latest.utr,
                              status: r.status,
                              date: latest.createdAt,
                              volunteerName: latest.createdBy?.name || r.createdBy.name,
                            });
                          }}
                          className="py-2 px-3 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-devotional-gold-300 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 text-devotional-gold-400" />
                          <span>Receipt</span>
                        </button>
                      )}

                      {r.contributorId && (
                        <button
                          type="button"
                          onClick={() => setSelectedContributorId(r.contributorId!)}
                          className="p-2 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-devotional-gold-300 font-bold text-xs flex items-center justify-center"
                          title="Profile"
                        >
                          <User className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {user?.role === 'ADMIN' && (
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingLaddu({ id: r.id, name: r.personName, due: r.totalDue });
                            setDeleteError(null);
                          }}
                          className="p-2 rounded-xl bg-red-950/60 border border-red-500/30 text-red-400 hover:text-red-200 text-xs flex items-center justify-center active:scale-95 transition-all"
                          title="Delete Laddu Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-devotional-blue-900/60 border border-devotional-gold-500/20 text-xs">
                <span className="text-gray-400">
                  Page {page} of {totalPages} ({totalCount} total records)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-2 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-devotional-gold-300 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-2 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-devotional-gold-300 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL 1: Record Payment Installment */}
      {payingLaddu && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setPayingLaddu(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-[#06102f] border-2 border-devotional-gold-500/40 p-5 sm:p-6 space-y-4 shadow-2xl animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-devotional-gold-500/20 pb-3">
              <div>
                <h3 className="text-base font-black text-white">Record Laddu Payment</h3>
                <p className="text-xs text-amber-300 font-semibold">{payingLaddu.personName}</p>
              </div>
              <button
                type="button"
                onClick={() => setPayingLaddu(null)}
                className="p-2 rounded-xl bg-devotional-blue-900 text-gray-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-devotional-blue-950 border border-devotional-gold-500/20 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Total Due:</span>
                <span className="font-bold text-white">₹{payingLaddu.totalDue.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-right">
                <span className="text-amber-400 block text-[10px] uppercase font-bold">Remaining Balance:</span>
                <span className="font-black text-amber-300 text-sm">
                  ₹{payingLaddu.remainingBalance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              {payError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{payError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-devotional-gold-300 flex items-center justify-between">
                  <span>Payment Amount (₹) *</span>
                  <button
                    type="button"
                    onClick={() => setPayAmount(payingLaddu.remainingBalance.toString())}
                    className="text-[10px] text-emerald-400 hover:underline font-bold"
                  >
                    Pay Full (₹{payingLaddu.remainingBalance})
                  </button>
                </label>
                <input
                  type="number"
                  min="1"
                  max={payingLaddu.remainingBalance}
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={`Max ₹${payingLaddu.remainingBalance}`}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/40 text-white font-black text-base focus:outline-none focus:ring-1 focus:ring-devotional-gold-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-devotional-gold-300">Payment Method *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayMethod('CASH')}
                    className={`py-2.5 rounded-xl text-xs font-black border transition-all ${
                      payMethod === 'CASH'
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-sm'
                        : 'bg-devotional-blue-950 text-gray-300 border-devotional-gold-500/30'
                    }`}
                  >
                    💵 CASH
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayMethod('ONLINE')}
                    className={`py-2.5 rounded-xl text-xs font-black border transition-all ${
                      payMethod === 'ONLINE'
                        ? 'bg-blue-600 text-white border-blue-400 shadow-sm'
                        : 'bg-devotional-blue-950 text-gray-300 border-devotional-gold-500/30'
                    }`}
                  >
                    📱 ONLINE (UPI)
                  </button>
                </div>
              </div>

              {payMethod === 'ONLINE' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-devotional-gold-300">UTR / Transaction ID</label>
                  <input
                    type="text"
                    value={payUtr}
                    onChange={(e) => setPayUtr(e.target.value)}
                    placeholder="12-digit UTR or Txn ID"
                    className="w-full px-3.5 py-2 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/40 text-white font-mono text-xs focus:outline-none"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400">Notes (Optional)</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Paid in cash at pandal"
                  className="w-full px-3.5 py-2 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-white text-xs focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingLaddu(null)}
                  className="flex-1 py-2.5 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-gray-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paySubmitting}
                  className="flex-1 py-2.5 rounded-xl btn-gold text-devotional-blue-950 font-black text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {paySubmitting ? (
                    <span>Recording...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm & Issue Receipt</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: New Laddu Entry */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-[#06102f] border-2 border-devotional-gold-500/40 p-5 sm:p-6 space-y-4 shadow-2xl animate-scaleUp my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-devotional-gold-500/20 pb-3">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">New Laddu Record</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl bg-devotional-blue-900 text-gray-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleNewLadduSubmit} className="space-y-3.5">
              {addError && (
                <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{addError}</span>
                </div>
              )}

              {/* Mobile Number with Auto-Donor Lookup */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-devotional-gold-300">Mobile Number (10 digits)</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={newMobile}
                  onChange={(e) => setNewMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 9876543210"
                  className="w-full px-3.5 py-2 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/40 text-white font-mono text-xs focus:outline-none"
                />
                {existingDonorBadge && (
                  <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-[11px] text-emerald-300 animate-fadeIn">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>
                      Found existing donor: <b>{existingDonorBadge.name}</b>. Linked to donor profile!
                    </span>
                  </div>
                )}
              </div>

              {/* Person Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-devotional-gold-300">Person / Devotee Name *</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ramesh Reddy"
                  className="w-full px-3.5 py-2 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/40 text-white text-xs focus:outline-none font-bold"
                />
              </div>

              {/* Address */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400">Address / Location (Optional)</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. Bhavani Nagar, Shankarpally"
                  className="w-full px-3.5 py-2 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-white text-xs focus:outline-none"
                />
              </div>

              {/* Year & Total Due */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-devotional-gold-300">Laddu Year</label>
                  <select
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/40 text-amber-300 font-black text-xs"
                  >
                    <option value="2025">2025 Laddu</option>
                    <option value="2024">2024 Laddu</option>
                    <option value="2026">2026 Laddu</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-devotional-gold-300">Total Laddu Due (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newTotalDue}
                    onChange={(e) => setNewTotalDue(e.target.value)}
                    placeholder="e.g. 10000"
                    className="w-full px-3.5 py-2 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/40 text-white font-black text-xs"
                  />
                </div>
              </div>

              {/* Initial Payment Checkbox */}
              <div className="pt-1 border-t border-devotional-gold-500/20">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-devotional-gold-300 select-none">
                  <input
                    type="checkbox"
                    checked={hasInitialPayment}
                    onChange={(e) => setHasInitialPayment(e.target.checked)}
                    className="w-4 h-4 rounded border-devotional-gold-500 accent-amber-500"
                  />
                  <span>Record an Initial Payment Now</span>
                </label>

                {hasInitialPayment && (
                  <div className="mt-3 p-3 rounded-2xl bg-devotional-blue-950 border border-devotional-gold-500/30 space-y-2.5 animate-fadeIn">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-emerald-400">Initial Amount Paid (₹)</label>
                      <input
                        type="number"
                        min="1"
                        max={newTotalDue ? parseInt(newTotalDue, 10) : undefined}
                        value={initialAmount}
                        onChange={(e) => setInitialAmount(e.target.value)}
                        placeholder="e.g. 3000"
                        className="w-full px-3 py-1.5 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-white font-black text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setInitialMethod('CASH')}
                        className={`py-1.5 rounded-lg text-xs font-black border ${
                          initialMethod === 'CASH'
                            ? 'bg-emerald-600 text-white border-emerald-400'
                            : 'bg-devotional-blue-900 text-gray-300 border-devotional-gold-500/20'
                        }`}
                      >
                        💵 CASH
                      </button>
                      <button
                        type="button"
                        onClick={() => setInitialMethod('ONLINE')}
                        className={`py-1.5 rounded-lg text-xs font-black border ${
                          initialMethod === 'ONLINE'
                            ? 'bg-blue-600 text-white border-blue-400'
                            : 'bg-devotional-blue-900 text-gray-300 border-devotional-gold-500/20'
                        }`}
                      >
                        📱 ONLINE
                      </button>
                    </div>

                    {initialMethod === 'ONLINE' && (
                      <input
                        type="text"
                        value={initialUtr}
                        onChange={(e) => setInitialUtr(e.target.value)}
                        placeholder="UTR / Transaction ID"
                        className="w-full px-3 py-1.5 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-white text-xs font-mono"
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-gray-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 py-2.5 rounded-xl btn-gold text-devotional-blue-950 font-black text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {addLoading ? (
                    <span>Saving...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Record</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: View Laddu Receipt Modal */}
      {viewingReceipt && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto"
          onClick={() => setViewingReceipt(null)}
        >
          <div
            className="w-full max-w-3xl rounded-3xl bg-[#06102f] border-2 border-devotional-gold-500/50 p-4 sm:p-6 space-y-4 shadow-2xl animate-scaleUp my-auto max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-devotional-gold-500/20 pb-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                {viewingReceipt.receiptNumber}
              </span>
              <button
                type="button"
                onClick={() => setViewingReceipt(null)}
                className="p-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-gray-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <LadduReceipt data={viewingReceipt} />
          </div>
        </div>
      )}

      {/* MODAL 4: Contributor Profile Modal */}
      {selectedContributorId && (
        <ContributorProfileModal
          contributorId={selectedContributorId}
          onClose={() => setSelectedContributorId(null)}
        />
      )}

      {/* MODAL 5: Image Lightbox */}
      <ImageLightboxModal
        isOpen={!!lightboxUrl}
        imageUrl={lightboxUrl}
        title={lightboxTitle}
        onClose={() => setLightboxUrl(null)}
      />

      {/* MODAL 6: Delete Laddu Record Confirmation */}
      {deletingLaddu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl border border-red-500/50 bg-[#06102f] p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-950 border border-red-500/40 mx-auto flex items-center justify-center text-red-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-white text-base">Delete Laddu Record?</h3>
              <p className="text-xs text-gray-300">
                Are you sure you want to permanently delete the Laddu record for{' '}
                <strong className="text-amber-300 font-bold">{deletingLaddu.name}</strong> (₹{deletingLaddu.due.toLocaleString('en-IN')})?
              </p>
              <p className="text-[11px] text-red-400/90 font-medium">
                All recorded installment payments, receipts, and balances for this person will be permanently erased.
              </p>
            </div>

            {deleteError && (
              <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs text-left">
                {deleteError}
              </div>
            )}

            <div className="flex gap-2 pt-2 text-xs">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => {
                  setDeletingLaddu(null);
                  setDeleteError(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gray-800 text-gray-300 font-bold hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteLaddu}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deleteLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Confirm Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      {user && <MobileBottomNav userRole={user.role} userName={user.name} />}
    </div>
  );
}
