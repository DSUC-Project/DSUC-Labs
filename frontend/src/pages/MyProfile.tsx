import toast from "react-hot-toast";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Save,
  Upload,
  Github,
  Twitter,
  Send,
  Facebook,
  LogOut,
  CreditCard,
  Mail,
  Link2,
  CheckCircle,
  Edit2,
  Hexagon,
  Trophy,
  Flame,
  Code,
  ArrowRight,
  Globe,
} from "lucide-react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useStore } from "../store/useStore";
import { BANKS } from "../data/mockData";
import { SkillInput } from "../components/SkillInput";
import { GoogleUserInfo } from "../types";
import { SoftBrutalCard } from "@/components/ui/Primitives";

interface GoogleJWTPayload {
  sub: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}

export function MyProfile() {
  const {
    currentUser,
    updateCurrentUser,
    linkGoogleAccount,
    logout,
    authMethod,
    reconnectWallet,
  } = useStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isReconnectingWallet, setIsReconnectingWallet] = useState(false);

  // Local state for form
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [github, setGithub] = useState("");
  const [twitter, setTwitter] = useState("");
  const [telegram, setTelegram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [portfolio, setPortfolio] = useState("");

  // Banking state
  const [bankId, setBankId] = useState("");
  const [accountNo, setAccountNo] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isEditingBank, setIsEditingBank] = useState(false);
  // Social links state
  const [isEditingSocials, setIsEditingSocials] = useState(false);
  // Additional edit states
  const [isEditingIdentity, setIsEditingIdentity] = useState(false);
  const [isEditingSkills, setIsEditingSkills] = useState(false);

  const isOfficialMember = currentUser?.memberType === "member";
  const isOnboarding =
    searchParams.get("onboarding") === "1" ||
    currentUser?.profile_completed === false;
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
      navigate("/");
      return;
    }
    setName(currentUser.name || "");
    setAvatar(currentUser.avatar || "");
    setSkills(currentUser.skills || []);
    setGithub(currentUser.socials?.github || "");
    setTwitter(currentUser.socials?.twitter || "");
    setTelegram(currentUser.socials?.telegram || "");
    setFacebook(currentUser.socials?.facebook || "");
    setPortfolio(currentUser.socials?.portfolio || "");
    setBankId(currentUser.bankInfo?.bankId || "");
    setAccountNo(currentUser.bankInfo?.accountNo || "");
    setAccountName(currentUser.bankInfo?.accountName || currentUser.name || "");
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
      toast.error(
        "Please complete basic profile information: name and at least one skill or social link.",
      );
      return;
    }

    try {
      const updates: any = {};

      if (name !== currentUser.name) updates.name = name;
      if (avatar !== currentUser.avatar) updates.avatar = avatar;
      if (skills !== currentUser.skills) updates.skills = skills;

      if (
        github !== (currentUser.socials?.github || "") ||
        twitter !== (currentUser.socials?.twitter || "") ||
        telegram !== (currentUser.socials?.telegram || "") ||
        facebook !== (currentUser.socials?.facebook || "")
      ) {
        updates.socials = { github, twitter, telegram, facebook };
      }

      if (
        isOfficialMember &&
        (bankId !== (currentUser.bankInfo?.bankId || "") ||
          accountNo !== (currentUser.bankInfo?.accountNo || "") ||
          accountName !==
            (currentUser.bankInfo?.accountName || currentUser.name || ""))
      ) {
        updates.bankInfo =
          bankId && accountNo ? { bankId, accountNo, accountName } : null;
      }

      if (isOnboarding) updates.profile_completed = true;

      // Ensure we only update if there's changes to save
      if (Object.keys(updates).length > 0) {
        await updateCurrentUser(updates);
      }
      setIsEditingSocials(false);
      setIsEditingBank(false);
      toast.success("Profile updated successfully");
      if (isOnboarding) {
        navigate("/home", { replace: true });
      }
    } catch (err) {
      console.error("[MyProfile] Save failed:", err);
      toast.error("Failed to update profile. Please check console.");
    }
  };

  const handleSaveIdentity = async () => {
    try {
      if (name.trim().length < 2) {
        toast.error("Name must be at least 2 characters.");
        return;
      }
      const updates: any = {};
      if (name !== currentUser.name) updates.name = name;
      if (avatar !== currentUser.avatar) updates.avatar = avatar;
      if (Object.keys(updates).length > 0) {
        await updateCurrentUser(updates);
      }
      setIsEditingIdentity(false);
      toast.success("Identity updated successfully");
    } catch (err) {
      toast.error("Failed to update identity.");
    }
  };

  const handleSaveSkills = async () => {
    try {
      const updates: any = {};
      if (skills !== currentUser.skills) updates.skills = skills;
      if (Object.keys(updates).length > 0) {
        await updateCurrentUser(updates);
      }
      setIsEditingSkills(false);
      toast.success("Skills updated successfully");
    } catch (err) {
      toast.error("Failed to update skills.");
    }
  };

  const handleSaveSocials = async () => {
    try {
      await updateCurrentUser({
        socials: { github, twitter, telegram, facebook, portfolio },
      });
      setIsEditingSocials(false);
    } catch (err) {
      toast.error("Failed to update social links.");
    }
  };

  const handleSaveBank = async () => {
    if (!isOfficialMember) {
      return;
    }

    try {
      await updateCurrentUser({
        bankInfo:
          bankId && accountNo
            ? {
                bankId,
                accountNo,
                accountName: accountName || name,
              }
            : undefined,
      });
      setIsEditingBank(false);
    } catch (err) {
      toast.error("Failed to update bank account.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleReconnectWallet = async () => {
    setIsReconnectingWallet(true);
    try {
      await reconnectWallet();
    } finally {
      setIsReconnectingWallet(false);
    }
  };

  const handleGoogleLinkSuccess = async (
    credentialResponse: CredentialResponse,
  ) => {
    if (!credentialResponse.credential) return;

    setIsLinkingGoogle(true);
    try {
      const decoded = jwtDecode<GoogleJWTPayload>(
        credentialResponse.credential,
      );
      const googleUserInfo: GoogleUserInfo = {
        email: decoded.email,
        google_id: decoded.sub,
        name: decoded.name,
        avatar: decoded.picture,
      };
      await linkGoogleAccount(googleUserInfo);
    } catch (error) {
      toast.error("Failed to link Google account. Please try again.");
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen pt-10 pb-32 max-w-6xl mx-auto px-4 sm:px-6 overflow-x-hidden bg-main-bg">
      {isOnboarding && (
        <div className="mb-8 bg-surface  p-6 rounded-lg shadow-sm">
          <div className="text-xs font-bold uppercase tracking-widest text-primary mb-2">
            First Time Setup
          </div>
          <p className="text-text-muted font-medium text-sm">
            Please complete your profile. Add your name and at least one skill
            or contact information, then click Save Changes.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end  pb-6 mb-8 mt-4 gap-6">
        <div>
          <h2 className="text-4xl sm:text-5xl font-display font-bold tracking-tight uppercase text-text-main">
            MY PROFILE
          </h2>
          <p className="text-text-muted font-bold text-sm mt-4 border-l-2 border-primary pl-4">
            Manage your identity and personal information.
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <button
            onClick={handleLogout}
            className="flex-1 md:flex-none border border-border-main hover:bg-main-bg text-red-500 font-bold text-xs uppercase tracking-wider px-6 py-4 flex items-center justify-center gap-2 transition-colors shadow-sm bg-surface"
          >
            <LogOut size={20} /> Log Out
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
          >
            <SoftBrutalCard className="p-8 relative group overflow-hidden">
              <div className="flex justify-end mb-4 relative z-10">
                {!isEditingIdentity ? (
                  <button
                    onClick={() => setIsEditingIdentity(true)}
                    className="p-2 border border-border-main bg-surface text-text-main hover:bg-main-bg transition-colors shadow-sm"
                  >
                    <Edit2 size={18} />
                  </button>
                ) : (
                  <button
                    onClick={handleSaveIdentity}
                    className="bg-primary border border-border-main text-main-bg font-bold text-xs uppercase tracking-wider px-4 py-2 shadow-sm hover:opacity-90 transition-colors"
                  >
                    Save
                  </button>
                )}
              </div>
              <div className="flex flex-col items-center relative z-10">
                <div className="w-32 h-32 p-1 border border-border-main mb-6 relative group/avatar bg-main-bg shadow-sm transition-transform duration-500 hover:scale-105">
                  <img
                    src={
                      avatar || `https://i.pravatar.cc/150?u=${currentUser.id}`
                    }
                    alt="Avatar"
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                  {isEditingIdentity && (
                    <label className="absolute inset-0 bg-text-main/80 flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                      <Upload className="text-white mb-1" size={24} />
                      <span className="text-[10px] font-bold text-white uppercase tracking-widest mt-1">
                        Edit
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  )}
                </div>

                <div className="mb-6 flex w-fit items-center gap-2 border border-border-main bg-primary px-4 py-2 font-bold uppercase tracking-widest text-main-bg shadow-sm">
                  <Flame className="text-main-bg" size={18} />
                  <span className="font-display text-2xl leading-none">
                    {currentUser.streak || 0}
                  </span>
                  <span className="text-[10px]">days</span>
                </div>

                <div className="w-full space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-main uppercase tracking-widest pl-1">
                      Display Name
                    </label>
                    {isEditingIdentity ? (
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-main-bg border border-border-main px-4 py-3 text-text-main outline-none font-display font-bold text-lg transition-colors shadow-sm focus:border-cyan-400"
                      />
                    ) : (
                      <div className="w-full bg-main-bg border border-border-main px-4 py-3 text-text-main font-display font-bold text-lg shadow-sm truncate">
                        {name || "Not provided"}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-text-main uppercase tracking-widest pl-1">
                      Member Tier
                    </label>
                    <div className="w-full bg-primary border border-border-main px-4 py-3 text-main-bg font-bold text-sm uppercase tracking-wider flex items-center justify-between shadow-sm">
                      <span>
                        {currentUser.memberType === "community"
                          ? "Community"
                          : currentUser.role}
                      </span>
                      <Hexagon size={20} className="text-main-bg" />
                    </div>
                  </div>
                </div>
              </div>
            </SoftBrutalCard>
          </motion.div>

          {currentUser.wallet_address && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-surface border border-border-main p-8 rounded-lg shadow-sm"
            >
              <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4 flex items-center gap-2">
                <Hexagon size={16} className="text-primary" /> Wallet Connection
              </h3>
              <div className="text-xs font-mono text-text-muted break-all mb-6 bg-surface p-4 rounded-lg border border-border-main">
                {currentUser.wallet_address}
              </div>
              <button
                onClick={handleReconnectWallet}
                disabled={isReconnectingWallet}
                className="w-full bg-surface hover:bg-main-bg border border-border-main text-text-main font-bold text-xs uppercase tracking-wider py-3 rounded-lg transition-colors shadow-sm disabled:opacity-60"
              >
                {isReconnectingWallet ? "Reconnecting..." : "Reconnect Wallet"}
              </button>
            </motion.div>
          )}

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SoftBrutalCard intent="accent" className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-display font-bold text-text-main flex items-center gap-2">
                    <Link2 size={24} className="text-accent" /> Social Links
                  </h3>
                </div>
                {!isEditingSocials ? (
                  <button
                    onClick={() => setIsEditingSocials(true)}
                    className="p-2 border border-border-main bg-accent text-main-bg hover:opacity-90 transition-colors shadow-sm "
                  >
                    <Edit2 size={18} />
                  </button>
                ) : (
                  <button
                    onClick={handleSaveSocials}
                    className="bg-accent border border-border-main text-main-bg font-bold text-xs uppercase tracking-wider px-4 py-2 shadow-sm hover:opacity-90 transition-colors "
                  >
                    Save
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {[
                  {
                    icon: Github,
                    value: github,
                    setter: setGithub,
                    placeholder: "github.com/username",
                    label: "GitHub",
                  },
                  {
                    icon: Twitter,
                    value: twitter,
                    setter: setTwitter,
                    placeholder: "x.com/username",
                    label: "X (Twitter)",
                  },
                  {
                    icon: Send,
                    value: telegram,
                    setter: setTelegram,
                    placeholder: "t.me/username",
                    label: "Telegram",
                  },
                  {
                    icon: Facebook,
                    value: facebook,
                    setter: setFacebook,
                    placeholder: "facebook.com/username",
                    label: "Facebook",
                  },
                  {
                    icon: Globe,
                    value: portfolio,
                    setter: setPortfolio,
                    placeholder: "https://your-portfolio.com",
                    label: "Portfolio",
                  },
                ].map((social, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 py-3 focus-within:text-accent transition-colors"
                  >
                    <social.icon
                      className="text-text-main flex-shrink-0"
                      size={20}
                    />
                    {isEditingSocials ? (
                      <input
                        type="text"
                        value={social.value}
                        onChange={(e) => social.setter(e.target.value)}
                        placeholder={social.placeholder}
                        className="flex-1 bg-surface border border-border-main px-4 py-2 outline-none font-bold text-sm placeholder:text-text-muted focus:border-cyan-400"
                      />
                    ) : (
                      <div className="flex-1 font-bold text-sm truncate">
                        {social.value ? (
                          <a
                            href={`https://${social.value.replace(/https?:\/\//, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-text-main hover:text-accent transition-colors"
                          >
                            {social.value}
                          </a>
                        ) : (
                          <span className="text-text-muted">Not provided</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SoftBrutalCard>
          </motion.div>
        </div>

        {/* Right Column: Content */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Academy Progress Redesign */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-full"
          >
            <SoftBrutalCard intent="default" className="overflow-hidden p-0 w-full bg-surface text-text-main border-2 border-text-main relative z-10">
              <div className="p-8 flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border-main relative z-10 gap-6">
                <div>
                  <h3 className="text-2xl font-display font-bold flex items-center gap-3">
                    <Trophy size={32} />
                    Learning Progress
                  </h3>
                  <p className="font-bold text-sm mt-2 text-text-muted">
                    Overview of your learning journey and achievements.
                  </p>
                </div>
                <button
                  onClick={() => navigate("/academy")}
                  className="group flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-main-bg border border-border-main shadow-[4px_4px_0_0_#000] px-6 py-4 font-bold text-xs uppercase tracking-wider transition-all hover:shadow-[6px_6px_0_0_#000] hover:-translate-y-1 hover:-translate-x-1"
                >
                  Go to Academy{" "}
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform border-l border-current pl-1"
                  />
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border-main relative z-10 w-full">
                <div className="p-8 flex flex-col items-center justify-center text-center hover:bg-black/10 transition-colors">
                  <Flame className="mb-3" size={32} />
                  <div className="text-4xl font-display font-bold">
                    {currentUser.streak || 0}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest mt-2 pt-2 w-full">
                    Learning Streak
                  </div>
                </div>
                <div className="p-8 flex flex-col items-center justify-center text-center hover:bg-black/10 transition-colors">
                  <Code className="mb-3" size={32} />
                  <div className="text-4xl font-display font-bold">
                    1
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest mt-2 pt-2 w-full">
                    Projects Completed
                  </div>
                </div>
                <div className="p-8 flex flex-col items-center justify-center text-center hover:bg-black/10 transition-colors">
                  <div className="font-display font-bold text-3xl mb-3">
                    {"< />"}
                  </div>
                  <div className="text-4xl font-display font-bold">
                    12
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest mt-2 pt-2 w-full">
                    Lessons
                  </div>
                </div>
                <div className="p-8 flex flex-col items-center justify-center text-center hover:bg-black/10 transition-colors group">
                  <Hexagon
                    className="mb-3"
                    size={32}
                  />
                  <div className="text-2xl font-display font-bold mt-1">
                    GENIN
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest mt-2 pt-2 w-full">
                    Rank
                  </div>
                </div>
              </div>
            </SoftBrutalCard>
          </motion.div>

          {/* Bank Configuration */}
          {isOfficialMember && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <SoftBrutalCard intent="accent" className="p-8">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-xl font-display font-bold text-text-main flex items-center gap-3">
                      <CreditCard className="text-accent" size={24} /> BANK
                      DETAILS
                    </h3>
                    <p className="text-sm text-text-muted font-bold mt-2">
                      Set up your bank account for support or project funding.
                    </p>
                  </div>
                  {!isEditingBank ? (
                    <button
                      onClick={() => setIsEditingBank(true)}
                      className="p-3 border border-border-main bg-accent text-main-bg hover:opacity-90 transition-colors shadow-sm "
                    >
                      <Edit2 size={24} />
                    </button>
                  ) : (
                    <button
                      onClick={handleSaveBank}
                      className="bg-accent border border-border-main text-main-bg font-bold text-xs uppercase tracking-wider px-6 py-4 shadow-sm hover:opacity-90 transition-colors "
                    >
                      Save Bank
                    </button>
                  )}
                </div>

              {isEditingBank ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-main uppercase tracking-widest ml-1">
                      Bank
                    </label>
                    <select
                      value={selectedBank?.id || bankId}
                      onChange={(e) => setBankId(e.target.value)}
                      className="w-full bg-surface border border-border-main px-4 py-3 text-text-main focus:border-cyan-400 outline-none font-bold text-sm transition-colors shadow-sm appearance-none"
                    >
                      <option value="">-- SELECT BANK --</option>
                      {BANKS.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.shortName} ({b.code}) - {b.bin}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-main uppercase tracking-widest ml-1">
                      Account Number
                    </label>
                    <input
                      value={accountNo}
                      onChange={(e) => setAccountNo(e.target.value)}
                      placeholder="Enter account number"
                      className="w-full bg-surface border border-border-main px-4 py-3 text-text-main focus:border-cyan-400 outline-none font-bold text-sm transition-colors shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-main uppercase tracking-widest ml-1">
                      Bank Code (BIN)
                    </label>
                    <input
                      value={bankId}
                      onChange={(e) => setBankId(e.target.value)}
                      placeholder="e.g., 970422"
                      className="w-full bg-surface border border-border-main px-4 py-3 text-text-main focus:border-cyan-400 outline-none font-bold text-sm transition-colors shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-main uppercase tracking-widest ml-1">
                      Account Holder Name
                    </label>
                    <input
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="NGUYEN VAN A"
                      className="w-full bg-surface border border-border-main px-4 py-3 text-text-main focus:border-cyan-400 outline-none font-bold uppercase text-sm transition-colors shadow-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-main uppercase tracking-widest ml-1">
                      Bank
                    </label>
                    <div className="w-full bg-main-bg border border-border-main px-4 py-3 font-display font-bold text-text-main text-sm shadow-sm">
                      {selectedBank
                        ? `${selectedBank.shortName} (${selectedBank.bin})`
                        : bankId || "Not Setup"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-main uppercase tracking-widest ml-1">
                      Account Number
                    </label>
                    <div className="w-full bg-main-bg border border-border-main px-4 py-3 font-mono font-bold text-text-main text-sm shadow-sm tracking-wider">
                      {accountNo
                        ? accountNo.replace(/\d(?=\d{4})/g, "*")
                        : "Not Setup"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-main uppercase tracking-widest ml-1">
                      Bank Code (BIN)
                    </label>
                    <div className="w-full bg-main-bg border border-border-main px-4 py-3 font-mono font-bold text-text-main text-sm shadow-sm tracking-wider">
                      {selectedBank?.code || "Not Setup"}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-main uppercase tracking-widest ml-1">
                      Account Holder Name
                    </label>
                    <div className="w-full bg-main-bg border border-border-main px-4 py-3 font-bold text-text-main text-sm shadow-sm uppercase">
                      {accountName || "Not Setup"}
                    </div>
                  </div>
                </div>
              )}
              </SoftBrutalCard>
            </motion.div>
          )}

          {/* Core Skills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-surface border border-border-main p-8 shadow-sm"
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-display font-bold text-text-main flex items-center gap-3 uppercase">
                  <Hexagon className="text-primary" size={24} /> Skills & Expertise
                </h3>
                <p className="text-sm text-text-muted font-bold mt-2">
                  Add multiple skills to showcase your expertise (e.g., TypeScript, React, System Design, UX/UI).
                </p>
              </div>
              {!isEditingSkills ? (
                <button
                  onClick={() => setIsEditingSkills(true)}
                  className="p-2 border border-border-main bg-surface text-text-main hover:bg-main-bg transition-colors shadow-sm ml-4 shrink-0"
                >
                  <Edit2 size={18} />
                </button>
              ) : (
                <button
                  onClick={handleSaveSkills}
                  className="bg-primary border border-border-main text-main-bg font-bold text-xs uppercase tracking-wider px-4 py-2 shadow-sm hover:opacity-90 transition-colors ml-4 shrink-0"
                >
                  Save
                </button>
              )}
            </div>
            
            {isEditingSkills ? (
              <SkillInput skills={skills} onChange={setSkills} maxSkills={5} />
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? (
                  skills.map((skill) => (
                    <div
                      key={skill}
                      className="flex items-center gap-2 bg-main-bg border border-border-main px-3 py-1.5 shadow-sm"
                    >
                      <span className="font-mono text-xs font-bold uppercase text-text-main">
                        {skill}
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-text-muted font-mono text-xs">No skills added yet.</span>
                )}
              </div>
            )}
          </motion.div>

          {/* Google Auth - Only show if not fully integrated native */}
          {authMethod === "wallet" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-surface border border-border-main p-8 shadow-sm mt-6"
            >
              <h3 className="text-xl font-display font-bold text-text-main mb-6 flex items-center gap-3">
                <Mail className="text-primary" size={24} /> FALLBACK LOGIN
                METHOD
              </h3>

              {currentUser?.email ? (
                <div className="flex items-center gap-4 bg-emerald-400/10 border border-border-main p-5 shadow-sm">
                  <CheckCircle className="text-emerald-500" size={32} />
                  <div>
                    <div className="text-xs font-bold text-text-main uppercase tracking-widest">
                      Linked
                    </div>
                    <div className="text-text-main font-bold mt-1 text-lg">
                      {currentUser.email}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-surface p-6 border border-border-main shadow-sm gap-4 relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="font-bold text-text-main text-xl tracking-tight uppercase">
                      Account not linked
                    </div>
                    <div className="text-sm font-bold text-text-muted mt-1">
                      Recommended for account recovery to avoid lost access.
                    </div>
                  </div>
                  <div className="relative z-10 shrink-0">
                    {isLinkingGoogle ? (
                      <span className="text-text-main font-bold text-xs uppercase tracking-widest px-4 py-2 bg-primary/10 border border-border-main shadow-sm">
                        Processing...
                      </span>
                    ) : (
                      <div className="bg-surface p-1 shadow-sm border border-border-main inline-block">
                        <GoogleLogin
                          onSuccess={handleGoogleLinkSuccess}
                          onError={() => toast.error("Failed")}
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
