"use client";

import { useState } from "react";
import { useGroupManagement } from "@/hooks/useGroupManagement";
import { useGroupInvites } from "@/hooks/useGroupInvites";
import { useGroupMembers } from "@/hooks/useGroupMembers";
import type { Organization } from "@/interfaces";
import { Modal } from "@/components/Modal";
import {
  Edit2,
  Check,
  X,
  Plus,
  Copy,
  Trash2,
  LogOut,
  Shield,
  User,
  Calendar,
  Hash,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface GroupManagementProps {
  organization: Organization;
  currentUserId: string;
  isAdmin: boolean;
}

export function GroupManagement({
  organization,
  currentUserId,
  isAdmin,
}: GroupManagementProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(organization.name);
  const [groupDescription, setGroupDescription] = useState(
    organization.description || ""
  );
  const [groupLogoUrl, setGroupLogoUrl] = useState(organization.logo_url || "");
  const [inviteDays, setInviteDays] = useState(7);
  const [maxUses, setMaxUses] = useState<number | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Modal states
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "info" | "warning" | "error" | "success" | "confirm";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
  });

  const {
    updateGroup,
    leaveGroup,
    isLoading: groupLoading,
  } = useGroupManagement();
  const {
    invites,
    createInvite,
    revokeInvite,
    isLoading: invitesLoading,
  } = useGroupInvites(organization._id);
  const {
    members,
    removeMember,
    isLoading: membersLoading,
  } = useGroupMembers(organization._id);

  const handleUpdateGroup = async () => {
    try {
      await updateGroup(organization._id, {
        name: groupName,
        description: groupDescription,
        logo_url: groupLogoUrl,
      });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleLeaveGroup = async () => {
    setModalState({
      isOpen: true,
      type: "confirm",
      title: "ออกจากกลุ่ม",
      message:
        "คุณแน่ใจหรือไม่ว่าต้องการออกจากกลุ่มนี้? การกระทำนี้ไม่สามารถยกเลิกได้",
      onConfirm: async () => {
        try {
          await leaveGroup(organization._id);
          window.location.href = "/profile";
        } catch (error) {
          setModalState({
            isOpen: true,
            type: "error",
            title: "เกิดข้อผิดพลาด",
            message:
              error instanceof Error
                ? error.message
                : "ไม่สามารถออกจากกลุ่มได้",
          });
        }
      },
    });
  };

  const handleCreateInvite = async () => {
    try {
      await createInvite({
        expiresInDays: inviteDays,
        maxUses: maxUses,
      });
      setModalState({
        isOpen: true,
        type: "success",
        title: "สำเร็จ",
        message: "สร้างรหัสเชิญเรียบร้อยแล้ว",
      });
    } catch (error) {
      setModalState({
        isOpen: true,
        type: "error",
        title: "เกิดข้อผิดพลาด",
        message:
          error instanceof Error ? error.message : "ไม่สามารถสร้างรหัสเชิญได้",
      });
    }
  };

  const handleRevokeInvite = async (inviteCode: string) => {
    setModalState({
      isOpen: true,
      type: "confirm",
      title: "เพิกถอนรหัสเชิญ",
      message: "คุณแน่ใจหรือไม่ว่าต้องการเพิกถอนรหัสเชิญนี้?",
      onConfirm: async () => {
        try {
          await revokeInvite(inviteCode);
          setModalState({
            isOpen: true,
            type: "success",
            title: "สำเร็จ",
            message: "เพิกถอนรหัสเชิญเรียบร้อยแล้ว",
          });
        } catch (error) {
          setModalState({
            isOpen: true,
            type: "error",
            title: "เกิดข้อผิดพลาด",
            message:
              error instanceof Error
                ? error.message
                : "ไม่สามารถเพิกถอนรหัสเชิญได้",
          });
        }
      },
    });
  };

  const handleRemoveMember = async (userId: string, username: string) => {
    setModalState({
      isOpen: true,
      type: "confirm",
      title: "ลบสมาชิก",
      message: `คุณแน่ใจหรือไม่ว่าต้องการลบ ${username} ออกจากกลุ่มนี้?`,
      onConfirm: async () => {
        try {
          await removeMember(userId);
          setModalState({
            isOpen: true,
            type: "success",
            title: "สำเร็จ",
            message: `ลบ ${username} ออกจากกลุ่มเรียบร้อยแล้ว`,
          });
        } catch (error) {
          setModalState({
            isOpen: true,
            type: "error",
            title: "เกิดข้อผิดพลาด",
            message:
              error instanceof Error ? error.message : "ไม่สามารถลบสมาชิกได้",
          });
        }
      },
    });
  };

  const copyInviteCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      setModalState({
        isOpen: true,
        type: "error",
        title: "เกิดข้อผิดพลาด",
        message: "ไม่สามารถคัดลอกรหัสเชิญได้",
      });
    }
  };

  return (
    <>
      <Modal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        onConfirm={modalState.onConfirm}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.type === "confirm" ? "ยืนยัน" : "ตกลง"}
        cancelText="ยกเลิก"
      />

      <div className="space-y-6">
        {/* Group Information */}
        <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">ข้อมูลกลุ่ม</h2>
            {isAdmin && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span className="text-sm">แก้ไข</span>
              </button>
            )}
          </div>

          {isEditing && isAdmin ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  ชื่อกลุ่ม
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/20 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  คำอธิบาย
                </label>
                <textarea
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/20 transition-colors resize-none"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">
                  URL โลโก้
                </label>
                <input
                  type="text"
                  value={groupLogoUrl}
                  onChange={(e) => setGroupLogoUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-white/20 transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleUpdateGroup}
                  disabled={groupLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold rounded-xl hover:opacity-90 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  บันทึก
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                >
                  <X className="w-4 h-4" />
                  ยกเลิก
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-start gap-4">
                {organization.logo_url ? (
                  <img
                    src={organization.logo_url}
                    alt={organization.name}
                    className="w-16 h-16 rounded-xl object-cover border border-white/10"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-white/10 border border-white/10 grid place-items-center text-xl font-semibold">
                    {organization.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-1">
                    {organization.name}
                  </h3>
                  <p className="text-white/70">
                    {organization.description || "ไม่มีคำอธิบาย"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Invite Codes - Admin Only */}
        {isAdmin && (
          <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4">รหัสเชิญ</h2>

            <div className="space-y-4">
              {/* Create New Invite */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="font-semibold mb-3 text-sm">
                  สร้างรหัสเชิญใหม่
                </h3>
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium text-white/70 mb-2">
                      หมดอายุใน (วัน)
                    </label>
                    <input
                      type="number"
                      value={inviteDays}
                      onChange={(e) => setInviteDays(Number(e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/20"
                      min="1"
                    />
                  </div>
                  <div className="flex-1 min-w-[150px]">
                    <label className="block text-xs font-medium text-white/70 mb-2">
                      จำนวนครั้งสูงสุด
                    </label>
                    <input
                      type="number"
                      value={maxUses || ""}
                      onChange={(e) =>
                        setMaxUses(
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      placeholder="ไม่จำกัด"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-white/20"
                      min="1"
                    />
                  </div>
                  <button
                    onClick={handleCreateInvite}
                    disabled={invitesLoading}
                    className="self-end flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
                  >
                    {invitesLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    สร้าง
                  </button>
                </div>
              </div>

              {/* Active Invites List */}
              <div>
                <h3 className="font-semibold mb-3 text-sm">
                  รหัสเชิญที่ใช้งานได้
                </h3>
                {invites.length === 0 ? (
                  <p className="text-white/60 text-sm text-center py-8">
                    ยังไม่มีรหัสเชิญ
                  </p>
                ) : (
                  <div className="space-y-2">
                    {invites.map((invite) => {
                      const isExpired =
                        new Date() > new Date(invite.expires_at);
                      const isMaxedOut =
                        invite.max_uses !== null &&
                        invite.current_uses >= invite.max_uses;
                      const isInactive =
                        !invite.is_active || isExpired || isMaxedOut;

                      return (
                        <div
                          key={invite.invite_code}
                          className={`flex items-center justify-between bg-white/5 border rounded-xl p-3 ${
                            isInactive
                              ? "border-white/5 opacity-60"
                              : "border-white/10"
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <code className="font-mono font-semibold text-sm">
                                {invite.invite_code}
                              </code>
                              {isInactive && (
                                <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">
                                  ไม่ใช้งาน
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-white/60">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(invite.expires_at).toLocaleDateString(
                                  "th-TH"
                                )}
                              </span>
                              <span className="flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                {invite.current_uses}/{invite.max_uses || "∞"}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {invite.is_active && !isExpired && !isMaxedOut && (
                              <button
                                onClick={() =>
                                  copyInviteCode(invite.invite_code)
                                }
                                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                                title="คัดลอก"
                              >
                                {copiedCode === invite.invite_code ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            )}
                            {invite.is_active && (
                              <button
                                onClick={() =>
                                  handleRevokeInvite(invite.invite_code)
                                }
                                disabled={invitesLoading}
                                className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                                title="เพิกถอน"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Members */}
        <div className="bg-neutral-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4">สมาชิก ({members.length})</h2>
          {membersLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-white/60" />
            </div>
          ) : (
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.user_id._id}
                  className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-3"
                >
                  <div className="flex items-center gap-3">
                    {member.user_id.profile_picture_url ? (
                      <img
                        src={member.user_id.profile_picture_url}
                        alt={member.user_id.username}
                        className="w-10 h-10 rounded-xl object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 grid place-items-center">
                        <User className="w-5 h-5" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm">
                        {member.user_id.username}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <span>@{member.user_id.handle}</span>
                        <span>•</span>
                        <span
                          className={`flex items-center gap-1 ${
                            member.role === "admin" ? "text-white/90" : ""
                          }`}
                        >
                          {member.role === "admin" && (
                            <Shield className="w-3 h-3" />
                          )}
                          {member.role === "admin" ? "ผู้ดูแล" : "สมาชิก"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isAdmin && member.user_id._id !== currentUserId && (
                    <button
                      onClick={() =>
                        handleRemoveMember(
                          member.user_id._id,
                          member.user_id.username
                        )
                      }
                      disabled={membersLoading}
                      className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                      title="ลบสมาชิก"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leave Group */}
        <div className="bg-neutral-900/60 backdrop-blur-xl border border-red-500/20 rounded-2xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xl font-bold text-red-400 mb-1">
                โซนอันตราย
              </h2>
              <p className="text-sm text-white/70">
                {isAdmin
                  ? "หมายเหตุ: คุณไม่สามารถออกจากกลุ่มได้หากคุณเป็นผู้ดูแลคนเดียว"
                  : "คุณสามารถเข้าร่วมอีกครั้งภายหลังด้วยรหัสเชิญ"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLeaveGroup}
            disabled={groupLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold rounded-xl transition-colors disabled:opacity-50 border border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            ออกจากกลุ่ม
          </button>
        </div>
      </div>
    </>
  );
}
