import { getProposalShare } from '../../services/proposalShare.service';
import { jsonResponse, corsHeaders } from '../../shared/cors';

export async function onRequestGet(context: {
  request: Request;
  params: Record<string, string>;
}): Promise<Response> {
  try {
    const code = context.params.code;
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
