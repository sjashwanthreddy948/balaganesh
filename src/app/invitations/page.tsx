'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import MobileBottomNav from '@/components/MobileBottomNav';
import InvitationCardModal, { InvitationData } from '@/components/InvitationCardModal';
import {
  FESTIVAL_CONFIG,
  buildWhatsAppInvitationMessage,
} from '@/config/festival.config';
import {
  Send,
  Users,
  Calendar,
  Clock,
  MapPin,
  MessageCircle,
  PlusCircle,
  Copy,
  Check,
  Download,
  Trash2,
  Eye,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Languages,
} from 'lucide-react';

const PRESET_EVENTS = [
  {
    id: 'couple-pooja',
    title: "Today's Special Ganesh Pooja & Mahaprasadam",
    telugu: 'నేటి విశేష పూజ & అన్నప్రసాద వితరణ',
    defaultTime: '07:30 PM onwards',
    defaultDescription:
      'Special Ganesh Abhishekam, Archana, and Maha Aarti, followed by sacred Mahaprasadam.',
    defaultHusband: '',
    defaultWife: '',
  },
  {
    id: 'sthapana',
    title: 'Sri Ganesh Murti Sthapana & Prana Pratishtha',
    telugu: 'శ్రీ విగ్రహ ప్రతిష్టాపన & విశేష పూజ',
    defaultTime: '08:30 AM onwards',
    defaultDescription:
      'Divine Ganesh Murti Sthapana, Vedic Pooja, Homam & Theertha Prasadam distribution.',
    defaultHusband: '',
    defaultWife: '',
  },
  {
    id: 'aarti',
    title: 'Maha Aarti & Daily Prasadam Distribution',
    telugu: 'మహా హారతి & ప్రసాద వితరణ',
    defaultTime: '07:30 PM onwards',
    defaultDescription:
      'Evening Grand Dhoop Deepa Maha Aarti followed by devotional bhajans and prasadam.',
    defaultHusband: '',
    defaultWife: '',
  },
  {
    id: 'annadanam',
    title: 'Grand Annadanam & Mahaprasadam',
    telugu: 'భారీ అన్నదాన మహోత్సవం',
    defaultTime: '12:30 PM to 04:00 PM',
    defaultDescription:
      'Community Mahaprasadam Annadanam. All devotees are cordially invited to partake in sacred meal.',
    defaultHusband: '',
    defaultWife: '',
  },
  {
    id: 'laddu',
    title: 'Sacred Laddu Prasadam Auction (లడ్డూ వేలం పాట)',
    telugu: 'పవిత్ర లడ్డూ ప్రసాదం వేలం పాట',
    defaultTime: '08:00 PM onwards',
    defaultDescription:
      'Annual auspicious Laddu Prasadam Auction. Seek divine prosperity and blessings of Lord Ganesha.',
    defaultHusband: '',
    defaultWife: '',
  },
  {
    id: 'visarjan',
    title: 'Ganesh Visarjan Shobha Yatra & Nimajjanam',
    telugu: 'గణేష్ నిమజ్జన శోభాయాత్ర',
    defaultTime: '02:00 PM onwards',
    defaultDescription:
      'Grand colorful Shobha Yatra with traditional music, drums, dance, and sacred Nimajjanam.',
    defaultHusband: '',
    defaultWife: '',
  },
];

