export type CustomerType = '成人' | '儿童' | '家庭' | '孕产需求';
export type MedicalRegion = '中国大陆' | '港澳台' | '全球除美加' | '全球';
export type HospitalType = '公立普通部' | '特需部' | '国际部' | 'VIP部' | '私立医院' | '昂贵医院';
export type OutpatientNeed = '不需要' | '需要普通门诊' | '需要门诊直付';
export type PreExistingCondition = '无' | '轻微异常' | '明确既往症' | '既往理赔记录';
export type YesNo = '是' | '否';

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
  | '生育/家庭计划';

export interface MedicalCustomerInput {
  customer_name: string;
  insured_age: number;
  insured_gender?: '男' | '女';
  customer_type: CustomerType;
  city: string;
  regions: MedicalRegion[];
  hospitals: HospitalType[];
  outpatient_need: OutpatientNeed;
  pre_existing_condition: PreExistingCondition;
  pre_existing_note?: string;
  has_social_insurance: YesNo;
  annual_budget: number;
  acceptable_deductibles: number[];
  concern_outpatient_drug_device: YesNo;
  concern_inpatient_direct_billing: YesNo;
  concern_overseas_medical: YesNo;
  concern_maternity: YesNo;
  focus_tags: MedicalFocusTag[];
  health_note?: string;
}

export interface MedicalHospitalNetwork {
  public_general: boolean;
  special_need: boolean;
  international_department: boolean;
  vip_department: boolean;
  private_hospital: boolean;
  expensive_hospital: boolean;
  summary: string;
}

export interface MedicalDirectBilling {
  inpatient: boolean;
  outpatient: boolean;
  hospital_count: number;
  summary: string;
}

export interface MedicalOutpatient {
  included: boolean;
  optional: boolean;
  direct_billing: boolean;
  limit?: string;
  summary: string;
}

export interface MedicalInpatient {
  included: boolean;
  room_limit: string;
  allowance: string;
  rehabilitation: string;
  durable_medical_equipment: string;
  reconstructive_surgery: string;
}

export interface MedicalDrugDevice {
  out_of_hospital_drug: string;
  cancer_special_drug: string;
  device_limit: string;
  proton_heavy_ion: string;
  overseas_new_drug?: string;
}

export interface MedicalPreExistingCondition {
  support_level: number;
  summary: string;
  waiting_period: string;
  first_year_limit: number;
}

export interface MedicalOverseasMedical {
  support_level: number;
  summary: string;
}

export interface MedicalUnderwriting {
  mode: string;
  attention: string;
}

export interface MedicalPriceLevel {
  level: '低' | '中' | '高' | '很高';
  child_reference?: number;
  adult_30_reference?: number;
  adult_40_reference?: number;
  adult_50_reference?: number;
}

export interface MedicalDeductible {
  medical_insurance_offset: boolean;
  all_departments_apply: boolean;
  cancer_zero_deductible: string;
}

export interface MedicalMaternity {
  available: boolean;
  limit?: string;
  summary: string;
}

export interface MedicalProduct {
  product_id: string;
  product_name: string;
  company: string;
  service_provider: string;
  category: string;
  tier: string;
  positioning: string;
  price_level: MedicalPriceLevel;
  min_age_days: number;
  max_initial_age: number;
  max_renewal_age: number;
  child_standalone: boolean;
  family_discount: string;
  regions: MedicalRegion[];
  hospital_network: MedicalHospitalNetwork;
  direct_billing: MedicalDirectBilling;
  annual_limit: number;
  deductible_options: number[];
  deductible: MedicalDeductible;
  outpatient: MedicalOutpatient;
  inpatient: MedicalInpatient;
  drug_device: MedicalDrugDevice;
  pre_existing_condition: MedicalPreExistingCondition;
  overseas_medical: MedicalOverseasMedical;
  value_added_services: string[];
  underwriting: MedicalUnderwriting;
  maternity?: MedicalMaternity;
  tags: string[];
  suitable_crowd: string;
  notes: string;
}

export interface MedicalProductWithScore extends MedicalProduct {
  match_score: number;
  match_tags: string[];
  match_details: Partial<Record<MedicalFocusTag, number>>;
}

export interface MedicalComparisonRow {
  item: string;
  values: Record<string, string>;
}

export interface MedicalProductAnalysis {
  product_id: string;
  product_name: string;
  advantages: string;
  attention_points: string;
}

export interface MedicalProposalContent {
  title: string;
  customer_summary: string;
  match_summary: string;
  comparison_table: MedicalComparisonRow[];
  product_analysis: MedicalProductAnalysis[];
  recommendation: string;
}

export interface MedicalMatchedProduct {
  product_id: string;
  product_name: string;
  company: string;
  tier: string;
  positioning: string;
  match_tags: string[];
  price_level: MedicalPriceLevel['level'];
}

export interface MedicalProposalResult {
  proposal_id: string;
  recommended_product_id: string;
  matched_products: MedicalMatchedProduct[];
  proposal_content: MedicalProposalContent;
}
