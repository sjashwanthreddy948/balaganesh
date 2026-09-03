'use client';

import React, { useState, useEffect } from 'react';
import { FESTIVAL_CONFIG, buildUpiUri } from '@/config/festival.config';
import { cleanIndianMobile } from '@/lib/validation';
import LandscapeCertificate, { CertificateData } from './LandscapeCertificate';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  Banknote,
  Smartphone,
  QrCode,
  CheckCircle,
  AlertCircle,
  UploadCloud,
  PlusCircle,
  ChevronRight,
  Sparkles,
  User,
  Phone,
  MapPin,
  X,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface FastContributionFormProps {
  onSuccess?: (contribution: CertificateData) => void;
  onCancel?: () => void;
}

export default function FastContributionForm({ onSuccess, onCancel }: FastContributionFormProps) {
  // Form Inputs
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number>(FESTIVAL_CONFIG.defaultAmount);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [customAmountInput, setCustomAmountInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE'>('CASH');
  const [utr, setUtr] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  // Dynamic QR Helper Drawer for online donor
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success / Generated Certificate State
  const [createdCertificate, setCreatedCertificate] = useState<CertificateData | null>(null);
  const [lastContributionPill, setLastContributionPill] = useState<{
    name: string;
    amount: number;
    method: string;
    certNo: string;
  } | null>(null);

  const effectiveAmount = isCustomAmount ? Number(customAmountInput) || 0 : selectedAmount;

  // Generate QR for online drawer
  useEffect(() => {
    if (effectiveAmount >= 10) {
      const upiUri = buildUpiUri(effectiveAmount);
      QRCode.toDataURL(upiUri, {
        width: 320,
        margin: 1.5,
        color: { dark: '#07112c', light: '#ffffff' },
      })
        .then((url) => setQrCodeUrl(url))
        .catch((err) => console.error('QR error:', err));
    }
  }, [effectiveAmount]);

  // Quick Amount Select
  const handleAmountClick = (amt: number) => {
    setIsCustomAmount(false);
    setSelectedAmount(amt);
    setCustomAmountInput('');
    setErrorMessage(null);
  };

  const handleCustomAmountClick = () => {
    setIsCustomAmount(true);
    setErrorMessage(null);
  };

  // Screenshot handler
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Screenshot image must be less than 5MB.');
        return;
      }
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
      setErrorMessage(null);
    }
  };

  // Reset form for "+ ADD ANOTHER CONTRIBUTION"
  const handleAddAnother = () => {
    if (createdCertificate) {
      setLastContributionPill({
        name: createdCertificate.fullName,
        amount: createdCertificate.amount,
        method: createdCertificate.paymentMethod,
        certNo: createdCertificate.certificateNumber,
      });
    }
    setFullName('');
    setMobileNumber('');
    setAddress('');
    setSelectedAmount(FESTIVAL_CONFIG.defaultAmount);
    setIsCustomAmount(false);
    setCustomAmountInput('');
    setPaymentMethod('CASH');
    setUtr('');
    setScreenshotFile(null);
    setScreenshotPreview(null);
    setErrorMessage(null);
    setCreatedCertificate(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage("Please enter the donor's name.");
      return;
    }

    if (!effectiveAmount || effectiveAmount < FESTIVAL_CONFIG.minAmount) {
      setErrorMessage("Please enter a valid contribution amount.");
      return;
    }

    if (mobileNumber.trim().length > 0) {
      const cleanMobile = cleanIndianMobile(mobileNumber);
      if (cleanMobile.length !== 10 || !/^[6-9]/.test(cleanMobile)) {
        setErrorMessage("Please enter a valid 10-digit mobile number.");
        return;
      }
    }

    if (paymentMethod === 'ONLINE') {
      const cleanUtr = utr.trim();
      if (!cleanUtr || cleanUtr.length < 4) {
        setErrorMessage("UTR is required for online contributions.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let uploadedScreenshotUrl: string | null = null;
      if (screenshotFile) {
        const formData = new FormData();
        formData.append('file', screenshotFile);
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadJson = await uploadRes.json();
        if (uploadRes.ok && uploadJson.url) {
          uploadedScreenshotUrl = uploadJson.url;
        }
      }

      const payload = {
        fullName: trimmedName,
        mobileNumber: mobileNumber.trim() || undefined,
        address: address.trim() || undefined,
        amount: effectiveAmount,
        paymentMethod,
        utr: paymentMethod === 'ONLINE' ? utr.trim().toUpperCase() : undefined,
        paymentScreenshot: uploadedScreenshotUrl,
      };

      const res = await fetch('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        if (res.status === 409 || json.error?.includes('already been recorded')) {
          setErrorMessage("This UTR has already been recorded.");
        } else {
          setErrorMessage(json.error || "Something went wrong. Please try again.");
        }
        setIsSubmitting(false);
        return;
      }

      const certData: CertificateData = {
        certificateNumber: json.data.certificateNumber,
        fullName: json.data.fullName,
        mobileNumber: json.data.mobileNumber,
        amount: json.data.amount,
        paymentMethod: json.data.paymentMethod,
        paymentStatus: json.data.paymentStatus,
        createdAt: json.data.createdAt,
        volunteerName: json.data.volunteerName,
      };

      setCreatedCertificate(certData);
      if (onSuccess) onSuccess(certData);

      // Celebration Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.5 },
          colors: ['#ffd700', '#e5b31e', '#254eb8', '#ffffff'],
        });
      } catch {
        // Safe ignore
      }
    } catch (err) {
      console.error('Submission error:', err);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // SUCCESS SCREEN (CERTIFICATE + ADD ANOTHER)
  // ==========================================
  if (createdCertificate) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6 animate-fadeIn py-2">
        {/* Success Header */}
        <div className="bg-devotional-blue-900/60 border border-emerald-500/40 rounded-2xl p-4 text-center space-y-1.5 shadow-xl">
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-extrabold text-base sm:text-lg">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Contribution Saved Successfully ✓</span>
          </div>
          <p className="text-xs text-devotional-gold-200">
            Certificate No: <b className="font-mono text-white text-sm">{createdCertificate.certificateNumber}</b>
          </p>
        </div>

        {/* 16:9 Landscape Certificate */}
        <LandscapeCertificate data={createdCertificate} />

        {/* Rapid Add Next Contribution Button */}
        <div className="pt-2">
          <button
            onClick={handleAddAnother}
            className="w-full py-4 px-6 rounded-2xl bg-devotional-blue-800 hover:bg-devotional-blue-700 border-2 border-devotional-gold-400 text-devotional-gold-200 hover:text-white font-extrabold text-base sm:text-lg flex items-center justify-center gap-3 shadow-gold-md transition-all active:scale-[0.99]"
          >
            <PlusCircle className="w-6 h-6 text-devotional-gold-400" />
            <span>+ ADD ANOTHER CONTRIBUTION</span>
          </button>
          <p className="text-[11px] text-gray-400 text-center mt-2">
            Instantly clears the form for the next donor in line.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // FAST ENTRY FORM SCREEN
  // ==========================================
  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Last Contribution Pill Bar (if volunteer is entering continuously) */}
      {lastContributionPill && (
        <div className="mb-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5 px-4 flex items-center justify-between text-xs text-emerald-200 shadow-sm animate-fadeIn">
          <span className="truncate">
            Last: <b className="text-white">{lastContributionPill.name}</b> — ₹{lastContributionPill.amount} — {lastContributionPill.method}
          </span>
          <span className="font-mono text-[10px] text-emerald-400 shrink-0 ml-2">
            {lastContributionPill.certNo}
          </span>
        </div>
      )}

      <div className="rounded-3xl border-2 border-devotional-gold-500/40 bg-devotional-blue-900/70 backdrop-blur-md p-5 sm:p-7 shadow-2xl space-y-6">
        {/* Form Title */}
        <div className="flex items-center justify-between border-b border-devotional-gold-500/20 pb-3">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-devotional-gold-300 tracking-wide flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-devotional-gold-400" />
              <span>NEW CONTRIBUTION</span>
            </h2>
            <p className="text-[11px] text-gray-300">
              Record Chanda & generate landscape certificate
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 flex items-start gap-2.5 text-xs text-red-200 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* SECTION 1: DONOR DETAILS */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-devotional-gold-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>DONOR DETAILS</span>
            </h3>

            {/* Donor Full Name */}
            <div>
              <label className="block text-xs font-semibold text-devotional-gold-200 mb-1">
                Full Name <span className="text-amber-400 font-bold">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ravi Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-devotional-gold-400 text-sm font-semibold capitalize"
                autoFocus
              />
            </div>

            {/* Mobile Number (Optional on ground) */}
            <div>
              <label className="block text-xs font-semibold text-devotional-gold-200 mb-1">
                Mobile Number <span className="text-gray-400 text-[11px] font-normal">(Optional for WhatsApp certificate)</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs font-bold text-gray-400 select-none">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-devotional-gold-400 text-sm"
                />
              </div>
            </div>

            {/* Address (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-devotional-gold-200 mb-1">
                Address / Colony <span className="text-gray-400 text-[11px] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Plot 24, Balaji Enclave"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-devotional-gold-400 text-xs"
              />
            </div>
          </div>

          {/* SECTION 2: CONTRIBUTION AMOUNT */}
          <div className="space-y-2.5 pt-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-devotional-gold-400">
              Contribution Amount <span className="text-amber-400 font-bold">*</span>
            </label>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {FESTIVAL_CONFIG.quickAmounts.map((amt) => {
                const isSelected = !isCustomAmount && selectedAmount === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleAmountClick(amt)}
                    className={`py-3 px-2 rounded-xl text-sm font-extrabold border transition-all ${
                      isSelected
                        ? 'bg-devotional-gold-500 text-devotional-blue-950 border-devotional-gold-300 shadow-gold-sm'
                        : 'bg-devotional-blue-950 text-devotional-gold-100 border-devotional-gold-500/20 hover:border-devotional-gold-500/50'
                    }`}
                  >
                    ₹{amt}
                  </button>
                );
              })}

              {/* Custom Amount Chip */}
              <button
                type="button"
                onClick={handleCustomAmountClick}
                className={`py-3 px-2 rounded-xl text-sm font-extrabold border transition-all ${
                  isCustomAmount
                    ? 'bg-devotional-gold-500 text-devotional-blue-950 border-devotional-gold-300 shadow-gold-sm'
                    : 'bg-devotional-blue-950 text-devotional-gold-100 border-devotional-gold-500/20 hover:border-devotional-gold-500/50'
                }`}
              >
                Custom
              </button>
            </div>

            {/* Custom Amount Input Field */}
            {isCustomAmount && (
              <div className="pt-1 animate-fadeIn">
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-lg font-black text-devotional-gold-400 select-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={FESTIVAL_CONFIG.minAmount}
                    max={FESTIVAL_CONFIG.maxAmount}
                    placeholder="Enter custom amount"
                    value={customAmountInput}
                    onChange={(e) => setCustomAmountInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-devotional-blue-950 border-2 border-devotional-gold-400 text-white font-black text-lg focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: PAYMENT METHOD (2 Large Mobile Buttons) */}
          <div className="space-y-2.5 pt-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-devotional-gold-400">
              Payment Method <span className="text-amber-400 font-bold">*</span>
            </label>

            <div className="grid grid-cols-2 gap-3">
              {/* CASH BUTTON */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('CASH');
                  setErrorMessage(null);
                }}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-lg ring-2 ring-emerald-400/50 scale-[1.02]'
                    : 'bg-devotional-blue-950/80 border-devotional-gold-500/20 text-gray-300 hover:border-devotional-gold-500/40'
                }`}
              >
                <Banknote className="w-7 h-7 text-emerald-400" />
                <span className="text-base font-black tracking-wide">CASH</span>
                <span className="text-[10px] text-gray-400 font-medium">Cash Contribution</span>
              </button>

              {/* ONLINE / UPI BUTTON */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('ONLINE');
                  setErrorMessage(null);
                }}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                  paymentMethod === 'ONLINE'
                    ? 'bg-devotional-blue-800/90 border-devotional-gold-400 text-devotional-gold-300 shadow-lg ring-2 ring-devotional-gold-400/50 scale-[1.02]'
                    : 'bg-devotional-blue-950/80 border-devotional-gold-500/20 text-gray-300 hover:border-devotional-gold-500/40'
                }`}
              >
                <Smartphone className="w-7 h-7 text-devotional-gold-400" />
                <span className="text-base font-black tracking-wide">ONLINE</span>
                <span className="text-[10px] text-gray-400 font-medium">UPI / QR Payment</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC FIELDS: CASH vs ONLINE */}
          {paymentMethod === 'CASH' ? (
            /* CASH NOTICE */
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-2xl p-4 flex items-center justify-between text-xs animate-fadeIn">
              <div>
                <span className="text-emerald-400 font-bold block text-sm">
                  CASH CONTRIBUTION
                </span>
                <span className="text-gray-300 text-[11px]">
                  Physical cash received by volunteer. Ready to issue certificate.
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shrink-0 ml-2">
                CASH RECEIVED
              </span>
            </div>
          ) : (
            /* ONLINE FIELDS: UTR + QR Helper + Screenshot */
            <div className="bg-devotional-blue-950/90 border border-devotional-gold-500/30 rounded-2xl p-4 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-devotional-gold-300 font-bold block text-sm">
                    ONLINE / UPI CONTRIBUTION
                  </span>
                  <span className="text-gray-400 text-[11px]">
                    Status: <b className="text-amber-400">PENDING VERIFICATION</b>
                  </span>
                </div>

                {/* Optional "Show UPI QR" toggle for on-the-spot scan */}
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-devotional-blue-800 border border-devotional-gold-400/50 text-devotional-gold-200 text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-devotional-blue-700 transition-colors"
                >
                  <QrCode className="w-4 h-4 text-devotional-gold-400" />
                  <span>Show UPI QR</span>
                </button>
              </div>

              {/* UTR Input */}
              <div>
                <label className="block text-xs font-semibold text-devotional-gold-200 mb-1">
                  Transaction ID / UTR <span className="text-amber-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 424567890123"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-white placeholder-gray-500 font-mono tracking-wider focus:outline-none focus:border-devotional-gold-400 text-sm uppercase"
                />
              </div>

              {/* Optional Screenshot upload */}
              <div>
                <label className="block text-xs font-semibold text-devotional-gold-200 mb-1">
                  Payment Screenshot <span className="text-gray-400 text-[11px] font-normal">(Optional)</span>
                </label>
                <label className="flex items-center justify-center p-3 border-2 border-dashed border-devotional-gold-500/30 rounded-xl cursor-pointer bg-devotional-blue-900/60 hover:bg-devotional-blue-900 transition-colors">
                  {screenshotPreview ? (
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={screenshotPreview}
                        alt="Screenshot"
                        className="w-10 h-10 object-cover rounded-lg border border-devotional-gold-400"
                      />
                      <span className="text-xs text-emerald-400 font-bold">Screenshot Attached ✓</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-devotional-gold-300">
                      <UploadCloud className="w-4 h-4 text-devotional-gold-400" />
                      <span>Upload payment screenshot</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleScreenshotChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* PRIMARY SAVE BUTTON */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2 shadow-gold-md transition-all active:scale-[0.99] disabled:opacity-50 ${
                paymentMethod === 'CASH'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-devotional-blue-950'
                  : 'btn-gold text-devotional-blue-950'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-devotional-blue-950 border-t-transparent rounded-full animate-spin" />
                  <span>Saving Contribution...</span>
                </>
              ) : (
                <>
                  <span>
                    {paymentMethod === 'CASH' ? 'SAVE CASH CONTRIBUTION' : 'SAVE ONLINE CONTRIBUTION'}
                  </span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* MODAL: SHOW UPI QR (If donor wants to scan right now) */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl border-2 border-devotional-gold-500/50 bg-devotional-blue-950 p-6 shadow-2xl space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-devotional-gold-500/20 pb-2">
              <span className="text-xs font-bold uppercase text-devotional-gold-400">Scan & Pay</span>
              <button
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-gray-300">Amount to Pay</p>
              <p className="text-2xl font-black text-devotional-gold-300">
                ₹{effectiveAmount.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="p-3 bg-white rounded-2xl shadow-xl border-2 border-devotional-gold-500/60 inline-block">
              {qrCodeUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrCodeUrl}
                  alt="UPI QR"
                  className="w-56 h-56 object-contain block mx-auto"
                />
              )}
            </div>

            <p className="text-xs font-bold text-devotional-gold-200">
              UPI ID: <span className="font-mono text-white">{FESTIVAL_CONFIG.upiId}</span>
            </p>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl btn-gold text-devotional-blue-950 font-bold text-xs"
            >
              Done Scanning (Return to Form)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
