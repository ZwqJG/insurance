import { Router, Request, Response } from 'express';
import { generateProposal } from '../services/proposalGenerate.service';
import { createProposalShare, getProposalShare } from '../services/proposalShare.service';
import { validateCustomerInput } from '../validators/proposal.validator';
import { ProposalResult } from '../types';

const router = Router();

router.post('/generate', async (req: Request, res: Response) => {
  try {
    const validation = validateCustomerInput(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: '请求参数有误', details: validation.errors });
    }
    const result = generateProposal(validation.data);
    if (result.matched_products.length === 0) {
      return res.status(404).json({
        error: '未找到匹配产品',
        message: '当前产品库中暂无符合该客户条件的儿童重疾险产品，请调整预算、保障期间或其他条件后重试。',
      });
    }
    return res.json(result);
  } catch (err) {
    console.error('生成方案失败:', err);
    return res.status(500).json({ error: '服务器内部错误，请稍后重试' });
  }
});

router.post('/share', async (req: Request, res: Response) => {
  try {
    const proposalResult = req.body?.proposal_result as ProposalResult | undefined;
    if (!proposalResult?.proposal_id || !proposalResult?.proposal_content || !proposalResult?.matched_products) {
      return res.status(400).json({ error: '分享内容缺失，请先生成方案后再创建分享链接' });
    }

    const share = await createProposalShare(proposalResult);
    return res.json(share);
  } catch (err) {
    console.error('创建分享链接失败:', err);
    return res.status(500).json({ error: '创建分享链接失败，请稍后重试' });
  }
});

router.get('/share/:code', async (req: Request, res: Response) => {
  try {
    const record = await getProposalShare(req.params.code);
    if (!record) {
      return res.status(404).json({ error: '未找到分享链接对应的方案' });
    }
    return res.json(record);
  } catch (err) {
    console.error('获取分享方案失败:', err);
    return res.status(500).json({ error: '获取分享方案失败，请稍后重试' });
  }
});

export default router;
