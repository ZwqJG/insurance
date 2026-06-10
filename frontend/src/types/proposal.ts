export type FocusTag = '保费便宜' | '保障全面' | '儿童特疾' | '癌症多次赔付' | '现金价值'
export type CoveragePreference = '终身' | '至70岁' | '30年' | '不确定'
export type PaymentPreference = '10年' | '20年' | '30年' | '不确定'

export interface CustomerInput {
  customer_name: string
  insured_age: number
  insured_gender: '男' | '女'
  sum_assured: number
  annual_budget: number
  coverage_preference: CoveragePreference
  payment_preference: PaymentPreference
  focus_tags: FocusTag[]
  health_note?: string
}

export interface MatchedProduct {
  product_id: string
  product_name: string
  company: string
  estimated_annual_premium: number
  match_tags: string[]
}

export interface ComparisonRow {
  item: string
  values: Record<string, string>
}

export interface ProductAnalysis {
  product_id: string
  product_name: string
  advantages: string
  attention_points: string
}

export interface ProposalContent {
  title: string
  customer_summary: string
  match_summary: string
  comparison_table: ComparisonRow[]
  product_analysis: ProductAnalysis[]
  recommendation: string
}

export interface ProposalResult {
  proposal_id: string
  recommended_product_id: string
  matched_products: MatchedProduct[]
  proposal_content: ProposalContent
}

export interface ProposalShareResult {
  share_code: string
  share_url: string
}

export interface SharedProposalRecord {
  code: string
  created_at: string
  proposal_result: ProposalResult
}
