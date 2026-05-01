import React, { useEffect, useMemo, useState } from 'react';
import ReactDOM from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  Landmark,
  ScanLine,
  ShieldCheck,
  Upload,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';

import { useUiPreview } from '@/components/Layout';
import {
  EmptyState,
  PageHeader,
  PermissionCard,
  SectionHeader,
  StatusBadge,
  SurfaceCard,
} from '@/components/ui/Primitives';
import { BANKS } from '@/data/mockData';
import { useStore } from '@/store/useStore';
import type { FinanceRequest, Member } from '@/types';

type FinanceTab = 'submit' | 'direct' | 'pending' | 'history';

function isOfficialMember(member: Member | null) {
  return (member?.memberType || member?.member_type) === 'member';
}

function canModerateFinanceByUser(member: Member | null) {
  return isOfficialMember(member) && ['President', 'Vice-President'].includes(member?.role || '');
}

function getBankInfo(member: Member | null) {
  const info = member?.bankInfo || (member?.bank_info as any);
  if (!info) {
    return null;
  }

  return {
    bankId: info.bankId || info.bank_id || '',
    accountNo: info.accountNo || info.account_no || '',
    accountName: info.accountName || info.account_name || member?.name || '',
  };
}

function formatAmount(value: string | number | undefined) {
  const numeric = Number(value || 0);
  if (Number.isNaN(numeric)) {
    return String(value || '0');
  }
  return `${numeric.toLocaleString('vi-VN')} VND`;
}

