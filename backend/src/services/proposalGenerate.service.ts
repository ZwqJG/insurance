import dayjs from 'dayjs';
import { CustomerInput, ProductWithScore, ProposalResult, ComparisonRow, ProductAnalysis } from '../types';
import { matchProducts } from './productMatch.service';

function fmt(n: number) { return n.toLocaleString('zh-CN', { maximumFractionDigits: 0 }); }
function fmtPrem(n: number) { return `${fmt(n)} 元/年（参考）`; }

function customerSummary(input: CustomerInput): string {
  const ageStr = input.insured_age === 0 ? '0岁（出生后）' : `${input.insured_age}岁`;
  let s = `本方案基于${input.customer_name}当前提供的信息生成。被保人为${ageStr}${input.insured_gender}宝宝，` +
    `家庭希望配置${input.coverage_preference}儿童重疾保障，期望保额为 ${fmt(input.sum_assured)} 元，` +
    `年预算约为 ${fmt(input.annual_budget)} 元。\n\n` +
    `本次方案重点关注：${input.focus_tags.join('、')}。系统根据被保人年龄、预算、保障期间偏好和重点关注方向，` +
    `从预置产品数据中自动匹配适合的儿童重疾险产品。`;
  if (input.health_note) s += `\n\n健康情况备注：${input.health_note}。`;
  return s;
}

function matchSummary(products: ProductWithScore[]): string {
  return `根据当前客户信息，系统从预置儿童重疾险产品数据中筛选出以下 ${products.length} 款产品进入对比。` +
    `筛选时主要参考了投保年龄、保障期间、预算范围、保费估算和客户关注点。`;
}

function buildTable(products: ProductWithScore[]): ComparisonRow[] {
  const ids = products.map((p) => p.product_id);
  const row = (item: string, fn: (p: ProductWithScore) => string): ComparisonRow => ({
    item,
    values: Object.fromEntries(ids.map((id, i) => [id, fn(products[i])])),
  });
  return [
    row('保险公司', (p) => p.company),
    row('产品名称', (p) => p.product_name),
    row('参考年缴保费', (p) => fmtPrem(p.estimated_annual_premium)),
    row('保障期间', (p) => p.available_coverage_periods.join(' / ')),
    row('缴费期间', (p) => p.available_payment_periods.join(' / ')),
    row('等待期', () => '180天'),
    row('重疾责任', (p) => p.critical_illness.summary),
    row('中症责任', (p) => p.moderate_illness.summary),
    row('轻症责任', (p) => p.mild_illness.summary),
    row('儿童特疾 / 罕见病', (p) => `${p.child_specific.summary}\n${p.rare_disease.summary}`),
    row('癌症多次赔付', (p) => p.cancer_multiple.summary),
    row('豁免责任', (p) => p.waiver.summary),
    row('身故 / 全残责任', (p) => p.death_benefit.summary),
  ];
}

function buildAnalysis(products: ProductWithScore[], input: CustomerInput): ProductAnalysis[] {
  return products.map((p) => {
    const adv: string[] = [];
    const att: string[] = [];
    if (p.critical_illness.extra_payout) adv.push('重疾责任包含额外赔付设计，能够在特定年龄阶段提高保障杠杆。');
    if (p.critical_illness.multiple_payout) adv.push('支持重疾多次赔付，有助于覆盖长期重疾复发风险。');
    if (p.moderate_illness.times >= 4 || p.mild_illness.times >= 4) adv.push('轻症和中症责任赔付次数较多，有助于覆盖早期疾病风险。');
    if (p.child_specific.strength_level >= 5) adv.push('儿童特定疾病保障较突出，适合关注儿童成长阶段高发重疾风险的家庭。');
    if (p.rare_disease.strength_level >= 5) adv.push('罕见病责任较有优势，可加强低发生率但高治疗费用疾病的保障。');
    if (p.cancer_multiple.strength_level >= 5) adv.push('癌症多次赔付责任较强，适合关注长期癌症复发、转移或新发风险的家庭。');
    if (p.estimated_annual_premium <= input.annual_budget) adv.push('参考年缴保费在客户预算范围内，保费压力相对可控。');
    if (p.cash_value.strength_level >= 4) adv.push('长期现金价值表现相对较好，适合兼顾长期利益的家庭。');
    if (p.estimated_annual_premium > input.annual_budget)
      att.push(`参考年缴保费（${fmt(p.estimated_annual_premium)}元）略高于当前预算，需结合家庭实际缴费能力进一步确认。`);
    if (p.child_specific.strength_level < 4 && input.focus_tags.includes('儿童特疾'))
      att.push('儿童专项保障不是该产品最突出的部分，如客户特别关注少儿特疾，可进一步比较其他产品。');
    if (p.cancer_multiple.strength_level < 4 && input.focus_tags.includes('癌症多次赔付'))
      att.push('癌症多次赔付责任需进一步确认，如客户特别关注癌症长期风险，应重点查看该项责任。');
    if (p.cash_value.strength_level < 3 && input.focus_tags.includes('现金价值'))
      att.push('长期现金价值信息暂不突出，如客户关注后期退保价值，需要进一步查看利益演示。');
    if (!adv.length) adv.push('该产品整体保障责任较为基础，适合预算敏感且优先考虑核心重疾保障的家庭。');
    if (!att.length) att.push('建议正式投保前核对最新条款，确认当前产品信息与保险公司官方文件一致。');
    return { product_id: p.product_id, product_name: p.product_name, advantages: adv.join('\n'), attention_points: att.join('\n') };
  });
}

function buildRecommendation(products: ProductWithScore[], input: CustomerInput): string {
  const top = products[0];
  const alt = products[1] ?? null;
  const ratio = top.estimated_annual_premium / input.annual_budget;
  const budgetDesc = ratio <= 1 ? '较为匹配' : ratio <= 1.2 ? '略高但仍处于可进一步沟通范围' : '高于当前预算，需进一步确认缴费能力';
  const focusStr = top.match_tags.join('、') || '整体保障均衡';
  let text = `综合客户年龄、预算、保障期间偏好和重点关注方向，本方案建议优先考虑【${top.product_name}】。\n\n` +
    `推荐原因是：该产品在${focusStr}方面与本次需求匹配度较高，参考年缴保费与客户预算${budgetDesc}，` +
    `同时在本次对比的产品中整体表现更适合作为宝宝儿童重疾险方案的优先选择。`;
  if (alt) {
    const other = input.focus_tags.find((t) => !top.match_tags.includes(t));
    text += `\n\n如果家庭后续${other ? `更关注${other}` : '希望从不同维度比较'}，也可以结合本次对比中的【${alt.product_name}】进一步比较。`;
  }
  return text;
}

export function generateProposal(input: CustomerInput): ProposalResult {
  const matched = matchProducts(input);
  return {
    proposal_id: `temp_${dayjs().format('YYYYMMDDHHmmss')}`,
    recommended_product_id: matched[0]?.product_id ?? '',
    matched_products: matched.map((p) => ({
      product_id: p.product_id, product_name: p.product_name, company: p.company,
      estimated_annual_premium: p.estimated_annual_premium, match_tags: p.match_tags,
    })),
    proposal_content: {
      title: '儿童重疾险产品对比方案',
      customer_summary: customerSummary(input),
      match_summary: matchSummary(matched),
      comparison_table: buildTable(matched),
      product_analysis: buildAnalysis(matched, input),
      recommendation: matched.length ? buildRecommendation(matched, input) : '',
    },
  };
}
