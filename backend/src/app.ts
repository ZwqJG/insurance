import express from 'express';
import cors from 'cors';
import proposalRoutes from './routes/proposal.routes';
import medicalProposalRoutes from './routes/medicalProposal.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/proposals', proposalRoutes);
app.use('/api/medical-proposals', medicalProposalRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: '保险方案生成器后端运行中（儿童重疾险 + 中高端医疗险）' });
});

app.listen(PORT, () => {
  console.log(`✅ 后端服务启动成功，监听端口 ${PORT}`);
});

export default app;