export default function InvitationsPage() {
  const router = useRouter();

  // Auth User
  const [user, setUser] = useState<{ id: string; name: string; role: string } | null>(null);

  // Form Fields
  const [invitees, setInvitees] = useState('All Devotees & Colony Residents');
  const [husbandName, setHusbandName] = useState('');
  const [wifeName, setWifeName] = useState('');
  const [language, setLanguage] = useState<'TE' | 'EN' | 'BOTH'>('TE');
  const [title, setTitle] = useState(PRESET_EVENTS[0].title);
  const [eventDate, setEventDate] = useState(() => {
    // Default to today's date in YYYY-MM-DD
    return new Date().toISOString().split('T')[0];
  });
  const [eventTime, setEventTime] = useState(PRESET_EVENTS[0].defaultTime);
  const [venue, setVenue] = useState(FESTIVAL_CONFIG.associationAddress);
  const [description, setDescription] = useState(PRESET_EVENTS[0].defaultDescription);
  const [contactInfo, setContactInfo] = useState('MINNU 9059375693');

  // States
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [copiedGroupLink, setCopiedGroupLink] = useState(false);

  // Modal for Viewing Card
  const [activeInvitationModal, setActiveInvitationModal] = useState<InvitationData | null>(null);

  // Saved Invitations
  const [savedInvitations, setSavedInvitations] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  // Check auth
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated) {
          setUser(data.user);
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // Load Saved Invitations
  const loadSavedInvitations = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch('/api/invitations');
      if (res.ok) {
        const json = await res.json();
        setSavedInvitations(json.data || []);
      }
    } catch (err) {
      console.error('Failed to load invitations:', err);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadSavedInvitations();
  }, [loadSavedInvitations]);

  // Select Preset Event
  const handleSelectPreset = (preset: typeof PRESET_EVENTS[0]) => {
    setTitle(preset.title);
    setEventTime(preset.defaultTime);
    setDescription(preset.defaultDescription);
    if (preset.defaultHusband !== undefined) {
      setHusbandName(preset.defaultHusband);
    }
    if (preset.defaultWife !== undefined) {
      setWifeName(preset.defaultWife);
    }
  };

  // Prepare current in-progress invitation data object
  const currentInvitationData: InvitationData = {
    title: title.trim() || 'Ganesh Festival Celebration',
    invitees: invitees.trim() || 'All Devotees & Families',
    husbandName: husbandName.trim() || null,
    wifeName: wifeName.trim() || null,
    eventDate: eventDate || new Date().toISOString(),
    eventTime: eventTime.trim() || '7:00 PM onwards',
    venue: venue.trim() || FESTIVAL_CONFIG.associationAddress,
    description: description.trim() || null,
    contactInfo: contactInfo.trim() || null,
  };

  // Handle Save / Add Invitation
  const handleSaveInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSaving(true);

    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          invitees,
          husbandName: husbandName || undefined,
          wifeName: wifeName || undefined,
          eventDate,
          eventTime,
          venue,
          description: description || undefined,
          contactInfo: contactInfo || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to save invitation.');
        setIsSaving(false);
        return;
      }

      setSuccessMsg('✓ Invitation saved successfully!');
      loadSavedInvitations();
      // Automatically open visual card preview modal
      setActiveInvitationModal(data.data);
    } catch {
      setError('Unable to save invitation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Direct Send to Bala Ganesh WhatsApp Group
  const handleSendToWhatsAppGroup = () => {
    const message = buildWhatsAppInvitationMessage(currentInvitationData, language);

    // Auto copy to clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        navigator.clipboard.writeText(message);
        setCopiedMessage(true);
        setTimeout(() => setCopiedMessage(false), 3000);
      } catch {}
    }

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Copy WhatsApp Message
  const handleCopyMessage = async () => {
    const message = buildWhatsAppInvitationMessage(currentInvitationData, language);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        setCopiedMessage(true);
        setTimeout(() => setCopiedMessage(false), 3000);
      }
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  // Delete Invitation
  const handleDeleteInvitation = async (id: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to delete invitation for "${eventTitle}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/invitations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedInvitations((prev) => prev.filter((item) => item.id !== id));
      } else {
        const json = await res.json();
        alert(json.error || 'Failed to delete invitation.');
      }
    } catch {
      alert('Error deleting invitation.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between pb-24 md:pb-8">
      <Header />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 space-y-6">
        {/* Top Header Card */}
        <div className="rounded-3xl border-2 border-devotional-gold-500/50 bg-gradient-to-br from-[#071338] via-[#0a184a] to-[#06102f] p-5 sm:p-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold shadow-sm">
                <span>🕉️</span>
                <span>FESTIVAL INVITATION STUDIO</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">
                Send & Share <span className="gold-text-gradient">Festival Invitations</span>
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 max-w-2xl">
                Add devotee names and event dates to prepare devotional invitation cards and broadcast
                directly to the official <span className="text-devotional-gold-300 font-bold">Bala Ganesh WhatsApp group</span>.
              </p>
            </div>

            {/* Quick Link to WhatsApp Group */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <a
                href={FESTIVAL_CONFIG.whatsappGroupLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
              >
                <Users className="w-4 h-4 text-white" />
                <span>Open Bala Ganesh Group</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2.5 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Dashboard →</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 1: QUICK EVENT PRESETS */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black tracking-wider uppercase text-devotional-gold-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Choose an Event Template (Quick 1-Click Setup)</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {PRESET_EVENTS.map((preset) => {
              const isSelected = title === preset.title;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3 rounded-2xl border text-left transition-all active:scale-95 flex flex-col justify-between h-full ${
                    isSelected
                      ? 'bg-devotional-gold-500/20 border-devotional-gold-400 text-devotional-gold-200 shadow-gold-sm ring-1 ring-devotional-gold-400'
                      : 'bg-devotional-blue-900/40 border-devotional-gold-500/20 text-gray-300 hover:bg-devotional-blue-900/80 hover:text-white'
                  }`}
                >
                  <div>
                    <span className="text-base block mb-1">🪔</span>
                    <h3 className="text-xs font-bold leading-tight text-white mb-0.5">
                      {preset.title}
                    </h3>
                    <p className="text-[10px] text-devotional-gold-300 font-medium">
                      {preset.telugu}
                    </p>
                  </div>
                  <span className="text-[9px] text-gray-400 mt-2 block font-mono">
                    {preset.defaultTime}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: CREATE / PREPARE INVITATION FORM & LIVE ACTIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Inputs (7 Cols) */}
          <div className="lg:col-span-7 rounded-3xl border-2 border-devotional-gold-500/40 bg-[#071338]/90 backdrop-blur-md p-5 sm:p-6 shadow-xl space-y-4">
            <div className="border-b border-devotional-gold-500/20 pb-3">
              <h2 className="text-base font-black text-devotional-gold-300 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-amber-400" />
                <span>Prepare New Invitation</span>
              </h2>
              <p className="text-[11px] text-gray-300">
                Customize details for invitees, date, time, and program.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs">
                {error}
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-bold">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSaveInvitation} className="space-y-4 text-xs">
              {/* POOJA HOSTS / పూజా దంపతులు (HUSBAND & WIFE NAMES) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-devotional-gold-500/10 to-transparent border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🌸</span>
                    <div>
                      <h3 className="text-xs font-black text-amber-300">
                        Pooja Hosts / నేటి విశేష పూజా దంపతులు
                      </h3>
                      <p className="text-[10px] text-gray-300">
                        Enter Husband &amp; Wife names hosting today&apos;s pooja followed by prasadam
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-devotional-gold-200 font-bold mb-1">
                      Husband Name / యజమాని పేరు
                    </label>
                    <input
                      type="text"
                      value={husbandName}
                      onChange={(e) => setHusbandName(e.target.value)}
                      placeholder="Enter husband name (యజమాని పేరు)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-devotional-blue-950 border border-amber-500/40 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-devotional-gold-200 font-bold mb-1">
                      Wife Name / ధర్మపత్ని పేరు
                    </label>
                    <input
                      type="text"
                      value={wifeName}
                      onChange={(e) => setWifeName(e.target.value)}
                      placeholder="Enter wife name (ధర్మపత్ని పేరు)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-devotional-blue-950 border border-amber-500/40 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-medium"
                    />
                  </div>
                </div>

                {/* Live Preview Pill for Couple */}
                {(husbandName || wifeName) && (
                  <div className="p-2.5 rounded-xl bg-devotional-blue-950/80 border border-amber-500/30 text-[11px] space-y-1">
                    <p className="text-devotional-gold-300 font-bold">
                      🕉️ <span className="underline">తెలుగు:</span>{' '}
                      {husbandName && wifeName
                        ? `శ్రీ మరియు శ్రీమతి ${husbandName} - ${wifeName} దంపతులు & కుటుంబ సభ్యులు`
                        : husbandName
                        ? `శ్రీ ${husbandName} & కుటుంబ సభ్యులు`
                        : `శ్రీమతి ${wifeName} & కుటుంబ సభ్యులు`}
                    </p>
                    <p className="text-gray-300 font-medium">
                      ⭐ <span className="underline">English:</span>{' '}
                      {husbandName && wifeName
                        ? `Sri ${husbandName} & Smt. ${wifeName} (and Family)`
                        : husbandName
                        ? `Sri ${husbandName} & Family`
                        : `Smt. ${wifeName} & Family`}
                    </p>
                  </div>
                )}
              </div>

              {/* Invitee Names */}
              <div>
                <label className="block text-devotional-gold-200 font-bold mb-1">
                  Invitee Name(s) / ఆహ్వానితులు <span className="text-amber-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={invitees}
                  onChange={(e) => setInvitees(e.target.value)}
                  placeholder="e.g. All Devotees, Colony Residents & Friends, or Sri Ramesh & Family"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/40 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-medium"
                  required
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  Tip: Use &quot;All Devotees &amp; Colony Residents&quot; for general group broadcast, or enter a specific family name.
                </p>
              </div>

              {/* Event Title */}
              <div>
                <label className="block text-devotional-gold-200 font-bold mb-1">
                  Occasion / Event Title <span className="text-amber-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Sri Ganesh Murti Sthapana & Pooja"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/40 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-bold"
                  required
                />
              </div>

              {/* Date & Time Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-devotional-gold-200 font-bold mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Event Date <span className="text-amber-400">*</span></span>
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/40 text-white focus:outline-none focus:border-amber-400 font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-devotional-gold-200 font-bold mb-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Event Time <span className="text-amber-400">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    placeholder="e.g. 07:30 PM onwards or Morning 9:00 AM"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/40 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Venue */}
              <div>
                <label className="block text-devotional-gold-200 font-bold mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Venue / Location <span className="text-amber-400">*</span></span>
                </label>
                <input
                  type="text"
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. Bhavani Nagar Pandal, Shankarpally, Telangana"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/40 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-medium"
                  required
                />
              </div>

              {/* Program Details / Highlights */}
              <div>
                <label className="block text-devotional-gold-200 font-bold mb-1">
                  Program Details / Highlights (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Special Ganapati Homam, Evening Aarti, Mahaprasadam distribution, and devotional music..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/40 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-medium"
                />
              </div>

              {/* Contact Info */}
              <div>
                <label className="block text-devotional-gold-200 font-bold mb-1">
                  Contact Number for Queries
                </label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-devotional-blue-950 border border-devotional-gold-500/40 text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 font-medium"
                />
              </div>

              {/* Action Submit Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Save & Generate Button */}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 px-4 rounded-xl btn-gold text-devotional-blue-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-gold-sm hover:brightness-110 active:scale-95 transition-all disabled:opacity-60"
                >
                  <PlusCircle className="w-4 h-4 text-devotional-blue-950" />
                  <span>{isSaving ? 'Saving Invitation...' : 'Save & Prepare Invitation'}</span>
                </button>

                {/* Instant Preview Card */}
                <button
                  type="button"
                  onClick={() => setActiveInvitationModal(currentInvitationData)}
                  className="py-3 px-4 rounded-xl bg-devotional-blue-900 hover:bg-devotional-blue-800 border border-devotional-gold-500/40 text-devotional-gold-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                  <Eye className="w-4 h-4 text-devotional-gold-400" />
                  <span>View Card Preview</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live WhatsApp Message Preview & 1-Click Dispatch (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* Live WhatsApp Group Sender Box */}
            <div className="rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-br from-[#061c16] via-[#07241e] to-[#051322] p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-emerald-300">
                      Bala Ganesh WhatsApp Dispatch
                    </h3>
                    <p className="text-[10px] text-gray-300">
                      Post directly to Bala Ganesh group
                    </p>
                  </div>
                </div>

                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                  Official Group
                </span>
              </div>

              {/* Language Selection Toggle */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Select Language / భాష ఎంచుకోండి:</span>
                  </span>
                  <span className="text-[10px] text-emerald-200/80 font-mono font-bold">
                    {language === 'TE' ? 'తెలుగు మాత్రమే' : language === 'EN' ? 'English Only' : 'ఉభయ భాషలు (Both)'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 bg-devotional-blue-950 p-1.5 rounded-2xl border border-emerald-500/40 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setLanguage('TE')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                      language === 'TE'
                        ? 'bg-emerald-500 text-devotional-blue-950 font-black shadow-sm'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    🇮🇳 తెలుగు
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('EN')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                      language === 'EN'
                        ? 'bg-emerald-500 text-devotional-blue-950 font-black shadow-sm'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('BOTH')}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all ${
                      language === 'BOTH'
                        ? 'bg-emerald-500 text-devotional-blue-950 font-black shadow-sm'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    🌟 Both
                  </button>
                </div>
              </div>

              {/* Primary 1-Click Send to WhatsApp Group */}
              <button
                type="button"
                onClick={handleSendToWhatsAppGroup}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-lg hover:brightness-110 active:scale-95 transition-all"
              >
                <Send className="w-5 h-5 text-white" />
                <span>
                  Send ({language === 'TE' ? 'తెలుగు' : language === 'EN' ? 'English' : 'Both'}) to WhatsApp Group
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                {/* Copy Formatted Text */}
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="py-2.5 px-3 rounded-xl bg-devotional-blue-950/80 border border-emerald-500/30 text-emerald-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  {copiedMessage ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-emerald-400" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                {/* Open Group Link Directly */}
                <a
                  href={FESTIVAL_CONFIG.whatsappGroupLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-devotional-blue-950/80 border border-emerald-500/30 text-emerald-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Open Group</span>
                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                </a>
              </div>

              {/* Live Formatted WhatsApp Message Preview */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                  Live Message Preview ({language === 'TE' ? 'Telugu' : language === 'EN' ? 'English' : 'Bilingual'}):
                </span>
                <div className="p-3.5 rounded-2xl bg-[#031310] border border-emerald-500/30 text-xs text-gray-200 font-mono whitespace-pre-wrap max-h-64 overflow-y-auto leading-relaxed shadow-inner">
                  {buildWhatsAppInvitationMessage(currentInvitationData, language)}
                </div>
              </div>
            </div>

            {/* Visual Card Quick Trigger */}
            <div className="rounded-3xl border-2 border-devotional-gold-500/30 bg-[#071338]/80 p-4 text-center space-y-2">
              <span className="text-xs font-bold text-devotional-gold-300 block">
                Digital Invitation Card (PNG)
              </span>
              <p className="text-[11px] text-gray-300">
                You can also generate and download the high-resolution photo card to share on your WhatsApp status or story!
              </p>
              <button
                type="button"
                onClick={() => setActiveInvitationModal(currentInvitationData)}
                className="w-full py-2.5 px-4 rounded-xl bg-devotional-blue-900 hover:bg-devotional-blue-800 border border-devotional-gold-500/40 text-devotional-gold-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Download className="w-4 h-4 text-devotional-gold-400" />
                <span>Open &amp; Download Card Image</span>
              </button>
            </div>
          </div>
        </div>

        {/* SECTION 3: SAVED INVITATIONS LIST */}
        <div className="space-y-3 pt-4 border-t border-devotional-gold-500/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Prepared &amp; Saved Invitations</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-devotional-gold-500/20 text-devotional-gold-300 font-bold">
                  {savedInvitations.length}
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Click to re-share to Bala Ganesh group or download card anytime
              </p>
            </div>

            <button
              type="button"
              onClick={loadSavedInvitations}
              className="p-2 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/30 text-devotional-gold-300 hover:text-white transition-colors"
              title="Refresh Invitations"
            >
              <RefreshCw className={`w-4 h-4 ${loadingList ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingList ? (
            <div className="p-8 text-center text-gray-400 text-xs">
              <div className="w-8 h-8 border-2 border-devotional-gold-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading saved invitations...
            </div>
          ) : savedInvitations.length === 0 ? (
            <div className="p-8 rounded-3xl border border-devotional-gold-500/20 bg-[#071338]/60 text-center space-y-2">
              <span className="text-2xl">📩</span>
              <h3 className="text-sm font-bold text-gray-200">No invitations saved yet</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Fill the form above to prepare and save your first festival invitation for the Bala Ganesh WhatsApp group!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedInvitations.map((inv) => {
                const dateString = new Date(inv.eventDate).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl border border-devotional-gold-500/30 bg-[#071338]/90 flex flex-col justify-between gap-3 hover:border-devotional-gold-400/60 transition-all shadow-md"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-devotional-gold-500/20 text-devotional-gold-300 font-bold border border-devotional-gold-500/30">
                          {dateString}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleDeleteInvitation(inv.id, inv.title)}
                          className="p-1 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                          title="Delete Invitation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h3 className="text-sm font-black text-white line-clamp-2">
                        {inv.title}
                      </h3>

                      <div className="space-y-1 text-xs text-gray-300">
                        {(inv.husbandName || inv.wifeName) && (
                          <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-400/30 text-[11px] text-amber-200 font-semibold flex items-center gap-1.5">
                            <span className="text-xs">🌸</span>
                            <span>
                              {inv.husbandName && inv.wifeName
                                ? `${inv.husbandName} & ${inv.wifeName}`
                                : inv.husbandName || inv.wifeName}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 text-[11px] text-gray-300">
                          <Users className="w-3.5 h-3.5 text-devotional-gold-400 shrink-0" />
                          <span className="font-semibold text-devotional-gold-200 truncate">
                            {inv.invitees}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-gray-300">
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{inv.eventTime}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-gray-300">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span className="truncate">{inv.venue}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-devotional-gold-500/20">
                      <button
                        type="button"
                        onClick={() => {
                          const msg = buildWhatsAppInvitationMessage(inv, language);
                          if (typeof navigator !== 'undefined' && navigator.clipboard) {
                            try {
                              navigator.clipboard.writeText(msg);
                            } catch {}
                          }
                          const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
                          window.open(url, '_blank');
                        }}
                        className="py-2 px-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        title="Send directly to Bala Ganesh WhatsApp group"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Group</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveInvitationModal(inv)}
                        className="py-2 px-2.5 rounded-xl bg-devotional-blue-900 border border-devotional-gold-500/40 text-devotional-gold-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Card</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        userRole={user?.role}
        userName={user?.name}
      />

      {/* Active Invitation Card Modal */}
      {activeInvitationModal && (
        <InvitationCardModal
          invitation={activeInvitationModal}
          initialLanguage={language}
          onClose={() => setActiveInvitationModal(null)}
        />
      )}
    </div>
  );
}
