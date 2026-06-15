import { generateMedicalProposal } from '../../services/medicalProposalGenerate.service';
import { validateMedicalCustomerInput } from '../../validators/medicalProposal.validator';
import { jsonResponse, corsHeaders } from '../../shared/cors';

export async function onRequestPost(context: {
  request: Request;
}): Promise<Response> {
  try {
    const body = await context.request.json();
    const validation = validateMedicalCustomerInput(body);
    if (!validation.success) {
      return jsonResponse({ error: '输入验证失败', details: validation.errors }, 400);
    }
    const result = generateMedicalProposal(validation.data);
    return jsonResponse(result);
  } catch (error) {
    console.error('generate medical proposal error:', error);
    return jsonResponse({ error: '生成方案失败，请稍后重试' }, 500);
  }
}

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, { headers: corsHeaders });
}
