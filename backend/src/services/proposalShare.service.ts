import { randomBytes } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { ProposalResult } from '../types';

interface ProposalShareRecord {
  code: string;
  created_at: string;
  proposal_result: ProposalResult;
}

interface ProposalShareResponse {
  share_code: string;
  share_url: string;
}

const shareStorePath = path.resolve(process.cwd(), 'src/data/proposal-shares.json');

async function readShareRecords(): Promise<ProposalShareRecord[]> {
  try {
    const raw = await readFile(shareStorePath, 'utf8');
    const parsed = JSON.parse(raw) as ProposalShareRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeShareRecords(records: ProposalShareRecord[]): Promise<void> {
  await mkdir(path.dirname(shareStorePath), { recursive: true });
  await writeFile(shareStorePath, JSON.stringify(records, null, 2), 'utf8');
}

function createShareCode(): string {
  return randomBytes(4).toString('base64url');
}

export async function createProposalShare(proposalResult: ProposalResult): Promise<ProposalShareResponse> {
  const records = await readShareRecords();
  let code = createShareCode();

  while (records.some((record) => record.code === code)) {
    code = createShareCode();
  }

  records.push({
    code,
    created_at: new Date().toISOString(),
    proposal_result: proposalResult,
  });

  await writeShareRecords(records);

  return {
    share_code: code,
    share_url: `/?s=${code}`,
  };
}

export async function getProposalShare(code: string): Promise<ProposalShareRecord | null> {
  const records = await readShareRecords();
  return records.find((record) => record.code === code) ?? null;
}
