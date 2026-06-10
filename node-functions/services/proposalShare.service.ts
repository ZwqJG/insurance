import { randomBytes } from 'node:crypto';
import { getStore } from '@edgeone/pages-blob';

const store = getStore('proposal-shares');

interface ProposalShareRecord {
  code: string;
  created_at: string;
  proposal_result: any;
}

interface ProposalShareResponse {
  share_code: string;
  share_url: string;
}

export async function createProposalShare(proposalResult: any): Promise<ProposalShareResponse> {
  const code = randomBytes(4).toString('base64url');

  const record: ProposalShareRecord = {
    code,
    created_at: new Date().toISOString(),
    proposal_result: proposalResult,
  };

  await store.set(code, JSON.stringify(record));

  return {
    share_code: code,
    share_url: `/?s=${code}`,
  };
}

export async function getProposalShare(code: string): Promise<ProposalShareRecord | null> {
  const data = await store.get(code);
  if (!data) return null;
  return JSON.parse(data);
}
