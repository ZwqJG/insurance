import dayjs from 'dayjs';
import {
  MedicalCustomerInput,
  MedicalProductWithScore,
  MedicalProposalResult,
  MedicalComparisonRow,
  MedicalProductAnalysis,
} from '../types/medical';
import { matchMedicalProducts } from './medicalProductMatch.service';

function fmt(n: number) { return n.toLocaleString('zh-CN', { maximumFractionDigits: 0 }); }

function customerSummary(input: MedicalCustomerInput): string {
  const ageStr = input.insured_age <= 1 && input.insured_age >= 0
    ? `${Math.max(input.insured_age * 12, 1)}个月`
    : `${input.insured_age}岁`;
  const genderStr = input.insured_gender ? `${input.insured_gender}` : '';
  const regionStr = input.regions.join('、');
  const hospitalStr = input.hospitals.join('、');

  let s = `本方案基于${input.customer_name}当前提供的信息生成。被保人为${ageStr}${genderStr}，` +
    `主要希望覆盖${regionStr}范围内的${hospitalStr}就医需求，年预算约为 ${fmt(input.annual_budget)} 元。\n\n` +
    `本次方案重点关注：${input.focus_tags.join('、')}。系统根据投保年龄、保障区域、医院网络、门诊需求、` +
    `既往症情况、免赔额偏好和预算范围，从预置中高端医疗险产品库中自动匹配适合的产品。`;

  if (input.pre_existing_condition !== '无') {
    s += `\n\n健康情况备注：${input.pre_existing_condition}`;
    if (input.pre_existing_note) s += `（${input.pre_existing_note}）`;
    s += '。本系统不作核保结论，最终能否承保、是否除外、是否加费或延期，以保险公司核保结果为准。';
  } else if (input.health_note) {
    s += `\n\n健康情况备注：${input.health_note}。`;
  }

  return s;
}

function matchSummary(products: MedicalProductWithScore[]): string {
  const count = products.length;
  const tiers = [...new Set(products.map((p) => p.tier))].join('、');
  return `根据当前客户信息，系统从预置中高端医疗险产品数据中筛选出 ${count} 款${tiers}产品进入对比。` +
    `筛选时主要参考了投保年龄、保障区域、医院网络、门诊需求、既往症情况、免赔额偏好和预算范围。` +
    `以下产品按综合匹配度从高到低排列。`;
}

function fmtPriceLevel(level: string): string {
  const map: Record<string, string> = {
    '低': '较低，预算友好',
    '中': '中等，性价比较高',
    '高': '较高，适合追求全面保障',
    '很高': '较高，适合高端需求',
  };
  return map[level] || level;
}

function buildTable(products: MedicalProductWithScore[]): MedicalComparisonRow[] {
  const ids = products.map((p) => p.product_id);
  const row = (item: string, fn: (p: MedicalProductWithScore) => string): MedicalComparisonRow => ({
    item,
    values: Object.fromEntries(ids.map((id, i) => [id, fn(products[i])])),
  });

  const fmtBool = (v: boolean | undefined) => v ? '✅' : '—';
  const fmtList = (arr: string[] | undefined) => arr?.length ? arr.join('、') : '—';
  const fmtOpts = (opts: number[] | undefined) => opts?.map((d) => d === 0 ? '0免赔' : `${fmt(d)}元`).join('、') || '—';

  return [
    row('保险公司', (p) => p.company),
    row('服务商', (p) => p.service_provider),
    row('产品定位', (p) => p.positioning),
    row('参考保费水平', (p) => fmtPriceLevel(p.price_level.level)),
    row('最高续保年龄', (p) => `${p.max_renewal_age}岁`),
    row('保障区域', (p) => p.regions.join('、')),
    row('医院范围', (p) => p.hospital_network.summary),
    row('年度总限额', (p) => `${fmt(p.annual_limit)}元`),
    row('可选免赔额', (p) => fmtOpts(p.deductible_options)),
    row('医保抵扣免赔额', (p) => p.deductible.medical_insurance_offset ? '✅ 可抵扣' : '❌ 不可抵扣'),
    row('癌症/重疾0免赔', (p) => p.deductible.cancer_zero_deductible !== '无' ? p.deductible.cancer_zero_deductible : '—'),
    row('住院直付', (p) => fmtBool(p.direct_billing.inpatient)),
    row('门诊直付', (p) => fmtBool(p.direct_billing.outpatient)),
    row('直付医院数', (p) => p.direct_billing.hospital_count > 0 ? `${p.direct_billing.hospital_count}家` : '垫付为主'),
    row('门诊责任', (p) => p.outpatient.summary),
    row('床位费', (p) => p.inpatient.room_limit),
    row('住院津贴', (p) => p.inpatient.allowance || '—'),
    row('外购药/器械', (p) => p.drug_device.out_of_hospital_drug),
    row('院外抗癌特药', (p) => p.drug_device.cancer_special_drug),
    row('质子重离子', (p) => p.drug_device.proton_heavy_ion),
    row('既往症规则', (p) => p.pre_existing_condition.summary),
    row('海外就医', (p) => p.overseas_medical.summary),
    row('增值服务', (p) => fmtList(p.value_added_services)),
    row('适合人群', (p) => p.suitable_crowd),
  ];
}

