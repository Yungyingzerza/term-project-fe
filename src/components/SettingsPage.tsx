"use client";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import BottomTabs from "./BottomTabs";
import { useDispatch, useSelector } from "react-redux";
import { Check, LogOut, Save, Settings, Shield, Trash2, UserCog, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction, KeyboardEvent } from "react";
import { setPictureUrl, setUsername, setEmails } from "@/store/userSlice";

export default function SettingsPage() {
  const dispatch = useDispatch();
  const ambientColor = useSelector((s: any) => s.player.ambientColor) as string;
  const user = useSelector((s: any) => s.user) as {
    username: string;
    picture_url: string;
    emails?: string[];
  };

  const [username, setUsernameLocal] = useState(user?.username || "");
  const [avatarDataUrl, setAvatarDataUrl] = useState(user?.picture_url || "");
  const [emails, setEmailsLocal] = useState<string[]>(user?.emails || []);
  const [savedBurst, setSavedBurst] = useState(false);

  useEffect(() => {
    setUsernameLocal(user?.username || "");
    setAvatarDataUrl(user?.picture_url || "");
    setEmailsLocal(user?.emails || []);
  }, [user?.username, user?.picture_url, user?.emails]);

  // Local-only preferences (no backend yet)
  const [showActivity, setShowActivity] = useState(true);
  // Mentions disabled for now
  // const [allowMentions, setAllowMentions] = useState(true);

  // Avatar image input
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const onPickAvatar = () => avatarInputRef.current?.click();
  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      setAvatarDataUrl(url);
    };
    reader.readAsDataURL(f);
  };

  const onSaveAccount = () => {
    dispatch(setUsername(username));
    dispatch(setPictureUrl(avatarDataUrl));
    dispatch(setEmails(emails));
    setSavedBurst(true);
    const t = setTimeout(() => setSavedBurst(false), 1200);
    return () => clearTimeout(t);
  };

  return (
    <div className="flex flex-col relative min-h-screen bg-neutral-950 text-white selection:bg-white selection:text-black overflow-hidden overscroll-none pt-14">
      {/* Ambient overlay to match ModernTok */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 transition-[background-color,opacity] duration-700 ease-linear"
        style={{
          backgroundColor: ambientColor,
          opacity: 0.5,
          filter: "blur(60px)",
        }}
      />

      <TopBar />

      <div className="relative z-10 flex flex-1">
        <Sidebar />

        <main className="flex-1">
          <section className="max-w-7xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-white text-black grid place-items-center">
                <Settings className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold">Settings</h1>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              {/* Left column: Account + Password */}
              <div className="space-y-5 xl:col-span-2">
                {/* Account */}
                <div className="rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur-sm p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-neutral-800 shrink-0">
                      <img
                        src={avatarDataUrl || user?.picture_url || "https://i.pravatar.cc/100?img=1"}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <UserCog className="w-4 h-4 text-white/80" />
                        <h2 className="font-semibold">Account</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm text-white/80 mb-1">Display name</label>
                          <input
                            value={username}
                            onChange={(e) => setUsernameLocal(e.target.value)}
                            placeholder="Your name"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-white/20"
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-sm text-white/80 mb-1">Avatar</label>
                            <div className="flex items-center gap-2">
                              <button onClick={onPickAvatar} className="cursor-pointer px-3 py-2 rounded-xl bg-white text-black font-semibold hover:opacity-90">
                                Choose image
                              </button>
                              <button onClick={() => setAvatarDataUrl("")} className="cursor-pointer px-3 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15">
                                Remove
                              </button>
                            </div>
                            <input ref={avatarInputRef} type="file" accept="image/*" onChange={onAvatarChange} className="hidden" />
                          </div>
                        </div>
                        <EmailsEditor emails={emails} setEmails={setEmailsLocal} />
                      </div>
                      <div className="mt-3 flex items-center gap-2 justify-end">
                        <button
                          onClick={() => {
                            setUsernameLocal(user?.username || "");
                            setAvatarDataUrl(user?.picture_url || "");
                            setEmailsLocal(user?.emails || []);
                          }}
                          className="cursor-pointer px-3 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 inline-flex items-center gap-1.5"
                        >
                          <X className="w-4 h-4" /> Reset
                        </button>
                        <button
                          onClick={onSaveAccount}
                          className="cursor-pointer px-3 py-2 rounded-xl bg-white text-black font-semibold inline-flex items-center gap-1.5 relative"
                        >
                          <Save className="w-4 h-4" /> Save
                          {savedBurst && (
                            <span
                              aria-hidden
                              className="absolute inset-0 rounded-xl border border-white/10 bg-white/10 animate-[burst_700ms_ease-out]"
                            />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password */}
                <PasswordCard />
              </div>

              {/* Right column: Privacy + Danger */}
              <div className="space-y-5">
                {/* Privacy */}
                <div className="rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-white/80" />
                    <h2 className="font-semibold">Privacy</h2>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                      <span className="text-sm">Show activity status</span>
                      <button
                        onClick={() => setShowActivity((s) => !s)}
                        className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${
                          showActivity
                            ? "bg-white text-black border-white"
                            : "bg-neutral-900/60 border-white/10"
                        }`}
                        aria-pressed={showActivity}
                      >
                        {showActivity ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                        {showActivity ? "On" : "Off"}
                      </button>
                    </div>
                    {/* Allow mentions is disabled/commented for now */}
                  </div>
                </div>

                {/* Danger zone */}
                <div className="rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur-sm p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-white/80" />
                    <h2 className="font-semibold">Danger Zone</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="cursor-pointer px-3 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 inline-flex items-center gap-1.5"
                      title="No-op in demo"
                    >
                      <LogOut className="w-4 h-4" /> Log out
                    </button>
                    <button
                      className="cursor-pointer px-3 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 hover:bg-red-500/30 inline-flex items-center gap-1.5"
                      title="No-op in demo"
                    >
                      <Trash2 className="w-4 h-4" /> Delete account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>

      <div className="relative z-10">
        <BottomTabs />
      </div>
    </div>
  );
}

function PasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  const valid = next.length >= 8 && next === confirm;

  const onChangePassword = async () => {
    setError("");
    setOk(false);
    if (!valid) {
      setError("Password must be at least 8 characters and match.");
      return;
    }
    setSaving(true);
    try {
      // Placeholder demo action
      await new Promise((r) => setTimeout(r, 900));
      setOk(true);
      setCurrent("");
      setNext("");
      setConfirm("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <Settings className="w-4 h-4 text-white/80" />
        <h2 className="font-semibold">Change Password</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm text-white/80 mb-1">Current password</label>
          <input
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            type="password"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-white/20"
            placeholder="••••••••"
          />
        </div>
        <div>
          <label className="block text-sm text-white/80 mb-1">New password</label>
          <input
            value={next}
            onChange={(e) => setNext(e.target.value)}
            type="password"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-white/20"
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <label className="block text-sm text-white/80 mb-1">Confirm new password</label>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            type="password"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-white/20"
            placeholder="Re-enter password"
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="text-xs">
          {error && <span className="text-red-300">{error}</span>}
          {ok && (
            <span className="text-green-300 inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Password updated
            </span>
          )}
        </div>
        <button
          onClick={onChangePassword}
          disabled={saving}
          className="cursor-pointer px-3 py-2 rounded-xl bg-white text-black font-semibold disabled:opacity-50"
        >
          {saving ? "Saving..." : "Change Password"}
        </button>
      </div>
    </div>
  );
}

function EmailsEditor({
  emails,
  setEmails,
}: {
  emails: string[];
  setEmails: Dispatch<SetStateAction<string[]>>;
}) {
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState("");

  const isValidEmail = (val: string) => {
    const e = val.trim().toLowerCase();
    // Simple RFC5322-ish check; good enough for UI validation
    return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(e);
  };

  const addEmail = () => {
    const e = newEmail.trim().toLowerCase();
    if (!e) return;
    if (!isValidEmail(e)) {
      setError("Enter a valid email address.");
      return;
    }
    if (emails.includes(e)) {
      setError("Email already added.");
      return;
    }
    setEmails((prev) => [...prev, e]);
    setNewEmail("");
    setError("");
  };

  const removeEmail = (e: string) => {
    setEmails((prev) => prev.filter((x) => x !== e));
  };

  const onKeyDown = (evt: KeyboardEvent<HTMLInputElement>) => {
    if (evt.key === "Enter") {
      evt.preventDefault();
      addEmail();
    }
  };

  return (
    <div className="md:col-span-2">
      <label className="block text-sm text-white/80 mb-1">Emails</label>
      <div className="flex gap-2">
        <input
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="you@company.com"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-white/20"
          type="email"
        />
        <button
          onClick={addEmail}
          className="cursor-pointer px-3 py-2 rounded-xl bg-white text-black font-semibold hover:opacity-90"
        >
          Add
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {emails.map((e) => (
          <span key={e} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-sm">
            {e}
            <button
              onClick={() => removeEmail(e)}
              className="cursor-pointer inline-flex items-center justify-center w-5 h-5 rounded-md bg-black/40 border border-white/10"
              title="Remove"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        {emails.length === 0 && (
          <span className="text-sm text-white/60">No emails added yet.</span>
        )}
      </div>
      <p className="mt-1 text-xs text-white/60">
        We use your email domains to identify your organizations.
      </p>
    </div>
  );
}
