import { z } from 'zod';
import { CustomerInput, FocusTag } from '../types';

const focusTagValues: [FocusTag, ...FocusTag[]] = [
  '保费便宜', '保障全面', '儿童特疾', '癌症多次赔付', '现金价值',
];

const schema = z.object({
  customer_name: z.string().min(1, '客户称呼不能为空'),
  insured_age: z.number().int().min(0).max(17),
  insured_gender: z.enum(['男', '女']),
  sum_assured: z.number().positive(),
  annual_budget: z.number().positive(),
  coverage_preference: z.enum(['终身', '至70岁', '30年', '不确定']),
  payment_preference: z.enum(['10年', '20年', '30年', '不确定']),
  focus_tags: z.array(z.enum(focusTagValues)).min(1, '请至少选择一个重点关注方向'),
  health_note: z.string().optional(),
});

export function validateCustomerInput(body: unknown):
  | { success: true; data: CustomerInput }
  | { success: false; errors: string[] } {
  const result = schema.safeParse(body);
  if (result.success) return { success: true, data: result.data as CustomerInput };
  return { success: false, errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`) };
}
