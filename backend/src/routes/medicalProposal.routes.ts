import { Router, Request, Response } from 'express';
import { generateMedicalProposal } from '../services/medicalProposalGenerate.service';
import { validateMedicalCustomerInput } from '../validators/medicalProposal.validator';

const router = Router();

router.post('/generate', (req: Request, res: Response) => {
  try {
    const validation = validateMedicalCustomerInput(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: '请求参数有误', details: validation.errors });
    }

    const result = generateMedicalProposal(validation.data);
    if (result.matched_products.length === 0) {
      return res.status(404).json({
        error: '未找到匹配产品',
        message: '当前产品库中暂无完全符合该客户条件的中高端医疗险产品，请调整预算、就医区域或其他条件后重试。',
      });
    }

    return res.json(result);
  } catch (err) {
    console.error('生成医疗险方案失败:', err);
    return res.status(500).json({ error: '服务器内部错误，请稍后重试' });
  }
});

export default router;
