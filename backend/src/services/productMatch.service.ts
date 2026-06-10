import { CustomerInput, Product, ProductWithScore, FocusTag } from '../types';
import productsData from '../data/child-critical-illness.json';

const products = productsData as Product[];

export function estimatePremium(product: Product, input: CustomerInput): number | null {
  const payPref = input.payment_preference === '不确定' ? null : input.payment_preference;
  const covPref = input.coverage_preference === '不确定' ? null : input.coverage_preference;
  const candidates = product.premium_examples.filter(
    (e) =>
      e.gender === input.insured_gender &&
      (!payPref || e.payment_period === payPref) &&
      (!covPref || e.coverage_period === covPref)
  );

  const exact = candidates.find(
    (e) => e.age === input.insured_age && e.gender === input.insured_gender &&
      e.sum_assured === input.sum_assured &&
      (!payPref || e.payment_period === payPref) &&
      (!covPref || e.coverage_period === covPref)
  );
  if (exact) return exact.annual_premium;

  const sameAge = candidates.find((e) => e.age === input.insured_age);
  if (sameAge) return parseFloat((sameAge.annual_premium * (input.sum_assured / sameAge.sum_assured)).toFixed(2));

  const closest = candidates
    .sort((a, b) => Math.abs(a.age - input.insured_age) - Math.abs(b.age - input.insured_age))[0];
  if (closest) return parseFloat((closest.annual_premium * (input.sum_assured / closest.sum_assured)).toFixed(2));

  return null;
}

function hardFilter(p: Product, input: CustomerInput, mult: number): boolean {
  if (p.category !== '儿童重疾险') return false;
  if (input.insured_age < p.min_age || input.insured_age > p.max_age) return false;
  if (input.coverage_preference !== '不确定' && !p.available_coverage_periods.includes(input.coverage_preference)) return false;
  if (input.payment_preference !== '不确定' && !p.available_payment_periods.includes(input.payment_preference)) return false;
  const prem = estimatePremium(p, input);
  if (prem === null || prem > input.annual_budget * mult) return false;
  return true;
}

function score(p: Product, input: CustomerInput, premium: number): { score: number; matchTags: string[] } {
  let s = 0;
  const tags: string[] = [];
  for (const tag of input.focus_tags as FocusTag[]) {
    switch (tag) {
      case '保障全面':
        if (p.critical_illness?.summary) s += 2;
        if (p.moderate_illness?.summary) s += 1;
        if (p.mild_illness?.summary) s += 1;
        if (p.critical_illness?.extra_payout) s += 1;
        if (p.critical_illness?.multiple_payout) s += 1;
        tags.push('保障全面'); break;
      case '儿童特疾':
        s += p.child_specific?.strength_level ?? 0;
        s += (p.rare_disease?.strength_level ?? 0) * 0.5;
        tags.push('儿童特疾'); break;
      case '癌症多次赔付':
        s += p.cancer_multiple?.strength_level ?? 0;
        tags.push('癌症多次赔付'); break;
      case '现金价值':
        s += p.cash_value?.strength_level ?? 0;
        if ((p.cash_value?.payback_year ?? 99) < 40) s += 1;
        tags.push('现金价值'); break;
      case '保费便宜': {
        const r = premium / input.annual_budget;
        if (r <= 0.8) { s += 5; tags.push('保费较低'); }
        else if (r <= 1) { s += 4; tags.push('保费匹配'); }
        else if (r <= 1.2) { s += 2; tags.push('保费略高'); }
        break;
      }
    }
  }
  return { score: s, matchTags: [...new Set(tags)] };
}

export function matchProducts(input: CustomerInput): ProductWithScore[] {
  const build = (mult: number) =>
    products
      .filter((p) => hardFilter(p, input, mult))
      .map((p) => {
        const prem = estimatePremium(p, input)!;
        const { score: s, matchTags } = score(p, input, prem);
        return { ...p, estimated_annual_premium: prem, match_score: s, match_tags: matchTags } as ProductWithScore;
      })
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 3);

  const r = build(1.2);
  return r.length >= 1 ? r : build(1.5);
}
