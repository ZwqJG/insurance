import React, { useState } from 'react'
import { Button, Input, Tag, Tooltip } from 'antd'
import {
  ArrowLeftOutlined,
  CopyOutlined,
  ReloadOutlined,
  PrinterOutlined,
} from '@ant-design/icons'
import { MedicalProposalResult, MedicalComparisonRow, MedicalProductAnalysis } from '../types/medicalProposal'
import EditableText from '../components/EditableText'
import EditableTable from '../components/EditableTable'
import AnalysisCard from '../components/AnalysisCard'

interface Props {
  proposalResult: MedicalProposalResult
  onBack: () => void
  onRegenerate: () => void | Promise<void>
  regenerating?: boolean
  readOnly?: boolean
  onCreateShare?: () => void | Promise<void>
  sharing?: boolean
  shareUrl?: string | null
}

const MedicalProposalPreviewPage: React.FC<Props> = ({
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

  const [title, setTitle] = useState(pc.title)
  const [customerSummary, setCustomerSummary] = useState(pc.customer_summary)
  const [matchSummary, setMatchSummary] = useState(pc.match_summary)
  const [comparisonRows, setComparisonRows] = useState<MedicalComparisonRow[]>(pc.comparison_table)
  const [productAnalysis, setProductAnalysis] = useState<MedicalProductAnalysis[]>(pc.product_analysis)
  const [recommendation, setRecommendation] = useState(pc.recommendation)

  const productIds = matched_products.map((p) => p.product_id)
  const productNames: Record<string, string> = {}
  matched_products.forEach((p) => { productNames[p.product_id] = p.product_name })

  const handlePrint = () => window.print()

  return (
    <div className="preview-page">
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

      <div className="proposal-container" id="proposal-print">

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          {readOnly ? (
            <div style={{
              fontSize: 22, fontWeight: 700, color: '#1677ff',
              textAlign: 'center', width: '100%', fontFamily: 'inherit',
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

        <div className="no-print" style={{ textAlign: 'center', marginBottom: 24 }}>
          {matched_products.map((p) => (
            <Tag
              key={p.product_id}
              color={p.product_id === recommended_product_id ? 'blue' : 'default'}
              style={{ fontSize: 13, padding: '4px 12px', borderRadius: 20, margin: '0 6px' }}
            >
              {p.product_id === recommended_product_id ? '⭐ ' : ''}{p.product_name}
              <span style={{ marginLeft: 6, color: '#888', fontSize: 12 }}>
                {p.tier} · {p.positioning}
              </span>
            </Tag>
          ))}
        </div>

        <div className="section-block">
          <div className="section-heading">一、客户需求摘要</div>
          <EditableText value={customerSummary} rows={5} onChange={setCustomerSummary} readOnly={readOnly} />
        </div>

        <div className="section-block">
          <div className="section-heading">二、系统匹配结果</div>
          <EditableText value={matchSummary} rows={3} onChange={setMatchSummary} readOnly={readOnly} />
        </div>

        <div className="section-block">
          <div className="section-heading">三、产品核心对比</div>
          <EditableTable<MedicalComparisonRow>
            rows={comparisonRows}
            productIds={productIds}
            productNames={productNames}
            recommendedId={recommended_product_id}
            onChange={setComparisonRows}
            readOnly={readOnly}
          />
        </div>

        <div className="section-block">
          <div className="section-heading">四、产品优劣说明</div>
          {productAnalysis.map((analysis, i) => (
            <AnalysisCard<MedicalProductAnalysis>
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

        <div className="section-block">
          <div className="section-heading">五、综合推荐</div>
          <div className="recommendation-box">
            <EditableText value={recommendation} rows={6} onChange={setRecommendation} readOnly={readOnly} />
          </div>
        </div>

        <div style={{
          marginTop: 32, paddingTop: 16, borderTop: '1px solid #e8e8e8',
          fontSize: 12, color: '#999', textAlign: 'center',
        }}>
          本方案由中高端医疗险智能推荐系统自动生成 · 具体保障责任以保险公司正式条款为准 ·
          参考保费以正式投保报价为准 · 本系统不作核保结论，最终能否承保以保险公司核保结果为准
        </div>
      </div>
    </div>
  )
}

export default MedicalProposalPreviewPage
