export type CustomerType = '成人' | '儿童' | '家庭' | '孕产需求'
export type MedicalRegion = '中国大陆' | '港澳台' | '全球除美加' | '全球'
export type HospitalType = '公立普通部' | '特需部' | '国际部' | 'VIP部' | '私立医院' | '昂贵医院'
export type OutpatientNeed = '不需要' | '需要普通门诊' | '需要门诊直付'
export type PreExistingCondition = '无' | '轻微异常' | '明确既往症' | '既往理赔记录'
export type YesNo = '是' | '否'

export type MedicalFocusTag =
  | '预算可控'
  | '0免赔/低免赔'
  | '特需/国际部'
  | '私立医院'
  | '门诊直付'
  | '既往症友好'
  | '外购药/特药'
  | '儿童单独投保'
  | '海外/港澳台就医'
  | '生育/家庭计划'

export interface MedicalCustomerInput {
  customer_name: string
  insured_age: number
  insured_gender?: '男' | '女'
  customer_type: CustomerType
  city: string
  regions: MedicalRegion[]
  hospitals: HospitalType[]
  outpatient_need: OutpatientNeed
  pre_existing_condition: PreExistingCondition
  pre_existing_note?: string
  has_social_insurance: YesNo
  annual_budget: number
  acceptable_deductibles: number[]
  concern_outpatient_drug_device: YesNo
  concern_inpatient_direct_billing: YesNo
  concern_overseas_medical: YesNo
  concern_maternity: YesNo
  focus_tags: MedicalFocusTag[]
  health_note?: string
}

export interface MedicalMatchedProduct {
  product_id: string
  product_name: string
  company: string
  tier: string
  positioning: string
  match_tags: string[]
  price_level: string
}

export interface MedicalComparisonRow {
  item: string
  values: Record<string, string>
}

export interface MedicalProductAnalysis {
  product_id: string
  product_name: string
  advantages: string
  attention_points: string
}

export interface MedicalProposalContent {
  title: string
  customer_summary: string
  match_summary: string
  comparison_table: MedicalComparisonRow[]
  product_analysis: MedicalProductAnalysis[]
  recommendation: string
}

export interface MedicalProposalResult {
  proposal_id: string
  recommended_product_id: string
  matched_products: MedicalMatchedProduct[]
  proposal_content: MedicalProposalContent
}
