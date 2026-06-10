import React, { useState } from 'react'
import { Button, Input, Tag, Tooltip } from 'antd'
import {
  ArrowLeftOutlined,
  CopyOutlined,
  ReloadOutlined,
  PrinterOutlined,
  CheckCircleFilled,
} from '@ant-design/icons'
import { ProposalResult, ComparisonRow, ProductAnalysis } from '../types/proposal'

interface Props {
  proposalResult: ProposalResult
  onBack: () => void
  onRegenerate: () => void | Promise<void>
  regenerating?: boolean
  readOnly?: boolean
  onCreateShare?: () => void | Promise<void>
  sharing?: boolean
  shareUrl?: string | null
}

/* ─── 可编辑纯文本块 ───────────────────────────────────────────── */
const EditableText: React.FC<{
  value: string
  onChange: (v: string) => void
  rows?: number
  readOnly?: boolean
}> = ({ value, onChange, rows = 4, readOnly = false }) => (
  <textarea
    className="editable-textarea"
    value={value}
    rows={rows}
    readOnly={readOnly}
    onChange={readOnly ? undefined : (e) => onChange(e.target.value)}
  />
)

/* ─── 可编辑对比表 ────────────────────────────────────────────── */
const EditableTable: React.FC<{
  rows: ComparisonRow[]
  productIds: string[]
  productNames: Record<string, string>
  recommendedId: string
  onChange: (rows: ComparisonRow[]) => void
  readOnly?: boolean
}> = ({ rows, productIds, productNames, recommendedId, onChange, readOnly = false }) => {
  const handleCell = (rowIdx: number, pid: string, val: string) => {
    const next = rows.map((r, i) =>
      i === rowIdx ? { ...r, values: { ...r.values, [pid]: val } } : r
    )
    onChange(next)
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="comparison-table">
        <thead>
          <tr>
            <th style={{ minWidth: 120 }}>对比项</th>
            {productIds.map((pid) => (
              <th key={pid} style={{ minWidth: 180 }}>
                {productNames[pid]}
                {pid === recommendedId && (
                  <span className="recommended-badge">推荐</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td>{row.item}</td>
              {productIds.map((pid) => {
                const val = row.values[pid] ?? ''
                const multiline = val.length > 40 || val.includes('\n')
                return (
                  <td key={pid}>
                    {multiline ? (
                      <textarea
                        value={val}
                        rows={Math.min(6, val.split('\n').length + 1)}
                        readOnly={readOnly}
                        onChange={readOnly ? undefined : (e) => handleCell(i, pid, e.target.value)}
                      />
                    ) : (
                      <input
                        value={val}
                        readOnly={readOnly}
                        onChange={readOnly ? undefined : (e) => handleCell(i, pid, e.target.value)}
                      />
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ─── 产品优劣分析卡片 ────────────────────────────────────────── */
const AnalysisCard: React.FC<{
  analysis: ProductAnalysis
  isRecommended: boolean
  onChange: (updated: ProductAnalysis) => void
  readOnly?: boolean
}> = ({ analysis, isRecommended, onChange, readOnly = false }) => (
  <div className="analysis-card">
    <div className="analysis-card-title">
      {isRecommended && <CheckCircleFilled style={{ color: '#1677ff', fontSize: 16 }} />}
      {analysis.product_name}
      {isRecommended && <span className="recommended-badge">首推</span>}
    </div>

    <div className="analysis-label">✅ 主要优势</div>
    <EditableText
      value={analysis.advantages}
      rows={4}
      onChange={(v) => onChange({ ...analysis, advantages: v })}
      readOnly={readOnly}
    />

    <div className="analysis-label attention" style={{ marginTop: 10 }}>⚠️ 需要关注</div>
    <EditableText
      value={analysis.attention_points}
      rows={3}
      onChange={(v) => onChange({ ...analysis, attention_points: v })}
      readOnly={readOnly}
    />
  </div>
)

/* ─── 主页面 ─────────────────────────────────────────────────── */
const ProposalPreviewPage: React.FC<Props> = ({
  proposalResult,
  onBack,
  onRegenerate,
  regenerating = false,
  readOnly = false,
  onCreateShare,
  sharing = false,
  shareUrl = null,
}) => {
  const { proposal_content: pc, matched_products, recommended_product_id } = proposalResult

  // 可编辑状态
  const [title, setTitle] = useState(pc.title)
  const [customerSummary, setCustomerSummary] = useState(pc.customer_summary)
  const [matchSummary, setMatchSummary] = useState(pc.match_summary)
  const [comparisonRows, setComparisonRows] = useState<ComparisonRow[]>(pc.comparison_table)
  const [productAnalysis, setProductAnalysis] = useState<ProductAnalysis[]>(pc.product_analysis)
  const [recommendation, setRecommendation] = useState(pc.recommendation)

  const productIds = matched_products.map((p) => p.product_id)
  const productNames: Record<string, string> = {}
  matched_products.forEach((p) => { productNames[p.product_id] = p.product_name })

  const handlePrint = () => window.print()

  return (
    <div className="preview-page">
      {/* 工具栏（打印时隐藏） */}
      <div className="preview-toolbar no-print">
        {!readOnly && (
          <Tooltip title="返回修改客户信息">
            <Button icon={<ArrowLeftOutlined />} onClick={onBack}>返回</Button>
          </Tooltip>
        )}
        {!readOnly && (
          <Tooltip title={shareUrl ? '复制短链' : '生成并复制短链'}>
            <Button icon={<CopyOutlined />} onClick={onCreateShare} loading={sharing}>
              {shareUrl ? '复制短链' : '生成短链'}
            </Button>
          </Tooltip>
        )}
        {!readOnly && (
          <Tooltip title="重新生成方案">
            <Button icon={<ReloadOutlined />} onClick={onRegenerate} loading={regenerating}>
              重新生成
            </Button>
          </Tooltip>
        )}
        <Button
          type="primary"
          icon={<PrinterOutlined />}
          onClick={handlePrint}
          size="middle"
        >
          导出 PDF
        </Button>
      </div>

      {!readOnly && shareUrl && (
        <div className="no-print" style={{ marginBottom: 16 }}>
          <Input
            value={shareUrl}
            readOnly
            addonBefore="短链"
            style={{ maxWidth: 760 }}
          />
        </div>
      )}

      {readOnly && (
        <div className="no-print" style={{ marginBottom: 16, color: '#666', textAlign: 'center' }}>
          这是分享链接中的只读方案，客户可直接查看和打印。
        </div>
      )}

      {/* 方案主体 */}
      <div className="proposal-container" id="proposal-print">

        {/* 标题 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {readOnly ? (
            <div style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#1677ff',
              textAlign: 'center',
              width: '100%',
              fontFamily: 'inherit',
            }}>
              {title}
            </div>
          ) : (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                fontSize: 22, fontWeight: 700, color: '#1677ff',
                border: 'none', outline: 'none', textAlign: 'center',
                width: '100%', background: 'transparent', fontFamily: 'inherit',
              }}
            />
          )}
        </div>

        {/* 匹配产品标签 */}
        <div className="no-print" style={{ textAlign: 'center', marginBottom: 24 }}>
          {matched_products.map((p) => (
            <Tag
              key={p.product_id}
              color={p.product_id === recommended_product_id ? 'blue' : 'default'}
              style={{ fontSize: 13, padding: '4px 12px', borderRadius: 20, margin: '0 6px' }}
            >
              {p.product_id === recommended_product_id ? '⭐ ' : ''}{p.product_name}
              <span style={{ marginLeft: 6, color: '#888', fontSize: 12 }}>
                {p.estimated_annual_premium.toLocaleString('zh-CN', { maximumFractionDigits: 0 })}元/年
              </span>
            </Tag>
          ))}
        </div>

        {/* 一、客户需求摘要 */}
        <div className="section-block">
          <div className="section-heading">一、客户需求摘要</div>
          <EditableText value={customerSummary} rows={5} onChange={setCustomerSummary} readOnly={readOnly} />
        </div>

        {/* 二、系统匹配结果 */}
        <div className="section-block">
          <div className="section-heading">二、系统匹配结果</div>
          <EditableText value={matchSummary} rows={3} onChange={setMatchSummary} readOnly={readOnly} />
        </div>

        {/* 三、产品核心对比 */}
        <div className="section-block">
          <div className="section-heading">三、产品核心对比</div>
          <EditableTable
            rows={comparisonRows}
            productIds={productIds}
            productNames={productNames}
            recommendedId={recommended_product_id}
            onChange={setComparisonRows}
            readOnly={readOnly}
          />
        </div>

        {/* 四、产品优劣说明 */}
        <div className="section-block">
          <div className="section-heading">四、产品优劣说明</div>
          {productAnalysis.map((analysis, i) => (
            <AnalysisCard
              key={analysis.product_id}
              analysis={analysis}
              isRecommended={analysis.product_id === recommended_product_id}
              readOnly={readOnly}
              onChange={(updated) => {
                const next = [...productAnalysis]
                next[i] = updated
                setProductAnalysis(next)
              }}
            />
          ))}
        </div>

        {/* 五、综合推荐 */}
        <div className="section-block">
          <div className="section-heading">五、综合推荐</div>
          <div className="recommendation-box">
            <EditableText value={recommendation} rows={6} onChange={setRecommendation} readOnly={readOnly} />
          </div>
        </div>

        {/* 底部生成说明（打印时显示） */}
        <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #e8e8e8', fontSize: 12, color: '#999', textAlign: 'center' }}>
          本方案由儿童重疾险智能方案生成器自动生成 · 具体保障责任以保险公司正式条款为准 · 参考年缴保费以正式投保报价为准
        </div>
      </div>
    </div>
  )
}

export default ProposalPreviewPage
