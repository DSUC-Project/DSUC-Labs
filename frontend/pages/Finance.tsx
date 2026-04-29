
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion } from 'framer-motion';
import { Check, X, ScanLine, ArrowRight, Zap, Upload } from 'lucide-react';
import { useStore } from '../store/useStore';
import { FinanceRequest, Member } from '../types';
import { BANKS } from '../data/mockData';

export function Finance() {
  const [activeTab, setActiveTab] = useState<'submit' | 'pending' | 'history' | 'direct'>('submit');
  const { financeRequests, financeHistory, fetchPendingRequests, fetchFinanceHistory, fetchMembers, currentUser } = useStore();
  const isOfficialMember = currentUser?.memberType === 'member';
  const canModerateFinance =
    isOfficialMember &&
    ['President', 'Vice-President'].includes(currentUser?.role || '');
  const visibleTabs = canModerateFinance
    ? ['submit', 'direct', 'pending', 'history']
    : ['submit', 'direct', 'history'];
  const tabLabels: Record<string, string> = {
    submit: 'Yêu cầu',
    direct: 'Chuyển khoản',
    pending: 'Chờ duyệt',
    history: 'Lịch sử',
  };

  // Fetch members on mount (needed for bank info lookup in ApprovalModal)
  useEffect(() => {
    if (isOfficialMember) {
      fetchMembers();
    }
  }, [isOfficialMember, fetchMembers]);

  // Fetch pending requests when tab changes to pending (for admin)
  useEffect(() => {
    if (activeTab === 'pending' && canModerateFinance) {
      fetchPendingRequests();
    }
  }, [activeTab, canModerateFinance, fetchPendingRequests]);

  // Fetch finance history when tab changes to history
  useEffect(() => {
    if (activeTab === 'history' && isOfficialMember) {
      fetchFinanceHistory();
    }
  }, [activeTab, isOfficialMember, fetchFinanceHistory]);

  useEffect(() => {
    if (activeTab === 'pending' && !canModerateFinance) {
      setActiveTab('submit');
    }
  }, [activeTab, canModerateFinance]);

  if (!currentUser || !isOfficialMember) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 pt-10">
        <div className="flex min-h-[500px] flex-col items-center justify-center space-y-6 border-4 border-brutal-black bg-white px-8 py-12 text-center shadow-neo">
          <div className="flex h-20 w-20 items-center justify-center border-4 border-brutal-black bg-brutal-yellow text-4xl shadow-neo-sm">🔒</div>
          <h2 className="font-display text-3xl font-black uppercase tracking-tight text-brutal-black">Finance chỉ dành cho member</h2>
          <p className="max-w-md border-4 border-brutal-black bg-brutal-pink px-4 py-3 text-sm font-black uppercase tracking-widest text-brutal-black shadow-neo-sm">
            Hãy đăng nhập bằng tài khoản DSUC member để truy cập module Finance.
          </p>
          <div className="max-w-lg text-xs font-bold uppercase tracking-widest text-gray-500">
            Tài khoản community không có quyền truy cập khu vực này.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-20 pt-10 px-4 sm:px-6">
      <div className="flex flex-col items-start justify-between gap-6 border-b-4 border-brutal-black pb-6 md:flex-row md:items-end">
        <div>
          <h2 className="mb-3 text-4xl font-display font-black uppercase tracking-tighter text-brutal-black decoration-brutal-yellow decoration-4 underline underline-offset-4">Finance</h2>
          <p className="border-l-4 border-brutal-blue pl-4 text-sm font-bold text-brutal-black">Tạo yêu cầu thanh toán, chuyển khoản trực tiếp và theo dõi lịch sử giao dịch.</p>
        </div>
        <div className="flex flex-wrap gap-2 border-4 border-brutal-black bg-white p-2 shadow-neo-sm">
          {visibleTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex items-center gap-2 border-4 px-4 py-3 text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'border-brutal-black bg-brutal-yellow text-brutal-black shadow-neo-sm' : 'border-transparent bg-white text-gray-500 hover:border-brutal-black hover:bg-brutal-pink hover:text-brutal-black'}`}
            >
              {tab === 'direct' && <Zap size={14} />}
              {tabLabels[tab] || tab}
              {tab === 'pending' && financeRequests.length > 0 && (
                <span className="ml-1 border-2 border-brutal-black bg-brutal-blue px-1.5 py-0.5 text-[10px] font-black text-white shadow-neo-sm">{financeRequests.length}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'submit' && <SubmitRequestForm onSubmitted={() => setActiveTab('pending')} />}
        {activeTab === 'direct' && <DirectTransferTool />}
        {activeTab === 'pending' && <PendingRequestsList />}
        {activeTab === 'history' && <HistoryList />}
      </div>
    </div>
  );
}

function SubmitRequestForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { submitFinanceRequest, currentUser } = useStore();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');
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
      alert('Vui lòng đăng nhập trước.');
      return;
    }

    try {
      await submitFinanceRequest({
        id: Math.random().toString(),
        amount,
        reason,
        date,
        billImage,
        status: 'pending',
        requesterName: currentUser.name || 'Unknown',
        requesterId: currentUser.id
      });

      // Reset form
      setAmount('');
      setReason('');
      setDate('');
      setBillImage(null);
      setBillFile(null);

      onSubmitted();
    } catch (err) {
      alert('Không thể gửi yêu cầu thanh toán. Vui lòng thử lại.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-6">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 border-4 border-brutal-black bg-brutal-blue px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-neo-sm">
            <Zap size={14} />
            Yêu cầu thanh toán
          </div>
          <h3 className="font-display text-3xl font-black uppercase tracking-tight text-brutal-black">Gửi yêu cầu thanh toán</h3>
          <p className="mt-4 border-l-4 border-brutal-pink pl-4 text-sm font-bold text-brutal-black">Tạo request hoàn tiền cho chi phí hoạt động của câu lạc bộ. Hóa đơn là bắt buộc để lưu hồ sơ.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6 border-4 border-brutal-black bg-white p-6 shadow-neo">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-brutal-black">Amount (VND)</label>
            <input value={amount} onChange={e => setAmount(e.target.value)} type="number" required className="w-full border-4 border-brutal-black bg-white p-4 font-mono text-xl font-bold text-brutal-black outline-none transition-colors focus:bg-brutal-yellow/20" placeholder="500000" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-brutal-black">Target Date</label>
            <input value={date} onChange={e => setDate(e.target.value)} type="date" required className="w-full border-4 border-brutal-black bg-white p-4 font-mono text-sm font-bold text-brutal-black outline-none transition-colors focus:bg-brutal-yellow/20" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-brutal-black">Justification</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} required rows={4} className="w-full border-4 border-brutal-black bg-white p-4 text-sm font-bold text-brutal-black outline-none transition-colors focus:bg-brutal-yellow/20" placeholder="Mô tả lý do chi tiêu..." />
          </div>

          {/* Bill/Receipt Upload */}
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-brutal-black">Bill / Receipt</label>
            <div className="relative border-4 border-dashed border-brutal-black bg-brutal-bg transition-colors hover:bg-brutal-yellow/20">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                required
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {billImage ? (
                <div className="p-4">
                  <img src={billImage} alt="Bill preview" className="mb-2 max-h-40 w-full border-4 border-brutal-black object-contain bg-white" />
                  <div className="flex items-center justify-center gap-2 font-mono text-xs font-bold text-brutal-blue">
                    <Check size={14} /> {billFile?.name}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Upload size={32} className="mx-auto mb-2 text-brutal-blue" />
                  <div className="mb-1 font-mono text-xs font-bold text-brutal-black">Click để tải hóa đơn</div>
                  <div className="font-mono text-[10px] font-bold text-gray-500">PNG, JPG tối đa 10MB</div>
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="w-full border-4 border-brutal-black bg-brutal-yellow py-4 text-sm font-black uppercase tracking-widest text-brutal-black transition-all hover:-translate-y-1 hover:bg-brutal-blue hover:text-white hover:shadow-neo">
            Gửi yêu cầu
          </button>
        </form>
      </div>
      <div className="hidden h-full border-4 border-brutal-black bg-brutal-yellow p-8 shadow-neo lg:flex lg:flex-col lg:justify-between">
        <div className="inline-flex w-fit items-center gap-2 border-4 border-brutal-black bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-brutal-black shadow-neo-sm">
          <ScanLine size={14} />
          Kênh tài chính
        </div>
        <div>
          <h4 className="font-display text-3xl font-black uppercase tracking-tight text-brutal-black">Minh bạch từng khoản chi</h4>
          <p className="mt-4 border-4 border-brutal-black bg-white px-4 py-3 text-sm font-bold text-brutal-black shadow-neo-sm">
            Mọi request, phê duyệt và lịch sử thanh toán đều được gom tại đây để President và Vice-President quản lý tập trung.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function DirectTransferTool() {
  const { members } = useStore();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [amount, setAmount] = useState('');
  const [content, setContent] = useState('');
  const [billFile, setBillFile] = useState<File | null>(null);
  const [showQR, setShowQR] = useState(false);

  // Filter members who have bank info
  const eligibleMembers = members.filter(
    (m) => (m.memberType !== 'community' && m.member_type !== 'community') && (m.bankInfo || m.bank_info)
  );

  // Get normalized bank info - support both camelCase and snake_case
  const getBankInfo = (member: Member) => {
    const info = member.bankInfo || member.bank_info;
    if (!info) return null;

    // Normalize to camelCase
    return {
      bankId: info.bankId || (info as any).bank_id,
      accountNo: info.accountNo || (info as any).account_no,
      accountName: info.accountName || (info as any).account_name
    };
  };

  const bankInfo = selectedMember ? getBankInfo(selectedMember) : null;
  const qrUrl = bankInfo
    ? `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}`
    : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Member Selection */}
      <div className="space-y-6">
        <h3 className="flex items-center gap-2 font-display text-2xl font-black uppercase tracking-widest text-brutal-black">
          <Zap size={20} /> QUICK TRANSFER LINK
        </h3>
        <p className="border-l-4 border-brutal-blue pl-4 text-sm font-bold text-brutal-black">Chọn member để tạo QR chuyển khoản nhanh và lưu lại ảnh chụp hóa đơn.</p>

        {!selectedMember ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
            {eligibleMembers.map(member => {
              const memberBankInfo = getBankInfo(member);
              return (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className="flex flex-col gap-2 border-4 border-brutal-black bg-white p-4 text-left shadow-neo-sm transition-all hover:-translate-y-1 hover:bg-brutal-yellow/20 hover:shadow-neo"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 overflow-hidden border-4 border-brutal-black bg-brutal-yellow shadow-neo-sm">
                      <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="font-display text-lg font-black text-brutal-black">{member.name}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">{member.role}</div>
                    </div>
                  </div>
                  {memberBankInfo && (
                    <div className="pl-14 space-y-1">
                      <div className="text-[9px] font-mono font-bold text-brutal-blue">
                        {BANKS.find(b => b.id === memberBankInfo.bankId)?.shortName || memberBankInfo.bankId}
                      </div>
                      {memberBankInfo.accountName && (
                        <div className="text-[9px] font-mono text-gray-500">
                          {memberBankInfo.accountName}
                        </div>
                      )}
                      <div className="text-[9px] font-mono text-gray-500">
                        {memberBankInfo.accountNo}
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
            {eligibleMembers.length === 0 && (
              <div className="col-span-2 border-4 border-brutal-black bg-white py-10 text-center text-sm font-black uppercase tracking-widest text-gray-500 shadow-neo">Không tìm thấy member có dữ liệu ngân hàng</div>
            )}
          </div>
        ) : (
          <div className="space-y-6 border-4 border-brutal-black bg-white p-6 shadow-neo">
            <div className="flex items-center justify-between border-b-4 border-brutal-black pb-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 overflow-hidden border-4 border-brutal-black bg-brutal-yellow shadow-neo-sm">
                  <img src={selectedMember.avatar} alt={selectedMember.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="font-display text-lg font-black text-brutal-black">{selectedMember.name}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-brutal-blue">Đã chọn người nhận</div>
                </div>
              </div>
              <button onClick={() => { setSelectedMember(null); setShowQR(false); }} className="border-2 border-transparent p-2 text-brutal-black transition-colors hover:border-brutal-black hover:bg-brutal-yellow"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-brutal-black">Amount</label>
                <input value={amount} onChange={e => setAmount(e.target.value)} type="number" className="w-full border-4 border-brutal-black bg-white p-3 font-mono font-bold text-brutal-black outline-none transition-colors focus:bg-brutal-yellow/20" placeholder="0" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-brutal-black">Message</label>
                <input value={content} onChange={e => setContent(e.target.value)} type="text" className="w-full border-4 border-brutal-black bg-white p-3 font-bold text-brutal-black outline-none transition-colors focus:bg-brutal-yellow/20" placeholder="Payment for..." />
              </div>

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-brutal-black">Proof of Bill</label>
                <div className="relative border-4 border-dashed border-brutal-black bg-brutal-bg p-4 text-center transition-colors hover:bg-brutal-yellow/20">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setBillFile(e.target.files?.[0] || null)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {billFile ? (
                    <div className="flex items-center justify-center gap-2 font-mono text-xs font-bold text-brutal-blue">
                      <Check size={14} /> {billFile.name}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 font-mono text-xs font-bold text-gray-500">
                      <Upload size={14} /> Tải ảnh hóa đơn
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={() => setShowQR(true)}
                disabled={!amount}
                className="w-full border-4 border-brutal-black bg-brutal-blue py-3 font-display text-sm font-black uppercase tracking-widest text-white transition-all hover:-translate-y-1 hover:bg-brutal-yellow hover:text-brutal-black hover:shadow-neo disabled:cursor-not-allowed disabled:opacity-50"
              >
                Tạo mã QR
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right: QR Display */}
      <div className="relative flex items-center justify-center border-4 border-brutal-black bg-white shadow-neo min-h-[360px]">
        {showQR && selectedMember && bankInfo ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex h-full w-full flex-col items-center justify-center bg-white p-8 text-center">
            <img src={qrUrl} alt="VietQR" className="max-w-[250px] mix-blend-multiply mb-4" />
            <div className="border-2 border-brutal-black bg-brutal-yellow px-3 py-2 text-xs font-black uppercase tracking-widest text-brutal-black shadow-neo-sm">Scan to Pay {selectedMember.name}</div>
            <div className="mt-3 font-mono text-[10px] font-bold text-gray-500">
              Bank: {BANKS.find(b => b.id === bankInfo.bankId)?.shortName || bankInfo.bankId}
            </div>
            {bankInfo.accountName && (
              <div className="mt-0.5 font-mono text-[9px] text-gray-500">
                {bankInfo.accountName}
              </div>
            )}
          </motion.div>
        ) : (
          <div className="text-center opacity-60">
            <ScanLine size={100} className="mx-auto mb-4 text-brutal-black" />
            <p className="font-mono text-xs font-black uppercase tracking-widest text-brutal-black">QR generator idle</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PendingRequestsList() {
  const { financeRequests, approveFinanceRequest, rejectFinanceRequest } = useStore();
  const [selectedReq, setSelectedReq] = useState<FinanceRequest | null>(null);

  if (financeRequests.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center border-4 border-brutal-black bg-white text-sm font-black uppercase tracking-widest text-gray-500 shadow-neo">
        Không có yêu cầu chờ duyệt
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {financeRequests.map(req => (
        <div key={req.id} className="group flex items-center justify-between border-4 border-brutal-black bg-white p-6 shadow-neo-sm transition-all hover:-translate-y-1 hover:shadow-neo">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="bg-brutal-yellow px-3 py-1 text-lg font-black text-brutal-black border-2 border-brutal-black shadow-neo-sm">{parseInt(req.amount).toLocaleString()} VND</span>
              <span className="border-2 border-brutal-black bg-white px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-gray-500">{req.date}</span>
            </div>
            <p className="font-display font-black text-brutal-black transition-colors group-hover:text-brutal-blue">{req.reason}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-gray-500">Người gửi: {req.requesterName}</p>
          </div>

          <button
            onClick={() => setSelectedReq(req)}
            className="border-4 border-brutal-black bg-white p-3 text-brutal-black shadow-neo-sm transition-all hover:-translate-y-1 hover:bg-brutal-blue hover:text-white"
          >
            <ArrowRight size={20} />
          </button>
        </div>
      ))}

      {/* Approval Modal */}
      {selectedReq && (
        <ApprovalModal
          request={selectedReq}
          onClose={() => setSelectedReq(null)}
          onApprove={() => { approveFinanceRequest(selectedReq.id); setSelectedReq(null); }}
          onReject={() => { rejectFinanceRequest(selectedReq.id); setSelectedReq(null); }}
        />
      )}
    </div>
  );
}

function ApprovalModal({ request, onClose, onApprove, onReject }: { request: FinanceRequest, onClose: () => void, onApprove: () => void, onReject: () => void }) {
  const { members } = useStore();
  const [showQR, setShowQR] = useState(false);

  // Find requester to get their bank info
  const requester = members.find(m => m.id === request.requesterId);

  // Get normalized bank info - handle both camelCase and snake_case
  const rawBankInfo = requester ? (requester.bankInfo || (requester as any).bank_info) : null;

  const requesterBankInfo = rawBankInfo ? {
    bankId: rawBankInfo.bankId || (rawBankInfo as any).bank_id,
    accountNo: rawBankInfo.accountNo || (rawBankInfo as any).account_no,
    accountName: rawBankInfo.accountName || (rawBankInfo as any).account_name
  } : null;

  // Default Club Account if requester has no bank info
  const DEFAULT_ACCOUNT_NO = "0356616096";
  const DEFAULT_BANK_ID = "970422"; // MB Bank
  const DEFAULT_NAME = "DUT SUPERTEAM";

  const bankId = requesterBankInfo?.bankId || DEFAULT_BANK_ID;
  const accountNo = requesterBankInfo?.accountNo || DEFAULT_ACCOUNT_NO;
  const accountName = requesterBankInfo?.accountName || (requester ? requester.name : DEFAULT_NAME);
  const bankName = BANKS.find(b => b.id === bankId)?.shortName || 'Unknown Bank';

  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${request.amount}&addInfo=${encodeURIComponent(request.reason)}&accountName=${encodeURIComponent(accountName)}`;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="relative z-10 grid w-full max-w-2xl grid-cols-1 gap-8 border-4 border-brutal-black bg-white p-8 shadow-neo-xl md:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Left: Details */}
        <div>
          <h3 className="mb-6 font-display text-2xl font-black uppercase tracking-wider text-brutal-black">Xét duyệt yêu cầu</h3>
          <div className="space-y-4 text-xs font-bold">
            <div className="flex justify-between border-b-4 border-brutal-black pb-2">
              <span className="uppercase tracking-widest text-gray-500">Số tiền</span>
              <span className="text-lg font-black text-brutal-black">{parseInt(request.amount).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-b-4 border-brutal-black pb-2">
              <span className="uppercase tracking-widest text-gray-500">Người gửi</span>
              <span className="text-brutal-black">{request.requesterName}</span>
            </div>
            <div className="flex justify-between border-b-4 border-brutal-black pb-2">
              <span className="uppercase tracking-widest text-gray-500">Ngân hàng</span>
              <span className="text-brutal-blue">{bankName}</span>
            </div>
            <div className="flex justify-between border-b-4 border-brutal-black pb-2">
              <span className="uppercase tracking-widest text-gray-500">Số tài khoản</span>
              <span className="text-brutal-black">{accountNo}</span>
            </div>
            <div>
              <span className="mb-1 block uppercase tracking-widest text-gray-500">Lý do</span>
              <p className="border-4 border-brutal-black bg-brutal-bg p-3 text-sm text-brutal-black">{request.reason}</p>
            </div>
          </div>

          {!showQR && (
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={onReject} className="border-4 border-brutal-black bg-brutal-red py-3 text-sm font-black uppercase tracking-widest text-white transition-all hover:-translate-y-1 hover:shadow-neo">Reject</button>
              <button onClick={() => setShowQR(true)} className="border-4 border-brutal-black bg-brutal-blue py-3 text-sm font-black uppercase tracking-widest text-white transition-all hover:-translate-y-1 hover:bg-brutal-yellow hover:text-brutal-black hover:shadow-neo">Transfer</button>
            </div>
          )}
        </div>

        {/* Right: QR Area */}
        <div className="relative flex flex-col items-center justify-center overflow-hidden border-4 border-brutal-black bg-brutal-yellow p-4">
          {showQR ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center w-full">
              <img src={qrUrl} className="w-full mb-4 mix-blend-multiply" alt="VietQR" />
              <button onClick={onApprove} className="w-full border-4 border-brutal-black bg-brutal-black py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:-translate-y-1 hover:bg-brutal-blue hover:shadow-neo">Confirm transfer</button>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center text-center text-brutal-black/40">
              <ScanLine size={64} />
              <p className="mt-4 text-xs font-black uppercase tracking-widest">Chờ xác nhận chuyển khoản</p>
            </div>
          )}
        </div>

      </motion.div>
    </div>,
    document.body
  );
}

