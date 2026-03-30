export type TrackId = 'genin' | 'chunin' | 'jonin';

export type QuizChoice = { id: string; label: string };
export type QuizQuestion = {
  id: string;
  prompt: string;
  choices: QuizChoice[];
  correctChoiceId: string;
  explanation: string;
};

export type Lesson = {
  id: string;
  track: TrackId;
  title: string;
  minutes: number;
  content: {
    md: string;
    callouts?: { title: string; body: string }[];
  };
  quiz: QuizQuestion[];
};

// Roadmap inspiration:
// - Official beginner outline: https://github.com/Lab-Blueprint/Solana-Rapid-Fire-Beginner-101
// - Developer journey: https://superteamvn.substack.com/p/solana-developer-journey
export const TRACKS: { id: TrackId; title: string; subtitle: string }[] = [
  {
    id: 'genin',
    title: 'Genin (Beginner)',
    subtitle: 'Core concepts + first hands-on builds (Solana 101)',
  },
  {
    id: 'chunin',
    title: 'Chunin (Builder)',
    subtitle: 'Build real apps: Anchor, CPI, compute budget, architecture, debugging, security basics',
  },
  {
    id: 'jonin',
    title: 'Jonin (Expert)',
    subtitle: 'Performance, security/auditing mindset, protocol-level understanding, leadership',
  },
];

// Helper to generate choices quickly
function choice(id: string, label: string): QuizChoice {
  return { id, label };
}

// --- GENIN (Beginner) ---
// Based on the official-style outline from Lab-Blueprint Rapid-Fire Beginner 101.
const GENIN: Lesson[] = [
  {
    id: 'm1-blockchain-as-a-computer',
    track: 'genin',
    title: 'Module 1: Blockchain as a Computer',
    minutes: 12,
    content: {
      md: `# Blockchain as a Computer

A blockchain is best understood as a **shared computer**.
Not “a database”, not “a website”, but a machine where **many independent operators** agree on what inputs are valid and what the output state becomes.

## Client-server vs shared computer
**Client-server (web2)**
- One server (or one company) owns the database.
- That server decides what is true.

**Peer-to-peer replication (web3)**
- Transactions are broadcast.
- Many validators verify the same rules.
- The resulting state is replicated.

## Why this model exists
It matters when you need:
- **credible neutrality** (no single admin can rewrite outcomes)
- **public verifiability** (anyone can check)

## What you pay for
You trade speed and simplicity for:
- fees
- stricter rules
- more engineering discipline
`,
    },
    quiz: [
      {
        id: 'q1',
        prompt: 'Which architecture is centralized?',
        choices: [choice('a', 'Client-server'), choice('b', 'Peer-to-peer replication'), choice('c', 'Many independent validators enforcing rules')],
        correctChoiceId: 'a',
        explanation: 'Client-server has a central authority controlling data and availability.',
      },
      {
        id: 'q2',
        prompt: 'Why does P2P reduce single points of failure?',
        choices: [choice('a', 'Replication across many nodes'), choice('b', 'No cryptography needed'), choice('c', 'It uses fewer machines')],
        correctChoiceId: 'a',
        explanation: 'Replication avoids dependence on one server/provider.',
      },
    ],
  },
  {
    id: 'm2-identity-and-authentication',
    track: 'genin',
    title: 'Module 2: Identity & Authentication',
    minutes: 13,
    content: {
      md: `# Identity & Authentication

In web3, a wallet is a **portable identity**.
Instead of “login with password”, you usually **sign a message**.

## Keypairs
- **private key** signs
- **public key** verifies

## RPC nodes
Your app usually talks to an RPC to read data and submit transactions.
RPC is a *gateway*, not the chain itself.
`,
    },
    quiz: [
      {
        id: 'q1',
        prompt: 'What does a signature prove?',
        choices: [choice('a', 'RPC is trusted'), choice('b', 'Private key approved the message'), choice('c', 'Transaction will succeed')],
        correctChoiceId: 'b',
        explanation: 'Signatures prove approval, not success.',
      },
      {
        id: 'q2',
        prompt: 'Which key verifies a signature?',
        choices: [choice('a', 'Private key'), choice('b', 'Public key'), choice('c', 'Blockhash')],
        correctChoiceId: 'b',
        explanation: 'Verification uses the public key.',
      },
    ],
  },
  {
    id: 'm3-consensus-input-not-memory',
    track: 'genin',
    title: 'Module 3: Consensus (Input, Not Memory)',
    minutes: 13,
    content: {
      md: `# Consensus (Input, Not Memory)

Consensus is mainly agreement on **transaction ordering** (inputs).
If you agree on ordering, and execution is deterministic, you reproduce the same resulting state.
`,
    },
    quiz: [
      {
        id: 'q1',
        prompt: 'Consensus primarily agrees on…',
        choices: [choice('a', 'Transaction order'), choice('b', 'Wallet UI'), choice('c', 'Private keys')],
        correctChoiceId: 'a',
        explanation: 'It’s about canonical ordering of inputs.',
      },
    ],
  },
  {
    id: 'm4-account-file',
    track: 'genin',
    title: 'Module 4: Account = File',
    minutes: 14,
    content: {
      md: `# Account = File

Accounts are “files” with fields:
- **lamports**
- **data**
- **owner**
- **executable**

Only the **owner program** can write account **data**.
`,
    },
    quiz: [
      {
        id: 'q1',
        prompt: 'Who can modify an account’s data?',
        choices: [choice('a', 'Anyone'), choice('b', 'Only the owner program'), choice('c', 'Only the RPC')],
        correctChoiceId: 'b',
        explanation: 'Writes are constrained by the owner program.',
      },
    ],
  },
  {
    id: 'm5-program-library',
    track: 'genin',
    title: 'Module 5: Program = Library',
    minutes: 14,
    content: {
      md: `# Program = Library

Programs are shared code. They are effectively stateless; state lives in accounts.

## PDAs
A PDA is derived from seeds + program id and is controlled by program logic (not a private key).
`,
    },
    quiz: [
      {
        id: 'q1',
        prompt: 'Where does persistent state live on Solana?',
        choices: [choice('a', 'Inside programs'), choice('b', 'In accounts'), choice('c', 'In the wallet UI')],
        correctChoiceId: 'b',
        explanation: 'Programs are stateless; accounts store state.',
      },
    ],
  },
  {
    id: 'm6-environment-setup-minimal',
    track: 'genin',
    title: 'Module 6: Environment Setup (Minimal)',
    minutes: 12,
    content: {
      md: `# Environment Setup (Minimal)

Two paths:
- Fast: Solana Playground
- Local: Rust + Solana CLI + Node.js + Anchor

Goal: get a build/test loop working before installing everything.
`,
    },
    quiz: [
      {
        id: 'q1',
        prompt: 'Which toolchain typically compiles Solana programs?',
        choices: [choice('a', 'Rust toolchain'), choice('b', 'Solscan'), choice('c', 'Wallet adapter')],
        correctChoiceId: 'a',
        explanation: 'Most Solana programs are written in Rust.',
      },
    ],
  },
  {
    id: 'm7-coding-with-claude',
    track: 'genin',
    title: 'Module 7: Coding with Claude',
    minutes: 14,
    content: {
      md: `# Coding with Claude

AI helps, but only if you use structure.

A strong prompt includes:
1) **Context**
2) **Goal**
3) **Constraints** (security checks)
4) **Acceptance criteria** (tests)
`,
      callouts: [
        {
          title: 'Discussion',
          body: 'Before you build: write your idea + constraints. A good place to discuss and refine: https://gimmeidea.com',
        },
      ],
    },
    quiz: [
      {
        id: 'q1',
        prompt: 'Which prompt structure is best for safe code?',
        choices: [choice('a', 'Vague idea only'), choice('b', 'Context + goal + constraints + acceptance'), choice('c', 'Only stack')],
        correctChoiceId: 'b',
        explanation: 'This reduces hallucination and forces safety constraints.',
      },
    ],
  },
];

