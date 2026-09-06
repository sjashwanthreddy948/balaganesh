'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
  User,
  Phone,
  MapPin,
  Calendar,
  Eye,
  CheckCircle,
  Clock,
  Coins,
  Receipt,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface ContributorProfileModalProps {
  contributorId: string;
  onClose: () => void;
  onViewCertificate?: (certNo: string) => void;
  onViewLadduReceipt?: (receiptNo: string) => void;
}

export default function ContributorProfileModal({
  contributorId,
  onClose,
  onViewCertificate,
  onViewLadduReceipt,
}: ContributorProfileModalProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'CHANDA' | 'LADDU'>('ALL');

  useEffect(() => {
    if (!contributorId) return;
    setLoading(true);
    fetch(`/api/contributors/${contributorId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setProfile(json.data);
        } else {
          setError(json.error || 'Failed to load profile');
        }
      })
      .catch(() => setError('Network error loading profile'))
      .finally(() => setLoading(false));
  }, [contributorId]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-3xl bg-[#06102f] border-2 border-devotional-gold-500/40 p-5 sm:p-6 space-y-5 shadow-2xl animate-scaleUp my-auto max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-devotional-gold-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-devotional-blue-900 border border-devotional-gold-400 flex items-center justify-center text-devotional-gold-300">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">
                {profile ? profile.fullName : 'Contributor Profile'}
              </h2>
              <p className="text-xs text-devotional-gold-300/80 font-mono">
                {profile?.mobileNumber ? `+91 ${profile.mobileNumber}` : 'Devotee Records'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-gray-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-devotional-gold-300">
            <div className="w-8 h-8 border-3 border-devotional-gold-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold">Loading Contributor History...</p>
          </div>
        ) : error || !profile ? (
          <div className="p-6 text-center text-red-300 bg-red-950/40 rounded-2xl border border-red-500/30">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-xs font-bold">{error || 'Contributor not found'}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Address Banner */}
            {profile.address && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-devotional-blue-900/50 border border-devotional-gold-500/20 text-xs text-gray-300">
                <MapPin className="w-4 h-4 text-devotional-gold-400 shrink-0" />
                <span>{profile.address}</span>
              </div>
            )}

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-2xl bg-devotional-blue-900/60 border border-devotional-gold-500/30 text-center">
                <span className="text-[10px] font-bold text-devotional-gold-300 uppercase block">
                  Total Chanda
                </span>
                <span className="text-base font-black text-white mt-0.5 block">
                  ₹{profile.aggregates.totalChanda.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-center">
                <span className="text-[10px] font-bold text-amber-300 uppercase block">
                  Laddu Due
                </span>
                <span className="text-base font-black text-amber-200 mt-0.5 block">
                  ₹{profile.aggregates.totalLadduDue.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-center">
                <span className="text-[10px] font-bold text-emerald-300 uppercase block">
                  Laddu Paid
                </span>
                <span className="text-base font-black text-emerald-200 mt-0.5 block">
                  ₹{profile.aggregates.totalLadduPaid.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-center">
                <span className="text-[10px] font-bold text-gray-300 uppercase block">
                  Laddu Balance
                </span>
                <span
                  className={`text-base font-black mt-0.5 block ${
                    profile.aggregates.remainingLadduBalance === 0 ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  ₹{profile.aggregates.remainingLadduBalance.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-devotional-gold-500/20 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'ALL'
                    ? 'bg-devotional-gold-500 text-devotional-blue-950'
                    : 'text-gray-400 hover:text-white bg-devotional-blue-900/60'
                }`}
              >
                All Activity
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('CHANDA')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'CHANDA'
                    ? 'bg-devotional-gold-500 text-devotional-blue-950'
                    : 'text-gray-400 hover:text-white bg-devotional-blue-900/60'
                }`}
              >
                Chanda ({profile.contributions?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('LADDU')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'LADDU'
                    ? 'bg-amber-500 text-devotional-blue-950'
                    : 'text-gray-400 hover:text-white bg-devotional-blue-900/60'
                }`}
              >
                Laddu ({profile.ladduBalances?.length || 0})
              </button>
            </div>

            {/* Records Content */}
            <div className="space-y-4">
              {/* Chanda Section */}
              {(activeTab === 'ALL' || activeTab === 'CHANDA') && (
                <div className="space-y-2">
                  <h3 className="text-xs font-extrabold text-devotional-gold-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-devotional-gold-400" />
                    <span>Chanda Contributions</span>
                  </h3>
                  {profile.contributions?.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No Chanda contributions recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {profile.contributions.map((c: any) => (
                        <div
                          key={c.id}
                          className="p-3 rounded-2xl bg-devotional-blue-900/40 border border-devotional-gold-500/20 flex items-center justify-between gap-3 text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-devotional-gold-300 font-bold">
                                {c.certificateNumber}
                              </span>
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  c.paymentStatus === 'CASH_RECEIVED' || c.paymentStatus === 'VERIFIED'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {c.paymentStatus}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-400 mt-1">
                              {new Date(c.createdAt).toLocaleDateString('en-IN')} • Via {c.paymentMethod}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-extrabold text-sm text-white">
                              ₹{c.amount.toLocaleString('en-IN')}
                            </span>
                            <Link
                              href={`/certificate/${c.certificateNumber}`}
                              target="_blank"
                              className="p-1.5 rounded-lg bg-devotional-blue-950 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white"
                              title="View Certificate"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Laddu Section */}
              {(activeTab === 'ALL' || activeTab === 'LADDU') && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>Laddu Auction & Balances</span>
                  </h3>
                  {profile.ladduBalances?.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No Laddu records found.</p>
                  ) : (
                    <div className="space-y-3">
                      {profile.ladduBalances.map((l: any) => (
                        <div
                          key={l.id}
                          className="p-3.5 rounded-2xl bg-devotional-blue-900/40 border border-amber-500/30 space-y-2.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[11px] font-black uppercase text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-500/30">
                                {l.ladduYear} Laddu
                              </span>
                              <span
                                className={`ml-2 text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  l.status === 'PAID'
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                                    : 'bg-amber-950 text-amber-300 border border-amber-500/30'
                                }`}
                              >
                                {l.status}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-gray-400 text-[11px]">Due: </span>
                              <span className="font-extrabold text-white">
                                ₹{l.totalDue.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-[11px] bg-devotional-blue-950/80 p-2 rounded-xl">
                            <div>
                              <span className="text-emerald-400 font-bold">Paid: </span>
                              <span className="font-bold text-white">₹{l.totalPaid.toLocaleString('en-IN')}</span>
                            </div>
                            <div>
                              <span className="text-amber-400 font-bold">Balance: </span>
                              <span className="font-bold text-white">₹{l.remainingBalance.toLocaleString('en-IN')}</span>
                            </div>
                          </div>

                          {/* Installments History */}
                          {l.payments && l.payments.length > 0 && (
                            <div className="space-y-1.5 pt-1">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                                Payment Installments ({l.payments.length})
                              </p>
                              <div className="space-y-1">
                                {l.payments.map((p: any) => (
                                  <div
                                    key={p.id}
                                    className="flex items-center justify-between py-1 px-2 rounded-lg bg-devotional-blue-950 text-[11px]"
                                  >
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-mono text-devotional-gold-300">
                                        {p.receiptNumber}
                                      </span>
                                      <span className="text-gray-400">({p.paymentMethod})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-bold text-emerald-400">
                                        +₹{p.amount.toLocaleString('en-IN')}
                                      </span>
                                      <Link
                                        href={`/laddu/receipt/${p.receiptNumber}`}
                                        target="_blank"
                                        className="text-devotional-gold-400 hover:text-white"
                                        title="View Laddu Receipt"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </Link>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
