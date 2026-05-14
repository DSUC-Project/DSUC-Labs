import toast from "react-hot-toast";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check, X, ScanLine, ArrowRight, Zap, Upload } from "lucide-react";
import { useStore } from "../store/useStore";
import { FinanceRequest, Member } from "../types";
import { BANKS } from "../data/mockData";
import { ModalShell } from "@/components/ui/ModalShell";
import { Card, ActionCard } from "@/components/ui/Cards";
import { SoftBrutalCard } from "@/components/ui/Primitives";

export function Finance() {
  const [activeTab, setActiveTab] = useState<
    "submit" | "pending" | "history" | "direct"
  >("submit");
  const {
    financeRequests,
    financeHistory,
    fetchPendingRequests,
    fetchFinanceHistory,
    fetchMembers,
    currentUser,
  } = useStore();
  const isOfficialMember = currentUser?.memberType === "member";
  const canModerateFinance =
    isOfficialMember &&
    ["President", "Vice-President"].includes(currentUser?.role || "");
  const visibleTabs = canModerateFinance
    ? ["submit", "direct", "pending", "history"]
    : ["submit", "direct", "history"];
  const tabLabels: Record<string, string> = {
    submit: "Yêu cầu",
    direct: "Chuyển khoản",
    pending: "Chờ duyệt",
    history: "Lịch sử",
  };

  // Fetch members on mount (needed for bank info lookup in ApprovalModal)
  useEffect(() => {
    if (isOfficialMember) {
      fetchMembers();
    }
  }, [isOfficialMember, fetchMembers]);

  // Fetch pending requests when tab changes to pending (for admin)
  useEffect(() => {
    if (activeTab === "pending" && canModerateFinance) {
      fetchPendingRequests();
    }
  }, [activeTab, canModerateFinance, fetchPendingRequests]);

  // Fetch finance history when tab changes to history
  useEffect(() => {
    if (activeTab === "history" && isOfficialMember) {
      fetchFinanceHistory();
    }
  }, [activeTab, isOfficialMember, fetchFinanceHistory]);

  useEffect(() => {
    if (activeTab === "pending" && !canModerateFinance) {
      setActiveTab("submit");
    }
  }, [activeTab, canModerateFinance]);

  if (!currentUser || !isOfficialMember) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 pt-10">
        <SoftBrutalCard intent="locked" className="flex min-h-[500px] flex-col items-center justify-center space-y-6 bg-surface px-8 py-12 text-center text-text-muted">
          <div className="flex h-20 w-20 items-center justify-center bg-main-bg  text-text-muted text-4xl shadow-sm">
            🔒
          </div>
          <h2 className="font-heading text-3xl font-black uppercase tracking-tight text-text-main">
            Finance chỉ dành cho member
          </h2>
          <p className="max-w-md bg-main-bg px-4 py-3 text-sm font-bold uppercase tracking-widest text-text-main shadow-sm">
            Hãy đăng nhập bằng tài khoản DSUC member để truy cập module Finance.
          </p>
          <div className="max-w-lg text-xs font-mono uppercase tracking-widest">
            Tài khoản community không có quyền truy cập khu vực này.
          </div>
        </SoftBrutalCard>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-20 pt-10 px-4 sm:px-6">
      <div className="flex flex-col items-start justify-between gap-6 pb-6 md:flex-row md:items-end">
        <div>
          <h2 className="mb-3 text-4xl font-heading font-black uppercase tracking-tighter text-text-main">
            Finance
          </h2>
          <p className="border-l-4 border-primary pl-4 text-sm font-bold text-text-main">
            Tạo yêu cầu thanh toán, chuyển khoản trực tiếp và theo dõi lịch sử
            giao dịch.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {visibleTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex items-center gap-2 border border-border-main px-4 py-3 text-xs font-mono font-bold uppercase tracking-widest transition-all ${activeTab === tab ? "bg-primary text-main-bg shadow-sm" : "bg-surface text-text-muted hover:bg-main-bg hover:text-text-main shadow-sm"}`}
            >
              {tab === "direct" && (
                <Zap
                  size={14}
                  className={
                    activeTab === tab ? "text-main-bg" : "text-primary"
                  }
                />
              )}
              {tabLabels[tab] || tab}
              {tab === "pending" && financeRequests.length > 0 && (
                <span className="ml-1 border border-border-main bg-highlight text-main-bg px-1.5 py-0.5 text-[10px] font-bold shadow-sm">
                  {financeRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[500px]">
        {activeTab === "submit" && (
          <SubmitRequestForm onSubmitted={() => setActiveTab("pending")} />
        )}
        {activeTab === "direct" && <DirectTransferTool />}
        {activeTab === "pending" && <PendingRequestsList />}
        {activeTab === "history" && <HistoryList />}
      </div>
    </div>
  );
}

function SubmitRequestForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { submitFinanceRequest, currentUser } = useStore();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");
  const [billImage, setBillImage] = useState<string | null>(null);
  const [billFile, setBillFile] = useState<File | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Convert to base64 for preview and submission
      const reader = new FileReader();
      reader.onloadend = () => {
        setBillImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      setBillFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast("Vui lòng đăng nhập trước.");
      return;
    }

    try {
      await submitFinanceRequest({
        id: Math.random().toString(),
        amount,
        reason,
        date,
        billImage,
        status: "pending",
        requesterName: currentUser.name || "Unknown",
        requesterId: currentUser.id,
      });

      // Reset form
      setAmount("");
      setReason("");
      setDate("");
      setBillImage(null);
      setBillFile(null);

      onSubmitted();
    } catch (err) {
      toast("Không thể gửi yêu cầu thanh toán. Vui lòng thử lại.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px]"
    >
      <div className="space-y-6">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 bg-main-bg border border-border-main px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-primary shadow-sm">
            <Zap size={14} />
            Yêu cầu thanh toán
          </div>
          <h3 className="font-heading text-3xl font-black uppercase tracking-tight text-text-main">
            Gửi yêu cầu thanh toán
          </h3>
          <p className="mt-4 border-l-4 border-primary pl-4 text-sm font-bold text-text-main">
            Tạo request hoàn tiền cho chi phí hoạt động của câu lạc bộ. Hóa đơn
            là bắt buộc để lưu hồ sơ.
          </p>
        </div>
        <Card className="space-y-6 p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted">
                Amount (VND)
              </label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                required
                className="w-full border border-border-main bg-main-bg p-4 font-mono text-xl font-bold text-text-main outline-none transition-colors focus:border-primary shadow-sm"
                placeholder="500000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted">
                Target Date
              </label>
              <input
                value={date}
                onChange={(e) => setDate(e.target.value)}
                type="date"
                required
                className="w-full border border-border-main bg-main-bg p-4 font-mono text-sm font-bold text-text-main outline-none transition-colors focus:border-primary shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted">
                Justification
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                rows={4}
                className="w-full border border-border-main bg-main-bg p-4 text-sm font-bold text-text-main outline-none transition-colors focus:border-primary resize-none shadow-sm"
                placeholder="Mô tả lý do chi tiêu..."
              />
            </div>

            {/* Bill/Receipt Upload */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted">
                Bill / Receipt
              </label>
              <div className="relative border border-border-main bg-main-bg transition-colors hover:border-primary cursor-pointer group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  required
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                {billImage ? (
                  <div className="p-4 flex flex-col items-center">
                    <img
                      src={billImage}
                      alt="Bill preview"
                      className="mb-4 max-h-40 w-auto border border-border-main object-contain bg-white shadow-sm"
                    />
                    <div className="flex items-center justify-center gap-2 font-mono text-xs font-bold text-primary bg-surface py-1.5 px-3 border border-border-main">
                      <Check size={14} /> {billFile?.name}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center flex flex-col items-center">
                    <Upload
                      size={32}
                      className="mb-4 text-primary group-hover:scale-110 transition-transform"
                    />
                    <div className="mb-2 font-mono text-xs font-bold text-text-main uppercase tracking-widest">
                      Click để tải hóa đơn
                    </div>
                    <div className="font-mono text-[10px] font-bold text-text-muted uppercase">
                      PNG, JPG tối đa 10MB
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full border border-border-main bg-primary text-main-bg py-4 font-mono text-sm font-bold uppercase tracking-widest transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#1a1b26] border-solid focus:outline-none"
            >
              Gửi yêu cầu
            </button>
          </form>
        </Card>
      </div>
      <Card className="hidden h-full p-8 lg:flex lg:flex-col lg:justify-between bg-main-bg shadow-sm">
        <div className="inline-flex w-fit items-center gap-2 bg-surface px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-text-main border border-border-main shadow-sm">
          <ScanLine size={14} className="text-primary" />
          Kênh tài chính
        </div>
        <div className="mt-8">
          <h4 className="font-heading text-3xl font-black uppercase tracking-tight text-text-main">
            Minh bạch từng khoản chi
          </h4>
          <p className="mt-4 border-l-4 border-primary pl-4 text-sm font-bold text-text-muted">
            Mọi request, phê duyệt và lịch sử thanh toán đều được gom tại đây để
            President và Vice-President quản lý tập trung.
          </p>
        </div>
      </Card>
    </motion.div>
  );
}

function DirectTransferTool() {
  const { members } = useStore();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [amount, setAmount] = useState("");
  const [content, setContent] = useState("");
  const [billFile, setBillFile] = useState<File | null>(null);
  const [showQR, setShowQR] = useState(false);

  // Filter members who have bank info
  const eligibleMembers = members.filter(
    (m) =>
      m.memberType !== "community" &&
      m.member_type !== "community" &&
      (m.bankInfo || m.bank_info),
  );

  // Get normalized bank info - support both camelCase and snake_case
  const getBankInfo = (member: Member) => {
    const info = member.bankInfo || member.bank_info;
    if (!info) return null;

    // Normalize to camelCase
    return {
      bankId: info.bankId || (info as any).bank_id,
      accountNo: info.accountNo || (info as any).account_no,
      accountName: info.accountName || (info as any).account_name,
    };
  };

  const bankInfo = selectedMember ? getBankInfo(selectedMember) : null;
  const qrUrl = bankInfo
    ? `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}`
    : "";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Member Selection */}
      <div className="space-y-6">
        <h3 className="flex items-center gap-2 font-heading text-2xl font-black uppercase tracking-widest text-text-main mb-6">
          <Zap size={20} className="text-primary" /> QUICK TRANSFER LINK
        </h3>

        {!selectedMember ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 pb-4">
            {eligibleMembers.map((member) => {
              const memberBankInfo = getBankInfo(member);
              return (
                <SoftBrutalCard
                  intent="accent"
                  interactive
                  key={member.id}
                  className="p-4 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer h-full border border-border-main"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedMember(member)}
                    className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <div className="flex items-center gap-4 mb-3">
                      <div className="h-10 w-10 flex-shrink-0 overflow-hidden border border-border-main bg-main-bg">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-heading text-lg font-bold text-text-main truncate group-hover:text-accent transition-colors">
                          {member.name}
                        </div>
                        <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-text-muted truncate">
                          {member.role}
                        </div>
                      </div>
                    </div>
                    {memberBankInfo && (
                      <div className="pl-14 space-y-1 pt-2 ">
                        <div className="text-[9px] font-mono font-bold text-accent">
                          {BANKS.find((b) => b.id === memberBankInfo.bankId)
                            ?.shortName || memberBankInfo.bankId}
                        </div>
                        {memberBankInfo.accountName && (
                          <div className="text-[9px] font-mono text-text-muted truncate">
                            {memberBankInfo.accountName}
                          </div>
                        )}
                        <div className="text-[9px] font-mono text-text-main font-bold">
                          {memberBankInfo.accountNo}
                        </div>
                      </div>
                    )}
                  </button>
                </SoftBrutalCard>
              );
            })}
            {eligibleMembers.length === 0 && (
              <Card className="col-span-1 md:col-span-2 py-10 text-center text-sm font-mono font-bold uppercase tracking-widest text-text-muted">
                Không tìm thấy member có dữ liệu ngân hàng
              </Card>
            )}
          </div>
        ) : (
          <Card className="space-y-6 p-6 shadow-sm">
            <div className="flex items-center justify-between  pb-4 border-t-0 border-x-0">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 overflow-hidden border border-border-main bg-main-bg shadow-sm">
                  <img
                    src={selectedMember.avatar}
                    alt={selectedMember.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-heading text-lg font-black text-text-main leading-tight">
                    {selectedMember.name}
                  </div>
                  <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary mt-1">
                    Đã chọn người nhận
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedMember(null);
                  setShowQR(false);
                }}
                className="p-2 text-text-muted transition-colors hover:text-text-main hover:bg-main-bg border border-border-main"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted">
                  Amount
                </label>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  className="w-full border border-border-main bg-main-bg p-3 font-mono font-bold text-text-main outline-none transition-colors focus:border-primary shadow-sm"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted">
                  Message
                </label>
                <input
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  type="text"
                  className="w-full border border-border-main bg-main-bg p-3 font-mono text-sm font-bold text-text-main outline-none transition-colors focus:border-primary shadow-sm"
                  placeholder="Payment for..."
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted">
                  Proof of Bill
                </label>
                <div className="relative border border-border-main bg-main-bg p-4 text-center transition-colors hover:border-primary cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBillFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {billFile ? (
                    <div className="flex items-center justify-center gap-2 font-mono text-xs font-bold text-primary">
                      <Check size={14} /> {billFile.name}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 font-mono text-xs font-bold text-text-muted uppercase tracking-widest">
                      <Upload size={14} /> Tải ảnh hóa đơn
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowQR(true)}
                disabled={!amount}
                className="w-full border border-border-main bg-primary text-main-bg py-3 font-mono text-sm font-bold uppercase tracking-widest transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#1a1b26] disabled:cursor-not-allowed disabled:opacity-50 mt-4"
              >
                Tạo mã QR
              </button>
            </div>
          </Card>
        )}
      </div>

      {/* Right: QR Display */}
      <Card className="relative flex flex-col items-center justify-center bg-surface shadow-sm min-h-[460px] p-8">
        {showQR && selectedMember && bankInfo ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex h-full w-full flex-col items-center justify-center text-center"
          >
            <div className="border-[8px] border-border-main bg-white p-2 mb-6 shadow-sm">
              <img
                src={qrUrl}
                alt="VietQR"
                className="max-w-[250px] mix-blend-multiply"
              />
            </div>

            <div className="bg-primary text-main-bg px-4 py-2 text-xs font-mono font-bold uppercase tracking-widest border border-border-main shadow-sm mb-4">
              Scan to Pay {selectedMember.name}
            </div>

            <div className="bg-main-bg p-4 border border-border-main text-center w-full max-w-[280px]">
              <div className="font-mono text-[10px] font-bold text-text-muted uppercase mb-1">
                Bank:{" "}
                <span className="text-primary">
                  {BANKS.find((b) => b.id === bankInfo.bankId)?.shortName ||
                    bankInfo.bankId}
                </span>
              </div>
              {bankInfo.accountName && (
                <div className="font-mono text-xs text-text-main font-bold mb-1">
                  {bankInfo.accountName}
                </div>
              )}
              <div className="font-mono text-[10px] text-text-muted">
                {bankInfo.accountNo}
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="text-center opacity-40">
            <ScanLine size={80} className="mx-auto mb-4 text-text-main" />
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-text-main">
              QR generator idle
            </p>
            <p className="font-mono text-[10px] text-text-muted mt-2 max-w-[200px] mx-auto">
              Chọn người nhận và nhập số tiền để tạo mã QR thanh toán nhanh.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

function PendingRequestsList() {
  const { financeRequests, approveFinanceRequest, rejectFinanceRequest } =
    useStore();
  const [selectedReq, setSelectedReq] = useState<FinanceRequest | null>(null);

  if (financeRequests.length === 0) {
    return (
      <Card className="flex h-64 items-center justify-center bg-surface text-sm font-mono font-bold uppercase tracking-widest text-text-muted shadow-sm">
        Không có yêu cầu chờ duyệt
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {financeRequests.map((req) => (
        <ActionCard
          key={req.id}
          onClick={() => setSelectedReq(req)}
          className="flex items-center justify-between p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md cursor-pointer group"
        >
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-primary text-main-bg px-2 py-1 text-sm font-mono font-bold border border-border-main truncate max-w-[120px]">
                {parseInt(req.amount).toLocaleString()} VND
              </span>
              <span className="border border-border-main bg-main-bg px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-widest text-text-muted">
                {req.date}
              </span>
            </div>
            <p className="font-heading font-black text-lg text-text-main transition-colors group-hover:text-primary leading-tight truncate my-3">
              {req.reason}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-text-muted">
                From:
              </span>
              <span className="text-xs font-bold text-text-main">
                {req.requesterName}
              </span>
            </div>
          </div>

          <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 border border-border-main bg-main-bg text-text-main group-hover:bg-primary group-hover:text-main-bg transition-colors">
            <ArrowRight size={16} />
          </div>
        </ActionCard>
      ))}

      {/* Approval Modal */}
      {selectedReq && (
        <ApprovalModal
          request={selectedReq}
          onClose={() => setSelectedReq(null)}
          onApprove={() => {
            approveFinanceRequest(selectedReq.id);
            setSelectedReq(null);
          }}
          onReject={() => {
            rejectFinanceRequest(selectedReq.id);
            setSelectedReq(null);
          }}
        />
      )}
    </div>
  );
}

function ApprovalModal({
  request,
  onClose,
  onApprove,
  onReject,
}: {
  request: FinanceRequest;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { members } = useStore();
  const [showQR, setShowQR] = useState(false);

  // Find requester to get their bank info
  const requester = members.find((m) => m.id === request.requesterId);

  // Get normalized bank info - handle both camelCase and snake_case
  const rawBankInfo = requester
    ? requester.bankInfo || (requester as any).bank_info
    : null;

  const requesterBankInfo = rawBankInfo
    ? {
        bankId: rawBankInfo.bankId || (rawBankInfo as any).bank_id,
        accountNo: rawBankInfo.accountNo || (rawBankInfo as any).account_no,
        accountName:
          rawBankInfo.accountName || (rawBankInfo as any).account_name,
      }
    : null;

  // Default Club Account if requester has no bank info
  const DEFAULT_ACCOUNT_NO = "0356616096";
  const DEFAULT_BANK_ID = "970422"; // MB Bank
  const DEFAULT_NAME = "DUT SUPERTEAM";

  const bankId = requesterBankInfo?.bankId || DEFAULT_BANK_ID;
  const accountNo = requesterBankInfo?.accountNo || DEFAULT_ACCOUNT_NO;
  const accountName =
    requesterBankInfo?.accountName ||
    (requester ? requester.name : DEFAULT_NAME);
  const bankName =
    BANKS.find((b) => b.id === bankId)?.shortName || "Unknown Bank";

  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${request.amount}&addInfo=${encodeURIComponent(request.reason)}&accountName=${encodeURIComponent(accountName)}`;

  return (
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title="Xét duyệt yêu cầu"
      label="FINANCE ADMIN"
    >
      <div className="flex flex-col gap-8">
        {/* Top: Details */}
        <div className="flex flex-col h-full">
          <div className="space-y-4 font-mono text-xs">
            <div className="flex justify-between border-b border-border-main pb-2">
              <span className="uppercase tracking-widest text-text-muted font-bold">
                Số tiền
              </span>
              <span className="text-base font-bold text-text-main">
                {parseInt(request.amount).toLocaleString()} VND
              </span>
            </div>
            <div className="flex justify-between border-b border-border-main pb-2">
              <span className="uppercase tracking-widest text-text-muted font-bold">
                Người gửi
              </span>
              <span className="text-text-main font-bold">
                {request.requesterName}
              </span>
            </div>
            <div className="flex justify-between border-b border-border-main pb-2">
              <span className="uppercase tracking-widest text-text-muted font-bold">
                Ngân hàng
              </span>
              <span className="text-primary font-bold">{bankName}</span>
            </div>
            <div className="flex justify-between border-b border-border-main pb-2">
              <span className="uppercase tracking-widest text-text-muted font-bold">
                Số tài khoản
              </span>
              <span className="text-text-main font-bold">{accountNo}</span>
            </div>
            <div className="pt-2 flex-grow">
              <span className="mb-2 block uppercase tracking-widest text-text-muted font-bold">
                Lý do
              </span>
              <p className="border border-border-main bg-main-bg p-4 text-sm text-text-main font-sans leading-relaxed">
                {request.reason}
              </p>
            </div>
          </div>

          {!showQR && (
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button
                onClick={onReject}
                className="border border-border-main bg-surface text-text-main py-3 font-mono text-sm font-bold uppercase tracking-widest transition-all hover:-translate-y-1 hover:shadow-sm"
              >
                Từ chối
              </button>
              <button
                onClick={() => setShowQR(true)}
                className="border border-border-main bg-primary text-main-bg py-3 font-mono text-sm font-bold uppercase tracking-widest transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#1a1b26] border-solid focus:outline-none"
              >
                Chuyển khoản
              </button>
            </div>
          )}
        </div>

        {/* Bottom: QR Area */}
        <AnimatePresence>
          {showQR && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="relative flex flex-col items-center justify-center p-6 border border-border-main bg-main-bg"
            >
              <div className="flex flex-col items-center w-full">
                <div className="border-[4px] border-border-main bg-white p-2 mb-6">
                  <img
                    src={qrUrl}
                    className="w-full max-w-[200px] mix-blend-multiply"
                    alt="VietQR"
                  />
                </div>
                <button
                  onClick={onApprove}
                  className="w-full border border-border-main bg-highlight text-main-bg py-3 font-mono text-xs font-bold uppercase tracking-widest transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#1a1b26]"
                >
                  Xác nhận đã chuyển
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ModalShell>
  );
}

function HistoryList() {
  const { financeHistory } = useStore();

  return (
    <Card className="p-0 overflow-hidden shadow-sm">
      <div className="bg-surface p-6 border-b border-border-main">
        <div className="inline-flex items-center gap-2 bg-main-bg border border-border-main px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest text-text-main mb-3">
          <Zap size={12} className="text-primary" /> Public Ledger
        </div>
        <p className="text-sm font-mono text-text-muted">
          Tất cả giao dịch đã duyệt hoặc từ chối đều được lưu ở đây để đảm bảo
          minh bạch.
        </p>
      </div>

      <div className="overflow-x-auto w-full">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-4 px-6 py-4 border-b border-border-main text-[10px] font-mono font-bold uppercase tracking-widest text-text-muted bg-main-bg">
            <span>Status</span>
            <span>Amount</span>
            <span>Reason</span>
            <span className="text-right">Date</span>
          </div>

          <div className="divide-y divide-dashed divide-border-main">
            {financeHistory.map((req) => (
              <div
                key={req.id}
                className="grid grid-cols-4 items-center px-6 py-4 text-sm font-mono bg-surface hover:bg-main-bg transition-colors"
              >
                <div>
                  {req.status === "completed" ? (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-highlight/20 border border-border-main text-highlight text-[10px] font-bold uppercase tracking-widest">
                      <Check size={12} /> Paid
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-border-main text-red-500 text-[10px] font-bold uppercase tracking-widest">
                      <X size={12} /> Rejected
                    </span>
                  )}
                </div>
                <div className="font-bold text-text-main">
                  {parseInt(req.amount).toLocaleString()} ₫
                </div>
                <div
                  className="truncate pr-4 text-text-muted"
                  title={req.reason}
                >
                  {req.reason}
                </div>
                <div className="text-right text-text-muted text-xs">
                  {req.date}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {financeHistory.length === 0 && (
        <div className="py-16 text-center bg-surface">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-text-muted">
            Chưa có giao dịch lưu trữ
          </span>
        </div>
      )}
    </Card>
  );
}
