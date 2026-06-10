export interface CustomerInput {
  customer_name: string;
  insured_age: number;
  insured_gender: '男' | '女';
  sum_assured: number;
  annual_budget: number;
  coverage_preference: '终身' | '至70岁' | '30年' | '不确定';
  payment_preference: '10年' | '20年' | '30年' | '不确定';
  focus_tags: FocusTag[];
  health_note?: string;
}

export type FocusTag = '保费便宜' | '保障全面' | '儿童特疾' | '癌症多次赔付' | '现金价值';

export interface PremiumExample {
  age: number;
  gender: '男' | '女';
  sum_assured: number;
  payment_period: string;
  coverage_period: string;
  annual_premium: number;
}

export interface Product {
  product_id: string;
  product_name: string;
  company: string;
  category: string;
  min_age: number;
  max_age: number;
  available_coverage_periods: string[];
  available_payment_periods: string[];
  premium_examples: PremiumExample[];
  critical_illness: {
    summary: string;
    disease_count: number;
    base_payout_percent: number;
    extra_payout?: string;
    multiple_payout?: string;
  };
  moderate_illness: { summary: string; disease_count: number; payout_percent: number; times: number };
  mild_illness: { summary: string; disease_count: number; payout_percent: number; times: number };
  child_specific: { summary: string; strength_level: number };
  rare_disease: { summary: string; strength_level: number };
  cancer_multiple: { summary: string; strength_level: number };
  cash_value: { summary: string; payback_year: number; strength_level: number };
  waiver: { summary: string };
  death_benefit: { summary: string };
  tags: string[];
}

export interface ProductWithScore extends Product {
  estimated_annual_premium: number;
  match_score: number;
  match_tags: string[];
}

export interface ComparisonRow {
  item: string;
  values: Record<string, string>;
}

export interface ProductAnalysis {
  product_id: string;
  product_name: string;
  advantages: string;
  attention_points: string;
}

export interface ProposalContent {
  title: string;
  customer_summary: string;
  match_summary: string;
  comparison_table: ComparisonRow[];
  product_analysis: ProductAnalysis[];
  recommendation: string;
}

export interface ProposalResult {
  proposal_id: string;
  recommended_product_id: string;
  matched_products: Array<{
    product_id: string;
    product_name: string;
    company: string;
    estimated_annual_premium: number;
    match_tags: string[];
  }>;
  proposal_content: ProposalContent;
}