// --- CHUNIN (Builder) ---
// Target: 8 quiz questions per module.
const CHUNIN: Lesson[] = [
  {
    id: 'c1-anchor-and-account-design',
    track: 'chunin',
    title: 'Chunin 1: Anchor & Account Design Patterns',
    minutes: 18,
    content: {
      md: `# Anchor & Account Design Patterns

At Chunin level, you stop thinking “write a program” and start thinking “design a **state model**”.

## Core skills
- account model: what lives where, who owns it, who can write
- PDAs and stable seed schemes
- constraints and invariants (checked **every** instruction)

## Patterns
- **Config PDA**: global settings owned by program
- **User profile PDA**: per-user state
- **Vault PDA**: authority controlled by program logic

## Common pitfalls
- forgetting ownership checks
- writable accounts passed by attacker
- seed collisions (non-stable seeds)

## Checklist before shipping
- signer checks
- ownership checks
- PDA validation (seeds + bump)
- invariants on every instruction

> Discussion: post your account model + invariants and get feedback: https://gimmeidea.com
`,
    },
    quiz: [
      {
        id: 'q1',
        prompt: 'Why should invariants be enforced on every instruction (not only init)?',
        choices: [choice('a', 'Because clients can bypass UI and call instructions directly'), choice('b', 'Because Anchor requires it'), choice('c', 'Because RPC caches state')],
        correctChoiceId: 'a',
        explanation: 'Attackers can call instructions with crafted accounts; invariants must hold always.',
      },
      {
        id: 'q2',
        prompt: 'A good PDA seed scheme is…',
        choices: [choice('a', 'Random every time'), choice('b', 'Stable prefixes + deterministic user identifiers'), choice('c', 'Depends on UI theme')],
        correctChoiceId: 'b',
        explanation: 'Stability prevents collisions and makes accounts predictable.',
      },
      {
        id: 'q3',
        prompt: 'What does an ownership check protect against?',
        choices: [choice('a', 'RPC outages'), choice('b', 'Writing to attacker-controlled accounts'), choice('c', 'Low SOL balance')],
        correctChoiceId: 'b',
        explanation: 'Without ownership checks, a program can be tricked into mutating wrong state.',
      },
      {
        id: 'q4',
        prompt: 'Which account type is best for global settings?',
        choices: [choice('a', 'Config PDA'), choice('b', 'Any random wallet'), choice('c', 'Instruction data only')],
        correctChoiceId: 'a',
        explanation: 'A config PDA is deterministic and owned by the program.',
      },
      {
        id: 'q5',
        prompt: 'Why are writable accounts “dangerous”?',
        choices: [choice('a', 'They cost more rent always'), choice('b', 'They allow state mutation; must be validated'), choice('c', 'They disable signatures')],
        correctChoiceId: 'b',
        explanation: 'Writable means mutable state → attack surface.',
      },
      {
        id: 'q6',
        prompt: 'Anchor constraints help by…',
        choices: [choice('a', 'Replacing all security checks'), choice('b', 'Automating validation of PDAs/owners/signers'), choice('c', 'Reducing fees')],
        correctChoiceId: 'b',
        explanation: 'Constraints reduce boilerplate but do not remove the need for threat modeling.',
      },
      {
        id: 'q7',
        prompt: 'A vault PDA is typically used to…',
        choices: [choice('a', 'Store UI settings'), choice('b', 'Control escrowed assets via program logic'), choice('c', 'Act as an RPC proxy')],
        correctChoiceId: 'b',
        explanation: 'Vaults are controlled by program-derived authority and rules.',
      },
      {
        id: 'q8',
        prompt: 'What is the best mental model for a Solana program?',
        choices: [choice('a', 'A shared library invoked with explicit accounts'), choice('b', 'A background server with memory'), choice('c', 'A centralized database')],
        correctChoiceId: 'a',
        explanation: 'Programs are stateless and operate on provided accounts.',
      },
    ],
  },
  {
    id: 'c2-cpi-and-composability',
    track: 'chunin',
    title: 'Chunin 2: CPI, Signed CPI, and Composability',
    minutes: 18,
    content: {
      md: `# CPI, Signed CPI, and Composability

CPI (Cross-Program Invocation) is “calling another program”.
This is what makes Solana composable.

## Useful distinctions
- **unsigned CPI**: you call another program without signing as a PDA
- **signed CPI**: your program proves authority over a PDA via seeds + bump

## Risks
- confused-deputy problems (signing for the wrong accounts)
- passing attacker-controlled accounts into CPI

## Checklist
- validate all accounts passed to CPI
- validate that the PDA you sign for is the expected one

> Discussion: share a CPI flow diagram you designed: https://gimmeidea.com
`,
      callouts: [
        { title: 'Animation note', body: 'This is one of the places where an animation is useful (CPI flow + signer authority). We will add it later.' },
      ],
    },
    quiz: [
      {
        id: 'q1',
        prompt: 'What is CPI?',
        choices: [choice('a', 'Cross-Program Invocation'), choice('b', 'Compute Price Index'), choice('c', 'Client Program Interface')],
        correctChoiceId: 'a',
        explanation: 'CPI = calling another program from within a program.',
      },
      {
        id: 'q2',
        prompt: 'When do you need signed CPI?',
        choices: [choice('a', 'When the program must act as authority for a PDA'), choice('b', 'Whenever you call RPC'), choice('c', 'For reading account data')],
        correctChoiceId: 'a',
        explanation: 'Signed CPI proves PDA authority via seeds + bump.',
      },
      {
        id: 'q3',
        prompt: 'What is a confused-deputy risk in CPI?',
        choices: [choice('a', 'RPC throttling'), choice('b', 'Your program signs for unintended accounts'), choice('c', 'Too many signatures')],
        correctChoiceId: 'b',
        explanation: 'If you sign for the wrong PDA/accounts, you can be exploited.',
      },
      {
        id: 'q4',
        prompt: 'Best practice before CPI?',
        choices: [choice('a', 'Validate all accounts used by the CPI target'), choice('b', 'Skip checks because target program checks'), choice('c', 'Only validate payer')],
        correctChoiceId: 'a',
        explanation: 'Never assume the called program will protect you from wrong inputs.',
      },
      {
        id: 'q5',
        prompt: 'Signed CPI uses what to prove PDA authority?',
        choices: [choice('a', 'Password'), choice('b', 'Seeds + bump'), choice('c', 'RPC key')],
        correctChoiceId: 'b',
        explanation: 'Seeds+bump let runtime sign for PDA.',
      },
      {
        id: 'q6',
        prompt: 'Composability mainly means…',
        choices: [choice('a', 'Programs can be reused together like Lego'), choice('b', 'Everything is centralized'), choice('c', 'No fees')],
        correctChoiceId: 'a',
        explanation: 'Apps compose by invoking shared programs.',
      },
      {
        id: 'q7',
        prompt: 'If an attacker can choose accounts in your CPI, what can happen?',
        choices: [choice('a', 'Nothing'), choice('b', 'Funds/state can be redirected'), choice('c', 'Blockhash disappears')],
        correctChoiceId: 'b',
        explanation: 'Account substitution is a common exploit pattern.',
      },
      {
        id: 'q8',
        prompt: 'Unsigned CPI still requires…',
        choices: [choice('a', 'No validation'), choice('b', 'Account validation + correct program ids'), choice('c', 'Airdrop')],
        correctChoiceId: 'b',
        explanation: 'You must validate accounts and program ids regardless.',
      },
    ],
  },
  {
    id: 'c3-compute-budget-fees',
    track: 'chunin',
    title: 'Chunin 3: Fees, Compute Budget, and Transaction Reliability',
    minutes: 18,
    content: {
      md: `# Fees, Compute Budget, and Transaction Reliability

At builder level you must care about reliability:
- transaction size
- compute limit
- prioritization fees

## What you pay for
- base fee
- compute budget / priority fee (if you add it)
- rent-exempt balances for accounts

## Debugging mindset
When users report "it failed":
- reproduce on devnet
- inspect logs
- identify failure class (budget / account / signer / blockhash)

> Discussion: post a failure log + your hypothesis: https://gimmeidea.com
`,
      callouts: [
        { title: 'Animation note', body: 'Compute budget + tx lifecycle is one of the few places where an animation helps; we’ll add later.' },
      ],
    },
    quiz: [
      {
        id: 'q1',
        prompt: 'Why might a transaction fail during congestion even if logic is correct?',
        choices: [choice('a', 'Blockhash expiration / prioritization'), choice('b', 'Because signatures become invalid'), choice('c', 'Because PDAs change')],
        correctChoiceId: 'a',
        explanation: 'Validity window + prioritization affect landing.',
      },
      {
        id: 'q2',
        prompt: 'Rent-exemption mainly affects…',
        choices: [choice('a', 'Account persistence/creation cost'), choice('b', 'Wallet UI theme'), choice('c', 'Consensus rules')],
        correctChoiceId: 'a',
        explanation: 'Accounts need minimum lamports to remain allocated.',
      },
      {
        id: 'q3',
        prompt: 'Compute budget instructions are used to…',
        choices: [choice('a', 'Increase compute limit / set priority fee'), choice('b', 'Generate PDAs'), choice('c', 'Verify signatures')],
        correctChoiceId: 'a',
        explanation: 'They control compute limits and priority fees.',
      },
      {
        id: 'q4',
        prompt: 'Best first step when debugging a failed tx?',
        choices: [choice('a', 'Guess'), choice('b', 'Read logs and identify failure class'), choice('c', 'Increase UI padding')],
        correctChoiceId: 'b',
        explanation: 'Logs show the failure reason and program errors.',
      },
      {
        id: 'q5',
        prompt: '“Blockhash not found” usually means…',
        choices: [choice('a', 'Your tx is too old; fetch new blockhash'), choice('b', 'Your wallet is hacked'), choice('c', 'RPC is always wrong')],
        correctChoiceId: 'a',
        explanation: 'Recent blockhash has an expiry window.',
      },
      {
        id: 'q6',
        prompt: 'Priority fees are mainly used to…',
        choices: [choice('a', 'Speed up inclusion during congestion'), choice('b', 'Change owner of accounts'), choice('c', 'Remove rent')],
        correctChoiceId: 'a',
        explanation: 'They improve tx inclusion probability.',
      },
      {
        id: 'q7',
        prompt: 'A good reliability posture includes…',
        choices: [choice('a', 'Retries + idempotency where possible'), choice('b', 'No error handling'), choice('c', 'Only UI validation')],
        correctChoiceId: 'a',
        explanation: 'Network conditions fluctuate; code should handle retries safely.',
      },
      {
        id: 'q8',
        prompt: 'Fees are paid in…',
        choices: [choice('a', 'SOL'), choice('b', 'USDC always'), choice('c', 'Not paid')],
        correctChoiceId: 'a',
        explanation: 'Solana fees are paid in SOL.',
      },
    ],
  },
  {
    id: 'c4-case-study-program-account-relationships',
    track: 'chunin',
    title: 'Chunin 4: Case Study — Program/Account Relationships (NFTs & AMMs)',
    minutes: 20,
    content: {
      md: `# Case Study — Program/Account Relationships (NFTs & AMMs)

Chunin-level growth comes from reading *real systems*.

## What to practice
- Draw the **account graph** (which accounts exist, and how they link)
- Identify which program owns which state
- Identify which instructions write which accounts

## Example prompts
- How many accounts does an NFT mint touch (metadata, mint, token account, edition…)?
- How many accounts does an AMM pool touch (vaults, LP mint, config, observation…) ?

## Deliverable
Make a diagram. If you can’t draw it, you don’t understand it.

> Discussion: share your diagram and get feedback: https://gimmeidea.com
`,
    },
    quiz: [
      {
        id: 'q1',
        prompt: 'Why draw an account graph?',
        choices: [choice('a', 'To understand state, authority, and write locks'), choice('b', 'To pick fonts'), choice('c', 'To avoid signatures')],
        correctChoiceId: 'a',
        explanation: 'It reveals state relationships and attack surface.',
      },
      {
        id: 'q2',
        prompt: 'A key question in any protocol integration is…',
        choices: [choice('a', 'Which accounts are writable and why'), choice('b', 'Which emoji to use'), choice('c', 'Which RPC is coolest')],
        correctChoiceId: 'a',
        explanation: 'Writable accounts are the mutation surface.',
      },
      {
        id: 'q3',
        prompt: 'Reading production code mainly helps you learn…',
        choices: [choice('a', 'Real constraints and patterns'), choice('b', 'How to skip testing'), choice('c', 'How to avoid docs')],
        correctChoiceId: 'a',
        explanation: 'Production systems encode battle-tested patterns.',
      },
      {
        id: 'q4',
        prompt: 'Account relationships matter most because…',
        choices: [choice('a', 'They define who can change what state'), choice('b', 'They define UI layout'), choice('c', 'They define seed length')],
        correctChoiceId: 'a',
        explanation: 'Authority and write-access live in account relationships.',
      },
      {
        id: 'q5',
        prompt: 'In integrations, a frequent bug class is…',
        choices: [choice('a', 'Account substitution / wrong account passed'), choice('b', 'Too many headings'), choice('c', 'Wrong background color')],
        correctChoiceId: 'a',
        explanation: 'Attackers can pass wrong accounts unless validated.',
      },
      {
        id: 'q6',
        prompt: 'If an instruction writes to state, it must have…',
        choices: [choice('a', 'Writable account flag'), choice('b', 'A PNG'), choice('c', 'A token name')],
        correctChoiceId: 'a',
        explanation: 'Writes require writable accounts.',
      },
      {
        id: 'q7',
        prompt: 'A good diagram should include…',
        choices: [choice('a', 'Owners and authorities'), choice('b', 'Only colors'), choice('c', 'Only titles')],
        correctChoiceId: 'a',
        explanation: 'Owner/authority define mutation rights.',
      },
      {
        id: 'q8',
        prompt: 'The output of this module should be…',
        choices: [choice('a', 'A concrete account graph diagram'), choice('b', 'A tweet'), choice('c', 'A new private key')],
        correctChoiceId: 'a',
        explanation: 'The diagram is the proof of understanding.',
      },
    ],
  },
  {
    id: 'c5-fullstack-architecture',
    track: 'chunin',
    title: 'Chunin 5: Full-stack Architecture (On-chain + Off-chain)',
    minutes: 20,
    content: {
      md: `# Full-stack Architecture (On-chain + Off-chain)

Chunin builders ship systems, not just programs.

## A practical architecture
- On-chain program(s): state transitions + authority
- Off-chain service: indexing, caching, notifications, analytics
- Frontend: wallet UX, retries, idempotency

## Key design decisions
- What must be on-chain vs off-chain?
- What is the source of truth?
- How do you handle retries safely?

## Reliability checklist
- idempotent operations where possible
- safe retries (don’t double-spend)
- consistent error handling UX

> Discussion: post your app idea + architecture diagram for review: https://gimmeidea.com
`,
    },
    quiz: [
      {
        id: 'q1',
        prompt: 'What should generally be the on-chain “source of truth”?',
        choices: [choice('a', 'Validated state transitions and ownership rules'), choice('b', 'UI preferences'), choice('c', 'RPC cache')],
        correctChoiceId: 'a',
        explanation: 'On-chain is for verifiable state transitions and authority.',
      },
      {
        id: 'q2',
        prompt: 'Why do off-chain indexers exist?',
        choices: [choice('a', 'To make query UX fast and developer-friendly'), choice('b', 'To replace consensus'), choice('c', 'To store private keys')],
        correctChoiceId: 'a',
        explanation: 'Raw chain queries can be slow/complex for product UX.',
      },
      {
        id: 'q3',
        prompt: 'A safe retry strategy must avoid…',
        choices: [choice('a', 'Double execution of non-idempotent actions'), choice('b', 'Logging'), choice('c', 'Using TypeScript')],
        correctChoiceId: 'a',
        explanation: 'Retries can accidentally execute the same effect twice.',
      },
      {
        id: 'q4',
        prompt: 'Which is a good rule for “what goes on-chain”?',
        choices: [choice('a', 'Things that require trustless verification'), choice('b', 'Everything'), choice('c', 'Only CSS')],
        correctChoiceId: 'a',
        explanation: 'Put trust boundaries and critical state on-chain.',
      },
      {
        id: 'q5',
        prompt: 'If users report intermittent failures, you should first…',
        choices: [choice('a', 'Reproduce and inspect logs to classify failure'), choice('b', 'Ignore'), choice('c', 'Change theme')],
        correctChoiceId: 'a',
        explanation: 'Classify failures before applying fixes.',
      },
      {
        id: 'q6',
        prompt: 'A good client should show…',
        choices: [choice('a', 'Clear error messages + next action'), choice('b', 'Only “failed”'), choice('c', 'Nothing')],
        correctChoiceId: 'a',
        explanation: 'UX matters for reliability; guide the user.',
      },
      {
        id: 'q7',
        prompt: 'Idempotency helps because…',
        choices: [choice('a', 'Repeated requests don’t cause repeated side effects'), choice('b', 'It removes fees'), choice('c', 'It avoids signatures')],
        correctChoiceId: 'a',
        explanation: 'Idempotency is a core reliability pattern.',
      },
      {
        id: 'q8',
        prompt: 'An architecture diagram should include…',
        choices: [choice('a', 'Components + data flow + trust boundaries'), choice('b', 'Only logos'), choice('c', 'Only colors')],
        correctChoiceId: 'a',
        explanation: 'The point is understanding flow and boundaries.',
      },
    ],
  },
  {
    id: 'c6-testing-debugging-security-basics',
    track: 'chunin',
    title: 'Chunin 6: Testing, Debugging, and Security Basics',
    minutes: 20,
    content: {
      md: `# Testing, Debugging, and Security Basics

At Chunin level, you must build a tight loop:
**write → test → debug → harden**.

## What to test
- signer checks
- ownership checks
- PDA derivation
- invariants
- CPI flows (accounts + signer authority)

## Debugging workflow
- reproduce on devnet/localnet
- inspect program logs
- isolate minimal failing case

## Security basics
Assume an attacker:
- controls the client
- controls accounts passed to instructions

> Discussion: post a bug report (symptoms + logs + hypothesis) for review: https://gimmeidea.com
`,
    },
    quiz: [
      {
        id: 'q1',
        prompt: 'Why is UI validation insufficient for security?',
        choices: [choice('a', 'Attackers can call instructions directly'), choice('b', 'Because UI is slow'), choice('c', 'Because wallets are centralized')],
        correctChoiceId: 'a',
        explanation: 'Programs must treat clients as adversarial.',
      },
      {
        id: 'q2',
        prompt: 'The most valuable tests for a Solana program focus on…',
        choices: [choice('a', 'Authority + invariants'), choice('b', 'Fonts'), choice('c', 'RPC branding')],
        correctChoiceId: 'a',
        explanation: 'Most exploits come from missing checks and invariant failures.',
      },
      {
        id: 'q3',
        prompt: 'A minimal failing case helps because…',
        choices: [choice('a', 'It isolates root cause quickly'), choice('b', 'It increases compute'), choice('c', 'It changes seeds')],
        correctChoiceId: 'a',
        explanation: 'Smaller repro → faster diagnosis.',
      },
      {
        id: 'q4',
        prompt: 'Logs are most useful to…',
        choices: [choice('a', 'Identify failing instruction and error reason'), choice('b', 'Choose colors'), choice('c', 'Avoid signatures')],
        correctChoiceId: 'a',
        explanation: 'Logs show where and why things failed.',
      },
      {
        id: 'q5',
        prompt: 'A common exploit vector is…',
        choices: [choice('a', 'Account substitution (wrong accounts passed)'), choice('b', 'Too many quizzes'), choice('c', 'Long markdown')],
        correctChoiceId: 'a',
        explanation: 'Validate accounts and ownership.',
      },
      {
        id: 'q6',
        prompt: 'When debugging, you should first…',
        choices: [choice('a', 'Classify failure: signer/ownership/PDA/budget/blockhash'), choice('b', 'Refactor UI'), choice('c', 'Redeploy')],
        correctChoiceId: 'a',
        explanation: 'Classification makes fixes systematic.',
      },
      {
        id: 'q7',
        prompt: 'Which check prevents writing to attacker-owned state?',
        choices: [choice('a', 'Ownership check'), choice('b', 'Airdrop'), choice('c', 'Compute budget')],
        correctChoiceId: 'a',
        explanation: 'Ownership constrains write authority.',
      },
      {
        id: 'q8',
        prompt: 'A “secure by default” program means…',
        choices: [choice('a', 'It fails closed when inputs are wrong'), choice('b', 'It ignores checks'), choice('c', 'It hides errors')],
        correctChoiceId: 'a',
        explanation: 'Invalid inputs should be rejected safely.',
      },
    ],
  },
];

