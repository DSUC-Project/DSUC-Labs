import type { AcademyV2UnitDetail } from '@/types';

export type ChallengeRunCase = {
  id: string;
  description: string;
  hidden: boolean;
  passed: boolean;
  error?: string;
};

export type ChallengeRunReport = {
  supported: boolean;
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
  visiblePassedCount: number;
  visibleTotalCount: number;
  hiddenPassedCount: number;
  hiddenTotalCount: number;
  primaryFunction: string | null;
  runtimeLabel: string;
  message: string;
  cases: ChallengeRunCase[];
};

type HeuristicCaseResult = {
  passed: boolean;
  error?: string;
};

const MOCK_PUBLIC_KEYS = {
  sender: '7Yd7W6rR6C9rF3VQ9t9f1vW3zV7h8mJ3L2P6xWq4gBkA',
  recipient: 'C9oS2N8fK4mD7vQ1nB5xL6wR3tY8pH2jU4sA9cE7rQwX',
  owner: '9wQ2aF7nH4dK8mR3uT6xB1vP5cY7jL9sE2qW4zN6gHbC',
  programId: 'B4pL8xQ3mN6vR1tY7cD2fH9kJ5sA4wE8uP3nG6zC2qMx',
  payer: 'D7qM3vB9xN2kH6tR4wY8cP1fL5sJ7uE3aG9mQ2zV6rTx',
  walletA: 'F3xQ7mN2vB6kH9tR4wY8cP1fL5sJ7uE3aG9mQ2zV6rTy',
  walletB: 'H8mQ2xN6vB3kR9tY4cP1fL5sJ7uE3aG9wD2zV6rT4nKx',
};

const LAMPORTS_PER_SOL = 1_000_000_000;

function stripImportBlocks(code: string) {
  return String(code || '').replace(/^\s*import[\s\S]*?;\s*$/gm, '');
}

function stripInterfaceBlocks(code: string) {
  const source = String(code || '');
  let cursor = 0;
  let output = '';

  while (cursor < source.length) {
    const match = /\binterface\s+[A-Za-z0-9_]+\s*\{/.exec(source.slice(cursor));
    if (!match) {
      output += source.slice(cursor);
      break;
    }

    const start = cursor + match.index;
    output += source.slice(cursor, start);

    let braceIndex = start + match[0].lastIndexOf('{');
    let depth = 0;
    let end = braceIndex;
    while (end < source.length) {
      const char = source[end];
      if (char === '{') {
        depth += 1;
      } else if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          end += 1;
          break;
        }
      }
      end += 1;
    }

    cursor = end;
  }

  return output;
}

function stripParamTypes(params: string) {
  let output = '';
  let mode: 'normal' | 'type' = 'normal';
  let parenDepth = 0;
  let braceDepth = 0;
  let bracketDepth = 0;
  let angleDepth = 0;

  for (let index = 0; index < params.length; index += 1) {
    const char = params[index];

    if (mode === 'normal') {
      if (char === ':' && parenDepth === 0 && braceDepth === 0 && bracketDepth === 0 && angleDepth === 0) {
        mode = 'type';
        continue;
      }

      output += char;
    } else {
      if (char === '<') {
        angleDepth += 1;
        continue;
      }
      if (char === '>' && angleDepth > 0) {
        angleDepth -= 1;
        continue;
      }
      if (char === '(') {
        parenDepth += 1;
        continue;
      }
      if (char === ')' && parenDepth > 0) {
        parenDepth -= 1;
        continue;
      }
      if (char === '{') {
        braceDepth += 1;
        continue;
      }
      if (char === '}' && braceDepth > 0) {
        braceDepth -= 1;
        continue;
      }
      if (char === '[') {
        bracketDepth += 1;
        continue;
      }
      if (char === ']' && bracketDepth > 0) {
        bracketDepth -= 1;
        continue;
      }

      if (
        char === ',' &&
        parenDepth === 0 &&
        braceDepth === 0 &&
        bracketDepth === 0 &&
        angleDepth === 0
      ) {
        mode = 'normal';
        output += ',';
      }
    }
  }

  return output;
}

