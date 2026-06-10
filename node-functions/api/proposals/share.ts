import { createProposalShare } from '../../services/proposalShare.service';
import { jsonResponse, corsHeaders } from '../../shared/cors';

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

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: corsHeaders });
}
