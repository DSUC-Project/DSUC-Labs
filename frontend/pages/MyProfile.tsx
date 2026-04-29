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
      alert('Vui lòng hoàn thiện hồ sơ cơ bản: tên và ít nhất một kỹ năng hoặc mạng xã hội.');
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
      alert('Cập nhật hồ sơ thành công');
      if (isOnboarding) {
        navigate('/home', { replace: true });
      }
    } catch (err) {
      console.error('[MyProfile] Save failed:', err);
      alert('Lỗi cập nhật hồ sơ. Vui lòng kiểm tra console.');
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
    } catch (err) {
       alert('Cập nhật tài khoản ngân hàng thất bại.');
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
      alert('Liên kết tài khoản Google thất bại. Vui lòng thử lại.');
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen pt-10 pb-32 max-w-6xl mx-auto px-4 sm:px-6 overflow-x-hidden">
      {isOnboarding && (
        <div className="mb-8 bg-sky-50 border border-sky-100 p-6 rounded-2xl shadow-sm">
          <div className="text-[11px] font-bold uppercase tracking-widest text-sky-600 mb-2">
            Thiết lập lần đầu
          </div>
          <p className="text-slate-600 font-medium text-sm">
            Vui lòng hoàn thiện hồ sơ của bạn trước khi truy cập ứng dụng. Thêm tên và ít nhất một kỹ năng hoặc thông tin liên lạc, sau đó nhấn Lưu Thay Đổi.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-4 border-brutal-black pb-6 mb-8 mt-4 gap-6">
        <div>
          <h2 className="text-4xl sm:text-5xl font-display font-black text-brutal-black tracking-tight uppercase decoration-brutal-pink decoration-4 underline underline-offset-4">HỒ SƠ CỦA TÔI</h2>
          <p className="text-brutal-black font-bold text-sm mt-4 border-l-4 border-brutal-yellow pl-4">Quản lý định danh và thông tin cá nhân của bạn.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button
            onClick={handleLogout}
            className="flex-1 md:flex-none brutal-btn bg-brutal-red text-white hover:bg-brutal-pink hover:text-brutal-black font-black text-xs uppercase tracking-wider px-6 py-4 flex items-center justify-center gap-2 transition-colors border-4 border-brutal-black shadow-neo-sm"
          >
            <LogOut size={20} /> Đăng Xuất
          </button>
          <button
            onClick={handleSaveAll}
            className="flex-1 md:flex-none brutal-btn bg-brutal-blue hover:bg-brutal-yellow text-white hover:text-brutal-black font-black text-xs px-6 py-4 flex items-center justify-center gap-2 transition-all uppercase tracking-wider border-4 border-brutal-black shadow-neo-sm"
          >
            <Save size={20} /> Lưu Thay Đổi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Identity & Socials */}
        <div className="lg:col-span-4 flex flex-col gap-6">

          {/* Identity Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-4 border-brutal-black p-8 shadow-neo relative group overflow-hidden brutal-card"
          >
            <div className="flex flex-col items-center relative z-10">
              <div className="w-32 h-32 p-1 border-4 border-brutal-black mb-6 relative group/avatar bg-brutal-yellow shadow-neo-sm transition-transform duration-500 hover:scale-105">
                <img src={avatar || `https://i.pravatar.cc/150?u=${currentUser.id}`} alt="Avatar" className="w-full h-full object-cover transition-all duration-300" />
                <label className="absolute inset-0 bg-brutal-black/80 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                  <Upload className="text-white mb-1" size={24} />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest mt-1">Sửa</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>

              <div className="mb-6 flex w-fit items-center gap-2 border-4 border-brutal-black bg-brutal-pink px-4 py-2 font-black uppercase tracking-widest text-brutal-black shadow-neo-sm">
                <Flame size={18} className="text-brutal-black" />
                <span className="font-display text-2xl leading-none">{currentUser.streak || 0}</span>
                <span className="text-[10px]">ngày</span>
              </div>

              <div className="w-full space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-brutal-black uppercase tracking-widest pl-1">Tên hiển thị</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-white border-4 border-brutal-black px-4 py-3 text-brutal-black focus:bg-brutal-pink focus:outline-none font-display font-black text-lg transition-colors shadow-neo-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-brutal-black uppercase tracking-widest pl-1">Cấp độ thành viên</label>
                  <div className="w-full bg-brutal-blue border-4 border-brutal-black px-4 py-3 text-white font-black text-sm uppercase tracking-wider flex items-center justify-between shadow-neo-sm">
                    <span>{currentUser.memberType === 'community' ? 'Cộng đồng' : currentUser.role}</span>
                    <Hexagon size={20} className="text-white" />
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
              className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-sm"
            >
              <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Hexagon size={16} className="text-slate-400" /> Lk Ví Điện Tử
              </h3>
              <div className="text-xs font-mono text-slate-600 break-all mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                {currentUser.wallet_address}
              </div>
              <button
                onClick={handleReconnectWallet}
                disabled={isReconnectingWallet}
                className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-colors shadow-sm disabled:opacity-60"
              >
                {isReconnectingWallet ? 'Đang kết nối lại...' : 'Kết nối lại Ví'}
              </button>
            </motion.div>
          )}

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border-4 border-brutal-black p-8 shadow-neo-sm"
          >
            <h3 className="text-xs font-black text-brutal-black uppercase tracking-widest mb-6 flex items-center gap-2">
              <Link2 size={16} className="text-brutal-pink" /> Liên Kết Mạng Xã Hội
            </h3>
            <div className="space-y-4">
              {[
                { icon: Github, value: github, setter: setGithub, placeholder: 'github.com/username' },
                { icon: Twitter, value: twitter, setter: setTwitter, placeholder: 'x.com/username' },
                { icon: Send, value: telegram, setter: setTelegram, placeholder: 't.me/username' },
                { icon: Facebook, value: facebook, setter: setFacebook, placeholder: 'facebook.com/username' },
              ].map((social, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white border-4 border-brutal-black px-3 py-2 focus-within:bg-brutal-green transition-colors shadow-neo-sm">
                  <social.icon className="text-brutal-black shrink-0" size={20} />
                  <input
                    type="text"
                    value={social.value}
                    onChange={e => social.setter(e.target.value)}
                    placeholder={social.placeholder}
                    className="flex-1 bg-transparent text-brutal-black outline-none font-bold text-sm placeholder:text-gray-500"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Content */}
        <div className="lg:col-span-8 flex flex-col gap-6">

          {/* Academy Progress Redesign */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-brutal-yellow border-4 border-brutal-black relative overflow-hidden shadow-neo"
          >
            <div className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-brutal-black relative z-10 gap-6">
              <div>
                <h3 className="text-2xl font-display font-black text-brutal-black uppercase flex items-center gap-3">
                  <Trophy className="text-brutal-black" size={32} />
                  Tiến độ học tập
                </h3>
                <p className="text-brutal-black font-bold text-sm mt-2">Tổng quan quá trình và thành tích của bạn</p>
              </div>
              <button onClick={() => navigate('/academy')} className="group flex items-center justify-center gap-2 bg-brutal-pink hover:bg-brutal-blue text-brutal-black hover:text-white border-4 border-brutal-black shadow-neo px-6 py-4 font-black text-xs uppercase tracking-wider transition-all brutal-btn">
                Vào Học Viện <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform border-l-2 border-current pl-1" />
              </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x-4 divide-y-4 lg:divide-y-0 divide-brutal-black relative z-10 w-full bg-white">
              <div className="p-8 flex flex-col items-center justify-center text-center hover:bg-brutal-pink transition-colors">
                <Flame className="text-brutal-black mb-3" size={32} />
                <div className="text-4xl font-display font-black text-brutal-black">{currentUser.streak || 0}</div>
                <div className="text-[10px] font-black text-brutal-black uppercase tracking-widest mt-2 border-t-2 border-brutal-black pt-2 w-full">Chuỗi ngày học</div>
              </div>
              <div className="p-8 flex flex-col items-center justify-center text-center hover:bg-brutal-green transition-colors">
                <Code className="text-brutal-black mb-3" size={32} />
                <div className="text-4xl font-display font-black text-brutal-black">1</div>
                <div className="text-[10px] font-black text-brutal-black uppercase tracking-widest mt-2 border-t-2 border-brutal-black pt-2 w-full">Dự án hoàn thành</div>
              </div>
              <div className="p-8 flex flex-col items-center justify-center text-center hover:bg-brutal-gold transition-colors">
                <div className="font-display font-black text-brutal-black text-3xl mb-3">{'< />'}</div>
                <div className="text-4xl font-display font-black text-brutal-black">12</div>
                <div className="text-[10px] font-black text-brutal-black uppercase tracking-widest mt-2 border-t-2 border-brutal-black pt-2 w-full">Bài học</div>
              </div>
              <div className="p-8 flex flex-col items-center justify-center text-center hover:bg-brutal-blue hover:text-white transition-colors group">
                <Hexagon className="text-brutal-black group-hover:text-white mb-3" size={32} />
                <div className="text-2xl font-display font-black text-brutal-black group-hover:text-white mt-1">GENIN</div>
                <div className="text-[10px] font-black text-brutal-black group-hover:text-white uppercase tracking-widest mt-2 border-t-2 border-current pt-2 w-full">Danh hiệu</div>
              </div>
            </div>
          </motion.div>

          {/* Bank Configuration */}
          {isOfficialMember && (
            <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white border-4 border-brutal-black p-8 shadow-neo"
          >
            <div className="flex justify-between items-start mb-8 border-b-4 border-brutal-black pb-5">
              <div>
                <h3 className="text-xl font-display font-black text-brutal-black flex items-center gap-3">
                  <CreditCard className="text-brutal-blue" size={24} /> THÔNG TIN NGÂN HÀNG
                </h3>
                <p className="text-sm text-brutal-black font-bold mt-2">Thiết lập tài khoản để nhận hỗ trợ hoặc quỹ dự án</p>
              </div>
              {!isEditingBank ? (
                <button
                  onClick={() => setIsEditingBank(true)}
                  className="p-3 border-4 border-brutal-black bg-brutal-yellow text-brutal-black hover:bg-brutal-pink transition-colors shadow-neo-sm brutal-btn"
                >
                  <Edit2 size={24} />
                </button>
              ) : (
                <button
                  onClick={handleSaveBank}
                  className="bg-brutal-green border-4 border-brutal-black text-brutal-black font-black text-xs uppercase tracking-wider px-6 py-4 shadow-neo-sm hover:bg-brutal-blue hover:text-white transition-colors brutal-btn"
                >
                  Lưu Ngân Hàng
                </button>
              )}
            </div>

            {isEditingBank ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-brutal-black uppercase tracking-widest ml-1">Ngân hàng</label>
                  <select
                    value={selectedBank?.id || bankId}
                    onChange={e => setBankId(e.target.value)}
                    className="w-full bg-white border-4 border-brutal-black px-4 py-3 text-brutal-black focus:bg-brutal-pink outline-none font-bold text-sm transition-colors shadow-neo-sm appearance-none"
                  >
                    <option value="">-- CHỌN NGÂN HÀNG --</option>
                    {BANKS.map(b => (
                      <option key={b.id} value={b.id}>{b.shortName} ({b.code}) - {b.bin}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-brutal-black uppercase tracking-widest ml-1">Mã Ngân Hàng (BIN)</label>
                  <input
                    value={bankId}
                    onChange={e => setBankId(e.target.value)}
                    placeholder="Ví dụ: 970422"
                    className="w-full bg-white border-4 border-brutal-black px-4 py-3 text-brutal-black focus:bg-brutal-pink outline-none font-bold text-sm transition-colors shadow-neo-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-brutal-black uppercase tracking-widest ml-1">Số Tài Khoản</label>
                  <input
                    value={accountNo}
                    onChange={e => setAccountNo(e.target.value)}
                    placeholder="Nhập số tài khoản"
                    className="w-full bg-white border-4 border-brutal-black px-4 py-3 text-brutal-black focus:bg-brutal-pink outline-none font-bold text-sm transition-colors shadow-neo-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-brutal-black uppercase tracking-widest ml-1">Tên Chủ Tài Khoản</label>
                  <input
                    value={accountName}
                    onChange={e => setAccountName(e.target.value)}
                    placeholder="NGUYEN VAN A"
                    className="w-full bg-white border-4 border-brutal-black px-4 py-3 text-brutal-black focus:bg-brutal-pink outline-none font-bold uppercase text-sm transition-colors shadow-neo-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-brutal-pink border-4 border-brutal-black p-5 shadow-neo-sm">
                  <div className="text-[10px] font-black text-brutal-black uppercase tracking-widest mb-2 border-b-2 border-brutal-black pb-1">Ngân Hàng</div>
                  <div className="font-display font-black text-brutal-black text-lg">
                    {selectedBank ? `${selectedBank.shortName} (${selectedBank.bin})` : bankId || 'Chưa thiết lập'}
                  </div>
                </div>
                <div className="bg-brutal-yellow border-4 border-brutal-black p-5 shadow-neo-sm">
                  <div className="text-[10px] font-black text-brutal-black uppercase tracking-widest mb-2 border-b-2 border-brutal-black pb-1">Số Tài Khoản</div>
                  <div className="font-mono text-brutal-black font-black text-lg tracking-wider">
                    {accountNo ? accountNo.replace(/\d(?=\d{4})/g, '*') : 'Chưa thiết lập'}
                  </div>
                </div>
                <div className="bg-brutal-green border-4 border-brutal-black p-5 shadow-neo-sm">
                  <div className="text-[10px] font-black text-brutal-black uppercase tracking-widest mb-2 border-b-2 border-brutal-black pb-1">Mã Ngân Hàng</div>
                  <div className="font-mono text-brutal-black font-black text-lg tracking-wider">
                    {selectedBank?.code || 'Chưa thiết lập'}
                  </div>
                </div>
                <div className="bg-brutal-blue border-4 border-brutal-black p-5 shadow-neo-sm">
                  <div className="text-[10px] font-black text-white uppercase tracking-widest mb-2 border-b-2 border-white pb-1">Chủ Tài Khoản</div>
                  <div className="font-black text-white text-lg uppercase">
                    {accountName || 'Chưa thiết lập'}
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
            className="bg-white border-4 border-brutal-black p-8 shadow-neo"
          >
            <h3 className="text-xl font-display font-black text-brutal-black mb-6 flex items-center gap-3 border-b-4 border-brutal-black pb-5 uppercase">
              <Hexagon className="text-brutal-pink" size={24} /> Kỹ Năng / Chuyên Môn
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
              className="bg-white border-4 border-brutal-black p-8 shadow-neo-sm mt-6"
            >
              <h3 className="text-xl font-display font-black text-brutal-black mb-6 flex items-center gap-3">
                <Mail className="text-brutal-blue" size={24} /> PHƯƠNG THỨC ĐĂNG NHẬP DỰ PHÒNG
              </h3>

              {currentUser?.email ? (
                <div className="flex items-center gap-4 bg-brutal-green border-4 border-brutal-black p-5 shadow-neo-sm">
                  <CheckCircle className="text-brutal-black" size={32} />
                  <div>
                    <div className="text-xs font-black text-brutal-black uppercase tracking-widest">Đã Liên Kết</div>
                    <div className="text-brutal-black font-bold mt-1 text-lg">{currentUser.email}</div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-6 border-4 border-brutal-black shadow-neo-sm gap-4 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="font-black text-brutal-black text-xl tracking-tight uppercase">Tài khoản chưa được liên kết</div>
                    <div className="text-sm font-bold text-gray-600 mt-1">Nên thêm phương thức dự phòng để tránh mất quyền truy cập</div>
                  </div>
                  <div className="relative z-10 shrink-0">
                    {isLinkingGoogle ? (
                      <span className="text-brutal-black font-black text-xs uppercase tracking-widest px-4 py-2 bg-brutal-yellow border-4 border-brutal-black shadow-neo-sm">Đang xử lý...</span>
                    ) : (
                      <div className="bg-white p-1 shadow-neo-sm border-4 border-brutal-black inline-block">
                        <GoogleLogin
                          onSuccess={handleGoogleLinkSuccess}
                          onError={() => alert('Thất bại')}
                          useOneTap={false}
                          theme="outline"
                          size="medium"
                          shape="rectangular"
                        />
                      </div>
                    )}
                  </div>
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
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