function stripFunctionTypes(code: string) {
  const source = String(code || '');
  let cursor = 0;
  let output = '';

  while (cursor < source.length) {
    const match = /\b(?:async\s+)?function\s+[A-Za-z0-9_]+\s*\(/.exec(source.slice(cursor));
    if (!match) {
      output += source.slice(cursor);
      break;
    }

    const start = cursor + match.index;
    output += source.slice(cursor, start);

    const headerStart = start;
    let parenIndex = start + match[0].length - 1;
    let parenDepth = 0;
    let endParams = parenIndex;

    for (; endParams < source.length; endParams += 1) {
      const char = source[endParams];
      if (char === '(') {
        parenDepth += 1;
      } else if (char === ')') {
        parenDepth -= 1;
        if (parenDepth === 0) {
          break;
        }
      }
    }

    const prefix = source.slice(headerStart, parenIndex + 1);
    const rawParams = source.slice(parenIndex + 1, endParams);
    output += `${prefix}${stripParamTypes(rawParams)})`;

    cursor = endParams + 1;
    while (cursor < source.length && /\s/.test(source[cursor])) {
      output += source[cursor];
      cursor += 1;
    }

    if (source[cursor] === ':') {
      cursor += 1;
      let braceDepth = 0;
      let bracketDepth = 0;
      let angleDepth = 0;
      let nestedParenDepth = 0;

      while (cursor < source.length) {
        const char = source[cursor];
        if (char === '{' && braceDepth === 0 && bracketDepth === 0 && angleDepth === 0 && nestedParenDepth === 0) {
          output += ' ';
          break;
        }
        if (char === '{') {
          braceDepth += 1;
        } else if (char === '}' && braceDepth > 0) {
          braceDepth -= 1;
        } else if (char === '[') {
          bracketDepth += 1;
        } else if (char === ']' && bracketDepth > 0) {
          bracketDepth -= 1;
        } else if (char === '<') {
          angleDepth += 1;
        } else if (char === '>' && angleDepth > 0) {
          angleDepth -= 1;
        } else if (char === '(') {
          nestedParenDepth += 1;
        } else if (char === ')' && nestedParenDepth > 0) {
          nestedParenDepth -= 1;
        }
        cursor += 1;
      }
    }
  }

  return output;
}

function sanitizeJsLikeChallengeSource(code: string) {
  return stripFunctionTypes(stripInterfaceBlocks(stripImportBlocks(code)));
}

function extractPrimaryFunctionName(code: string) {
  const matches = [...String(code || '').matchAll(/\bfunction\s+([A-Za-z0-9_]+)\s*\(/g)];
  return matches[0]?.[1] || null;
}

function extractRustPrimaryFunctionName(code: string) {
  const matches = [...String(code || '').matchAll(/\bfn\s+([A-Za-z0-9_]+)\s*\(/g)];
  return matches[0]?.[1] || null;
}

class MockPublicKey {
  value: string;

  constructor(input: string | MockPublicKey) {
    const raw = input instanceof MockPublicKey ? input.toBase58() : String(input || '').trim();
    if (!raw || raw === 'invalid') {
      throw new Error('Invalid public key');
    }

    this.value = raw.length >= 32 ? raw : `${raw}${MOCK_PUBLIC_KEYS.sender}`.slice(0, 32);
  }

  toBase58() {
    return this.value;
  }

  toString() {
    return this.value;
  }

  toBytes() {
    return Array.from(new TextEncoder().encode(this.value.padEnd(32, '1').slice(0, 32)));
  }

  static isOnCurve(bytes: number[] | Uint8Array) {
    return Array.isArray(bytes) ? bytes.length > 0 : bytes.byteLength > 0;
  }
}

class MockKeypair {
  publicKey: MockPublicKey;

  constructor(seed?: string) {
    this.publicKey = new MockPublicKey(seed || MOCK_PUBLIC_KEYS.payer);
  }

  static generate() {
    const randomSeed = `${MOCK_PUBLIC_KEYS.payer}${Math.random().toString(36).slice(2)}`.slice(0, 44);
    return new MockKeypair(randomSeed);
  }
}

class MockTransaction {
  instructions: any[];

  constructor() {
    this.instructions = [];
  }

  add(instruction: any) {
    this.instructions.push(instruction);
    return this;
  }
}

class MockConnection {
  balances: Map<string, number>;

  constructor(initialBalances?: Record<string, number>) {
    this.balances = new Map(Object.entries(initialBalances || {}));
  }

  async getBalance(publicKey: MockPublicKey) {
    return this.balances.get(publicKey.toBase58()) ?? 2 * LAMPORTS_PER_SOL;
  }
}

const MockSystemProgram = {
  transfer({
    fromPubkey,
    toPubkey,
    lamports,
  }: {
    fromPubkey: MockPublicKey;
    toPubkey: MockPublicKey;
    lamports: number;
  }) {
    return {
      programId: '11111111111111111111111111111111',
      fromPubkey,
      toPubkey,
      lamports,
    };
  },
};

async function mockCreateMint() {
  return new MockPublicKey(`${MOCK_PUBLIC_KEYS.programId}${Date.now()}`.slice(0, 44));
}

function createAccountDataFixture() {
  const username = 'alice';
  const usernameBytes = new TextEncoder().encode(username);
  const result = new Uint8Array(9 + usernameBytes.length);
  const view = new DataView(result.buffer);
  view.setUint8(0, 1);
  view.setUint32(1, 5, true);
  view.setUint32(5, usernameBytes.length, true);
  result.set(usernameBytes, 9);
  return result;
}

function createSandbox() {
  const sender = new MockPublicKey(MOCK_PUBLIC_KEYS.sender);
  const recipient = new MockPublicKey(MOCK_PUBLIC_KEYS.recipient);
  const owner = new MockPublicKey(MOCK_PUBLIC_KEYS.owner);
  const programId = new MockPublicKey(MOCK_PUBLIC_KEYS.programId);
  const payer = new MockKeypair(MOCK_PUBLIC_KEYS.payer);
  const walletA = new MockPublicKey(MOCK_PUBLIC_KEYS.walletA);
  const walletB = new MockPublicKey(MOCK_PUBLIC_KEYS.walletB);
  const connection = new MockConnection({
    [sender.toBase58()]: 5 * LAMPORTS_PER_SOL,
    [recipient.toBase58()]: 0.5 * LAMPORTS_PER_SOL,
    [walletA.toBase58()]: 2 * LAMPORTS_PER_SOL,
    [walletB.toBase58()]: 0.75 * LAMPORTS_PER_SOL,
  });

  return {
    PublicKey: MockPublicKey,
    Keypair: MockKeypair,
    Transaction: MockTransaction,
    SystemProgram: MockSystemProgram,
    Connection: MockConnection,
    LAMPORTS_PER_SOL,
    createMint: mockCreateMint,
    Uint8Array,
    DataView,
    TextEncoder,
    TextDecoder,
    Date,
    Math,
    console: {
      log: (..._args: unknown[]) => {},
      error: (..._args: unknown[]) => {},
      warn: (..._args: unknown[]) => {},
    },
    sender,
    recipient,
    owner,
    programId,
    payer,
    connection,
    data: createAccountDataFixture(),
    wallets: [walletA, walletB],
  };
}

function evaluateArgumentList(input: string, sandbox: Record<string, any>) {
  if (!String(input || '').trim()) {
    return [];
  }

  const keys = Object.keys(sandbox);
  const values = Object.values(sandbox);
  return new Function(...keys, `return [${input}];`)(...values) as unknown[];
}

async function executePrimaryFunction(
  sanitizedCode: string,
  primaryFunction: string,
  input: string
) {
  const sandbox = createSandbox();
  const keys = Object.keys(sandbox);
  const values = Object.values(sandbox);

  const factory = new Function(
    ...keys,
    `
      "use strict";
      ${sanitizedCode}
      return typeof ${primaryFunction} === "function" ? ${primaryFunction} : null;
    `
  );

  const fn = factory(...values);
  if (typeof fn !== 'function') {
    throw new Error(`Primary function "${primaryFunction}" was not found after compilation.`);
  }

  const args = evaluateArgumentList(input, sandbox);
  return await Promise.resolve(fn(...args));
}

function evaluateExpectedOutput(expectedOutput: string, result: unknown) {
  const expression = String(expectedOutput || '').trim();
  if (!expression) {
    return true;
  }

  try {
    return Boolean(
      new Function('result', 'Transaction', `return (${expression});`)(result, MockTransaction)
    );
  } catch {
    return Boolean(
      new Function('result', 'Transaction', `${expression}`)(result, MockTransaction)
    );
  }
}

function isSupportedJsLikeChallenge(unit: AcademyV2UnitDetail) {
  return unit.section === 'practice' && !unit.language && !!unit.code && unit.tests.length > 0;
}

function testPattern(source: string, pattern: RegExp | string) {
  if (typeof pattern === 'string') {
    return source.includes(pattern);
  }

  return pattern.test(source);
}

function matchAll(source: string, patterns: Array<RegExp | string>) {
  return patterns.every((pattern) => testPattern(source, pattern));
}

function countMatches(source: string, pattern: RegExp) {
  const matches = source.match(pattern);
  return matches ? matches.length : 0;
}

function buildHeuristicCase(
  passed: boolean,
  fallbackError: string
): HeuristicCaseResult {
  return {
    passed,
    error: passed ? undefined : fallbackError,
  };
}

function hasCounterProgramBase(source: string) {
  return matchAll(source, [
    /use\s+anchor_lang::prelude::\*/m,
    /declare_id!\s*\(/m,
    /#\s*\[\s*program\s*\]/m,
    /pub\s+mod\s+academy_program/m,
    /pub\s+fn\s+initialize\s*\(/m,
  ]);
}

function hasInitializedCounterScaffold(source: string) {
  return (
    hasCounterProgramBase(source) &&
    hasInitializeCounterConstraints(source) &&
    hasCounterAccountStruct(source) &&
    matchAll(source, [
      /pub\s+system_program\s*:\s*Program\s*<\s*'info\s*,\s*System\s*>/m,
      /counter\.count\s*=\s*0/m,
      /counter\.authority\s*=\s*ctx\.accounts\.user\.key\(\)/m,
    ])
  );
}

function hasCounterAccountStruct(source: string) {
  return matchAll(source, [
    /pub\s+struct\s+Counter/m,
    /pub\s+count\s*:\s*u64/m,
    /pub\s+authority\s*:\s*Pubkey/m,
  ]);
}

function hasInitializeCounterConstraints(source: string) {
  return matchAll(source, [
    /pub\s+struct\s+Initialize\s*<\s*'info\s*>/m,
    /#\s*\[\s*account\s*\(\s*init[\s\S]*payer\s*=\s*user[\s\S]*seeds\s*=\s*\[\s*b"counter"\s*,\s*user\.key\(\)\.as_ref\(\)\s*\][\s\S]*bump[\s\S]*\)\s*\]/m,
    /pub\s+counter\s*:\s*Account\s*<\s*'info\s*,\s*Counter\s*>/m,
  ]);
}

function hasIncrementStruct(source: string) {
  return matchAll(source, [
    /pub\s+struct\s+Increment\s*<\s*'info\s*>/m,
    /#\s*\[\s*account\s*\(\s*mut\s*\)\s*\][\s\S]*pub\s+counter\s*:\s*Account\s*<\s*'info\s*,\s*Counter\s*>/m,
  ]);
}

function hasDecrementStruct(source: string) {
  return matchAll(source, [
    /pub\s+struct\s+Decrement\s*<\s*'info\s*>/m,
    /#\s*\[\s*account\s*\(\s*mut\s*\)\s*\][\s\S]*pub\s+counter\s*:\s*Account\s*<\s*'info\s*,\s*Counter\s*>/m,
  ]);
}

function hasFullCounterFlow(source: string) {
  return (
    hasCounterProgramBase(source) &&
    hasInitializeCounterConstraints(source) &&
    hasCounterAccountStruct(source) &&
    matchAll(source, [
      /pub\s+fn\s+increment\s*\(/m,
      /counter\.count\s*\+=\s*1/m,
      /pub\s+system_program\s*:\s*Program\s*<\s*'info\s*,\s*System\s*>/m,
    ])
  );
}

function buildRustHeuristicCases(unit: AcademyV2UnitDetail): HeuristicCaseResult[] | null {
  const source = String(unit.code || '');

  switch (unit.id) {
    case 'anchor-setup-challenge':
      return [
        buildHeuristicCase(
          countMatches(source, /AccountMeta\s*\{/g) >= 3,
          'Add exactly two AccountMeta entries for the user and the system program.'
        ),
        buildHeuristicCase(
          matchAll(source, [
            /instruction_name\s*(?:\.as_bytes\(\))?\s*\.len\(\)/m,
            /data_len/m,
          ]),
          'Encode the instruction name length and include it in the returned data_len field.'
        ),
        buildHeuristicCase(
          matchAll(source, [
            /format!\s*\(/m,
            /program:\{\}/m,
            /accounts:\{\}/m,
            /data_len:\{\}/m,
            /program_id/m,
          ]),
          'Return the instruction summary string with program_id, account count, and data length.'
        ),
      ];
    case 'anchor-accounts-challenge':
      return [
        buildHeuristicCase(
          matchAll(source, [
            /Ok\s*\(\s*"Valid"/m,
            /IncorrectProgramId/m,
            /MissingRequiredSignature/m,
            /AccountNotWritable/m,
          ]),
          'Cover the valid path plus all expected Anchor-style account errors.'
        ),
        buildHeuristicCase(
          matchAll(source, [
            /account_owner\s*!=\s*expected_owner/m,
            /IncorrectProgramId/m,
          ]),
          'Validate owner mismatches and return IncorrectProgramId.'
        ),
        buildHeuristicCase(
          matchAll(source, [
            /require_signer/m,
            /!\s*is_signer/m,
            /MissingRequiredSignature/m,
          ]),
          'Check the signer requirement before approving the account.'
        ),
        buildHeuristicCase(
          matchAll(source, [
            /require_writable/m,
            /!\s*is_writable/m,
            /AccountNotWritable/m,
          ]),
          'Reject non-writable accounts when the instruction needs mutation.'
        ),
      ];
    case 'pda-advanced-challenge':
      return [
        buildHeuristicCase(
          matchAll(source, [
            /find_pda\s*\(\s*&\s*\[\s*"user"\s*,\s*user\s*\]\s*,\s*program_id\s*\)/m,
            /find_pda\s*\(\s*&\s*\[\s*"stats"\s*,\s*user\s*\]\s*,\s*program_id\s*\)/m,
            /find_pda\s*\(\s*&\s*\[\s*"vault"\s*,\s*user\s*\]\s*,\s*program_id\s*\)/m,
          ]),
          'Derive the user, stats, and vault PDAs with distinct seed prefixes.'
        ),
        buildHeuristicCase(
          matchAll(source, [
            /\(\s*[A-Za-z_][A-Za-z0-9_]*\s*,\s*[A-Za-z_][A-Za-z0-9_]*\s*,\s*[A-Za-z_][A-Za-z0-9_]*\s*\)/m,
          ]),
          'Return a tuple with the three derived PDA hashes.'
        ),
        buildHeuristicCase(
          matchAll(source, [
            /\[\s*"user"\s*,\s*user\s*\]/m,
            /\[\s*"stats"\s*,\s*user\s*\]/m,
            /\[\s*"vault"\s*,\s*user\s*\]/m,
          ]),
          'Use the function user parameter inside every PDA seed set.'
        ),
      ];
    case 'cpi-challenge':
      return [
        buildHeuristicCase(
          matchAll(source, [
            /Ok\s*\(\s*\(/m,
            /recipient_balance\s*\+\s*amount/m,
            /vault_balance\s*-\s*amount/m,
          ]),
          'Return updated vault and recipient balances when the transfer succeeds.'
        ),
        buildHeuristicCase(
          matchAll(source, [
            /vault_balance\s*<\s*amount/m,
            /Err\s*\(/m,
          ]),
          'Reject transfers that exceed the vault balance.'
        ),
        buildHeuristicCase(
          matchAll(source, [
            /find_pda\s*\(\s*&\s*\[\s*"vault"\s*,\s*user\s*\]\s*,\s*"prog1"\s*\)/m,
            /bump/m,
            /recipient_balance\s*\+\s*amount/m,
            /vault_balance\s*-\s*amount/m,
          ]),
          'Derive the vault PDA bump and include it with the updated balances.'
        ),
      ];
    case 'testing-challenge':
      return [
        buildHeuristicCase(
          matchAll(source, [
            /PASS:/m,
            /sender_initial\s*[<>]=?\s*transfer_amount\s*\+\s*fee|transfer_amount\s*\+\s*fee\s*[<>]=?\s*sender_initial/m,
          ]),
          'Check affordability and emit a PASS payload for valid transfers.'
        ),
        buildHeuristicCase(
          /FAIL:insufficient_funds/.test(source),
          'Return FAIL:insufficient_funds when the sender cannot afford the transfer.'
        ),
        buildHeuristicCase(
          /sender_initial\s*-\s*transfer_amount\s*-\s*fee/.test(source),
          'Compute the sender balance as initial minus transfer amount and fee.'
        ),
      ];
    case 'rust-basics-challenge':
      return [
        buildHeuristicCase(
          matchAll(source, [
            /OK:/m,
            /self\.balance\s*-=\s*amount|balance\s*-\s*amount/m,
          ]),
          'Return the updated balance inside an OK:<remaining> string.'
        ),
        buildHeuristicCase(
          matchAll(source, [
            /ERR:/m,
            /amount\s*>\s*self\.balance|self\.balance\s*<\s*amount|balance\s*<\s*amount|amount\s*>\s*balance/m,
          ]),
          'Return an ERR:* response when the withdrawal exceeds the balance.'
        ),
        buildHeuristicCase(
          /self\.balance\s*-=\s*amount|balance\s*-\s*amount/.test(source),
          'Use the same subtraction path for exact-balance withdrawals so the result can reach zero.'
        ),
      ];
    case 'serialization-challenge':
      return [
        buildHeuristicCase(
          matchAll(source, [
            /Vec::new\s*\(\s*\)/m,
            /owner\.len\(\)\s+as\s+u32[\s\S]*to_le_bytes/m,
            /balance\.to_le_bytes\(\)/m,
            /buf\.push\s*\(/m,
          ]),
          'Write the owner length, balance bytes, and frozen flag into a Vec<u8>.'
        ),
        buildHeuristicCase(
          matchAll(source, [
            /owner\.len\(\)\s+as\s+u32/m,
            /owner\.as_bytes\(\)/m,
          ]),
          'Serialize the owner length prefix and owner UTF-8 bytes.'
        ),
        buildHeuristicCase(
          matchAll(source, [
            /extend_from_slice\s*\(\s*&\s*\(owner\.len\(\)\s+as\s+u32\)\.to_le_bytes\(\)\s*\)/m,
            /extend_from_slice\s*\(\s*owner\.as_bytes\(\)\s*\)/m,
          ]),
          'Append owner bytes immediately after the length prefix.'
        ),
      ];
    case 'error-challenge':
      return [
        buildHeuristicCase(
          /Ok\s*\(\s*\(\s*\)\s*\)|Ok\s*\(\s*\)/m.test(source),
          'Return Ok(()) only after every validation passes.'
        ),
        buildHeuristicCase(
          matchAll(source, [
            /recipient\.is_empty\(\)/m,
            /INVALID_RECIPIENT/m,
          ]),
          'Reject empty recipients with INVALID_RECIPIENT.'
        ),
        buildHeuristicCase(
          matchAll(source, [
            /amount\s*==\s*0/m,
            /ZERO_AMOUNT/m,
          ]),
          'Reject zero-value transfers with ZERO_AMOUNT.'
        ),
        buildHeuristicCase(
          matchAll(source, [
            /sender_balance\s*<\s*amount/m,
            /INSUFFICIENT_BALANCE/m,
          ]),
          'Reject transfers that exceed the sender balance.'
        ),
      ];
    case 'rust-program-challenge':
      return [
        buildHeuristicCase(
          matchAll(source, [
            /Ok\s*\(\s*\(\s*new_sender\s*,\s*new_recipient\s*\)\s*\)/m,
            /new_recipient\s*=\s*recipient_balance\s*\+\s*amount/m,
          ]),
          'Return the new sender and recipient balances on success.'
        ),
        buildHeuristicCase(
          matchAll(source, [
            /sender_balance\s*<\s*total_cost|sender_balance\s*<\s*amount\s*\+\s*fee/m,
            /INSUFFICIENT_BALANCE|Err\s*\(/m,
          ]),
          'Reject transfers when amount plus fee exceeds the sender balance.'
        ),
        buildHeuristicCase(
          /new_sender\s*=\s*sender_balance\s*-\s*total_cost|new_sender\s*=\s*sender_balance\s*-\s*amount\s*-\s*fee/m.test(source),
          'Subtract both the transfer amount and fee from the sender balance.'
        ),
      ];
    case 'pda-challenge':
      return [
        buildHeuristicCase(
          matchAll(source, [
            /for\s+bump\s+in\s+\(0\.\.=255u8\)\.rev\(\)/m,
            /hash\s*%\s*2\s*==\s*0/m,
          ]),
          'Search bumps from 255 down until an off-curve hash is found.'
        ),
        buildHeuristicCase(
          /hash_with_bump\s*\(\s*seeds\s*,\s*bump\s*,\s*program_id\s*\)/m.test(source),
          'Call hash_with_bump with the provided seeds, bump, and program_id.'
        ),
        buildHeuristicCase(
          /return\s*\(\s*hash\s*,\s*bump\s*\)/m.test(source),
          'Return the derived hash and bump together.'
        ),
      ];
    case 'your-first-build':
      return [
        buildHeuristicCase(
          hasCounterProgramBase(source) && /pub\s+struct\s+Initialize/m.test(source),
          'Keep the base Anchor program shell with initialize and Initialize accounts.'
        ),
      ];
    case 'add-instruction':
      return [
        buildHeuristicCase(
          hasCounterProgramBase(source) && /pub\s+struct\s+Initialize/m.test(source),
          'Keep the base Anchor program shell intact.'
        ),
        buildHeuristicCase(
          /pub\s+fn\s+greet\s*\(\s*_?ctx\s*:\s*Context\s*<\s*Greet\s*>\s*\)\s*->\s*Result\s*<\s*\(\s*\)\s*>/m.test(source),
          'Add the greet instruction to the program module.'
        ),
        buildHeuristicCase(
          /pub\s+struct\s+Greet/m.test(source),
          'Define the Greet accounts struct.'
        ),
      ];
    case 'define-counter-account':
      return [
        buildHeuristicCase(
          hasCounterProgramBase(source) &&
            hasInitializeCounterConstraints(source) &&
            /pub\s+system_program\s*:\s*Program\s*<\s*'info\s*,\s*System\s*>/m.test(source),
          'Set up Initialize with the Counter PDA and system program.'
        ),
        buildHeuristicCase(
          hasCounterAccountStruct(source),
          'Define the Counter account struct with count and authority.'
        ),
        buildHeuristicCase(
          matchAll(source, [
            /seeds\s*=\s*\[\s*b"counter"\s*,\s*user\.key\(\)\.as_ref\(\)\s*\]/m,
            /bump/m,
          ]),
          'Add the counter PDA constraints with seeds and bump.'
        ),
      ];
    case 'wire-up-initialize':
      return [
        buildHeuristicCase(
          hasInitializedCounterScaffold(source),
          'Wire initialize so the Counter account is configured correctly.'
        ),
        buildHeuristicCase(
          /pub\s+system_program\s*:\s*Program\s*<\s*'info\s*,\s*System\s*>/m.test(source),
          'Include the system_program account in Initialize.'
        ),
        buildHeuristicCase(
          matchAll(source, [
            /counter\.count\s*=\s*0/m,
            /counter\.authority\s*=\s*ctx\.accounts\.user\.key\(\)/m,
          ]),
          'Initialize the counter state and authority values.'
        ),
      ];
    case 'build-increment':
      return [
        buildHeuristicCase(
          hasInitializedCounterScaffold(source),
          'Keep the initialized counter scaffold intact before layering increment on top.'
        ),
        buildHeuristicCase(
          matchAll(source, [
            /pub\s+fn\s+increment\s*\(\s*ctx\s*:\s*Context\s*<\s*Increment\s*>\s*\)\s*->\s*Result\s*<\s*\(\s*\)\s*>/m,
            /counter\.count\s*\+=\s*1/m,
          ]),
          'Add the increment instruction and mutate the counter.'
        ),
        buildHeuristicCase(
          hasIncrementStruct(source),
          'Define the Increment accounts struct with a mutable counter account.'
        ),
      ];
    case 'complete-counter-program':
      return [
        buildHeuristicCase(
          hasFullCounterFlow(source) &&
            hasIncrementStruct(source) &&
            hasDecrementStruct(source) &&
            /pub\s+fn\s+decrement\s*\(/m.test(source),
          'Keep the full counter program wired with initialize, increment, and decrement.'
        ),
        buildHeuristicCase(
          matchAll(source, [
            /pub\s+fn\s+decrement\s*\(/m,
            /require!\s*\(\s*counter\.count\s*>\s*0\s*,\s*ErrorCode::Underflow\s*\)/m,
            /counter\.count\s*-=\s*1/m,
          ]),
          'Add decrement with an explicit underflow guard.'
        ),
        buildHeuristicCase(
          /enum\s+ErrorCode[\s\S]*Underflow/m.test(source),
          'Define the ErrorCode enum with the Underflow variant.'
        ),
      ];
    case 'deploy-to-devnet':
    case 'deploy-program-devnet':
      return [
        buildHeuristicCase(
          hasFullCounterFlow(source) &&
            hasIncrementStruct(source) &&
            hasDecrementStruct(source) &&
            /enum\s+ErrorCode[\s\S]*Underflow/m.test(source) &&
            /pub\s+fn\s+decrement\s*\(/m.test(source),
          'Keep the counter program structurally complete before the real deploy/build step.'
        ),
      ];
    default:
      return null;
  }
}

function buildHeuristicReport(
  unit: AcademyV2UnitDetail,
  runtimeLabel: string,
  primaryFunction: string | null,
  caseResults: HeuristicCaseResult[],
  successMessage: string,
  failureMessage: string
): ChallengeRunReport {
  const cases: ChallengeRunCase[] = unit.tests.map((test, index) => {
    const result = caseResults[index] || buildHeuristicCase(false, 'No verifier matched this check.');
    return {
      id: test.id,
      description: test.description,
      hidden: test.hidden === true,
      passed: result.passed,
      error: result.error,
    };
  });

  const passedCount = cases.filter((item) => item.passed).length;
  const visibleCases = cases.filter((item) => item.hidden !== true);
  const hiddenCases = cases.filter((item) => item.hidden === true);
  const visiblePassedCount = visibleCases.filter((item) => item.passed).length;
  const hiddenPassedCount = hiddenCases.filter((item) => item.passed).length;
  const allPassed = cases.length > 0 && passedCount === cases.length;

  return {
    supported: true,
    allPassed,
    passedCount,
    totalCount: cases.length,
    visiblePassedCount,
    visibleTotalCount: visibleCases.length,
    hiddenPassedCount,
    hiddenTotalCount: hiddenCases.length,
    primaryFunction,
    runtimeLabel,
    message: allPassed ? successMessage : failureMessage,
    cases,
  };
}

function buildRustRuntimeMessage(unit: AcademyV2UnitDetail, allPassed: boolean) {
  if (unit.build_type === 'buildable') {
    return allPassed
      ? 'Scaffold verification passed. The required Anchor structure is present, but this is still not a real cargo or anchor build.'
      : 'Some scaffold checks are still failing. These checks validate required Anchor structure locally, not a real cargo or anchor build.';
  }

  return allPassed
    ? 'Guided Rust checks passed for this draft. Core logic and structure look complete for this lesson.'
    : 'Some guided Rust checks are still failing. These checks validate lesson logic locally, not a real cargo build.';
}

function runRustHeuristicChallenge(unit: AcademyV2UnitDetail): ChallengeRunReport | null {
  if (unit.language !== 'rust' || !unit.tests.length) {
    return null;
  }

  const caseResults = buildRustHeuristicCases(unit);
  if (!caseResults) {
    return null;
  }

  const runtimeLabel =
    unit.build_type === 'buildable' ? 'Rust scaffold verifier' : 'Guided Rust verifier';
  const primaryFunction = extractRustPrimaryFunctionName(unit.code);
  const successMessage = buildRustRuntimeMessage(unit, true);
  const failureMessage = buildRustRuntimeMessage(unit, false);

  return buildHeuristicReport(
    unit,
    runtimeLabel,
    primaryFunction,
    caseResults,
    successMessage,
    failureMessage
  );
}

export function canRunAcademyChallenge(unit: AcademyV2UnitDetail) {
  return isSupportedJsLikeChallenge(unit) || !!runRustHeuristicChallenge(unit);
}

export async function runAcademyChallenge(unit: AcademyV2UnitDetail): Promise<ChallengeRunReport> {
  const rustReport = runRustHeuristicChallenge(unit);
  if (rustReport) {
    return rustReport;
  }

  if (!canRunAcademyChallenge(unit)) {
    return {
      supported: false,
      allPassed: false,
      passedCount: 0,
      totalCount: unit.tests.length,
      visiblePassedCount: 0,
      visibleTotalCount: unit.tests.filter((item) => item.hidden !== true).length,
      hiddenPassedCount: 0,
      hiddenTotalCount: unit.tests.filter((item) => item.hidden === true).length,
      primaryFunction: null,
      runtimeLabel: unit.language === 'rust' ? 'Guided Rust lab' : 'Guided practice',
      message:
        unit.language === 'rust'
          ? 'This challenge is a guided Rust lab for now. Browser execution is not enabled yet.'
          : 'This practice unit does not have an executable browser runner yet.',
      cases: [],
    };
  }

  const primaryFunction = extractPrimaryFunctionName(unit.code);
  if (!primaryFunction) {
    return {
      supported: false,
      allPassed: false,
      passedCount: 0,
      totalCount: unit.tests.length,
      visiblePassedCount: 0,
      visibleTotalCount: unit.tests.filter((item) => item.hidden !== true).length,
      hiddenPassedCount: 0,
      hiddenTotalCount: unit.tests.filter((item) => item.hidden === true).length,
      primaryFunction: null,
      runtimeLabel: 'Unsupported challenge',
      message: 'No runnable primary function could be detected in this challenge source.',
      cases: [],
    };
  }

  const sanitizedCode = sanitizeJsLikeChallengeSource(unit.code);
  const cases: ChallengeRunCase[] = [];

  for (const test of unit.tests) {
    try {
      const result = await executePrimaryFunction(sanitizedCode, primaryFunction, test.input || '');
      const passed = evaluateExpectedOutput(test.expectedOutput || '', result);
      cases.push({
        id: test.id,
        description: test.description,
        hidden: test.hidden === true,
        passed,
        error: passed ? undefined : 'Expected output check failed.',
      });
    } catch (error: any) {
      cases.push({
        id: test.id,
        description: test.description,
        hidden: test.hidden === true,
        passed: false,
        error: error?.message || 'Challenge execution failed.',
      });
    }
  }

  const passedCount = cases.filter((item) => item.passed).length;
  const visibleCases = cases.filter((item) => item.hidden !== true);
  const hiddenCases = cases.filter((item) => item.hidden === true);
  const visiblePassedCount = visibleCases.filter((item) => item.passed).length;
  const hiddenPassedCount = hiddenCases.filter((item) => item.passed).length;
  const allPassed = cases.length > 0 && passedCount === cases.length;

  return {
    supported: true,
    allPassed,
    passedCount,
    totalCount: cases.length,
    visiblePassedCount,
    visibleTotalCount: visibleCases.length,
    hiddenPassedCount,
    hiddenTotalCount: hiddenCases.length,
    primaryFunction,
    runtimeLabel: 'Browser challenge runner',
    message: allPassed
      ? 'All visible and hidden checks passed for this challenge.'
      : 'Some checks are still failing. Fix the code and run the challenge again.',
    cases,
  };
}
