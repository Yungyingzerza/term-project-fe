"use client";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";
import BottomTabs from "./BottomTabs";
import { useSelector } from "react-redux";
import {
  Upload,
  Video,
  Hash,
  Image,
  X,
  Check,
  Users,
  Lock,
  Building2,
  Search,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

type Visibility = "Public" | "Friends" | "Private" | "Organizations";

export default function UploadPage() {
  const ambientColor = useSelector((s: any) => s.player.ambientColor) as string;

  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("Public");
  const [allowComments, setAllowComments] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [postOrgs, setPostOrgs] = useState<string[]>([]);
  const [viewOrgs, setViewOrgs] = useState<string[]>([]);
  const [postOrgQuery, setPostOrgQuery] = useState("");
  const [viewOrgQuery, setViewOrgQuery] = useState("");

  const ORGS = [
    { name: "OpenAI", logo: "https://logo.clearbit.com/openai.com" },
    { name: "Vercel", logo: "https://logo.clearbit.com/vercel.com" },
    { name: "GitHub", logo: "https://logo.clearbit.com/github.com" },
    { name: "Stripe", logo: "https://logo.clearbit.com/stripe.com" },
    { name: "Notion", logo: "https://logo.clearbit.com/notion.so" },
  ];

  const previewUrl = useMemo(() => {
    if (!file) return "";
    return URL.createObjectURL(file);
  }, [file]);

  const filteredPostChoices = useMemo(() => {
    const q = postOrgQuery.toLowerCase().trim();
    if (!q) return ORGS;
    return ORGS.filter((o) => o.name.toLowerCase().includes(q));
  }, [postOrgQuery]);

  const filteredViewChoices = useMemo(() => {
    const q = viewOrgQuery.toLowerCase().trim();
    if (!q) return ORGS;
    return ORGS.filter((o) => o.name.toLowerCase().includes(q));
  }, [viewOrgQuery]);

  const onPickFile = () => inputRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) setFile(f);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

  const onRemove = () => setFile(null);

  const onPost = async () => {
    if (!file) return;
    setIsPosting(true);
    try {
      // Placeholder: simulate upload
      await new Promise((r) => setTimeout(r, 1200));
      // eslint-disable-next-line no-console
      console.log("Posted:", {
        file: file.name,
        caption,
        visibility,
        allowComments,
        postOrgs,
        viewOrgs: visibility === "Organizations" ? viewOrgs : undefined,
      });
    } finally {
      setIsPosting(false);
    }
  };

  const hashtagSuggestions = [
    "#ai",
    "#coding",
    "#travel",
    "#food",
    "#music",
    "#wellness",
  ];

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
                <Upload className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold">Upload</h1>
            </div>

            {/* Content card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Left: picker / preview */}
              <div className="rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur-sm p-5">
                {file && previewUrl ? (
                  <div className="relative">
                    <video
                      src={previewUrl}
                      controls
                      className="w-full aspect-[9/16] object-cover rounded-xl border border-white/10 bg-black"
                    />
                    <button
                      onClick={onRemove}
                      className="cursor-pointer absolute top-2 right-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/10 text-sm"
                    >
                      <X className="w-4 h-4" /> Remove
                    </button>
                  </div>
                ) : (
                  <div
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/15 bg-neutral-950/60 p-8 sm:p-10 text-center"
                  >
                    <div className="h-14 w-14 rounded-2xl bg-white text-black grid place-items-center">
                      <Video className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold">Drag and drop a video</p>
                      <p className="text-white/70 text-sm">
                        or choose a file below
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        onClick={onPickFile}
                        className="cursor-pointer px-3 py-2 rounded-xl bg-white text-black font-semibold hover:opacity-90 inline-flex items-center gap-1.5"
                      >
                        <Upload className="w-4 h-4" /> Choose video
                      </button>
                      <button
                        className="cursor-not-allowed px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white/70 inline-flex items-center gap-1.5"
                        title="Images not supported yet"
                      >
                        <Image className="w-4 h-4" /> Image (soon)
                      </button>
                    </div>
                    <input
                      ref={inputRef}
                      type="file"
                      accept="video/*"
                      onChange={onFileChange}
                      className="hidden"
                    />
                    <div className="mt-3 text-xs text-white/60">
                      <p>MP4, MOV up to 200MB • 9:16 recommended</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: details */}
              <div className="rounded-2xl border border-white/10 bg-neutral-900/60 backdrop-blur-sm p-5">
                <div className="space-y-4">
                  {/* Post in organizations */}
                  <div>
                    <label className="block text-sm text-white/80 mb-2">
                      Post in organizations
                    </label>
                    <div className="group relative mb-2">
                      <input
                        value={postOrgQuery}
                        onChange={(e) => setPostOrgQuery(e.target.value)}
                        placeholder="Search organizations"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 outline-none focus:border-white/20"
                      />
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/70" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {filteredPostChoices.map((o) => {
                        const active = postOrgs.includes(o.name);
                        return (
                          <button
                            key={o.name}
                            onClick={() =>
                              setPostOrgs((prev) =>
                                prev.includes(o.name)
                                  ? prev.filter((n) => n !== o.name)
                                  : [...prev, o.name]
                              )
                            }
                            className={`cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm ${
                              active
                                ? "bg-white text-black border-white"
                                : "bg-white/5 border-white/10 hover:bg-white/10"
                            }`}
                          >
                            <img
                              src={o.logo}
                              alt={o.name}
                              className="w-4 h-4 rounded"
                            />
                            {o.name}
                          </button>
                        );
                      })}
                      {filteredPostChoices.length === 0 && (
                        <div className="text-sm text-white/60 px-1.5 py-1">
                          No organizations found
                        </div>
                      )}
                    </div>
                    {postOrgs.length === 0 && (
                      <p className="mt-1 text-xs text-white/60">
                        Optional: choose one or more organizations to post this
                        in.
                      </p>
                    )}
                  </div>

                  {/* Caption */}
                  <div>
                    <label className="block text-sm text-white/80 mb-1">
                      Caption
                    </label>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      rows={4}
                      placeholder="Say something about your video..."
                      className="w-full resize-y rounded-xl bg-white/5 border border-white/10 px-3 py-2 outline-none focus:border-white/20"
                    />
                    <div className="mt-1 text-xs text-white/60">
                      {caption.length}/2200
                    </div>
                  </div>

                  {/* Hashtags suggestions */}
                  <div>
                    <div className="text-sm text-white/80 mb-2">
                      Suggested hashtags
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {hashtagSuggestions.map((tag) => (
                        <button
                          key={tag}
                          onClick={() =>
                            setCaption((c) => (c ? c + " " + tag : tag))
                          }
                          className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/10 border border-white/10 text-sm text-white/90"
                        >
                          <Hash className="w-4 h-4 text-white/70" />{" "}
                          {tag.replace("#", "")}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visibility */}
                  <div>
                    <label className="block text-sm text-white/80 mb-1">
                      Who can view
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(
                        [
                          "Public",
                          "Friends",
                          "Organizations",
                          "Private",
                        ] as Visibility[]
                      ).map((v) => (
                        <button
                          key={v}
                          onClick={() => setVisibility(v)}
                          className={`cursor-pointer px-3 py-2 rounded-xl border text-sm inline-flex items-center justify-center gap-1.5 ${
                            visibility === v
                              ? "bg-white text-black border-white"
                              : "bg-white/5 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {v === "Public" ? (
                            <Users className="w-4 h-4" />
                          ) : v === "Friends" ? (
                            <Users className="w-4 h-4" />
                          ) : v === "Private" ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Building2 className="w-4 h-4" />
                          )}
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Options */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-sm">Allow comments</span>
                    <button
                      onClick={() => setAllowComments((s) => !s)}
                      className={`cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${
                        allowComments
                          ? "bg-white text-black border-white"
                          : "bg-neutral-900/60 border-white/10"
                      }`}
                      aria-pressed={allowComments}
                    >
                      {allowComments ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      {allowComments ? "On" : "Off"}
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button className="cursor-pointer px-3 py-2 rounded-xl bg-white/10 border border-white/10 hover:bg-white/15">
                      Cancel
                    </button>
                    <button
                      onClick={onPost}
                      disabled={
                        !file ||
                        isPosting ||
                        (visibility === "Organizations" &&
                          viewOrgs.length === 0)
                      }
                      className="cursor-pointer px-3 py-2 rounded-xl bg-white text-black font-semibold disabled:opacity-50 inline-flex items-center gap-1.5"
                    >
                      {isPosting ? (
                        <svg
                          className="animate-spin h-4 w-4"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-30"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-90"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                          />
                        </svg>
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      Post
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
