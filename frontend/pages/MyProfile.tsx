
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Save, Upload, Github, Twitter, Send, Facebook, LogOut, CreditCard, Mail, Link2, CheckCircle, Edit2, Hexagon, Trophy, Flame, Code } from 'lucide-react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useStore } from '../store/useStore';
import { BANKS } from '../data/mockData';
import { SkillInput } from '../components/SkillInput';
import { GoogleUserInfo } from '../types';

interface GoogleJWTPayload {
  sub: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}

export function MyProfile() {
  const { currentUser, updateCurrentUser, linkGoogleAccount, logout, authMethod, reconnectWallet } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isReconnectingWallet, setIsReconnectingWallet] = useState(false);

  // Local state for form
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [github, setGithub] = useState('');
  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');
  const [facebook, setFacebook] = useState('');

  // Banking state
  const [bankId, setBankId] = useState('');
  const [accountNo, setAccountNo] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isEditingBank, setIsEditingBank] = useState(false);
  const isOfficialMember = currentUser?.memberType === 'member';
  const isOnboarding =
    searchParams.get('onboarding') === '1' || currentUser?.profile_completed === false;
  const selectedBank =
    BANKS.find((bank) => bank.id === bankId) ||
    BANKS.find((bank) => bank.code.toLowerCase() === bankId.toLowerCase());
  const hasProfileBasics =
    name.trim().length >= 2 &&
    (skills.length > 0 ||
      github.trim().length > 0 ||
      twitter.trim().length > 0 ||
      telegram.trim().length > 0 ||
      facebook.trim().length > 0);

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    setName(currentUser.name || '');
    setAvatar(currentUser.avatar || '');
    setSkills(currentUser.skills || []);
    setGithub(currentUser.socials?.github || '');
    setTwitter(currentUser.socials?.twitter || '');
    setTelegram(currentUser.socials?.telegram || '');
    setFacebook(currentUser.socials?.facebook || '');
    setBankId(currentUser.bankInfo?.bankId || '');
    setAccountNo(currentUser.bankInfo?.accountNo || '');
    setAccountName(currentUser.bankInfo?.accountName || currentUser.name || '');
  }, [currentUser, navigate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAll = async () => {
    if (isOnboarding && !hasProfileBasics) {
      alert('Please complete your basic profile first: name and at least one skill or social link.');
      return;
    }

    try {
      const updates: any = {
        name,
        avatar,
        skills,
        socials: {
          github,
          twitter,
          telegram,
          facebook
        },
        profile_completed: isOnboarding ? true : currentUser?.profile_completed,
      };

      if (isOfficialMember) {
        updates.bankInfo = bankId && accountNo ? {
          bankId,
          accountNo,
          accountName: accountName || name
        } : undefined;
      }

      await updateCurrentUser(updates);
      alert('Profile saved successfully');
      if (isOnboarding) {
        navigate('/home', { replace: true });
      }
    } catch (err) {
      console.error('[MyProfile] Save failed:', err);
      alert('Failed to save profile. Check console for details.');
    }
  };

  const handleSaveBank = async () => {
    if (!isOfficialMember) {
      return;
    }

    try {
      await updateCurrentUser({
        bankInfo: bankId && accountNo ? {
          bankId,
          accountNo,
          accountName: accountName || name
        } : undefined
      });
      setIsEditingBank(false);
      // Optional: show a small toast inside the component instead of alert
    } catch (err) {
       alert('Failed to save bank info.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleReconnectWallet = async () => {
    setIsReconnectingWallet(true);
    try {
      await reconnectWallet();
    } finally {
      setIsReconnectingWallet(false);
    }
  };

  const handleGoogleLinkSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) return;

    setIsLinkingGoogle(true);
    try {
      const decoded = jwtDecode<GoogleJWTPayload>(credentialResponse.credential);
      const googleUserInfo: GoogleUserInfo = {
        email: decoded.email,
        google_id: decoded.sub,
        name: decoded.name,
        avatar: decoded.picture,
      };
      await linkGoogleAccount(googleUserInfo);
    } catch (error) {
      alert('Google account linking failed. Please try again.');
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen pt-20 pb-32 max-w-6xl mx-auto px-4 overflow-x-hidden">
      {isOnboarding && (
        <div className="mb-8 bg-cyber-blue/10 border border-cyber-blue/30 p-5">
          <div className="text-xs font-mono uppercase tracking-[0.25em] text-cyber-blue mb-2">
            First-Time Setup
          </div>
          <p className="text-white/70 text-sm">
            Complete your profile before entering the rest of the app. Add your name and at least one skill or social link, then commit changes once to continue.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-white/10 pb-6 mb-8 mt-4 gap-4">
        <div>
          <h2 className="text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50 tracking-wide uppercase">Operator Profile</h2>
          <p className="text-cyber-blue font-mono text-sm tracking-widest uppercase mt-2">Manage your identity and protocols.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={handleLogout}
            className="flex-1 md:flex-none border border-red-500/30 text-red-400 hover:bg-red-500/10 font-mono font-bold text-xs px-4 py-2 flex items-center justify-center gap-2 transition-colors uppercase tracking-widest"
          >
            <LogOut size={14} /> Disconnect
          </button>
          <button
            onClick={handleSaveAll}
            className="flex-1 md:flex-none bg-cyber-yellow hover:bg-white text-black font-mono font-bold text-xs px-6 py-2 flex items-center justify-center gap-2 transition-all uppercase tracking-widest shadow-[0_0_15px_rgba(255,214,0,0.2)] hover:shadow-[0_0_20px_rgba(255,214,0,0.5)]"
          >
            <Save size={14} /> Commit Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Identity & Socials */}
        <div className="lg:col-span-4 flex flex-col gap-8">

          {/* Identity Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#050B14] border border-white/10 p-6 relative group"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-blue/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full p-1 border border-white/20 mb-6 relative group overflow-hidden">
                <div className="absolute inset-0 rounded-full border border-cyber-blue/30 animate-[spin_4s_linear_infinite] pointer-events-none" />
                <img src={avatar || `https://i.pravatar.cc/150?u=${currentUser.id}`} alt="Avatar" className="w-full h-full object-cover rounded-full bg-black grayscale group-hover:grayscale-0 transition-all duration-500" />
                <label className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full backdrop-blur-sm">
                  <Upload className="text-white mb-1" size={20} />
                  <span className="text-[9px] font-mono text-white/80 uppercase tracking-widest">Update</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>

              <div className="w-full space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-cyber-blue uppercase tracking-widest">Callsign</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-black border border-white/10 px-3 py-2 text-white focus:border-cyber-blue outline-none font-display font-medium text-lg transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-cyber-blue uppercase tracking-widest">Clearance Level</label>
                  <div className="w-full bg-black border border-white/5 px-3 py-2 text-white/50 font-mono text-xs uppercase tracking-widest flex items-center justify-between">
                    <span>{currentUser.memberType === 'community' ? 'Community' : currentUser.role}</span>
                    <Hexagon size={14} className="text-cyber-blue/50" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {currentUser.wallet_address && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-[#050B14] border border-white/10 p-6"
            >
              <h3 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Hexagon size={14} /> Wallet Link
              </h3>
              <div className="text-[11px] font-mono text-white/60 break-all mb-4">
                {currentUser.wallet_address}
              </div>
              <button
                onClick={handleReconnectWallet}
                disabled={isReconnectingWallet}
                className="w-full border border-cyber-blue/40 text-cyber-blue hover:bg-cyber-blue hover:text-black font-mono font-bold text-[10px] uppercase tracking-widest py-3 transition-colors disabled:opacity-60"
              >
                {isReconnectingWallet ? 'Reconnecting...' : 'Reconnect Wallet'}
              </button>
            </motion.div>
          )}

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#050B14] border border-white/10 p-6"
          >
            <h3 className="text-xs font-mono text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Link2 size={14} /> Comms Network
            </h3>
            <div className="space-y-3">
              {[
                { icon: Github, value: github, setter: setGithub, placeholder: 'github.com/username' },
                { icon: Twitter, value: twitter, setter: setTwitter, placeholder: 'x.com/username' },
                { icon: Send, value: telegram, setter: setTelegram, placeholder: 't.me/username' },
                { icon: Facebook, value: facebook, setter: setFacebook, placeholder: 'facebook.com/username' },
              ].map((social, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-black border border-white/5 p-2 focus-within:border-cyber-blue transition-colors">
                  <social.icon className="text-white/30 ml-2" size={16} />
                  <input
                    type="text"
                    value={social.value}
                    onChange={e => social.setter(e.target.value)}
                    placeholder={social.placeholder}
                    className="flex-1 bg-transparent text-white outline-none font-mono text-xs placeholder:text-white/20"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Content */}
        <div className="lg:col-span-8 flex flex-col gap-8">

          {/* Academy Progress Redesign */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-[#050B14] border border-cyber-yellow/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-yellow/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 relative z-10 gap-6">
              <div>
                <h3 className="text-xl font-display font-bold text-white uppercase tracking-wider flex items-center gap-3">
                  <Trophy className="text-cyber-yellow" size={24} />
                  Academy Progress
                </h3>
                <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest mt-1">Current learning metrics and standing</p>
              </div>
              <button onClick={() => navigate('/academy')} className="group flex items-center gap-2 bg-cyber-yellow/10 hover:bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/30 px-4 py-2 font-mono text-[10px] uppercase tracking-widest transition-all">
                Enter Academy <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-white/5 relative z-10 w-full">
              <div className="p-6 flex flex-col items-center justify-center text-center bg-black/20 hover:bg-black/40 transition-colors">
                <Flame className="text-orange-500 mb-2" size={28} />
                <div className="text-3xl font-display font-black text-white">{currentUser.streak || 0}</div>
                <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest mt-1">Day Streak</div>
              </div>
              <div className="p-6 flex flex-col items-center justify-center text-center bg-black/20 hover:bg-black/40 transition-colors">
                <Code className="text-cyber-blue mb-2" size={28} />
                <div className="text-3xl font-display font-black text-white">1</div>
                <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest mt-1">Total Builds</div>
              </div>
              <div className="p-6 flex flex-col items-center justify-center text-center bg-black/20 hover:bg-black/40 transition-colors">
                <div className="font-display font-bold text-purple-400 text-2xl mb-2">{'< />'}</div>
                <div className="text-3xl font-display font-black text-white">12</div>
                <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest mt-1">Lessons</div>
              </div>
              <div className="p-6 flex flex-col items-center justify-center text-center bg-black/20 hover:bg-black/40 transition-colors">
                <Hexagon className="text-cyber-yellow mb-2" size={28} />
                <div className="text-xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-cyber-yellow to-orange-400 mt-1">GENIN</div>
                <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest mt-1">Rank</div>
              </div>
            </div>
          </motion.div>

          {/* Bank Configuration */}
          {isOfficialMember && (
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#050B14] border border-white/10 p-6 md:p-8"
          >
            <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-lg font-display font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                  <CreditCard className="text-white/50" size={20} /> Bank Protocol
                </h3>
                <p className="text-[10px] text-white/40 font-mono mt-1 uppercase tracking-widest">Link your account for financial operations</p>
              </div>
              {!isEditingBank ? (
                <button
                  onClick={() => setIsEditingBank(true)}
                  className="p-2 border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors"
                >
                  <Edit2 size={14} />
                </button>
              ) : (
                <button
                  onClick={handleSaveBank}
                  className="bg-white text-black font-mono font-bold text-[10px] uppercase tracking-widest px-4 py-2 shadow-lg"
                >
                  Save Bank
                </button>
              )}
            </div>

            {isEditingBank ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-white/50 uppercase tracking-widest">Institution</label>
                  <select
                    value={selectedBank?.id || bankId}
                    onChange={e => setBankId(e.target.value)}
                    className="w-full bg-black border border-white/10 px-3 py-3 text-white focus:border-cyber-blue outline-none font-mono text-xs appearance-none transition-colors"
                  >
                    <option value="">-- SELECT BANK --</option>
                    {BANKS.map(b => (
                      <option key={b.id} value={b.id}>{b.shortName} ({b.code}) - {b.bin}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-white/50 uppercase tracking-widest">Bank BIN / ID</label>
                  <input
                    value={bankId}
                    onChange={e => setBankId(e.target.value)}
                    placeholder="970422"
                    className="w-full bg-black border border-white/10 px-3 py-3 text-white focus:border-cyber-blue outline-none font-mono text-xs tracking-widest transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-white/50 uppercase tracking-widest">Account Number</label>
                  <input
                    value={accountNo}
                    onChange={e => setAccountNo(e.target.value)}
                    placeholder="Enter Account Number"
                    className="w-full bg-black border border-white/10 px-3 py-3 text-white focus:border-cyber-blue outline-none font-mono text-xs tracking-widest transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-white/50 uppercase tracking-widest">Account Name</label>
                  <input
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    placeholder="NGUYEN VAN A"
                    className="w-full bg-black border border-white/10 px-3 py-3 text-white focus:border-cyber-blue outline-none font-mono text-xs tracking-widest uppercase transition-colors"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/50 border border-white/5 p-4">
                  <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1">Institution</div>
                  <div className="font-display text-white">
                    {selectedBank ? `${selectedBank.shortName} (${selectedBank.bin})` : bankId || 'Not configured'}
                  </div>
                </div>
                <div className="bg-black/50 border border-white/5 p-4">
                  <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1">Account Number</div>
                  <div className="font-mono text-white tracking-wider">
                    {accountNo ? accountNo.replace(/\d(?=\d{4})/g, '*') : 'Not configured'}
                  </div>
                </div>
                <div className="bg-black/50 border border-white/5 p-4">
                  <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1">Bank Code</div>
                  <div className="font-mono text-white tracking-wider">
                    {selectedBank?.code || 'Not configured'}
                  </div>
                </div>
                <div className="bg-black/50 border border-white/5 p-4">
                  <div className="text-[9px] font-mono text-white/40 uppercase tracking-widest mb-1">Account Name</div>
                  <div className="font-mono text-white tracking-wider uppercase">
                    {accountName || 'Not configured'}
                  </div>
                </div>
              </div>
            )}
            </motion.div>
          )}

          {/* Core Skills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-[#050B14] border border-white/10 p-6 md:p-8"
          >
            <h3 className="text-lg font-display font-bold text-white mb-6 uppercase tracking-wide flex items-center gap-2 border-b border-white/5 pb-4">
              <Hexagon className="text-white/50" size={20} /> Skill Matrix
            </h3>
            <SkillInput
              skills={skills}
              onChange={setSkills}
              maxSkills={5}
            />
          </motion.div>

          {/* Google Auth - Only show if not fully integrated native */}
          {authMethod === 'wallet' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-[#050B14] border border-white/10 p-6 md:p-8"
            >
              <h3 className="text-lg font-display font-bold text-white mb-4 uppercase tracking-wide flex items-center gap-2">
                <Mail className="text-white/50" size={20} /> Auth Redundancy
              </h3>

              {currentUser?.email ? (
                <div className="flex items-center gap-4 bg-green-500/5 border border-green-500/20 p-4">
                  <CheckCircle className="text-green-500" size={20} />
                  <div>
                    <div className="text-[10px] font-mono text-green-500 uppercase tracking-widest">Active Link</div>
                    <div className="text-white text-sm mt-0.5">{currentUser.email}</div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-black p-4 border border-white/5">
                  <div>
                    <div className="text-xs font-mono text-white/80">Account unlinked</div>
                    <div className="text-[10px] text-white/40 mt-1">Enable alternate access vector</div>
                  </div>
                  {isLinkingGoogle ? (
                    <span className="text-white/40 font-mono text-[10px] uppercase">Processing...</span>
                  ) : (
                    <GoogleLogin
                      onSuccess={handleGoogleLinkSuccess}
                      onError={() => alert('Failed')}
                      useOneTap={false}
                      theme="filled_black"
                      size="medium"
                      shape="rectangular"
                    />
                  )}
                </div>
              )}
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}

function ArrowRight(props: any) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
