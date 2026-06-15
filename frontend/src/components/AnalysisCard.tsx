import React from 'react'
import { CheckCircleFilled } from '@ant-design/icons'
import EditableText from './EditableText'

export interface AnalysisData {
  product_id: string
  product_name: string
  advantages: string
  attention_points: string
}

interface Props<T extends AnalysisData> {
  analysis: T
  isRecommended: boolean
  onChange: (updated: T) => void
  readOnly?: boolean
}

function AnalysisCard<T extends AnalysisData>({
  analysis, isRecommended, onChange, readOnly = false,
}: Props<T>) {
  return (
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
}

export default AnalysisCard
