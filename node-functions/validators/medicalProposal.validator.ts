import { z } from 'zod';
import { MedicalCustomerInput, MedicalFocusTag } from '../types/medical';

const customerTypeValues = ['成人', '儿童', '家庭', '孕产需求'] as const;
const regionValues = ['中国大陆', '港澳台', '全球除美加', '全球'] as const;
const hospitalValues = ['公立普通部', '特需部', '国际部', 'VIP部', '私立医院', '昂贵医院'] as const;
const outpatientValues = ['不需要', '需要普通门诊', '需要门诊直付'] as const;
const preExistingValues = ['无', '轻微异常', '明确既往症', '既往理赔记录'] as const;
const yesNoValues = ['是', '否'] as const;
const focusTagValues: [MedicalFocusTag, ...MedicalFocusTag[]] = [
  '预算可控', '0免赔/低免赔', '特需/国际部', '私立医院',
  '门诊直付', '既往症友好', '外购药/特药', '儿童单独投保',
  '海外/港澳台就医', '生育/家庭计划',
];

const schema = z.object({
  customer_name: z.string().min(1, '客户称呼不能为空'),
  insured_age: z.number().int().min(0).max(100, '投保年龄不超过100岁'),
  insured_gender: z.enum(['男', '女']).optional(),
  customer_type: z.enum(customerTypeValues),
  city: z.string().min(1, '所在城市不能为空'),
  regions: z.array(z.enum(regionValues)).min(1, '请至少选择一个期望就医区域'),
  hospitals: z.array(z.enum(hospitalValues)).min(1, '请至少选择一个希望覆盖的医院类型'),
  outpatient_need: z.enum(outpatientValues),
  pre_existing_condition: z.enum(preExistingValues),
  pre_existing_note: z.string().optional(),
  has_social_insurance: z.enum(yesNoValues),
  annual_budget: z.number().positive('年预算必须大于0'),
  acceptable_deductibles: z.array(z.number()).min(1, '请至少选择一个可接受免赔额'),
  concern_outpatient_drug_device: z.enum(yesNoValues),
  concern_inpatient_direct_billing: z.enum(yesNoValues),
  concern_overseas_medical: z.enum(yesNoValues),
  concern_maternity: z.enum(yesNoValues),
  focus_tags: z.array(z.enum(focusTagValues)).min(1, '请至少选择一个重点关注方向'),
  health_note: z.string().optional(),
});

export function validateMedicalCustomerInput(body: unknown):
  | { success: true; data: MedicalCustomerInput }
  | { success: false; errors: string[] } {
  const result = schema.safeParse(body);
  if (result.success) return { success: true, data: result.data as MedicalCustomerInput };
  return { success: false, errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`) };
}
