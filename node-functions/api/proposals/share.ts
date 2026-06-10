import { createProposalShare, getProposalShare } from '../../services/proposalShare.service';
import { jsonResponse, corsHeaders } from '../../shared/cors';

// 注意：创建和获取分享必须在同一个 .ts 文件中，因为 EdgeOne Pages 对每个文件独立打包，
// 如果拆到不同文件，各自的 Map 实例不互通，导致写入后读取不到。

export async function onRequestPost(context: {
  request: Request;
}): Promise<Response> {
  try {
    const body = await context.request.json();
    const proposalResult = body.proposal_result;
    if (!proposalResult || !proposalResult.proposal_id) {
      return jsonResponse({ error: '缺少 proposal_result 或 proposal_id' }, 400);
    }
    const result = await createProposalShare(proposalResult);
    return jsonResponse(result);
  } catch (error) {
    console.error('share error:', error);
    return jsonResponse({ error: '创建分享链接失败' }, 500);
  }
}

export async function onRequestGet(context: {
  request: Request;
}): Promise<Response> {
  try {
    const url = new URL(context.request.url);
    const code = url.searchParams.get('code');
    if (!code) {
      return jsonResponse({ error: '缺少分享码' }, 400);
    }
    const record = await getProposalShare(code);
    if (!record) {
      return jsonResponse({ error: '分享链接无效或已过期' }, 404);
    }
    return jsonResponse(record);
  } catch (error) {
    console.error('get share error:', error);
    return jsonResponse({ error: '获取分享方案失败' }, 500);
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: corsHeaders });
}
