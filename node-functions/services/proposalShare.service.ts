import { randomBytes } from 'node:crypto';

interface ProposalShareRecord {
  code: string;
  created_at: string;
  proposal_result: any;
}

interface ProposalShareResponse {
  share_code: string;
  share_url: string;
}

// MVP: 使用内存存储，冷启动后数据会丢失。后续可升级为 Blob 存储或数据库。
const store = new Map<string, string>();

export async function createProposalShare(proposalResult: any): Promise<ProposalShareResponse> {
  const code = randomBytes(4).toString('base64url');

  const record: ProposalShareRecord = {
    code,
    created_at: new Date().toISOString(),
    proposal_result: proposalResult,
  };

  store.set(code, JSON.stringify(record));

  return {
    share_code: code,
    share_url: `/?s=${code}`,
  };
}

export async function getProposalShare(code: string): Promise<ProposalShareRecord | null> {
  const data = store.get(code);
  if (!data) return null;
  return JSON.parse(data);
}