function buildAnalysis(products: MedicalProductWithScore[], input: MedicalCustomerInput): MedicalProductAnalysis[] {
  return products.map((p) => {
    const adv: string[] = [];
    const att: string[] = [];

    // Advantages
    if (p.pre_existing_condition.support_level >= 4) {
      adv.push('既往症规则较为友好，该产品在健康异常客户中有较突出的承保灵活性。');
    }
    if (p.direct_billing.hospital_count > 300) {
      adv.push(`直付网络较广（${p.direct_billing.hospital_count}家医院），就医时免垫钱体验好。`);
    }
    if (p.direct_billing.outpatient && p.direct_billing.inpatient) {
      adv.push('住院和门诊均支持直付，适合注重就医便利性的客户。');
    }
    if (p.hospital_network.private_hospital) {
      adv.push('覆盖私立医院，客户有更灵活的就医选择。');
    }
    if (p.hospital_network.international_department) {
      adv.push('覆盖公立医院国际部，适合追求高品质就医环境的客户。');
    }
    if (p.overseas_medical.support_level >= 4) {
      adv.push('海外就医支持力度较强，适合关注海外医疗资源的客户。');
    }
    if (p.drug_device.out_of_hospital_drug.includes('不限清单') || p.drug_device.cancer_special_drug.includes('不限清单')) {
      adv.push('外购药械不限清单，在肿瘤特药方面保障灵活度较高。');
    }
    if (p.child_standalone) {
      adv.push('支持未成年子女单独投保，适合儿童单独配置。');
    }
    if (p.maternity?.available) {
      adv.push('含生育责任，适合有孕产需求的家庭。');
    }
    if (p.price_level.level === '低' || p.price_level.level === '中') {
      adv.push('参考保费水平相对合理，预算友好度较高。');
    }
    if (!adv.length) {
      adv.push('该产品保障结构完整，适合匹配其定位的客户需求。');
    }

    // Attention points
    if (p.pre_existing_condition.support_level <= 1 && input.pre_existing_condition !== '无') {
      att.push('该产品既往症规则为除外责任，如有明确既往症，建议选择其他既往症友好型产品。');
    }
    if (p.direct_billing.hospital_count === 0 && input.concern_inpatient_direct_billing === '是') {
      att.push('该产品以垫付为主，无直付网络，经常就医的话需注意垫付流程。');
    }
    if (p.max_initial_age < 65 && input.insured_age > p.max_initial_age - 10) {
      att.push(`该产品最高投保年龄为${p.max_initial_age}岁，建议尽早投保。`);
    }
    if (!p.child_standalone && input.customer_type === '儿童') {
      att.push('该产品不支持未成年子女单独投保，需由父母作为投保人共同投保。');
    }
    if (p.regions.length === 1 && p.regions[0] === '中国大陆' && input.regions.some((r) => r !== '中国大陆')) {
      att.push('该产品仅覆盖中国大陆，不覆盖港澳台及海外就医需求。');
    }
    if (input.pre_existing_condition !== '无') {
      att.push('系统推荐仅供参考，最终承保结论以保险公司核保结果为准。');
    }
    if (p.underwriting.attention) {
      att.push(p.underwriting.attention);
    }

    if (!att.length) {
      att.push('建议正式投保前核对最新条款，确认当前产品信息与保险公司官方文件一致。');
    }

    return {
      product_id: p.product_id,
      product_name: p.product_name,
      advantages: adv.join('\n'),
      attention_points: att.join('\n'),
    };
  });
}

function buildRecommendation(products: MedicalProductWithScore[], input: MedicalCustomerInput): string {
  if (products.length === 0) return '';

  const top = products[0];
  const alt = products[1] ?? null;
  const focusStr = top.match_tags.join('、') || '综合保障与服务';

  // Determine key advantage based on product features
  let keyAdvantage = '';
  if (top.pre_existing_condition.support_level >= 4) keyAdvantage = '既往症友好';
  else if (top.direct_billing.hospital_count > 300) keyAdvantage = '直付网络覆盖广';
  else if (top.hospital_network.private_hospital && top.hospital_network.international_department) keyAdvantage = '医院网络覆盖面广';
  else if (top.price_level.level === '低' || top.price_level.level === '中') keyAdvantage = '保费性价比高';
  else keyAdvantage = '综合保障和服务体验';

  let text = `综合客户的就医区域、医院类型、门诊需求、健康情况和预算，本方案建议优先考虑【${top.product_name}】。\n\n` +
    `推荐原因是：该产品在${focusStr}方面与本次需求匹配度较高，尤其适合${top.suitable_crowd}。` +
    `与其他产品相比，它的主要优势是${keyAdvantage}。`;

  if (alt) {
    const altFocus = alt.match_tags.slice(0, 2).join('、');
    text += `\n\n如果客户希望${altFocus ? `从${altFocus}角度` : '从不同维度'}进一步比较，` +
      `也可以关注【${alt.product_name}】。建议将推荐产品和备选产品一起呈现给客户，由客户根据实际感受做最终选择。`;
  }

  text += `\n\n需要注意的是：本系统推荐基于产品信息和客户提供的数据自动生成，不作承保承诺。` +
    `正式投保前建议进一步核对最新版计划书、费率表、医院网络清单、健康告知和核保规则。`;

  return text;
}

export function generateMedicalProposal(input: MedicalCustomerInput): MedicalProposalResult {
  const matched = matchMedicalProducts(input);

  return {
    proposal_id: `med_temp_${dayjs().format('YYYYMMDDHHmmss')}`,
    recommended_product_id: matched[0]?.product_id ?? '',
    matched_products: matched.map((p) => ({
      product_id: p.product_id,
      product_name: p.product_name,
      company: p.company,
      tier: p.tier,
      positioning: p.positioning,
      match_tags: p.match_tags,
      price_level: p.price_level.level,
    })),
    proposal_content: {
      title: '中高端医疗险产品对比方案',
      customer_summary: customerSummary(input),
      match_summary: matchSummary(matched),
      comparison_table: buildTable(matched),
      product_analysis: buildAnalysis(matched, input),
      recommendation: matched.length ? buildRecommendation(matched, input) : '',
    },
  };
}
