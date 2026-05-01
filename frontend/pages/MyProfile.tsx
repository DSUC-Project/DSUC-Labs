import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Facebook,
  Github,
  LogOut,
  Mail,
  Save,
  Send,
  Twitter,
  Upload,
  Wallet,
} from 'lucide-react';
import { GoogleLogin, type CredentialResponse } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

import { SkillInput } from '@/components/SkillInput';
import { ActionButton, PageHeader, SectionHeader, StatusBadge, SurfaceCard } from '@/components/ui/Primitives';
import { BANKS } from '@/data/mockData';
import { useStore } from '@/store/useStore';
import type { GoogleUserInfo } from '@/types';

interface GoogleJWTPayload {
  sub: string;
  email: string;
  name: string;
  picture: string;
  email_verified: boolean;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function isOfficialMember(memberType?: string) {
  return memberType === 'member';
}

export function MyProfile() {
  const {
    currentUser,
    updateCurrentUser,
    linkGoogleAccount,
    logout,
    authMethod,
    reconnectWallet,
    addToast,
  } = useStore();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [isReconnectingWallet, setIsReconnectingWallet] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>('idle');

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [github, setGithub] = useState('');
  const [twitter, setTwitter] = useState('');
  const [telegram, setTelegram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [bankId, setBankId] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNo, setAccountNo] = useState('');

  const isOnboarding =
    searchParams.get('onboarding') === '1' || currentUser?.profile_completed === false;
  const memberType = currentUser?.memberType || currentUser?.member_type || 'community';
  const officialMember = isOfficialMember(memberType);
  const selectedBank = BANKS.find((bank) => bank.id === bankId) || null;

  const hasProfileBasics = useMemo(
    () =>
      name.trim().length >= 2 &&
      (skills.length > 0 ||
        github.trim().length > 0 ||
        twitter.trim().length > 0 ||
        telegram.trim().length > 0 ||
        facebook.trim().length > 0),
    [facebook, github, name, skills.length, telegram, twitter]
  );

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

    const bankInfo = currentUser.bankInfo || (currentUser.bank_info as any);
    setBankId(bankInfo?.bankId || bankInfo?.bank_id || '');
    setAccountName(bankInfo?.accountName || bankInfo?.account_name || currentUser.name || '');
    setAccountNo(bankInfo?.accountNo || bankInfo?.account_no || '');
  }, [currentUser, navigate]);

  useEffect(() => {
    if (saveState === 'saved' || saveState === 'error') {
      const timeout = window.setTimeout(() => setSaveState('idle'), 2400);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [saveState]);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!currentUser) {
      return;
    }

    if (isOnboarding && !hasProfileBasics) {
      setSaveState('error');
      addToast('Complete your profile basics before continuing.', 'error');
      return;
    }

    setSaveState('saving');
    try {
      await updateCurrentUser({
        name,
        avatar,
        skills,
        socials: {
          github,
          twitter,
          telegram,
          facebook,
        },
        profile_completed: isOnboarding ? true : currentUser.profile_completed,
        bankInfo:
          officialMember && bankId && accountNo
            ? {
                bankId,
                accountName: accountName || name,
                accountNo,
              }
            : undefined,
      });
      setSaveState('saved');
      addToast('Profile saved.', 'success');
      if (isOnboarding) {
        navigate('/home', { replace: true });
      }
    } catch {
      setSaveState('error');
      addToast('Profile update failed.', 'error');
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
      addToast('Wallet reconnect flow started.', 'info');
    } finally {
      setIsReconnectingWallet(false);
    }
  };

  const handleGoogleLinkSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      return;
    }

    setIsLinkingGoogle(true);
    try {
      const decoded = jwtDecode<GoogleJWTPayload>(credentialResponse.credential);
      const googleUserInfo: GoogleUserInfo = {
        email: decoded.email,
        google_id: decoded.sub,
        name: decoded.name,
        avatar: decoded.picture,
      };
      const linked = await linkGoogleAccount(googleUserInfo);
      if (!linked) {
        setSaveState('error');
      }
    } catch {
      addToast('Google account linking failed.', 'error');
      setSaveState('error');
    } finally {
      setIsLinkingGoogle(false);
    }
  };

  if (!currentUser) {
    return null;
  }

  const saveLabel =
    saveState === 'saving'
      ? 'Saving...'
      : saveState === 'saved'
        ? 'Saved'
        : saveState === 'error'
          ? 'Retry Save'
          : 'Save Changes';

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <PageHeader
        eyebrow="Profile"
        title="Manage your DSUC Labs identity."
        subtitle="Keep profile basics, social links, and bank information consistent with the existing auth and member model."
        actions={
          <>
            <StatusBadge tone={saveState === 'saved' ? 'success' : saveState === 'error' ? 'danger' : 'info'}>
              {saveState === 'saving'
                ? 'Saving'
                : saveState === 'saved'
                  ? 'Saved'
                  : saveState === 'error'
                    ? 'Needs attention'
                    : 'Ready'}
            </StatusBadge>
            <ActionButton variant="danger" onClick={handleLogout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Logout
            </ActionButton>
            <ActionButton onClick={handleSave} loading={saveState === 'saving'}>
              <Save className="h-4 w-4" aria-hidden="true" />
              {saveLabel}
            </ActionButton>
          </>
        }
      />

      {isOnboarding ? (
        <SurfaceCard className="p-5">
          <p className="section-eyebrow">First-time setup</p>
          <h2 className="section-title">Complete your member profile</h2>
          <p className="section-subtitle">
            Add a display name and at least one skill or social link before entering the product.
          </p>
        </SurfaceCard>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-6">
          <SurfaceCard className="p-7">
            <div className="flex flex-col items-center text-center">
              <label className="group relative cursor-pointer">
                <div className="h-32 w-32 overflow-hidden rounded-[32px] border border-border-main bg-main-bg">
                  <img
                    src={avatar || `https://i.pravatar.cc/160?u=${currentUser.id}`}
                    alt={currentUser.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center rounded-[32px] bg-black/55 opacity-0 transition-opacity group-hover:opacity-100">
                  <div className="text-center text-white">
                    <Upload className="mx-auto h-5 w-5" aria-hidden="true" />
                    <p className="mt-2 text-xs uppercase tracking-[0.18em]">Update</p>
                  </div>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </label>

              <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-text-main">
                {name || currentUser.name}
              </h2>
              <p className="mt-1 text-sm text-text-muted">{currentUser.role || 'Member'}</p>

              <div className="mt-5 flex flex-wrap justify-center gap-2">
                <StatusBadge tone="info">{memberType === 'member' ? 'Official Member' : 'Community Member'}</StatusBadge>
                <StatusBadge>{authMethod || 'Account'}</StatusBadge>
                {currentUser.google_id ? <StatusBadge tone="success">Google Linked</StatusBadge> : null}
              </div>

              <div className="mt-6 grid w-full gap-3">
                <MetricRow label="Streak" value={`${currentUser.streak || 0} days`} />
                <MetricRow label="Builds" value={String(currentUser.builds || 0)} />
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-7">
            <SectionHeader
              eyebrow="Access"
              title="Account connections"
              subtitle="Keep wallet and Google access explicit."
            />

            <div className="mt-6 space-y-4">
              <ReadOnlyField label="Email" value={currentUser.email || 'No email connected'} icon={Mail} />
              <ReadOnlyField label="Wallet" value={currentUser.wallet_address || 'No wallet connected'} icon={Wallet} />

              {authMethod === 'wallet' && currentUser.wallet_address ? (
                <ActionButton
                  variant="secondary"
                  onClick={handleReconnectWallet}
                  loading={isReconnectingWallet}
                  fullWidth
                >
                  Reconnect Wallet
                </ActionButton>
              ) : null}

              {authMethod === 'wallet' && !currentUser.google_id ? (
                <div className="space-y-2">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
                    Link Google sign-in
                  </p>
                  <GoogleLogin
                    onSuccess={handleGoogleLinkSuccess}
                    onError={() => addToast('Google account linking failed.', 'error')}
                    useOneTap={false}
                  />
                  {isLinkingGoogle ? (
                    <StatusBadge tone="info">Linking Google account...</StatusBadge>
                  ) : null}
                </div>
              ) : null}
            </div>
          </SurfaceCard>
        </div>

        <div className="space-y-6">
          <SurfaceCard className="p-7">
            <SectionHeader
              eyebrow="Profile Basics"
              title="Display identity"
              subtitle="Your public profile uses this name, avatar, and skills list."
            />

            <div className="mt-6 grid gap-4">
              <Field label="Display name">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="input-shell"
                  placeholder="Your name"
                />
              </Field>

              <Field label="Skills">
                <SkillInput skills={skills} onChange={setSkills} />
              </Field>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-7">
            <SectionHeader
              eyebrow="Socials"
              title="Outbound profile links"
              subtitle="Edit, clear, and save social links without browser alerts."
            />

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="GitHub">
                <InputWithIcon value={github} onChange={setGithub} placeholder="https://github.com/..." icon={Github} />
              </Field>
              <Field label="Twitter / X">
                <InputWithIcon value={twitter} onChange={setTwitter} placeholder="https://x.com/..." icon={Twitter} />
              </Field>
              <Field label="Telegram">
                <InputWithIcon value={telegram} onChange={setTelegram} placeholder="https://t.me/..." icon={Send} />
              </Field>
              <Field label="Facebook">
                <InputWithIcon value={facebook} onChange={setFacebook} placeholder="https://facebook.com/..." icon={Facebook} />
              </Field>
            </div>
          </SurfaceCard>

          {officialMember ? (
            <SurfaceCard className="p-7">
              <SectionHeader
                eyebrow="Banking"
                title="Payout details"
                subtitle="Bank, account name, then account number. Keep this order stable for Finance."
              />

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <Field label="Bank">
                  <select value={bankId} onChange={(event) => setBankId(event.target.value)} className="input-shell">
                    <option value="">Select bank</option>
                    {BANKS.map((bank) => (
                      <option key={bank.id} value={bank.id}>
                        {bank.shortName}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Account name">
                  <input
                    value={accountName}
                    onChange={(event) => setAccountName(event.target.value)}
                    className="input-shell"
                    placeholder="Account holder name"
                  />
                </Field>
                <Field label="Account number">
                  <input
                    value={accountNo}
                    onChange={(event) => setAccountNo(event.target.value)}
                    className="input-shell"
                    placeholder="0123456789"
                  />
                </Field>
              </div>

              {selectedBank ? (
                <div className="mt-5 rounded-[20px] border border-border-main bg-main-bg p-4 text-sm text-text-muted">
                  Selected bank: <span className="font-medium text-text-main">{selectedBank.name}</span>
                </div>
              ) : null}
            </SurfaceCard>
          ) : null}
        </div>
      </div>
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

function ReadOnlyField({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-[20px] border border-border-main bg-main-bg p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <div className="mt-2 flex items-center gap-3">
        <Icon className="h-4 w-4 text-primary" />
        <p className="break-all text-sm text-text-main">{value}</p>
      </div>
    </div>
  );
}

function InputWithIcon({
  value,
  onChange,
  placeholder,
  icon: Icon,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="input-shell pl-11"
        placeholder={placeholder}
      />
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-[18px] border border-border-main bg-main-bg px-4 py-3">
      <span className="text-sm text-text-muted">{label}</span>
      <span className="text-sm font-semibold text-text-main">{value}</span>
    </div>
  );
}
