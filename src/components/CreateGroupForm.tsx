"use client";

import { useEffect, useState } from "react";
import { useGroupManagement } from "@/hooks/useGroupManagement";
import { Check, X, Image as ImageIcon, Loader2 } from "lucide-react";
import Image from "next/image";

interface CreateGroupFormProps {
  onSuccess?: (organizationId: string) => void;
  onCancel?: () => void;
}

export function CreateGroupForm({ onSuccess, onCancel }: CreateGroupFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreviewError, setLogoPreviewError] = useState(false);
  const { createGroup, isLoading, error } = useGroupManagement();

  useEffect(() => {
    setLogoPreviewError(false);
  }, [logoUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    try {
      const organization = await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        logo_url: logoUrl.trim() || undefined,
      });

      // Call success callback
      if (onSuccess) {
        onSuccess(organization._id);
      }
    } catch (err) {
      console.error("Failed to create group:", err);
    }
  };

  return (
    <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">สร้างกลุ่มใหม่</h2>
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">
          {error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-white/90 mb-2"
          >
            ชื่อกลุ่ม <span className="text-red-400">*</span>
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อกลุ่มของคุณ"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/20 transition-colors disabled:opacity-50"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-white/90 mb-2"
          >
            คำอธิบาย
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="บอกเกี่ยวกับกลุ่มของคุณ..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/20 transition-colors disabled:opacity-50 resize-none"
            rows={3}
            disabled={isLoading}
          />
        </div>

        <div>
          <label
            htmlFor="logoUrl"
            className="block text-sm font-medium text-white/90 mb-2"
          >
            URL รูปโลโก้
          </label>
          <div className="relative">
            <input
              id="logoUrl"
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 outline-none focus:border-white/20 transition-colors disabled:opacity-50"
              disabled={isLoading}
            />
            <ImageIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          </div>
          {logoUrl && !logoPreviewError && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
              <span className="text-sm text-white/60">ตัวอย่าง:</span>
              <Image
                src={logoUrl}
                alt="Logo preview"
                width={48}
                height={48}
                className="w-12 h-12 object-cover rounded-lg border border-white/10"
                onError={() => setLogoPreviewError(true)}
              />
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>กำลังสร้าง...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>สร้างกลุ่ม</span>
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
        <p className="text-sm text-white/70">
          <strong className="text-white/90">หมายเหตุ:</strong>{" "}
          คุณจะถูกเพิ่มเป็นผู้ดูแลกลุ่มโดยอัตโนมัติ
          และสามารถเชิญสมาชิกอื่นได้ด้วยรหัสเชิญ
        </p>
      </div>
    </div>
  );
}
