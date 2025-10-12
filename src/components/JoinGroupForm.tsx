"use client";

import { useState } from "react";
import { useGroupManagement } from "@/hooks/useGroupManagement";
import { LogIn, X, Loader2, Key } from "lucide-react";

interface JoinGroupFormProps {
  onSuccess?: (organizationId: string) => void;
  onCancel?: () => void;
  initialInviteCode?: string;
}

export function JoinGroupForm({
  onSuccess,
  onCancel,
  initialInviteCode = "",
}: JoinGroupFormProps) {
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const { joinGroup, isLoading, error } = useGroupManagement();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteCode.trim()) {
      return;
    }

    try {
      const organization = await joinGroup(inviteCode.trim());

      // Call success callback
      if (onSuccess) {
        onSuccess(organization._id);
      }
    } catch (err) {
      console.error("Failed to join group:", err);
    }
  };

  return (
    <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">เข้าร่วมกลุ่ม</h2>
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
            htmlFor="inviteCode"
            className="block text-sm font-medium text-white/90 mb-2"
          >
            รหัสเชิญ <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              id="inviteCode"
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="ใส่รหัสเชิญที่ได้รับ"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 font-mono outline-none focus:border-white/20 transition-colors disabled:opacity-50"
              required
              disabled={isLoading}
            />
            <Key className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          </div>
          <p className="text-sm text-white/60 mt-2">
            ใส่รหัสเชิญที่ได้รับจากผู้ดูแลกลุ่ม
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading || !inviteCode.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-black font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>กำลังเข้าร่วม...</span>
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              <span>เข้าร่วมกลุ่ม</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
        <p className="text-sm font-medium text-white/90 mb-2">เคล็ดลับ:</p>
        <ul className="text-sm text-white/70 space-y-1 list-disc list-inside">
          <li>รหัสเชิญสามารถใช้งานได้จนกว่าจะหมดอายุ</li>
          <li>บางรหัสอาจมีจำนวนการใช้งานจำกัด</li>
          <li>ตรวจสอบให้แน่ใจว่าใส่รหัสถูกต้อง</li>
        </ul>
      </div>
    </div>
  );
}