export function Finance() {
  const uiPreview = useUiPreview();
  const {
    financeRequests,
    financeHistory,
    fetchPendingRequests,
    fetchFinanceHistory,
    fetchMembers,
    currentUser,
  } = useStore();

  const [activeTab, setActiveTab] = useState<FinanceTab>('submit');
  const previewMode = uiPreview.previewOnly && !currentUser;
  const hasFinanceAccess = isOfficialMember(currentUser) || uiPreview.canAccessFinance;
  const canModerateFinance = canModerateFinanceByUser(currentUser) || (previewMode && uiPreview.canAccessAdmin);

  const visibleTabs = useMemo(
    () =>
      (canModerateFinance
        ? ['submit', 'direct', 'pending', 'history']
        : ['submit', 'direct', 'history']) as FinanceTab[],
    [canModerateFinance]
  );

  useEffect(() => {
    if (isOfficialMember(currentUser)) {
      fetchMembers();
    }
  }, [currentUser?.id, fetchMembers]);

  useEffect(() => {
    if (activeTab === 'pending' && canModerateFinance && currentUser) {
      fetchPendingRequests();
    }
  }, [activeTab, canModerateFinance, currentUser?.id, fetchPendingRequests]);

  useEffect(() => {
    if (activeTab === 'history' && isOfficialMember(currentUser)) {
      fetchFinanceHistory();
    }
  }, [activeTab, currentUser?.id, fetchFinanceHistory]);

  useEffect(() => {
    if (activeTab === 'pending' && !canModerateFinance) {
      setActiveTab('submit');
    }
  }, [activeTab, canModerateFinance]);

  if (!hasFinanceAccess) {
    return (
      <div className="mx-auto max-w-6xl">
        <PermissionCard
          title="Finance is restricted to official members"
          message="This module stays behind the existing member permission model. Community accounts can browse the rest of the product, but Finance remains locked."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <PageHeader
        eyebrow="Finance"
        title="A cleaner ledger for club operations."
        subtitle="Submit reimbursement requests, generate transfer details, review pending approvals, and track the finance history without breaking the current backend flow."
        actions={
          <>
            {previewMode ? <StatusBadge tone="warning">Preview Only</StatusBadge> : null}
            <StatusBadge tone="info">{financeRequests.length} pending</StatusBadge>
            <StatusBadge>{financeHistory.length} history</StatusBadge>
          </>
        }
      />

      {previewMode ? (
        <SurfaceCard className="p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="section-eyebrow">Dev Role Preview</p>
              <h2 className="section-title">Finance preview is unlocked locally</h2>
              <p className="section-subtitle">
                Real authentication is still required before submitting requests or approving transfers.
              </p>
            </div>
            <StatusBadge tone="warning">No production auth attached</StatusBadge>
          </div>
        </SurfaceCard>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {visibleTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              activeTab === tab
                ? 'border-primary bg-primary text-main-bg'
                : 'border-border-main bg-surface text-text-main hover:bg-main-bg'
            }`}
          >
            {tab === 'submit'
              ? 'Requests'
              : tab === 'direct'
                ? 'Transfer'
                : tab === 'pending'
                  ? 'Pending'
                  : 'History'}
          </button>
        ))}
      </div>

      {activeTab === 'submit' ? <SubmitRequestPanel previewMode={previewMode} onSubmitted={() => setActiveTab(canModerateFinance ? 'pending' : 'history')} /> : null}
      {activeTab === 'direct' ? <DirectTransferPanel /> : null}
      {activeTab === 'pending' ? <PendingRequestsPanel previewMode={previewMode} canModerateFinance={canModerateFinance} /> : null}
      {activeTab === 'history' ? <HistoryPanel /> : null}
    </div>
  );
}

function SubmitRequestPanel({
  previewMode,
  onSubmitted,
}: {
  previewMode: boolean;
  onSubmitted: () => void;
}) {
  const { currentUser, submitFinanceRequest, addToast } = useStore();
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [date, setDate] = useState('');
  const [billImage, setBillImage] = useState<string | null>(null);
  const [billFile, setBillFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setBillImage(reader.result as string);
    };
    reader.readAsDataURL(file);
    setBillFile(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (previewMode || !currentUser) {
      addToast('Preview mode cannot submit a real finance request.', 'info');
      return;
    }

    setSubmitting(true);
    try {
      await submitFinanceRequest({
        id: Math.random().toString(),
        amount,
        reason,
        date,
        billImage,
        status: 'pending',
        requesterName: currentUser.name || 'Unknown',
        requesterId: currentUser.id,
      });
      setAmount('');
      setReason('');
      setDate('');
      setBillImage(null);
      setBillFile(null);
      addToast('Finance request submitted.', 'success');
      onSubmitted();
    } catch {
      addToast('Could not submit the finance request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <SurfaceCard className="p-7">
        <SectionHeader
          eyebrow="Request Intake"
          title="Submit a reimbursement request"
          subtitle="This form keeps the real finance request action intact while making the workflow easier to scan."
        />

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Amount (VND)">
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                type="number"
                required
                className="input-shell"
                placeholder="500000"
                disabled={previewMode || submitting}
              />
            </Field>
            <Field label="Target date">
              <input
                value={date}
                onChange={(event) => setDate(event.target.value)}
                type="date"
                required
                className="input-shell"
                disabled={previewMode || submitting}
              />
            </Field>
          </div>
          <Field label="Reason">
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
              rows={5}
              className="input-shell min-h-[140px] resize-none"
              placeholder="Explain the expense, event, or operating need."
              disabled={previewMode || submitting}
            />
          </Field>

          <Field label="Receipt image">
            <label className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-border-main bg-main-bg px-5 py-6 text-center transition-colors hover:bg-surface">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                required={!previewMode}
                className="hidden"
                disabled={previewMode || submitting}
              />
              {billImage ? (
                <>
                  <img
                    src={billImage}
                    alt="Receipt preview"
                    className="mb-4 max-h-36 w-full rounded-[18px] border border-border-main object-contain bg-surface"
                  />
                  <span className="text-sm text-text-main">{billFile?.name || 'Receipt attached'}</span>
                </>
              ) : (
                <>
                  <Upload className="h-6 w-6 text-primary" aria-hidden="true" />
                  <span className="mt-3 text-sm text-text-main">Upload invoice / receipt</span>
                  <span className="mt-1 text-xs uppercase tracking-[0.18em] text-text-muted">
                    PNG or JPG
                  </span>
                </>
              )}
            </label>
          </Field>

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setAmount('');
                setReason('');
                setDate('');
                setBillImage(null);
                setBillFile(null);
              }}
              className="action-button action-button-ghost"
              disabled={submitting}
            >
              Reset
            </button>
            <button
              type="submit"
              className="action-button action-button-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </SurfaceCard>

      <SurfaceCard className="p-7">
        <SectionHeader
          eyebrow="Control Notes"
          title="Operational guardrails"
          subtitle="Requests stay reviewable and tied to the current user identity."
        />
        <div className="mt-6 space-y-4">
          <MetricCard label="Review flow" value="Pending → Approved / Rejected" />
          <MetricCard label="Receipt" value="Required for production" />
          <MetricCard label="Ledger model" value="Store + backend sync" />
        </div>
      </SurfaceCard>
    </div>
  );
}

function DirectTransferPanel() {
  const { members } = useStore();
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [amount, setAmount] = useState('');
  const [content, setContent] = useState('');
  const [billFile, setBillFile] = useState<File | null>(null);
  const [showQR, setShowQR] = useState(false);

  const eligibleMembers = members.filter((member) => {
    const memberType = member.memberType || member.member_type;
    return memberType !== 'community' && !!getBankInfo(member);
  });

  const bankInfo = getBankInfo(selectedMember);
  const qrUrl =
    bankInfo && amount
      ? `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}`
      : '';

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <SurfaceCard className="p-7">
        <SectionHeader
          eyebrow="Direct Transfer"
          title="Generate a clean transfer route"
          subtitle="Select a member with bank info, fill the amount, and generate a VietQR payment target."
        />

        {!selectedMember ? (
          eligibleMembers.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {eligibleMembers.map((member) => {
                const info = getBankInfo(member);
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setSelectedMember(member)}
                    className="rounded-[24px] border border-border-main bg-main-bg p-4 text-left transition-colors hover:bg-surface"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 overflow-hidden rounded-[18px] border border-border-main bg-surface">
                        <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-text-main">{member.name}</p>
                        <p className="truncate text-xs uppercase tracking-[0.16em] text-text-muted">
                          {member.role}
                        </p>
                      </div>
                    </div>
                    {info ? (
                      <div className="mt-4 space-y-1 text-sm text-text-muted">
                        <p>{BANKS.find((bank) => bank.id === info.bankId)?.shortName || info.bankId}</p>
                        <p>{info.accountName}</p>
                        <p>{info.accountNo}</p>
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState
              className="mt-6"
              title="No transfer targets yet"
              message="Members with stored bank details will appear here for quick transfer generation."
            />
          )
        ) : (
          <div className="mt-6 grid gap-4">
            <div className="flex items-center justify-between rounded-[24px] border border-border-main bg-main-bg p-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 overflow-hidden rounded-[18px] border border-border-main bg-surface">
                  <img
                    src={selectedMember.avatar}
                    alt={selectedMember.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-base font-semibold text-text-main">{selectedMember.name}</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
                    Transfer target selected
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedMember(null);
                  setShowQR(false);
                }}
                className="icon-button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Amount">
                <input
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  type="number"
                  className="input-shell"
                  placeholder="0"
                />
              </Field>
              <Field label="Transfer note">
                <input
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  className="input-shell"
                  placeholder="Payment for..."
                />
              </Field>
            </div>
            <Field label="Optional proof image">
              <label className="flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-border-main bg-main-bg px-5 py-6 text-center transition-colors hover:bg-surface">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setBillFile(event.target.files?.[0] || null)}
                  className="hidden"
                />
                {billFile ? (
                  <span className="text-sm text-text-main">{billFile.name}</span>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-primary" aria-hidden="true" />
                    <span className="mt-3 text-sm text-text-main">Attach a local proof image</span>
                  </>
                )}
              </label>
            </Field>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowQR(true)}
                disabled={!amount}
                className="action-button action-button-primary"
              >
                Generate QR
              </button>
            </div>
          </div>
        )}
      </SurfaceCard>

      <SurfaceCard className="p-7">
        <SectionHeader
          eyebrow="QR Output"
          title="Transfer target"
          subtitle="A compact payment target for the selected member."
        />
        <div className="mt-6 flex min-h-[360px] flex-col items-center justify-center rounded-[24px] border border-border-main bg-main-bg p-5 text-center">
          {showQR && selectedMember && bankInfo && qrUrl ? (
            <>
              <img src={qrUrl} alt="VietQR" className="max-w-[240px] mix-blend-multiply" />
              <p className="mt-4 text-sm font-semibold text-text-main">{selectedMember.name}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-text-muted">
                {BANKS.find((bank) => bank.id === bankInfo.bankId)?.shortName || bankInfo.bankId}
              </p>
            </>
          ) : (
            <>
              <ScanLine className="h-10 w-10 text-primary" aria-hidden="true" />
              <p className="mt-4 text-sm text-text-main">Select a member and enter an amount.</p>
            </>
          )}
        </div>
      </SurfaceCard>
    </div>
  );
}

function PendingRequestsPanel({
  previewMode,
  canModerateFinance,
}: {
  previewMode: boolean;
  canModerateFinance: boolean;
}) {
  const { financeRequests, approveFinanceRequest, rejectFinanceRequest, addToast } = useStore();
  const [selectedRequest, setSelectedRequest] = useState<FinanceRequest | null>(null);

  if (!canModerateFinance) {
    return (
      <PermissionCard
        title="Pending approvals are moderator-only"
        message="Only finance moderators can approve or reject reimbursement requests."
      />
    );
  }

  if (financeRequests.length === 0) {
    return (
      <EmptyState
        title="No pending requests"
        message={
          previewMode
            ? 'Preview mode is unlocked, but there is no real finance queue attached to this local session.'
            : 'There are no pending finance requests to review right now.'
        }
      />
    );
  }

  return (
    <>
      <div className="grid gap-4">
        {financeRequests.map((request) => (
          <SurfaceCard key={request.id} interactive className="p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge tone="warning">Pending</StatusBadge>
                  <StatusBadge>{request.date}</StatusBadge>
                </div>
                <h3 className="text-xl font-semibold text-text-main">{formatAmount(request.amount)}</h3>
                <p className="text-sm leading-7 text-text-muted">{request.reason}</p>
                <p className="text-xs uppercase tracking-[0.16em] text-text-muted">
                  Requested by {request.requesterName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(request)}
                className="action-button action-button-secondary"
              >
                Review
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </SurfaceCard>
        ))}
      </div>

      {selectedRequest ? (
        <ApprovalModal
          request={selectedRequest}
          previewMode={previewMode}
          onClose={() => setSelectedRequest(null)}
          onApprove={async () => {
            if (previewMode) {
              addToast('Preview mode cannot approve a real transfer.', 'info');
            } else {
              await approveFinanceRequest(selectedRequest.id);
              addToast('Finance request approved.', 'success');
            }
            setSelectedRequest(null);
          }}
          onReject={async () => {
            if (previewMode) {
              addToast('Preview mode cannot reject a real transfer.', 'info');
            } else {
              await rejectFinanceRequest(selectedRequest.id);
              addToast('Finance request rejected.', 'success');
            }
            setSelectedRequest(null);
          }}
        />
      ) : null}
    </>
  );
}

function ApprovalModal({
  request,
  previewMode,
  onClose,
  onApprove,
  onReject,
}: {
  request: FinanceRequest;
  previewMode: boolean;
  onClose: () => void;
  onApprove: () => void | Promise<void>;
  onReject: () => void | Promise<void>;
}) {
  const { members } = useStore();
  const [showQR, setShowQR] = useState(false);

  const requester = members.find((member) => member.id === request.requesterId) || null;
  const requesterBank = getBankInfo(requester);

  const bankId = requesterBank?.bankId || '970422';
  const accountNo = requesterBank?.accountNo || '0356616096';
  const accountName = requesterBank?.accountName || requester?.name || 'DUT SUPERTEAM';
  const bankName = BANKS.find((bank) => bank.id === bankId)?.shortName || bankId;
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${request.amount}&addInfo=${encodeURIComponent(request.reason)}&accountName=${encodeURIComponent(accountName)}`;

  return ReactDOM.createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.97 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative z-10 grid w-full max-w-4xl gap-6 rounded-[32px] border border-border-main bg-surface-elevated p-7 shadow-soft-xl lg:grid-cols-[minmax(0,1fr)_320px]"
          onClick={(event) => event.stopPropagation()}
        >
          <button type="button" onClick={onClose} className="icon-button absolute right-5 top-5">
            <X className="h-4 w-4" />
          </button>

          <div className="space-y-6">
            <div>
              <p className="section-eyebrow">Approval Review</p>
              <h2 className="section-title">Request details</h2>
              <p className="section-subtitle">
                Review the ledger entry, receipt, and bank target before approving the transfer.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <MetricCard label="Amount" value={formatAmount(request.amount)} />
              <MetricCard label="Requested date" value={request.date} />
              <MetricCard label="Requester" value={request.requesterName} />
              <MetricCard label="Bank target" value={bankName} />
            </div>

            <div className="rounded-[24px] border border-border-main bg-main-bg p-5">
              <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">Reason</p>
              <p className="mt-3 text-sm leading-7 text-text-main">{request.reason}</p>
            </div>

            {request.billImage ? (
              <div className="rounded-[24px] border border-border-main bg-main-bg p-5">
                <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">Receipt</p>
                <img
                  src={request.billImage}
                  alt="Receipt"
                  className="mt-4 max-h-80 w-full rounded-[18px] border border-border-main object-contain bg-surface"
                />
              </div>
            ) : null}

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={onReject} className="action-button action-button-danger">
                <XCircle className="h-4 w-4" aria-hidden="true" />
                Reject
              </button>
              <button
                type="button"
                onClick={() => setShowQR((value) => !value)}
                className="action-button action-button-secondary"
              >
                <Landmark className="h-4 w-4" aria-hidden="true" />
                {showQR ? 'Hide Transfer Target' : 'Show Transfer Target'}
              </button>
              <button type="button" onClick={onApprove} className="action-button action-button-primary">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                {previewMode ? 'Preview Approve' : 'Approve Transfer'}
              </button>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <p className="section-eyebrow">Transfer Target</p>
              <h2 className="section-title">Bank details</h2>
            </div>
            <div className="rounded-[24px] border border-border-main bg-main-bg p-5">
              <p className="text-sm text-text-main">{accountName}</p>
              <p className="mt-2 text-sm text-text-muted">{accountNo}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-text-muted">{bankName}</p>
            </div>
            <div className="flex min-h-[280px] items-center justify-center rounded-[24px] border border-border-main bg-main-bg p-5 text-center">
              {showQR ? (
                <div>
                  <img src={qrUrl} alt="VietQR" className="max-w-[240px] mix-blend-multiply" />
                  <p className="mt-4 text-sm text-text-main">Ready to scan</p>
                </div>
              ) : (
                <div>
                  <Wallet className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
                  <p className="mt-4 text-sm text-text-main">Reveal the transfer target to verify the payout path.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

function HistoryPanel() {
  const { financeHistory } = useStore();

  if (financeHistory.length === 0) {
    return (
      <EmptyState
        title="No finance history yet"
        message="Approved and rejected requests will appear here once the history ledger is populated."
      />
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="Ledger"
        title="Finance history"
        subtitle="A cleaner ledger view for approved and rejected requests."
      />
      <SurfaceCard className="overflow-hidden p-0">
        <div className="grid grid-cols-[120px_160px_minmax(0,1fr)_120px] gap-4 border-b border-border-main bg-main-bg px-5 py-4 text-[11px] uppercase tracking-[0.18em] text-text-muted">
          <span>Status</span>
          <span>Amount</span>
          <span>Reason</span>
          <span>Date</span>
        </div>
        <div className="divide-y divide-border-main">
          {financeHistory.map((request) => (
            <div
              key={request.id}
              className="grid grid-cols-[120px_160px_minmax(0,1fr)_120px] gap-4 px-5 py-4 text-sm text-text-main"
            >
              <div className="flex items-center">
                <StatusBadge tone={request.status === 'completed' ? 'success' : 'danger'}>
                  {request.status === 'completed' ? 'Paid' : 'Rejected'}
                </StatusBadge>
              </div>
              <div className="flex items-center">{formatAmount(request.amount)}</div>
              <div className="flex items-center truncate text-text-muted">{request.reason}</div>
              <div className="flex items-center text-text-muted">{request.date}</div>
            </div>
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2">
      <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted">{label}</span>
      {children}
    </label>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-border-main bg-main-bg p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-text-main">{value}</p>
    </div>
  );
}