function HistoryList() {
  const { financeHistory } = useStore();

  return (
    <div className="space-y-4">
      <div className="mb-6 border-4 border-brutal-black bg-brutal-yellow p-4 shadow-neo-sm">
        <p className="text-xs font-black uppercase tracking-widest text-brutal-black">
          <span className="font-display">Public ledger:</span> tất cả giao dịch đã duyệt hoặc từ chối đều được lưu ở đây để đảm bảo minh bạch.
        </p>
      </div>

      <div className="grid grid-cols-4 px-4 mb-2 text-[10px] font-black uppercase tracking-wider text-gray-500">
        <span>Status</span>
        <span>Amount</span>
        <span>Reason</span>
        <span className="text-right">Date</span>
      </div>
      {financeHistory.map(req => (
        <div key={req.id} className="flex items-center justify-between border-4 border-brutal-black bg-white p-4 text-xs shadow-neo-sm transition-all hover:-translate-y-1 hover:shadow-neo">
          <div className="w-1/4">
            {req.status === 'completed' ? (
              <span className="flex items-center gap-1 font-black uppercase tracking-widest text-brutal-green"><Check size={12} /> Paid</span>
            ) : (
              <span className="flex items-center gap-1 font-black uppercase tracking-widest text-brutal-red"><X size={12} /> Rejected</span>
            )}
          </div>
          <div className="w-1/4 font-black text-brutal-black">{parseInt(req.amount).toLocaleString()}</div>
          <div className="w-1/4 truncate pr-2 font-bold text-gray-700">{req.reason}</div>
          <div className="w-1/4 text-right font-bold text-gray-500">{req.date}</div>
        </div>
      ))}
      {financeHistory.length === 0 && (
        <div className="border-4 border-brutal-black bg-white py-10 text-center text-xs font-black uppercase tracking-widest text-gray-500 shadow-neo">Chưa có giao dịch lưu trữ</div>
      )}
    </div>
  );
}
