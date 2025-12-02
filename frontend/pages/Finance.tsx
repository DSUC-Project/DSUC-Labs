
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, X, ScanLine, ArrowRight, Zap, Search, Upload } from 'lucide-react';
import { useStore } from '../store/useStore';
import { FinanceRequest, Member } from '../types';
import { BANKS } from '../data/mockData';

export function Finance() {
  const [activeTab, setActiveTab] = useState<'submit' | 'pending' | 'history' | 'direct'>('submit');
  const { financeRequests, financeHistory } = useStore();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-end border-b border-cyber-blue/20 pb-6">
        <div>
           <h2 className="text-4xl font-display font-bold mb-1 text-white">TREASURY</h2>
           <p className="text-cyber-blue font-mono text-sm">Transparency & disbursement log.</p>
        </div>
        <div className="flex flex-wrap gap-2">
           {['submit', 'direct', 'pending', 'history'].map(tab => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab as any)}
               className={`px-6 py-2 font-display font-bold uppercase transition-all cyber-button text-sm flex items-center gap-2 ${activeTab === tab ? 'bg-cyber-yellow text-black' : 'bg-white/5 text-white/40 hover:text-white border border-white/10'}`}
             >
               {tab === 'direct' && <Zap size={14} />}
               {tab}
               {tab === 'pending' && financeRequests.length > 0 && (
                 <span className="ml-1 bg-cyber-blue text-white text-[10px] px-1.5 py-0.5 rounded-full">{financeRequests.length}</span>
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    submitFinanceRequest({
      id: Math.random().toString(),
      amount,
      reason,
      date,
      billImage: null,
      status: 'pending',
      requesterName: currentUser.name || 'Unknown',
      requesterId: currentUser.id
    });
    onSubmitted();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div className="space-y-6">
        <h3 className="text-xl font-display font-bold text-cyber-blue uppercase tracking-widest">Submit Disbursement</h3>
        <p className="text-xs font-mono text-white/40">Request reimbursement for club expenses. The QR code generated upon approval will be based on your profile's bank settings.</p>
        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="space-y-2">
             <label className="text-[10px] font-mono text-white/40 uppercase">Amount (VND)</label>
             <input value={amount} onChange={e => setAmount(e.target.value)} type="number" required className="w-full bg-surface border border-cyber-blue/30 p-4 text-xl font-mono text-white focus:border-cyber-yellow outline-none" placeholder="500,000" />
           </div>
           <div className="space-y-2">
             <label className="text-[10px] font-mono text-white/40 uppercase">Target Date</label>
             <input value={date} onChange={e => setDate(e.target.value)} type="date" required className="w-full bg-surface border border-cyber-blue/30 p-4 font-mono text-white focus:border-cyber-yellow outline-none text-sm" />
           </div>
           <div className="space-y-2">
             <label className="text-[10px] font-mono text-white/40 uppercase">Justification</label>
             <textarea value={reason} onChange={e => setReason(e.target.value)} required rows={4} className="w-full bg-surface border border-cyber-blue/30 p-4 font-mono text-white focus:border-cyber-yellow outline-none text-sm" placeholder="Server costs for Q4..." />
           </div>
           <button type="submit" className="w-full bg-cyber-yellow text-black font-display font-bold py-4 cyber-button hover:bg-white transition-colors text-sm tracking-widest uppercase">
             ENCRYPT & SUBMIT
           </button>
        </form>
      </div>
      <div className="hidden md:flex items-center justify-center opacity-30">
        <ScanLine size={200} className="text-cyber-blue animate-pulse" />
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
  const eligibleMembers = members.filter(m => m.bankInfo);

  const qrUrl = selectedMember && selectedMember.bankInfo 
    ? `https://img.vietqr.io/image/${selectedMember.bankInfo.bankId}-${selectedMember.bankInfo.accountNo}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(content)}`
    : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Member Selection */}
      <div className="space-y-6">
        <h3 className="text-xl font-display font-bold text-cyber-yellow uppercase tracking-widest flex items-center gap-2">
           <Zap size={20} /> QUICK TRANSFER LINK
        </h3>
        <p className="text-xs font-mono text-white/40">Select an operative to generate a direct payment channel. Proof of bill is required for record keeping.</p>
        
        {!selectedMember ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
            {eligibleMembers.map(member => (
              <button 
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className="flex items-center gap-4 p-4 cyber-card hover:bg-cyber-blue/10 transition-colors border-l-2 border-transparent hover:border-l-cyber-blue text-left"
              >
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10">
                  <img src={member.avatar} alt={member.name} className="w-full h-full object-cover grayscale" />
                </div>
                <div>
                  <div className="font-bold font-display text-white">{member.name}</div>
                  <div className="text-[10px] font-mono text-white/40">{member.role}</div>
                </div>
              </button>
            ))}
            {eligibleMembers.length === 0 && (
               <div className="col-span-2 text-center text-white/30 font-mono text-sm py-10">NO MEMBERS WITH BANK DATA FOUND</div>
            )}
          </div>
        ) : (
          <div className="space-y-6 cyber-card p-6 bg-surface/50">
             <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-cyber-yellow">
                    <img src={selectedMember.avatar} alt={selectedMember.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <div className="font-bold font-display text-lg text-white">{selectedMember.name}</div>
                    <div className="text-[10px] font-mono text-cyber-yellow">RECEIVER SELECTED</div>
                  </div>
                </div>
                <button onClick={() => { setSelectedMember(null); setShowQR(false); }} className="text-white/40 hover:text-white"><X size={20} /></button>
             </div>

             <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-white/40 uppercase">Amount</label>
                  <input value={amount} onChange={e => setAmount(e.target.value)} type="number" className="w-full bg-black/50 border border-white/10 p-3 text-white focus:border-cyber-yellow outline-none font-mono" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-white/40 uppercase">Message</label>
                  <input value={content} onChange={e => setContent(e.target.value)} type="text" className="w-full bg-black/50 border border-white/10 p-3 text-white focus:border-cyber-yellow outline-none font-mono" placeholder="Payment for..." />
                </div>
                
                {/* Image Upload */}
                <div className="space-y-2">
                   <label className="text-[10px] font-mono text-white/40 uppercase">Proof of Bill (Image)</label>
                   <div className="relative border border-dashed border-white/20 bg-black/30 p-4 text-center hover:border-cyber-blue/50 transition-colors">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setBillFile(e.target.files?.[0] || null)}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      />
                      {billFile ? (
                        <div className="text-cyber-blue font-mono text-xs flex items-center justify-center gap-2">
                           <Check size={14} /> {billFile.name}
                        </div>
                      ) : (
                        <div className="text-white/40 font-mono text-xs flex items-center justify-center gap-2">
                           <Upload size={14} /> Upload Screenshot
                        </div>
                      )}
                   </div>
                </div>

                <button 
                  onClick={() => setShowQR(true)}
                  disabled={!amount}
                  className="w-full bg-cyber-blue text-white font-display font-bold py-3 cyber-button hover:bg-white hover:text-black transition-colors uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  GENERATE QR CODE
                </button>
             </div>
          </div>
        )}
      </div>

      {/* Right: QR Display */}
      <div className="flex items-center justify-center bg-white/5 cyber-card border border-white/5 relative">
         {showQR && selectedMember ? (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center p-8 bg-white w-full h-full flex flex-col items-center justify-center">
               <img src={qrUrl} alt="VietQR" className="max-w-[250px] mix-blend-multiply mb-4" />
               <div className="text-black font-mono text-xs font-bold uppercase">Scan to Pay {selectedMember.name}</div>
               <div className="text-black/50 font-mono text-[10px] mt-1">Bank: {BANKS.find(b => b.id === selectedMember.bankInfo?.bankId)?.shortName}</div>
            </motion.div>
         ) : (
            <div className="text-center opacity-30">
               <ScanLine size={100} className="mx-auto mb-4" />
               <p className="font-mono text-xs">QR GENERATOR IDLE</p>
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
      <div className="h-64 flex items-center justify-center text-white/30 font-mono text-sm border border-dashed border-white/10">
        NO PENDING TRANSACTIONS
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {financeRequests.map(req => (
        <div key={req.id} className="cyber-card p-6 border-l border-l-cyber-yellow flex justify-between items-center group hover:bg-cyber-blue/5 transition-all">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-cyber-yellow font-mono font-bold text-lg">{parseInt(req.amount).toLocaleString()} VND</span>
              <span className="text-[10px] font-mono bg-white/5 border border-white/10 px-2 py-0.5 text-white/50">{req.date}</span>
            </div>
            <p className="font-display font-bold text-white group-hover:text-cyber-blue transition-colors">{req.reason}</p>
            <p className="text-[10px] font-mono text-white/30 uppercase mt-1">Req by: {req.requesterName}</p>
          </div>
          
          <button 
            onClick={() => setSelectedReq(req)}
            className="bg-white/5 hover:bg-cyber-blue hover:text-white text-cyber-blue p-3 cyber-button transition-colors border border-white/5"
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
  
  // Default Club Account if requester has no bank info
  const DEFAULT_ACCOUNT_NO = "0356616096"; 
  const DEFAULT_BANK_ID = "970422"; // MB Bank
  const DEFAULT_NAME = "DUT SUPERTEAM";

  const bankId = requester?.bankInfo?.bankId || DEFAULT_BANK_ID;
  const accountNo = requester?.bankInfo?.accountNo || DEFAULT_ACCOUNT_NO;
  const accountName = requester ? requester.name : DEFAULT_NAME;
  const bankName = BANKS.find(b => b.id === bankId)?.shortName || 'Unknown Bank';

  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-compact2.png?amount=${request.amount}&addInfo=${encodeURIComponent(request.reason)}&accountName=${encodeURIComponent(accountName)}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-surface cyber-card border border-cyber-blue/50 p-8 w-full max-w-2xl relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left: Details */}
        <div>
          <h3 className="text-xl font-display font-bold text-cyber-yellow mb-6 uppercase tracking-wider">Validate Request</h3>
          <div className="space-y-4 font-mono text-xs">
             <div className="flex justify-between border-b border-white/10 pb-2">
               <span className="text-white/40">Amount</span>
               <span className="font-bold text-lg text-white">{parseInt(request.amount).toLocaleString()}</span>
             </div>
             <div className="flex justify-between border-b border-white/10 pb-2">
               <span className="text-white/40">Requester</span>
               <span className="text-white">{request.requesterName}</span>
             </div>
             <div className="flex justify-between border-b border-white/10 pb-2">
               <span className="text-white/40">Target Bank</span>
               <span className="text-cyber-blue">{bankName}</span>
             </div>
             <div className="flex justify-between border-b border-white/10 pb-2">
               <span className="text-white/40">Account</span>
               <span className="text-white">{accountNo}</span>
             </div>
             <div>
               <span className="text-white/40 block mb-1">Reason</span>
               <p className="text-white/80 border border-white/10 p-2 bg-black/50">{request.reason}</p>
             </div>
          </div>
          
          {!showQR && (
            <div className="grid grid-cols-2 gap-4 mt-8">
              <button onClick={onReject} className="py-3 cyber-button bg-red-900/20 text-red-500 hover:bg-red-500 hover:text-white font-bold font-display text-sm border border-red-500/20">REJECT</button>
              <button onClick={() => setShowQR(true)} className="py-3 cyber-button bg-cyber-blue text-white hover:bg-white hover:text-black font-bold font-display text-sm">TRANSFER (GEN QR)</button>
            </div>
          )}
        </div>

        {/* Right: QR Area */}
        <div className="bg-white p-4 flex flex-col items-center justify-center relative overflow-hidden cyber-clip-bottom">
          {showQR ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center w-full">
              <img src={qrUrl} className="w-full mb-4 mix-blend-multiply" alt="VietQR" />
              <button onClick={onApprove} className="w-full bg-black text-white py-3 font-bold font-display hover:bg-cyber-blue text-xs uppercase tracking-widest">Confirm Transfer</button>
            </motion.div>
          ) : (
            <div className="text-black/20 flex flex-col items-center text-center">
              <ScanLine size={64} />
              <p className="mt-4 font-mono text-xs font-bold uppercase">Awaiting Authorization</p>
            </div>
          )}
        </div>

      </motion.div>
    </div>
  );
}

function HistoryList() {
  const { financeHistory } = useStore();

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 text-[10px] font-mono text-cyber-blue uppercase px-4 mb-2 tracking-wider">
        <span>Status</span>
        <span>Amount</span>
        <span>Reason</span>
        <span className="text-right">Date</span>
      </div>
      {financeHistory.map(req => (
        <div key={req.id} className="cyber-card p-4 flex items-center justify-between text-xs font-mono border-l-2 border-transparent hover:border-l-cyber-blue">
          <div className="w-1/4">
            {req.status === 'completed' ? (
              <span className="text-green-400 flex items-center gap-1"><Check size={12} /> PAID</span>
            ) : (
              <span className="text-red-400 flex items-center gap-1"><X size={12} /> REJECTED</span>
            )}
          </div>
          <div className="w-1/4 font-bold text-white">{parseInt(req.amount).toLocaleString()}</div>
          <div className="w-1/4 truncate pr-2 text-white/70">{req.reason}</div>
          <div className="w-1/4 text-right text-white/40">{req.date}</div>
        </div>
      ))}
      {financeHistory.length === 0 && (
         <div className="text-center text-white/20 py-10 font-mono text-xs">NO ARCHIVED RECORDS</div>
      )}
    </div>
  );
}