// --- JONIN (Expert) ---
// Target: 6 quiz questions per module.
const JONIN: Lesson[] = [
  {
    id: 'j1-performance-and-parallelism',
    track: 'jonin',
    title: 'Jonin 1: Performance, Parallelism, and Write Locks',
    minutes: 18,
    content: {
      md: `# Performance, Parallelism, and Write Locks

At Jonin level, you think in terms of throughput and contention.

## Core model
- transactions can run in parallel if they do not contend on writable accounts
- account design influences parallelism

## Practical outcomes
- design state so hot accounts are avoided
- split state (sharding) when needed

> Discussion: share a redesign proposal for a “hot account” problem: https://gimmeidea.com
`,
      callouts: [
        { title: 'Animation', body: 'Parallelism and write locks is one of the few places where animation is useful. We can add later.' },
      ],
    },
    quiz: [
      {
        id: 'q1',
        prompt: 'Why do hot writable accounts reduce throughput?',
        choices: [choice('a', 'They force serialization due to write locks'), choice('b', 'They remove signatures'), choice('c', 'They increase font size')],
        correctChoiceId: 'a',
        explanation: 'Write locks prevent parallel execution.',
      },
      {
        id: 'q2',
        prompt: 'A common fix for contention is…',
        choices: [choice('a', 'Sharding/splitting state'), choice('b', 'Adding more bold text'), choice('c', 'Using more RPCs')],
        correctChoiceId: 'a',
        explanation: 'Reduce contention by splitting state across accounts.',
      },
      {
        id: 'q3',
        prompt: 'Parallel execution is primarily gated by…',
        choices: [choice('a', 'Writability overlap'), choice('b', 'Wallet brand'), choice('c', 'Domain name')],
        correctChoiceId: 'a',
        explanation: 'Overlapping writable accounts cause conflicts.',
      },
      {
        id: 'q4',
        prompt: 'Best mental model: Solana is like…',
        choices: [choice('a', 'A parallel computer with explicit locks'), choice('b', 'A single-threaded app always'), choice('c', 'A spreadsheet')],
        correctChoiceId: 'a',
        explanation: 'Account locks define concurrency.',
      },
      {
        id: 'q5',
        prompt: 'To maximize parallelism, you should…',
        choices: [choice('a', 'Minimize shared writable accounts'), choice('b', 'Maximize shared writable accounts'), choice('c', 'Avoid PDAs')],
        correctChoiceId: 'a',
        explanation: 'Less shared writability → more parallelism.',
      },
      {
        id: 'q6',
        prompt: 'Why does account design matter for performance?',
        choices: [choice('a', 'It determines contention and lock scope'), choice('b', 'It determines UI color'), choice('c', 'It determines blockhash')],
        correctChoiceId: 'a',
        explanation: 'Account layout drives concurrency.',
      },
    ],
  },
  {
    id: 'j2-security-auditing-mindset',
    track: 'jonin',
    title: 'Jonin 2: Security & Auditing Mindset',
    minutes: 18,
    content: {
      md: `# Security & Auditing Mindset

At Jonin level, your job is to be paranoid *correctly*.

## Threat model basics
- attacker controls client
- attacker chooses accounts unless validated
- attacker can replay strategies across instructions

## Common failure classes
- missing signer checks
- missing ownership checks
- missing PDA validation
- logic bugs in invariants (e.g. balances)

## Audit checklist
- authority model
- invariants per instruction
- CPI flows and signer authority
- account substitution vectors
`,
    },
    quiz: [
      {
        id: 'q1',
        prompt: 'In on-chain threat models, the attacker controls…',
        choices: [choice('a', 'The client and inputs'), choice('b', 'Validator private keys'), choice('c', 'Your program binary')],
        correctChoiceId: 'a',
        explanation: 'Assume adversarial clients and crafted accounts.',
      },
      {
        id: 'q2',
        prompt: 'Most important rule in Solana programs?',
        choices: [choice('a', 'Never trust client-provided accounts without validation'), choice('b', 'Always use gradients'), choice('c', 'Always sign every step')],
        correctChoiceId: 'a',
        explanation: 'Validation is the core defense.',
      },
      {
        id: 'q3',
        prompt: 'A confused-deputy exploit often involves…',
        choices: [choice('a', 'Signing for the wrong accounts/authority'), choice('b', 'Wrong font choice'), choice('c', 'Too many headings')],
        correctChoiceId: 'a',
        explanation: 'Authority misuse is the key risk.',
      },
      {
        id: 'q4',
        prompt: 'Invariants must be checked…',
        choices: [choice('a', 'On every relevant instruction'), choice('b', 'Only on init'), choice('c', 'Only in UI')],
        correctChoiceId: 'a',
        explanation: 'Attackers can skip init paths.',
      },
      {
        id: 'q5',
        prompt: 'Ownership checks ensure…',
        choices: [choice('a', 'Your program writes only to expected program-owned state'), choice('b', 'RPC is fast'), choice('c', 'Fees are 0')],
        correctChoiceId: 'a',
        explanation: 'They prevent writing to malicious accounts.',
      },
      {
        id: 'q6',
        prompt: 'A good audit includes reviewing…',
        choices: [choice('a', 'CPI flows and signer authority'), choice('b', 'Only UI copy'), choice('c', 'Only README')],
        correctChoiceId: 'a',
        explanation: 'CPI and authority are major sources of exploits.',
      },
    ],
  },
  {
    id: 'j3-protocol-level-learning',
    track: 'jonin',
    title: 'Jonin 3: Protocol-Level Learning Path',
    minutes: 16,
    content: {
      md: `# Protocol-Level Learning Path

This is where you become dangerous (in a good way).

## What to focus on
- read docs + spec-level material
- follow core engineering discussions
- build intuition about bottlenecks

## Practical activities
- read native program behavior (system, token)
- trace a complex transaction end-to-end
- benchmark and profile
`,
    },
    quiz: [
      {
        id: 'q1',
        prompt: 'A protocol-level builder should prioritize…',
        choices: [choice('a', 'Reading specs + tracing real transactions'), choice('b', 'Only copying code'), choice('c', 'Only watching price')],
        correctChoiceId: 'a',
        explanation: 'Understanding comes from specs + traces + measurement.',
      },
      {
        id: 'q2',
        prompt: 'Benchmarking helps you…',
        choices: [choice('a', 'Measure bottlenecks and validate optimizations'), choice('b', 'Avoid logs'), choice('c', 'Skip tests')],
        correctChoiceId: 'a',
        explanation: 'Optimization without measurement is guessing.',
      },
      {
        id: 'q3',
        prompt: 'Tracing a tx end-to-end includes…',
        choices: [choice('a', 'Accounts + instructions + logs'), choice('b', 'Only UI'), choice('c', 'Only token name')],
        correctChoiceId: 'a',
        explanation: 'You need the full execution context.',
      },
      {
        id: 'q4',
        prompt: 'Native programs are important because…',
        choices: [choice('a', 'Many apps depend on them; they define core behavior'), choice('b', 'They set website colors'), choice('c', 'They remove fees')],
        correctChoiceId: 'a',
        explanation: 'They’re the foundation of the ecosystem.',
      },
      {
        id: 'q5',
        prompt: '“Optimize” without profiling is…',
        choices: [choice('a', 'Risky; you may optimize the wrong thing'), choice('b', 'Always correct'), choice('c', 'Free')],
        correctChoiceId: 'a',
        explanation: 'Profile first.',
      },
      {
        id: 'q6',
        prompt: 'Protocol-level work often involves…',
        choices: [choice('a', 'Tradeoffs and constraints'), choice('b', 'No tradeoffs'), choice('c', 'Only UI')],
        correctChoiceId: 'a',
        explanation: 'Every change has costs.',
      },
    ],
  },
  {
    id: 'j4-rpc-infra-and-observability',
    track: 'jonin',
    title: 'Jonin 4: RPC, Infra, and Observability',
    minutes: 18,
    content: {
      md: `# RPC, Infra, and Observability

At expert level, you treat RPC and infra as part of the product.

## Why it matters
- most failures users see are *infra failures* (timeouts, dropped tx, stale data)
- centralization often happens at the RPC layer

## What to build into your app
- structured logs and correlation ids
- retries with backoff
- circuit breakers / fallback RPCs
- metrics: success rate, latency, error classes

## Debug playbook
- classify: network vs program error vs wallet error
- reproduce on devnet/localnet
- compare RPC providers

> Discussion: share your reliability/observability checklist: https://gimmeidea.com
`,
    },
    quiz: [
      {
        id: 'q1',
        prompt: 'Most user-facing failures in web3 apps are often…',
        choices: [choice('a', 'Infra/RPC related'), choice('b', 'Font related'), choice('c', 'Always consensus failures')],
        correctChoiceId: 'a',
        explanation: 'Timeouts, dropped tx, and RPC issues are common.',
      },
      {
        id: 'q2',
        prompt: 'A good retry strategy includes…',
        choices: [choice('a', 'Backoff and idempotency awareness'), choice('b', 'Infinite tight loops'), choice('c', 'No logging')],
        correctChoiceId: 'a',
        explanation: 'Retries must be safe and measured.',
      },
      {
        id: 'q3',
        prompt: 'Circuit breakers are used to…',
        choices: [choice('a', 'Stop hammering a failing dependency'), choice('b', 'Increase compute'), choice('c', 'Derive PDAs')],
        correctChoiceId: 'a',
        explanation: 'They prevent cascading failures.',
      },
      {
        id: 'q4',
        prompt: 'Observability means…',
        choices: [choice('a', 'Logs, metrics, traces that explain behavior'), choice('b', 'More animations'), choice('c', 'More wallets')],
        correctChoiceId: 'a',
        explanation: 'You need insight into runtime behavior.',
      },
      {
        id: 'q5',
        prompt: 'A key decentralization risk for users is…',
        choices: [choice('a', 'Too few RPC providers'), choice('b', 'Too many accounts'), choice('c', 'Too much markdown')],
        correctChoiceId: 'a',
        explanation: 'Access-layer centralization creates chokepoints.',
      },
      {
        id: 'q6',
        prompt: 'A debugging playbook should first…',
        choices: [choice('a', 'Classify error class'), choice('b', 'Change UI'), choice('c', 'Blame users')],
        correctChoiceId: 'a',
        explanation: 'Classification narrows the search space.',
      },
    ],
  },
  {
    id: 'j5-advanced-security-cpi-audits',
    track: 'jonin',
    title: 'Jonin 5: Advanced Security — CPI & Authority Audits',
    minutes: 18,
    content: {
      md: `# Advanced Security — CPI & Authority Audits

Many high-impact exploits happen at authority boundaries.

## What to audit deeply
- signer authority model
- PDA signing (seeds/bump correctness)
- CPI target program id checks
- account substitution vectors
- re-entrancy style issues (logical, not EVM-style)

## Practical technique
For each instruction:
- list required invariants
- list attacker-controlled inputs
- list what becomes writable

> Discussion: post one instruction and its invariants for peer review: https://gimmeidea.com
`,
    },
    quiz: [
      {
        id: 'q1',
        prompt: 'A high-risk area in Solana programs is…',
        choices: [choice('a', 'Authority boundaries and CPI'), choice('b', 'Typography'), choice('c', 'NFT art')],
        correctChoiceId: 'a',
        explanation: 'Authority misuse and CPI account substitution are common exploit paths.',
      },
      {
        id: 'q2',
        prompt: 'Before doing a CPI, you should always validate…',
        choices: [choice('a', 'Target program id and all accounts passed'), choice('b', 'Only the payer'), choice('c', 'Only the UI input')],
        correctChoiceId: 'a',
        explanation: 'Don’t allow account/program substitution.',
      },
      {
        id: 'q3',
        prompt: 'Signed CPI is dangerous if…',
        choices: [choice('a', 'You sign for an unintended PDA'), choice('b', 'You add markdown'), choice('c', 'You use devnet')],
        correctChoiceId: 'a',
        explanation: 'Signing is authority; mistakes can be fatal.',
      },
      {
        id: 'q4',
        prompt: 'An audit should focus on…',
        choices: [choice('a', 'Invariants + writable accounts'), choice('b', 'Only performance'), choice('c', 'Only design')],
        correctChoiceId: 'a',
        explanation: 'Most exploits are invariant failures or write misuse.',
      },
      {
        id: 'q5',
        prompt: 'Account substitution means…',
        choices: [choice('a', 'Attacker supplies different accounts than intended'), choice('b', 'Changing fonts'), choice('c', 'RPC switching')],
        correctChoiceId: 'a',
        explanation: 'Validate accounts and their owners/PDAs.',
      },
      {
        id: 'q6',
        prompt: 'A good invariant is…',
        choices: [choice('a', 'A statement that must always be true after instruction execution'), choice('b', 'A UI tooltip'), choice('c', 'A gradient')],
        correctChoiceId: 'a',
        explanation: 'Invariants formalize correctness.',
      },
    ],
  },
  {
    id: 'j6-leadership-and-impact',
    track: 'jonin',
    title: 'Jonin 6: Leadership, Mentorship, and Ecosystem Impact',
    minutes: 14,
    content: {
      md: `# Leadership, Mentorship, and Ecosystem Impact

At the top level, your impact is not only code.

## What changes
- you mentor juniors and unblock teams
- you define quality bars and review checklists
- you communicate tradeoffs clearly

## A practical leadership checklist
- write docs that prevent repeated mistakes
- enforce security checklists
- lead postmortems without blame

> Discussion: write a “quality bar” checklist and share it: https://gimmeidea.com
`,
    },
    quiz: [
      {
        id: 'q1',
        prompt: 'A Jonin-level engineer’s impact includes…',
        choices: [choice('a', 'Mentoring and setting quality bars'), choice('b', 'Only shipping features'), choice('c', 'Only redesigning UI')],
        correctChoiceId: 'a',
        explanation: 'Leadership amplifies a team’s output and safety.',
      },
      {
        id: 'q2',
        prompt: 'A good postmortem should be…',
        choices: [choice('a', 'Blameless and action-oriented'), choice('b', 'Only blaming'), choice('c', 'Hidden from the team')],
        correctChoiceId: 'a',
        explanation: 'Postmortems exist to prevent repeats.',
      },
      {
        id: 'q3',
        prompt: 'Review checklists matter because…',
        choices: [choice('a', 'They reduce repeated classes of bugs'), choice('b', 'They increase fees'), choice('c', 'They replace testing')],
        correctChoiceId: 'a',
        explanation: 'Checklists encode lessons and reduce misses.',
      },
      {
        id: 'q4',
        prompt: 'Mentoring is valuable because…',
        choices: [choice('a', 'It scales knowledge and reduces bottlenecks'), choice('b', 'It removes the need for docs'), choice('c', 'It changes blockhash')],
        correctChoiceId: 'a',
        explanation: 'A strong team is a multiplier.',
      },
      {
        id: 'q5',
        prompt: 'A clear quality bar should include…',
        choices: [choice('a', 'Security, testing, UX, and reliability expectations'), choice('b', 'Only performance'), choice('c', 'Only design')],
        correctChoiceId: 'a',
        explanation: 'Quality bars are multidimensional.',
      },
      {
        id: 'q6',
        prompt: 'The best kind of expertise sharing is…',
        choices: [choice('a', 'Docs, reviews, workshops, and reusable checklists'), choice('b', 'Keeping knowledge private'), choice('c', 'Only tweets')],
        correctChoiceId: 'a',
        explanation: 'Reusable knowledge raises the whole ecosystem.',
      },
    ],
  },
];

export const LESSONS: Lesson[] = [...GENIN, ...CHUNIN, ...JONIN];

export function lessonsByTrack(track: TrackId): Lesson[] {
  return LESSONS.filter((l) => l.track === track);
}

export function findLesson(track: TrackId, lessonId: string): Lesson {
  const l = LESSONS.find((x) => x.track === track && x.id === lessonId);
  if (!l) throw new Error('Lesson not found');
  return l;
}

export function firstLessonId(track: TrackId): string {
  const l = lessonsByTrack(track)[0];
  return l?.id || '';
}
