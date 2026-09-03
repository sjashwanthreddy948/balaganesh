'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { FESTIVAL_CONFIG, buildUpiUri, buildWhatsAppShareUrl } from '@/config/festival.config';
import { cleanIndianMobile } from '@/lib/validation';
import ReceiptCanvas, { ReceiptData } from './ReceiptCanvas';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Copy,
  Check,
  QrCode,
  ShieldCheck,
  UploadCloud,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  AlertCircle,
  Sparkles,
  HeartHandshake,
} from 'lucide-react';

type Step = 'HOME' | 'FORM' | 'PAYMENT' | 'CONFIRMATION' | 'RECEIPT';

export default function ChandaFlow() {
  const [step, setStep] = useState<Step>('HOME');

  // Form State
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [address, setAddress] = useState('');
  const [selectedAmount, setSelectedAmount] = useState<number>(FESTIVAL_CONFIG.defaultAmount);
  const [isCustomAmount, setIsCustomAmount] = useState(false);
  const [customAmountInput, setCustomAmountInput] = useState('');

  // Payment Confirmation State
  const [utr, setUtr] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  // QR Code Data URL
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Submission & Receipt State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // Scroll to top on step change for mobile friendliness
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

  // Generate UPI QR Code whenever amount changes
  useEffect(() => {
    const effectiveAmount = isCustomAmount ? Number(customAmountInput) || 0 : selectedAmount;
    if (effectiveAmount >= 10) {
      const upiUri = buildUpiUri(effectiveAmount);
      QRCode.toDataURL(upiUri, {
        width: 380,
        margin: 1.5,
        color: {
          dark: '#07112c',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate UPI QR:', err));
    }
  }, [selectedAmount, isCustomAmount, customAmountInput]);

  // Copy UPI ID helper
  const handleCopyUpi = () => {
    navigator.clipboard.writeText(FESTIVAL_CONFIG.upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  // Quick Amount Selector
  const handleSelectQuickAmount = (amt: number) => {
    setIsCustomAmount(false);
    setSelectedAmount(amt);
    setCustomAmountInput('');
    setFormError(null);
  };

  const handleSelectCustom = () => {
    setIsCustomAmount(true);
    setFormError(null);
  };

  // Step 2 Validation: Chanda Form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setFormError('Please enter your full name (at least 2 characters).');
      return;
    }

    const cleanMobile = cleanIndianMobile(mobileNumber);
    if (cleanMobile.length !== 10 || !/^[6-9]/.test(cleanMobile)) {
      setFormError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    const effectiveAmount = isCustomAmount ? Number(customAmountInput) : selectedAmount;
    if (!effectiveAmount || isNaN(effectiveAmount) || effectiveAmount < FESTIVAL_CONFIG.minAmount) {
      setFormError(`Please enter a valid contribution amount (minimum ₹${FESTIVAL_CONFIG.minAmount}).`);
      return;
    }

    if (effectiveAmount > FESTIVAL_CONFIG.maxAmount) {
      setFormError(`Contribution amount cannot exceed ₹${FESTIVAL_CONFIG.maxAmount.toLocaleString('en-IN')}.`);
      return;
    }

    // Advance to Payment step
    setStep('PAYMENT');
  };

  // Step 4: Handle Screenshot File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Screenshot image must be less than 5MB.');
        return;
      }
      setScreenshotFile(file);
      const previewUrl = URL.createObjectURL(file);
      setScreenshotPreview(previewUrl);
      setFormError(null);
    }
  };

  // Final Submission
  const handlePaymentSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanUtr = utr.trim().toUpperCase();
    if (!cleanUtr || cleanUtr.length < 6) {
      setFormError('Please enter your transaction ID / UTR.');
      return;
    }

    setIsSubmitting(true);

    try {
      let uploadedScreenshotUrl: string | null = null;

      // Upload screenshot if attached
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
        } else {
          console.warn('Screenshot upload warning:', uploadJson.error);
        }
      }

      const effectiveAmount = isCustomAmount ? Number(customAmountInput) : selectedAmount;

      const payload = {
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim(),
        address: address.trim() || undefined,
        amount: effectiveAmount,
        utr: cleanUtr,
        paymentScreenshot: uploadedScreenshotUrl,
      };

      const response = await fetch('/api/contributions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409 || result.error?.includes('already been submitted')) {
          setFormError('This transaction ID has already been submitted.');
        } else {
          setFormError(result.error || 'Something went wrong. Please try again.');
        }
        setIsSubmitting(false);
        return;
      }

      // Success: Save receipt data & go to RECEIPT
      setReceiptData({
        receiptNumber: result.data.receiptNumber,
        fullName: result.data.fullName,
        mobileNumber: result.data.mobileNumber,
        amount: result.data.amount,
        utr: result.data.utr,
        paymentStatus: result.data.paymentStatus,
        createdAt: result.data.createdAt,
      });

      setStep('RECEIPT');

      // Trigger subtle celebration confetti
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ffd700', '#e5b31e', '#f9de78', '#254eb8'],
        });
      } catch {
        // Ignored if confetti fails
      }
    } catch (err) {
      console.error('Submission error:', err);
      setFormError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const effectiveAmount = isCustomAmount ? Number(customAmountInput) || 0 : selectedAmount;
  const upiDeepLink = buildUpiUri(effectiveAmount);

  // ==========================================
  // 1. HOME SCREEN
  // ==========================================
  if (step === 'HOME') {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-6 flex flex-col items-center text-center">
        {/* Devotional Banner Card */}
        <div className="w-full relative rounded-3xl overflow-hidden border-2 border-devotional-gold-500/40 shadow-blue-glow bg-devotional-blue-950 mb-6 group">
          {/* Main Authentic Festival Image */}
          <div className="relative w-full aspect-[9/13] sm:aspect-[4/5] overflow-hidden">
            <Image
              src={FESTIVAL_CONFIG.heroImage}
              alt={`${FESTIVAL_CONFIG.associationName} Ganesh Festival`}
              fill
              priority
              className="object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
            />
            {/* Elegant gradient overlay at bottom for smooth contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-devotional-blue-950 via-devotional-blue-950/20 to-transparent" />

            {/* Glowing Festival Diya Badge */}
            <div className="absolute top-4 left-4 bg-devotional-blue-950/80 backdrop-blur-md border border-devotional-gold-500/40 px-3 py-1 rounded-full text-xs font-semibold text-devotional-gold-300 shadow-gold-sm flex items-center gap-1.5">
              <span className="text-amber-400">🪔</span> {FESTIVAL_CONFIG.festivalYear} Utsav
            </div>
          </div>

          <div className="p-5 pt-3 bg-devotional-blue-950 text-center space-y-2">
            <p className="text-sm font-semibold tracking-wider text-devotional-gold-400">
              {FESTIVAL_CONFIG.mantraHeader}
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
              {FESTIVAL_CONFIG.heroSubtitle}
            </h2>
            <p className="text-sm text-devotional-gold-100/80 max-w-xs mx-auto leading-relaxed pt-1">
              {FESTIVAL_CONFIG.heroDescription}
            </p>
          </div>
        </div>

        {/* Primary CTA Button */}
        <div className="w-full space-y-3">
          <button
            onClick={() => setStep('FORM')}
            className="w-full py-4 px-6 rounded-2xl btn-gold text-devotional-blue-950 font-extrabold text-lg tracking-wide shadow-gold-md flex items-center justify-center gap-3 transition-transform active:scale-[0.98]"
          >
            <Sparkles className="w-5 h-5 text-devotional-blue-950 fill-current" />
            <span>Contribute Chanda</span>
            <ChevronRight className="w-5 h-5" />
          </button>

          <p className="text-xs text-devotional-gold-200/75 max-w-xs mx-auto leading-normal">
            {FESTIVAL_CONFIG.heroTagline}
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. CHANDA FORM SCREEN
  // ==========================================
  if (step === 'FORM') {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => setStep('HOME')}
          className="flex items-center gap-2 text-xs font-medium text-devotional-gold-300/80 hover:text-devotional-gold-200 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="rounded-3xl border border-devotional-gold-500/30 bg-devotional-blue-900/60 backdrop-blur-md p-6 shadow-xl space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-devotional-gold-300 tracking-wide">
              Chanda Contribution
            </h2>
            <p className="text-xs text-gray-300">
              Please enter your details to receive your digital receipt.
            </p>
          </div>

          {formError && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 flex items-start gap-2.5 text-xs text-red-200 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleFormSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-devotional-gold-200 mb-1.5">
                Full Name <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-devotional-blue-950/90 border border-devotional-gold-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-devotional-gold-400 focus:ring-1 focus:ring-devotional-gold-400 text-sm"
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-semibold text-devotional-gold-200 mb-1.5">
                Mobile Number <span className="text-amber-400">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs font-semibold text-gray-400 select-none">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-devotional-blue-950/90 border border-devotional-gold-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-devotional-gold-400 focus:ring-1 focus:ring-devotional-gold-400 text-sm"
                />
              </div>
              <span className="text-[11px] text-gray-400 mt-1 block">
                For sending receipt and verification
              </span>
            </div>

            {/* Address (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-devotional-gold-200 mb-1.5">
                Address / Flat / Colony <span className="text-gray-400 text-[11px]">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Flat 302, Sai Residency"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-devotional-blue-950/90 border border-devotional-gold-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-devotional-gold-400 focus:ring-1 focus:ring-devotional-gold-400 text-sm"
              />
            </div>

            {/* Chanda Amount with Quick Select */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-devotional-gold-200">
                Chanda Amount <span className="text-amber-400">*</span>
              </label>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {FESTIVAL_CONFIG.quickAmounts.map((amt) => {
                  const isSelected = !isCustomAmount && selectedAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleSelectQuickAmount(amt)}
                      className={`py-2.5 px-3 rounded-xl text-sm font-bold border transition-all ${
                        isSelected
                          ? 'bg-devotional-gold-500 text-devotional-blue-950 border-devotional-gold-400 shadow-gold-sm'
                          : 'bg-devotional-blue-950/80 text-devotional-gold-100 border-devotional-gold-500/20 hover:border-devotional-gold-500/50'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  );
                })}

                {/* Custom Amount Chip */}
                <button
                  type="button"
                  onClick={handleSelectCustom}
                  className={`py-2.5 px-3 rounded-xl text-sm font-bold border transition-all ${
                    isCustomAmount
                      ? 'bg-devotional-gold-500 text-devotional-blue-950 border-devotional-gold-400 shadow-gold-sm'
                      : 'bg-devotional-blue-950/80 text-devotional-gold-100 border-devotional-gold-500/20 hover:border-devotional-gold-500/50'
                  }`}
                >
                  Custom
                </button>
              </div>

              {/* Custom Amount Input */}
              {isCustomAmount && (
                <div className="pt-2 animate-fadeIn">
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-base font-bold text-devotional-gold-400 select-none">
                      ₹
                    </span>
                    <input
                      type="number"
                      min={FESTIVAL_CONFIG.minAmount}
                      max={FESTIVAL_CONFIG.maxAmount}
                      placeholder="Enter amount in ₹"
                      value={customAmountInput}
                      onChange={(e) => setCustomAmountInput(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 rounded-xl bg-devotional-blue-950/90 border border-devotional-gold-400 text-white font-bold placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-devotional-gold-400 text-base"
                      autoFocus
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-xl btn-gold text-devotional-blue-950 font-bold text-base flex items-center justify-center gap-2 shadow-gold-sm active:scale-[0.99]"
              >
                <span>Continue to Payment</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. PAYMENT / QR SCANNER SCREEN
  // ==========================================
  if (step === 'PAYMENT') {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => setStep('FORM')}
          className="flex items-center gap-2 text-xs font-medium text-devotional-gold-300/80 hover:text-devotional-gold-200 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Edit Details</span>
        </button>

        <div className="rounded-3xl border-2 border-devotional-gold-500/40 bg-devotional-blue-900/70 backdrop-blur-md p-6 shadow-2xl space-y-6 text-center">
          {/* Header */}
          <div className="space-y-1">
            <p className="text-xs uppercase font-extrabold tracking-widest text-devotional-gold-400">
              {FESTIVAL_CONFIG.associationName}
            </p>
            <p className="text-xs text-gray-300">Chanda Amount</p>
            <h2 className="text-3xl font-black text-devotional-gold-300 tracking-tight">
              ₹{effectiveAmount.toLocaleString('en-IN')}
            </h2>
          </div>

          {/* Large Dynamic QR Code */}
          <div className="flex flex-col items-center">
            <div className="p-3.5 bg-white rounded-2xl shadow-xl border-4 border-devotional-gold-500/60 inline-block">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt="UPI QR Code"
                  className="w-56 h-56 sm:w-64 sm:h-64 object-contain"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-gray-400">
                  Generating QR...
                </div>
              )}
            </div>

            <p className="text-xs font-bold text-devotional-gold-300 mt-3 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-devotional-gold-400" />
              Scan & Pay using any UPI app
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Google Pay • PhonePe • Paytm • BHIM • Cred
            </p>
          </div>

          {/* UPI ID with Copy button */}
          <div className="bg-devotional-blue-950/90 border border-devotional-gold-500/30 rounded-xl p-3 flex items-center justify-between gap-2">
            <div className="text-left overflow-hidden">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block">UPI ID</span>
              <span className="text-xs sm:text-sm font-mono text-devotional-gold-200 font-bold truncate block">
                {FESTIVAL_CONFIG.upiId}
              </span>
            </div>
            <button
              onClick={handleCopyUpi}
              className="shrink-0 px-3 py-1.5 bg-devotional-blue-900 border border-devotional-gold-500/40 hover:border-devotional-gold-400 rounded-lg text-xs font-semibold text-devotional-gold-300 flex items-center gap-1 transition-all"
            >
              {copiedUpi ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* "Pay using UPI" Mobile Direct App Intent Link */}
          <div className="space-y-2 pt-1">
            <a
              href={upiDeepLink}
              className="w-full py-3 px-4 rounded-xl bg-devotional-blue-800/90 border border-devotional-gold-400/50 hover:bg-devotional-blue-700/90 text-devotional-gold-200 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Pay using UPI App</span>
            </a>
            <p className="text-[10px] text-gray-400">
              (Opens installed UPI app directly on mobile phones)
            </p>
          </div>

          {/* Next CTA */}
          <div className="border-t border-devotional-gold-500/20 pt-4 space-y-2">
            <p className="text-xs text-devotional-gold-100/90 font-medium">
              After completing the payment, click Payment Done.
            </p>
            <button
              onClick={() => {
                setFormError(null);
                setStep('CONFIRMATION');
              }}
              className="w-full py-3.5 px-4 rounded-xl btn-gold text-devotional-blue-950 font-extrabold text-base flex items-center justify-center gap-2 shadow-gold-sm active:scale-[0.99]"
            >
              <Check className="w-5 h-5 text-devotional-blue-950" />
              <span>Payment Done</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 4. PAYMENT CONFIRMATION SCREEN
  // ==========================================
  if (step === 'CONFIRMATION') {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => setStep('PAYMENT')}
          className="flex items-center gap-2 text-xs font-medium text-devotional-gold-300/80 hover:text-devotional-gold-200 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to QR</span>
        </button>

        <div className="rounded-3xl border border-devotional-gold-500/30 bg-devotional-blue-900/60 backdrop-blur-md p-6 shadow-xl space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-xl font-bold text-devotional-gold-300 tracking-wide">
              Confirm Your Payment
            </h2>
            <p className="text-xs text-gray-300">
              Enter your UPI Transaction ID (UTR) to generate your Chanda receipt.
            </p>
          </div>

          {/* Amount Reminder Pill */}
          <div className="bg-devotional-blue-950/80 border border-devotional-gold-500/20 rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-gray-400">Contributing as: <b className="text-white">{fullName}</b></span>
            <span className="text-devotional-gold-300 font-extrabold text-sm">₹{effectiveAmount}</span>
          </div>

          {formError && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 flex items-start gap-2.5 text-xs text-red-200 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handlePaymentSubmission} className="space-y-5">
            {/* UTR / Transaction ID */}
            <div>
              <label className="block text-xs font-semibold text-devotional-gold-200 mb-1.5">
                Transaction ID / UTR <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 424567890123"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-devotional-blue-950/90 border border-devotional-gold-500/30 text-white placeholder-gray-500 font-mono tracking-wider focus:outline-none focus:border-devotional-gold-400 focus:ring-1 focus:ring-devotional-gold-400 text-sm uppercase"
              />
              <span className="text-[11px] text-gray-400 mt-1 block">
                Found in your GPay / PhonePe / Paytm payment receipt details.
              </span>
            </div>

            {/* Payment Screenshot Upload (Optional) */}
            <div>
              <label className="block text-xs font-semibold text-devotional-gold-200 mb-1.5">
                Payment Screenshot <span className="text-gray-400 text-[11px]">(Optional)</span>
              </label>
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-devotional-gold-500/30 rounded-2xl cursor-pointer bg-devotional-blue-950/50 hover:bg-devotional-blue-950/80 transition-colors">
                {screenshotPreview ? (
                  <div className="flex items-center gap-3 px-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={screenshotPreview}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-lg border border-devotional-gold-500/40"
                    />
                    <div className="text-left">
                      <p className="text-xs font-bold text-emerald-400">Image Attached ✓</p>
                      <p className="text-[10px] text-gray-400">Click to replace screenshot</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-3 pb-3 text-center">
                    <UploadCloud className="w-6 h-6 text-devotional-gold-400 mb-1" />
                    <p className="text-xs font-medium text-devotional-gold-200">
                      Tap to upload screenshot
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG or WebP (max 5MB)</p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Verification Notice */}
            <div className="bg-devotional-blue-950/90 border border-devotional-gold-500/20 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-devotional-gold-100/90">
              <ShieldCheck className="w-4 h-4 text-devotional-gold-400 shrink-0 mt-0.5" />
              <p>
                Your payment will be verified by the association committee against the bank statement.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl btn-gold text-devotional-blue-950 font-extrabold text-base flex items-center justify-center gap-2 shadow-gold-sm transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-devotional-blue-950 border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Contribution...</span>
                </>
              ) : (
                <>
                  <span>Submit Payment</span>
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // 5. RECEIPT & WHATSAPP SCREEN
  // ==========================================
  if (step === 'RECEIPT' && receiptData) {
    const whatsAppUrl = buildWhatsAppShareUrl({
      fullName: receiptData.fullName,
      amount: receiptData.amount,
      receiptNumber: receiptData.receiptNumber,
      utr: receiptData.utr,
    });

    return (
      <div className="w-full max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Success Banner */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-lg animate-bounce">
            <Check className="w-7 h-7 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-devotional-gold-300 tracking-tight">
            Contribution Submitted Successfully ✓
          </h2>
          <p className="text-xs text-devotional-gold-100/90 max-w-xs mx-auto">
            Thank you for supporting {FESTIVAL_CONFIG.associationName}.
          </p>
        </div>

        {/* Dynamic Canvas High-DPI Receipt Card */}
        <ReceiptCanvas data={receiptData} />

        {/* WhatsApp & Additional Actions */}
        <div className="w-full max-w-md mx-auto space-y-3 pt-2">
          <a
            href={whatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.99]"
          >
            <MessageCircle className="w-5 h-5" />
            <span>📲 Send on WhatsApp</span>
          </a>

          <p className="text-[11px] text-gray-400 text-center px-4">
            Click &quot;Send on WhatsApp&quot; to notify the committee with your pre-filled contribution details. Attach your downloaded receipt image to the chat.
          </p>

          <div className="pt-3">
            <button
              onClick={() => {
                // Reset form to contribute again if desired
                setFullName('');
                setMobileNumber('');
                setAddress('');
                setUtr('');
                setScreenshotFile(null);
                setScreenshotPreview(null);
                setSelectedAmount(FESTIVAL_CONFIG.defaultAmount);
                setIsCustomAmount(false);
                setCustomAmountInput('');
                setReceiptData(null);
                setStep('HOME');
              }}
              className="w-full py-2.5 text-xs text-devotional-gold-300/80 hover:text-devotional-gold-200 border border-devotional-gold-500/20 rounded-xl hover:border-devotional-gold-500/40 transition-colors"
            >
              Make Another Contribution
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
