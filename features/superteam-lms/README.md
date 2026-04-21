# Superteam Academy — LMS dApp (MVP)

A production-style LMS prototype for Solana developer education.

## Hosted demo
https://superteam-academy-lms.vercel.app

## What this MVP includes
- Pill-style UI + modern typography
- Course list + lesson checklist
- Progress tracking + simple XP/level formula
- Multi-language toggle (EN/PT/ES) UI demo
- **On-chain completion receipt (devnet)** using Solana Memo (proof link via Solscan)

## Why this matches the listing
The listing asks for:
- interactive, project-based learning + tracking
- gamification (XP/levels)
- on-chain credentials
- multi-language support

This MVP demonstrates the end-to-end UX plus a minimal on-chain proof primitive. A full implementation would integrate the official Anchor program (Token-2022 non-transferable XP + evolving compressed NFTs).

## Run locally
```bash
cd web
npm install
npm run dev
```

## Notes
- Data sources and detection are not needed for this listing (this is an LMS build).
