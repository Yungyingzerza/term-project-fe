"use client";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import BottomTabs from "./BottomTabs";
import { useDispatch, useSelector } from "react-redux";
import {
  Check,
  LogOut,
  Save,
  Settings,
  Shield,
  Trash2,
  UserCog,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction, KeyboardEvent } from "react";
import {
  setPictureUrl,
  setUsername,
  setEmails,
  setHandle,
} from "@/store/userSlice";
import {
  updateHandle as updateHandleApi,
  updateUsername as updateUsernameApi,
  updateProfilePicture as updateProfilePictureApi,
  getEmails as getEmailsApi,
  sendEmailOtp,
  createEmail as createEmailApi,
  deleteEmail as deleteEmailApi,
} from "@/lib/api/user";
import { uploadProfileImage } from "@/lib/api/media";
import type { UserEmail } from "@/interfaces/user";

export default function SettingsPage() {
  const dispatch = useDispatch();
  const ambientColor = useSelector((s: any) => s.player.ambientColor) as string;
  const user = useSelector((s: any) => s.user) as {
    id?: string;
    username: string;
    handle?: string;
    picture_url: string;
    emails?: string[];
  };

  const [username, setUsernameLocal] = useState(user?.username || "");
  const [handle, setHandleLocal] = useState(user?.handle || "");
  const [avatarDataUrl, setAvatarDataUrl] = useState(user?.picture_url || "");
  const [emails, setEmailsLocal] = useState<UserEmail[]>([]);
  const [emailsLoading, setEmailsLoading] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [savedBurst, setSavedBurst] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const avatarObjectUrlRef = useRef<string | null>(null);

  const updateEmailsState = useCallback(
    (next: UserEmail[]) => {
      setEmailsLocal(next);
      dispatch(setEmails(next.map((e) => e.email)));
    },
    [dispatch]
  );

  const clearAvatarObjectUrl = useCallback(() => {
    if (avatarObjectUrlRef.current) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
      avatarObjectUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    setUsernameLocal(user?.username || "");
    setHandleLocal(user?.handle || "");
    clearAvatarObjectUrl();
    setAvatarFile(null);
    setAvatarDataUrl(user?.picture_url || "");
  }, [user?.username, user?.handle, user?.picture_url, clearAvatarObjectUrl]);

  const reloadEmails = useCallback(async () => {
    setEmailsLoading(true);
    setEmailError(null);
    try {
      const data = await getEmailsApi();
      updateEmailsState(data.emails);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load emails";
      setEmailError(message);
    } finally {
      setEmailsLoading(false);
    }
  }, [updateEmailsState]);

  useEffect(() => {
    void reloadEmails();
  }, [reloadEmails]);

  useEffect(() => () => clearAvatarObjectUrl(), [clearAvatarObjectUrl]);

  // Local-only preferences (no backend yet)
  const [showActivity, setShowActivity] = useState(true);
  // Mentions disabled for now
  // const [allowMentions, setAllowMentions] = useState(true);

  // Avatar image input
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const onPickAvatar = () => avatarInputRef.current?.click();
  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    clearAvatarObjectUrl();
    const previewUrl = URL.createObjectURL(file);
    avatarObjectUrlRef.current = previewUrl;
    setAvatarFile(file);
    setAvatarDataUrl(previewUrl);
    setAccountError(null);
  };

  const onRemoveAvatar = () => {
    clearAvatarObjectUrl();
    setAvatarFile(null);
    setAvatarDataUrl("");
  };

  const onSaveAccount = async () => {
    const trimmedUsername = username.trim();
    const sanitizedHandle = handle.trim().replace(/^@+/, "");
    const normalizedHandle = sanitizedHandle.toLowerCase();

    if (!sanitizedHandle) {
      setAccountError("Handle is required.");
      return;
    }

    const needsUsernameUpdate =
      trimmedUsername && trimmedUsername !== (user?.username || "");
    const needsHandleUpdate =
      normalizedHandle && normalizedHandle !== (user?.handle || "");
    const hasAvatarFile = avatarFile != null;
    const remoteAvatarChanged =
      !hasAvatarFile &&
      avatarDataUrl &&
      avatarDataUrl !== (user?.picture_url || "");

    if (
      !needsUsernameUpdate &&
      !needsHandleUpdate &&
      !hasAvatarFile &&
      avatarDataUrl === (user?.picture_url || "")
    ) {
      dispatch(setPictureUrl(avatarDataUrl));
      setSavedBurst(true);
      window.setTimeout(() => setSavedBurst(false), 1200);
      return;
    }

    if (!hasAvatarFile && avatarDataUrl === "" && user?.picture_url) {
      setAccountError("Upload a new profile image or keep the current one.");
      return;
    }

    if (remoteAvatarChanged && !/^https?:/i.test(avatarDataUrl)) {
      setAccountError("Please upload the image before saving.");
      return;
    }

    setAccountSaving(true);
    setAccountError(null);
    try {
      if (needsUsernameUpdate) {
        const res = await updateUsernameApi({ username: trimmedUsername });
        dispatch(setUsername(res.user.username ?? trimmedUsername));
      }

      if (needsHandleUpdate) {
        const res = await updateHandleApi({ handle: normalizedHandle });
        dispatch(setHandle(res.user.handle ?? normalizedHandle));
        setHandleLocal(res.user.handle ?? normalizedHandle);
      }
      let latestPictureUrl = user?.picture_url || "";
      if (hasAvatarFile && avatarFile) {
        const res = await uploadProfileImage(avatarFile, {});
        latestPictureUrl = res.pictureUrl;
        clearAvatarObjectUrl();
        setAvatarFile(null);
        setAvatarDataUrl(res.pictureUrl);
      } else if (remoteAvatarChanged && avatarDataUrl) {
        const res = await updateProfilePictureApi({ pictureUrl: avatarDataUrl });
        latestPictureUrl = res.user.picture_url || avatarDataUrl;
        setAvatarDataUrl(latestPictureUrl);
      } else {
        latestPictureUrl = avatarDataUrl || user?.picture_url || "";
      }

      dispatch(setPictureUrl(latestPictureUrl));
      setSavedBurst(true);
      window.setTimeout(() => setSavedBurst(false), 1200);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save account";
      setAccountError(message);
    } finally {
      setAccountSaving(false);
    }
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
              {/* Left column: Account */}
              <div className="space-y-5 xl:col-span-2">
                {/* Account */}
                <div className="rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur-sm p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-neutral-800 shrink-0">
                      <img
                        src={
                          avatarDataUrl ||
                          user?.picture_url ||
                          "https://i.pravatar.cc/100?img=1"
                        }
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <UserCog className="w-4 h-4 text-white/80" />
                        <h2 className="font-semibold">Account</h2>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm text-white/80 mb-1">
                            Display name
                          </label>
                          <input
                            value={username}
                            onChange={(e) => setUsernameLocal(e.target.value)}
                            placeholder="Your name"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-white/20"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-white/80 mb-1">
                            Handle
                          </label>
                          <div className="flex rounded-xl border border-white/10 bg-white/5 focus-within:border-white/20">
                            <span className="px-3 py-2 text-sm text-white/60">@</span>
                            <input
                              value={handle}
                              onChange={(e) => setHandleLocal(e.target.value)}
                              placeholder="handle"
                              className="w-full bg-transparent rounded-r-xl px-3 py-2 outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-sm text-white/80 mb-1">
                              Avatar
                            </label>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={onPickAvatar}
                                className="cursor-pointer px-3 py-2 rounded-xl bg-white text-black font-semibold hover:opacity-90"
                              >
                                Choose image
                              </button>
                              <button
                                onClick={onRemoveAvatar}
                                className="cursor-pointer px-3 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15"
                              >
                                Remove
                              </button>
                            </div>
                            <input
                              ref={avatarInputRef}
                              type="file"
                              accept="image/*"
                              onChange={onAvatarChange}
                              className="hidden"
                            />
                          </div>
                        </div>
                        <EmailsEditor
                          emails={emails}
                          onEmailsChange={updateEmailsState}
                          loading={emailsLoading}
                          error={emailError}
                          setError={setEmailError}
                        />
                      </div>
                      <div className="mt-3 flex items-center gap-2 justify-end">
                        {accountError ? (
                          <span className="mr-auto text-xs text-rose-400">
                            {accountError}
                          </span>
                        ) : null}
                        <button
                          onClick={() => {
                            setUsernameLocal(user?.username || "");
                            setHandleLocal(user?.handle || "");
                            clearAvatarObjectUrl();
                            setAvatarFile(null);
                            setAvatarDataUrl(user?.picture_url || "");
                            setAccountError(null);
                            void reloadEmails();
                          }}
                          className="cursor-pointer px-3 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 inline-flex items-center gap-1.5"
                        >
                          <X className="w-4 h-4" /> Reset
                        </button>
                        <button
                          onClick={() => {
                            void onSaveAccount();
                          }}
                          disabled={accountSaving}
                          className="cursor-pointer px-3 py-2 rounded-xl bg-white text-black font-semibold inline-flex items-center gap-1.5 relative disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <Save className="w-4 h-4" />
                          {accountSaving ? "Saving" : "Save"}
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
                        {showActivity ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
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

function EmailsEditor({
  emails,
  onEmailsChange,
  loading,
  error,
  setError,
}: {
  emails: UserEmail[];
  onEmailsChange: (emails: UserEmail[]) => void;
  loading: boolean;
  error: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
}) {
  const [newEmail, setNewEmail] = useState("");
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState("");
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isValidEmail = (val: string) => {
    const e = val.trim().toLowerCase();
    return /[^\s@]+@[^\s@]+\.[^\s@]+/.test(e);
  };

  const handleSendOtp = async () => {
    const email = newEmail.trim().toLowerCase();
    setStatus(null);
    setError(null);
    if (!email) return;
    if (!isValidEmail(email)) {
      setStatus({ type: "error", message: "Enter a valid email address." });
      return;
    }
    if (emails.some((e) => e.email.toLowerCase() === email)) {
      setStatus({ type: "error", message: "Email already added." });
      return;
    }
    setSendingOtp(true);
    try {
      await sendEmailOtp({ email });
      setOtpEmail(email);
      setStatus({
        type: "success",
        message: `Verification code sent to ${email}. It expires in 5 minutes.`,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send verification code.";
      setStatus({ type: "error", message });
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpEmail) return;
    const otp = otpValue.trim();
    setStatus(null);
    setError(null);
    if (!otp) {
      setStatus({ type: "error", message: "Enter the 6-digit code." });
      return;
    }
    setVerifyingOtp(true);
    try {
      const res = await createEmailApi({ email: otpEmail, otp });
      onEmailsChange([...emails, res.email]);
      setStatus({ type: "success", message: "Email added successfully." });
      setNewEmail("");
      setOtpEmail(null);
      setOtpValue("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to verify code.";
      setStatus({ type: "error", message });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleDeleteEmail = async (emailId: string) => {
    setStatus(null);
    setError(null);
    setDeletingId(emailId);
    try {
      await deleteEmailApi(emailId);
      onEmailsChange(emails.filter((e) => e._id !== emailId));
      setStatus({ type: "success", message: "Email removed." });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to remove email.";
      setStatus({ type: "error", message });
    } finally {
      setDeletingId(null);
    }
  };

  const onKeyDown = (evt: KeyboardEvent<HTMLInputElement>) => {
    if (evt.key === "Enter") {
      evt.preventDefault();
      if (otpEmail) {
        void handleVerifyOtp();
      } else {
        void handleSendOtp();
      }
    }
  };

  return (
    <div className="md:col-span-3">
      <label className="block text-sm text-white/80 mb-1">Emails</label>
      <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-neutral-950/40 p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="you@company.com"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-white/20"
            type="email"
            disabled={sendingOtp || verifyingOtp}
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                void handleSendOtp();
              }}
              disabled={sendingOtp || verifyingOtp}
              className="cursor-pointer px-3 py-2 rounded-xl bg-white text-black font-semibold hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {sendingOtp ? "Sending…" : "Send code"}
            </button>
            {otpEmail ? (
              <button
                onClick={() => {
                  void handleVerifyOtp();
                }}
                disabled={verifyingOtp}
                className="cursor-pointer px-3 py-2 rounded-xl bg-emerald-500/90 text-black font-semibold hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {verifyingOtp ? "Verifying…" : "Verify"}
              </button>
            ) : null}
          </div>
        </div>
        {otpEmail ? (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Enter 6-digit code"
              className="w-full sm:w-48 bg-white/5 border border-white/10 rounded-xl px-3 py-2 outline-none focus:border-white/20 tracking-[0.3em]"
              inputMode="numeric"
              maxLength={6}
            />
            <span className="text-xs text-white/50 self-center">
              Sent to <strong>{otpEmail}</strong>
            </span>
          </div>
        ) : null}
        {status ? (
          <p
            className={`text-xs ${
              status.type === "error" ? "text-rose-300" : "text-emerald-300"
            }`}
          >
            {status.message}
          </p>
        ) : null}
        {error ? <p className="text-xs text-rose-300">{error}</p> : null}
        <div className="mt-2 space-y-2">
          {loading ? (
            <p className="text-sm text-white/60">Loading emails…</p>
          ) : emails.length > 0 ? (
            emails.map((email) => (
              <div
                key={email._id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-neutral-900/70 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{email.email}</p>
                </div>
                <button
                  onClick={() => {
                    void handleDeleteEmail(email._id);
                  }}
                  disabled={deletingId === email._id}
                  className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-black/40 border border-white/10 px-2.5 py-1.5 text-xs hover:bg-black/60 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deletingId === email._id ? "Removing…" : "Remove"}
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-white/60">No emails added yet.</p>
          )}
        </div>
      </div>
      <p className="mt-1 text-xs text-white/60">
        We use your email domains to identify your organizations.
      </p>
    </div>
  );
}
