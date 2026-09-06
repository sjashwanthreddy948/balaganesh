'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FESTIVAL_CONFIG,
  buildUpiUri,
  buildWhatsAppCertificateMessage,
  buildWhatsAppPayLaterReminderMessage,
} from '@/config/festival.config';
import { cleanIndianMobile, normalizeIndianMobileForWhatsApp } from '@/lib/validation';
import { compressImageToTarget } from '@/lib/image-compress';
import LandscapeCertificate, { CertificateData, dataUrlToBlob } from './LandscapeCertificate';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  Banknote,
  Smartphone,
  QrCode,
  CheckCircle,
  AlertCircle,
  Camera,
  Image as ImageIcon,
  PlusCircle,
  ChevronRight,
  Sparkles,
  User,
  X,
  Trash2,
  Eye,
  MessageCircle,
  Clock,
  Bell,
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
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'ONLINE' | 'PAY_LATER'>('CASH');
  const [utr, setUtr] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  // File input refs for Camera vs Gallery
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Dynamic QR Helper Drawer for online donor
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success / Generated Certificate State
  const [createdCertificate, setCreatedCertificate] = useState<CertificateData | null>(null);
  const [certImageDataUrl, setCertImageDataUrl] = useState<string | null>(null);
  const [certBlob, setCertBlob] = useState<Blob | null>(null);
  const certBlobRef = useRef<Blob | null>(null);
  const certDataUrlRef = useRef<string | null>(null);
  const [isSharingWhatsApp, setIsSharingWhatsApp] = useState(false);
  const [whatsAppNotice, setWhatsAppNotice] = useState<{
    type: 'error' | 'success' | 'info';
    message: string;
  } | null>(null);
  const [lastContributionPill, setLastContributionPill] = useState<{
    name: string;
    amount: number;
    method: string;
    certNo: string;
  } | null>(null);

  const [existingDonor, setExistingDonor] = useState<{ name: string; address?: string } | null>(null);

  // Debounced duplicate phone lookup & profile linking
  useEffect(() => {
    const clean = cleanIndianMobile(mobileNumber);
    if (clean && clean.length === 10) {
      const timer = setTimeout(() => {
        fetch(`/api/contributors?mobile=${clean}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.success && d.contributor) {
              setExistingDonor({
                name: d.contributor.fullName,
                address: d.contributor.address,
              });
              setFullName((prev) => (!prev ? d.contributor.fullName : prev));
              setAddress((prev) => (!prev && d.contributor.address ? d.contributor.address : prev));
            } else {
              setExistingDonor(null);
            }
          })
          .catch(() => setExistingDonor(null));
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setExistingDonor(null);
    }
  }, [mobileNumber]);

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

  // Photo Compression State
  const [isCompressing, setIsCompressing] = useState(false);

  // Process File Select (Camera or Gallery) with Automatic 200KB Compression
  const processSelectedFile = async (file: File | undefined) => {
    if (!file) return;

    setIsCompressing(true);
    setErrorMessage(null);
    try {
      // Automatically compress & minimize camera photo or gallery image strictly under 200KB
      const compressed = await compressImageToTarget(file, 200 * 1024);
      setScreenshotFile(compressed);
      setScreenshotPreview(URL.createObjectURL(compressed));
    } catch (err) {
      console.warn('Compression fallback to original file:', err);
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    processSelectedFile(file);
  };

  const handleRemovePhoto = () => {
    setScreenshotFile(null);
    setScreenshotPreview(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
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
    setCertImageDataUrl(null);
    setCertBlob(null);
    certBlobRef.current = null;
    certDataUrlRef.current = null;
    setIsSharingWhatsApp(false);
    setWhatsAppNotice(null);
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
        utr: paymentMethod === 'ONLINE' && utr.trim().length > 0 ? utr.trim().toUpperCase() : undefined,
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
        paymentScreenshot: json.data.paymentScreenshot || uploadedScreenshotUrl || screenshotPreview,
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
  // SUCCESS SCREEN (CLEAN: + ADD ANOTHER CHANDA & 📱 SEND VIA WHATSAPP / 🔔 SEND REMINDER)
  // ==========================================
  if (createdCertificate) {
    const isPayLater =
      createdCertificate.paymentMethod === 'PAY_LATER' ||
      createdCertificate.paymentStatus === 'PAY_LATER';

    const handleWhatsAppShare = async () => {
      // 1. Validate the mobile number saved with this specific contribution
      const phoneResult = normalizeIndianMobileForWhatsApp(createdCertificate.mobileNumber);
      if (!phoneResult) {
        setWhatsAppNotice({
          type: 'error',
          message: 'Please enter a valid mobile number for this contributor.',
        });
        return;
      }

      setIsSharingWhatsApp(true);
      setWhatsAppNotice(null);

      // If PAY LATER: do NOT attach certificate! Send Pay Later Reminder message!
      if (isPayLater) {
        const reminderMsg = buildWhatsAppPayLaterReminderMessage({
          fullName: createdCertificate.fullName,
          amount: createdCertificate.amount,
          certificateNumber: createdCertificate.certificateNumber,
        });

        if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
          try {
            await navigator.clipboard.writeText(reminderMsg);
          } catch {}
        }

        const phoneParam = phoneResult ? `phone=${phoneResult.whatsappPhone}&` : '';
        const chatUrl = `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(reminderMsg)}`;

        const isMobile =
          typeof navigator !== 'undefined' &&
          /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

        if (isMobile) {
          window.location.href = chatUrl;
        } else {
          const a = document.createElement('a');
          a.href = chatUrl;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }

        setWhatsAppNotice({
          type: 'info',
          message: `WhatsApp opened with Pledge Reminder for ${phoneResult?.displayPhone || 'devotee'}.`,
        });
        setIsSharingWhatsApp(false);
        return;
      }

      // 2. Ensure the certificate image blob is ready (for CASH & ONLINE)
      let blob = certBlobRef.current || certBlob;
      if (!blob && certDataUrlRef.current) {
        blob = dataUrlToBlob(certDataUrlRef.current);
      }

      // If still rendering canvas, wait up to 3 seconds for it to finish
      if (!blob) {
        blob = await new Promise<Blob | null>((resolve) => {
          let attempts = 0;
          const interval = setInterval(() => {
            attempts++;
            if (certBlobRef.current) {
              clearInterval(interval);
              resolve(certBlobRef.current);
            } else if (certDataUrlRef.current) {
              clearInterval(interval);
              resolve(dataUrlToBlob(certDataUrlRef.current));
            } else if (attempts > 30) {
              clearInterval(interval);
              resolve(null);
            }
          }, 100);
        });
      }

      // 3. Exact greeting message for this donor & certificate
      const message = buildWhatsAppCertificateMessage(createdCertificate);

      // 4. Download contributor's exact Certificate JPG so it's ready on their device
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BalaGanesh_Certificate_${createdCertificate.certificateNumber}_${createdCertificate.fullName.replace(/\s+/g, '_')}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      } else if (certImageDataUrl) {
        const a = document.createElement('a');
        a.href = certImageDataUrl;
        a.download = `BalaGanesh_Certificate_${createdCertificate.certificateNumber}_${createdCertificate.fullName.replace(/\s+/g, '_')}.jpg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      // Pre-copy greeting text to clipboard
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(message);
        } catch {}
      }

      // Also copy image to clipboard if supported (for Ctrl+V directly into WhatsApp Web)
      if (blob && typeof navigator !== 'undefined' && navigator.clipboard && (window as any).ClipboardItem) {
        try {
          await navigator.clipboard.write([
            new (window as any).ClipboardItem({ [blob.type]: blob }),
          ]);
        } catch {}
      }

      // Directly open WhatsApp targeting the contributor's saved phone number (+91XXXXXXXXXX)
      const phoneParam = phoneResult ? `phone=${phoneResult.whatsappPhone}&` : '';
      const whatsAppChatUrl = `https://api.whatsapp.com/send?${phoneParam}text=${encodeURIComponent(message)}`;

      const isMobile =
        typeof navigator !== 'undefined' &&
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isMobile) {
        window.location.href = whatsAppChatUrl;
      } else {
        const a = document.createElement('a');
        a.href = whatsAppChatUrl;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      setWhatsAppNotice({
        type: 'info',
        message: `WhatsApp opened for ${phoneResult?.displayPhone || 'devotee'}. Certificate JPG downloaded to device.`,
      });
      setIsSharingWhatsApp(false);
    };

    return (
      <div className="w-full max-w-2xl mx-auto space-y-4 animate-fadeIn py-2">
        {/* Banner: Pay Later vs Paid/Saved */}
        {isPayLater ? (
          <div className="bg-amber-950/80 border-2 border-amber-500/60 rounded-2xl p-4 text-center space-y-1.5 shadow-xl">
            <div className="flex items-center justify-center gap-2 text-amber-400 font-extrabold text-base sm:text-lg">
              <Clock className="w-6 h-6 shrink-0 text-amber-400" />
              <span>⏱ Chanda Pledge Recorded (Pay Later)</span>
            </div>
            <p className="text-xs text-devotional-gold-200 font-semibold">
              Devotee: <b className="text-white">{createdCertificate.fullName}</b> • Pledged Amount: <b className="text-white text-sm">₹{createdCertificate.amount.toLocaleString('en-IN')}</b>
            </p>
            <p className="text-[11px] text-gray-300">
              Devotee pledged to pay later. Once marked as Paid in Dashboard, their official Certificate will be generated.
            </p>
          </div>
        ) : (
          <div className="bg-devotional-blue-900/80 border-2 border-emerald-500/50 rounded-2xl p-4 text-center space-y-1.5 shadow-xl">
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-extrabold text-base sm:text-lg">
              <CheckCircle className="w-6 h-6 shrink-0" />
              <span>✓ Contribution Saved</span>
            </div>
            <p className="text-xs text-devotional-gold-200 font-semibold">
              Certificate generated successfully: <b className="font-mono text-white text-sm">{createdCertificate.certificateNumber}</b>
            </p>
          </div>
        )}

        {/* WhatsApp Notice / Feedback */}
        {whatsAppNotice && (
          <div
            className={`p-3.5 rounded-2xl text-xs sm:text-sm font-semibold flex items-start gap-2.5 shadow-md ${
              whatsAppNotice.type === 'error'
                ? 'bg-red-950/80 border-2 border-red-500/60 text-red-200'
                : whatsAppNotice.type === 'success'
                ? 'bg-emerald-950/80 border-2 border-emerald-500/60 text-emerald-200'
                : 'bg-devotional-blue-950/90 border-2 border-devotional-gold-500/50 text-devotional-gold-200'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-devotional-gold-400" />
            <div className="flex-1">
              <span>{whatsAppNotice.message}</span>
            </div>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Button 1: + ADD ANOTHER CHANDA */}
          <button
            type="button"
            onClick={handleAddAnother}
            className="w-full py-3.5 px-4 rounded-2xl btn-gold text-devotional-blue-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-gold-sm transition-all active:scale-95"
          >
            <PlusCircle className="w-5 h-5 text-devotional-blue-950" />
            <span>+ ADD ANOTHER CHANDA</span>
          </button>

          {/* Button 2: WhatsApp Reminder (Pay Later) or WhatsApp Certificate (Cash/Online) */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            disabled={isSharingWhatsApp}
            className={`w-full py-3.5 px-4 rounded-2xl text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
              isPayLater
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {isSharingWhatsApp ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{isPayLater ? 'OPENING WHATSAPP...' : 'ATTACHING CERTIFICATE...'}</span>
              </>
            ) : isPayLater ? (
              <>
                <Bell className="w-5 h-5" />
                <span>🔔 SEND REMINDER VIA WHATSAPP</span>
              </>
            ) : (
              <>
                <MessageCircle className="w-5 h-5" />
                <span>📱 SEND VIA WHATSAPP</span>
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-devotional-gold-500/30 my-2" />

        {isPayLater ? (
          /* PLEDGE CARD (NO CERTIFICATE GENERATED YET) */
          <div className="p-5 rounded-2xl bg-devotional-blue-950/90 border border-amber-500/40 text-center space-y-3 shadow-lg animate-fadeIn">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                PLEDGE STATUS: PENDING PAYMENT
              </span>
              <h4 className="text-lg font-black text-white mt-1">
                {createdCertificate.fullName}
              </h4>
              <p className="text-xl font-black text-devotional-gold-300 mt-0.5">
                ₹{createdCertificate.amount.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="p-3.5 bg-devotional-blue-900/60 rounded-xl border border-devotional-gold-500/20 text-xs text-gray-300 space-y-1 text-left">
              <p className="font-semibold text-devotional-gold-200">Pledge Details:</p>
              <p>• Reference No: <b className="font-mono text-white">{createdCertificate.certificateNumber}</b></p>
              <p>• Payment Options: Cash to volunteer or UPI (<span className="font-mono text-devotional-gold-300">{FESTIVAL_CONFIG.upiId}</span>)</p>
              <p className="text-emerald-300 font-semibold pt-1">
                ✓ Once devotee pays, open Dashboard and click <b>&quot;Paid&quot;</b> to update as paid and generate the official Certificate.
              </p>
            </div>
          </div>
        ) : (
          /* 16:9 Landscape Certificate for CASH / ONLINE */
          <div>
            <LandscapeCertificate
              data={createdCertificate}
              onImageReady={(url, blob) => {
                setCertImageDataUrl(url);
                certDataUrlRef.current = url;
                if (blob) {
                  setCertBlob(blob);
                  certBlobRef.current = blob;
                } else {
                  const b = dataUrlToBlob(url);
                  setCertBlob(b);
                  certBlobRef.current = b;
                }
              }}
              hideActions={true}
            />
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // FAST ENTRY FORM SCREEN
  // ==========================================
  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Last Contribution Pill Bar */}
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
                className="w-full px-4 py-3 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-devotional-gold-400 text-base font-semibold capitalize"
                autoFocus
              />
            </div>

            {/* Mobile Number */}
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
                  inputMode="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/30 text-white placeholder-gray-500 focus:outline-none focus:border-devotional-gold-400 text-base font-medium"
                />
              </div>
              {existingDonor && (
                <div className="mt-2 p-2 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-[11px] text-emerald-300 flex items-center gap-2 animate-fadeIn">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    Existing donor: <b>{existingDonor.name}</b>. This contribution will be linked to their donor profile.
                  </span>
                </div>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-semibold text-devotional-gold-200 mb-1">
                Address / Colony <span className="text-gray-400 text-[11px] font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Plot 24, Balaji Enclave"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/20 text-white placeholder-gray-500 focus:outline-none focus:border-devotional-gold-400 text-base"
              />
            </div>
          </div>

          {/* SECTION 2: CONTRIBUTION AMOUNT */}
          <div className="space-y-2.5 pt-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-devotional-gold-400">
              Contribution Amount <span className="text-amber-400 font-bold">*</span>
            </label>

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

            {isCustomAmount && (
              <div className="pt-1 animate-fadeIn">
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-lg font-black text-devotional-gold-400 select-none">
                    ₹
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
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

          {/* SECTION 3: PAYMENT METHOD */}
          <div className="space-y-2.5 pt-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-devotional-gold-400">
              Payment Method <span className="text-amber-400 font-bold">*</span>
            </label>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {/* CASH */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('CASH');
                  setErrorMessage(null);
                }}
                className={`p-3 sm:p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition-all text-center ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-lg ring-2 ring-emerald-400/50 scale-[1.02]'
                    : 'bg-devotional-blue-950/80 border-devotional-gold-500/20 text-gray-300 hover:border-devotional-gold-500/40'
                }`}
              >
                <Banknote className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
                <span className="text-sm sm:text-base font-black tracking-wide">CASH</span>
                <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium">Received Cash</span>
              </button>

              {/* ONLINE / UPI */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('ONLINE');
                  setErrorMessage(null);
                }}
                className={`p-3 sm:p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition-all text-center ${
                  paymentMethod === 'ONLINE'
                    ? 'bg-devotional-blue-800/90 border-devotional-gold-400 text-devotional-gold-300 shadow-lg ring-2 ring-devotional-gold-400/50 scale-[1.02]'
                    : 'bg-devotional-blue-950/80 border-devotional-gold-500/20 text-gray-300 hover:border-devotional-gold-500/40'
                }`}
              >
                <Smartphone className="w-6 h-6 sm:w-7 sm:h-7 text-devotional-gold-400" />
                <span className="text-sm sm:text-base font-black tracking-wide">ONLINE</span>
                <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium">UPI / QR</span>
              </button>

              {/* PAY LATER */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('PAY_LATER');
                  setErrorMessage(null);
                }}
                className={`p-3 sm:p-4 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition-all text-center ${
                  paymentMethod === 'PAY_LATER'
                    ? 'bg-amber-950/80 border-amber-400 text-amber-300 shadow-lg ring-2 ring-amber-400/50 scale-[1.02]'
                    : 'bg-devotional-blue-950/80 border-devotional-gold-500/20 text-gray-300 hover:border-devotional-gold-500/40'
                }`}
              >
                <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400" />
                <span className="text-sm sm:text-base font-black tracking-wide">PAY LATER</span>
                <span className="text-[9px] sm:text-[10px] text-gray-400 font-medium">Pledge Amount</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC FIELDS: CASH vs PAY LATER vs ONLINE */}
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
          ) : paymentMethod === 'PAY_LATER' ? (
            /* PAY LATER NOTICE */
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 flex items-center justify-between text-xs animate-fadeIn">
              <div>
                <span className="text-amber-400 font-bold block text-sm">
                  PAY LATER (PLEDGED)
                </span>
                <span className="text-gray-300 text-[11px]">
                  Devotee pledged contribution and will pay later. Admin can verify once money is collected.
                </span>
              </div>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/50 shrink-0 ml-2">
                PAY LATER
              </span>
            </div>
          ) : (
            /* ONLINE FIELDS: UTR (OPTIONAL) + CAMERA / GALLERY PHOTO UPLOAD */
            <div className="bg-devotional-blue-950/90 border border-devotional-gold-500/30 rounded-2xl p-4 space-y-3.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-devotional-gold-300 font-bold block text-sm">
                    ONLINE / UPI CONTRIBUTION
                  </span>
                  <span className="text-gray-400 text-[11px]">
                    Status: <b className="text-amber-400">PENDING VERIFICATION</b>
                  </span>
                </div>

                {/* Show UPI QR button */}
                <button
                  type="button"
                  onClick={() => setShowQrModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-devotional-gold-500 text-devotional-blue-950 text-xs font-black flex items-center gap-1.5 shadow-sm hover:bg-devotional-gold-400 transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Show UPI QR</span>
                </button>
              </div>

              {/* UPI ID Display & Copy Button */}
              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-devotional-blue-900/70 border border-devotional-gold-500/25">
                <div className="text-xs text-gray-300 truncate">
                  <span className="text-devotional-gold-400 font-bold">UPI ID:</span>{' '}
                  <span className="font-mono text-white font-bold">{FESTIVAL_CONFIG.upiId}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(FESTIVAL_CONFIG.upiId);
                    setCopiedUpi(true);
                    setTimeout(() => setCopiedUpi(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-devotional-blue-800 text-[11px] font-bold text-devotional-gold-200 border border-devotional-gold-400/40 hover:text-white shrink-0"
                >
                  {copiedUpi ? 'Copied ✓' : 'Copy'}
                </button>
              </div>

              {/* UTR Input (Now strictly OPTIONAL with no compulsory asterisk) */}
              <div>
                <label className="block text-xs font-semibold text-devotional-gold-200 mb-1">
                  Transaction ID / UTR <span className="text-gray-400 text-[11px] font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  inputMode="text"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Enter 12-digit UTR if available"
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-white placeholder-gray-500 font-mono tracking-wider focus:outline-none focus:border-devotional-gold-400 text-base uppercase"
                />
              </div>

              {/* SCREENSHOT OR PHOTO UPLOAD (CAMERA OR GALLERY) */}
              <div className="space-y-2 pt-1">
                <label className="block text-xs font-semibold text-devotional-gold-200">
                  Payment Proof Photo / Screenshot <span className="text-gray-400 text-[11px] font-normal">(Camera or Gallery)</span>
                </label>

                {/* Hidden real file inputs */}
                {/* 1. Camera capture input */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {/* 2. Gallery picker input */}
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {isCompressing && (
                  <div className="bg-devotional-blue-950 border border-devotional-gold-500/50 rounded-2xl p-3.5 flex items-center justify-center gap-2.5 text-xs font-bold text-devotional-gold-200 animate-pulse">
                    <div className="w-4 h-4 border-2 border-devotional-gold-400 border-t-transparent rounded-full animate-spin" />
                    <span>Minimizing photo under 200KB automatically...</span>
                  </div>
                )}

                {screenshotPreview ? (
                  /* Attached Photo Preview with Remove button */
                  <div className="bg-devotional-blue-900/90 border border-emerald-500/40 rounded-2xl p-3 flex items-center justify-between gap-3 animate-fadeIn">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={screenshotPreview}
                        alt="Payment Proof"
                        className="w-14 h-14 object-cover rounded-xl border border-devotional-gold-400 shadow-sm shrink-0"
                      />
                      <div className="truncate">
                        <p className="text-xs font-bold text-emerald-300">
                          Photo Attached ✓ {screenshotFile && <span className="text-[10px] text-emerald-400 font-mono font-normal">({(screenshotFile.size / 1024).toFixed(0)} KB)</span>}
                        </p>
                        <p className="text-[11px] text-gray-300 truncate font-mono">
                          {screenshotFile?.name || 'payment_proof.jpg'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="p-2 rounded-xl bg-red-950/70 border border-red-500/40 text-red-300 hover:text-red-100 hover:bg-red-900 text-xs flex items-center gap-1 shrink-0 transition-colors"
                      title="Remove Photo"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>
                ) : (
                  /* Two Mobile-Friendly Buttons: Camera vs Gallery */
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* CAMERA BUTTON */}
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="p-3.5 rounded-xl border border-devotional-gold-500/40 bg-devotional-blue-900/80 hover:bg-devotional-blue-800 text-devotional-gold-200 hover:text-white flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-sm"
                    >
                      <Camera className="w-5 h-5 text-devotional-gold-400" />
                      <span className="text-xs font-bold">Use Camera</span>
                      <span className="text-[10px] text-gray-400">Snap donor screen</span>
                    </button>

                    {/* GALLERY BUTTON */}
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="p-3.5 rounded-xl border border-devotional-gold-500/40 bg-devotional-blue-900/80 hover:bg-devotional-blue-800 text-devotional-gold-200 hover:text-white flex flex-col items-center justify-center gap-1.5 transition-all active:scale-[0.98] shadow-sm"
                    >
                      <ImageIcon className="w-5 h-5 text-devotional-gold-400" />
                      <span className="text-xs font-bold">From Gallery</span>
                      <span className="text-[10px] text-gray-400">Choose screenshot</span>
                    </button>
                  </div>
                )}
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

      {/* MODAL: SHOW UPI QR */}
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

            <div className="flex items-center justify-center gap-2">
              <p className="text-xs font-bold text-devotional-gold-200">
                UPI ID: <span className="font-mono text-white">{FESTIVAL_CONFIG.upiId}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(FESTIVAL_CONFIG.upiId);
                  setCopiedUpi(true);
                  setTimeout(() => setCopiedUpi(false), 2000);
                }}
                className="px-2.5 py-0.5 rounded-lg bg-devotional-blue-800 text-[11px] font-bold text-devotional-gold-200 border border-devotional-gold-400/40 hover:text-white"
              >
                {copiedUpi ? 'Copied ✓' : 'Copy'}
              </button>
            </div>

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
