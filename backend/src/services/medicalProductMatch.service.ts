import {
  MedicalCustomerInput,
  MedicalProduct,
  MedicalProductWithScore,
  MedicalFocusTag,
  HospitalType,
  MedicalPriceLevel,
} from '../types/medical';
import productsData from '../data/mid-high-medical.json';

const products = productsData as MedicalProduct[];

function getPriceReference(priceLevel: MedicalPriceLevel, age: number): number | undefined {
  if (age <= 17) return priceLevel.child_reference;
  if (age <= 35) return priceLevel.adult_30_reference;
  if (age <= 45) return priceLevel.adult_40_reference;
  return priceLevel.adult_50_reference;
}

/**
 * Estimate whether a product fits the customer's budget based on price level
 */
function estimateBudgetFit(product: MedicalProduct, input: MedicalCustomerInput): boolean {
  const reference = getPriceReference(product.price_level, input.insured_age);
  if (!reference) return true;
  return input.annual_budget >= reference;
}

/**
 * Hard filter: exclude products that clearly don't match customer needs
 */
function hardFilter(p: MedicalProduct, input: MedicalCustomerInput): { pass: boolean; reason?: string } {
  // Age check
  const ageInDays = input.insured_age * 365;
  if (ageInDays < p.min_age_days) {
    return { pass: false, reason: `投保年龄不足（最低${Math.ceil(p.min_age_days / 30)}个月）` };
  }
  if (input.insured_age > p.max_initial_age) {
    return { pass: false, reason: `超过最高投保年龄（${p.max_initial_age}岁）` };
  }

  // Child standalone check
  if (input.customer_type === '儿童' && !p.child_standalone && input.insured_age < 18) {
    return { pass: false, reason: '不支持未成年子女单独投保' };
  }

  // Region check
  const requiredRegions = input.regions;
  if (requiredRegions.length > 0) {
    const hasMatchingRegion = requiredRegions.some((r) => p.regions.includes(r));
    if (!hasMatchingRegion) {
      return { pass: false, reason: `保障区域不匹配（产品仅覆盖${p.regions.join('、')}）` };
    }
  }

  // Hospital network check
  if (input.hospitals.length > 0) {
    if (input.hospitals.includes('私立医院' as HospitalType) && !p.hospital_network.private_hospital) {
      return { pass: false, reason: '不覆盖私立医院' };
    }
    if (input.hospitals.includes('昂贵医院' as HospitalType) && !p.hospital_network.expensive_hospital) {
      return { pass: false, reason: '不覆盖昂贵医院' };
    }
  }

  // Outpatient check
  if (input.outpatient_need === '需要门诊直付' && !p.outpatient.included && !p.outpatient.optional) {
    return { pass: false, reason: '不含门诊且不可选门诊' };
  }
  if (input.outpatient_need === '需要普通门诊' && !p.outpatient.included && !p.outpatient.optional) {
    return { pass: false, reason: '不含门诊且不可选门诊' };
  }

  // Pre-existing condition check
  if (input.pre_existing_condition === '明确既往症' || input.pre_existing_condition === '既往理赔记录') {
    if (p.pre_existing_condition.support_level <= 1) {
      return { pass: false, reason: '既往症规则为除外，不适合明确既往症客户' };
    }
  }

  // Budget check
  if (!estimateBudgetFit(p, input)) {
    return { pass: false, reason: '参考保费可能超出客户预算' };
  }

  // Maternity check
  if (input.concern_maternity === '是' && !p.maternity?.available) {
    return { pass: false, reason: '不支持生育责任' };
  }

  return { pass: true };
}

/**
 * Score a product against customer needs
 */
function score(p: MedicalProduct, input: MedicalCustomerInput): { score: number; matchTags: MedicalFocusTag[]; matchDetails: Partial<Record<MedicalFocusTag, number>> } {
  let totalScore = 0;
  const matchTags: MedicalFocusTag[] = [];
  const matchDetails: Partial<Record<MedicalFocusTag, number>> = {};

  // Helper to add to a scoring dimension
  const addScore = (dimension: MedicalFocusTag, s: number, maxS: number) => {
    const weighted = (s / maxS) * 100;
    totalScore += weighted;
    matchDetails[dimension] = weighted;
  };

  // 1. Hospital Network Match (权重 25)
  const hospitalScore = scoreHospitalNetwork(p, input);
  addScore('特需/国际部', hospitalScore, 6);

  // 2. Budget & Deductible Match (权重 15)
  const budgetScore = scoreBudgetAndDeductible(p, input);
  addScore('预算可控', budgetScore, 6);

  // 3. Health / Pre-existing Condition Match (权重 20)
  const healthScore = scoreHealthFit(p, input);
  addScore('既往症友好', healthScore, 5);

  // 4. Outpatient & Direct Billing (权重 15)
  const outpatientScore = scoreOutpatientAndDirectBilling(p, input);
  addScore('门诊直付', outpatientScore, 5);

  // 5. Drug & Cancer Treatment (权重 10)
  const drugScore = scoreDrugAndCancerTreatment(p, input);
  addScore('外购药/特药', drugScore, 4);

  // 6. Region & Overseas (权重 10)
  const regionScore = scoreRegionAndOverseas(p, input);
  addScore('海外/港澳台就医', regionScore, 5);

  // 7. Family / Children / Maternity (权重 5)
  const familyScore = scoreFamilyFit(p, input);
  addScore('儿童单独投保', familyScore, 3);
  addScore('生育/家庭计划', familyScore, 3);

  // Collect matching tags based on score thresholds
  if (hospitalScore >= 4) matchTags.push('特需/国际部');
  if (p.hospital_network.private_hospital && hospitalScore >= 3) matchTags.push('私立医院');
  if (budgetScore >= 4) matchTags.push('预算可控');
  if (p.deductible_options.includes(0) && budgetScore >= 3) matchTags.push('0免赔/低免赔');
  if (healthScore >= 3) matchTags.push('既往症友好');
  if (outpatientScore >= 3) matchTags.push('门诊直付');
  if (drugScore >= 3) matchTags.push('外购药/特药');
  if (p.child_standalone && familyScore >= 2) matchTags.push('儿童单独投保');
  if (regionScore >= 4) matchTags.push('海外/港澳台就医');
  if (p.maternity?.available && familyScore >= 2) matchTags.push('生育/家庭计划');

  return { score: totalScore, matchTags: [...new Set(matchTags)], matchDetails };
}

function scoreHospitalNetwork(p: MedicalProduct, input: MedicalCustomerInput): number {
  let s = 0;
  const maxHospitals = Math.max(input.hospitals.length, 1);

  for (const h of input.hospitals) {
    switch (h) {
      case '公立普通部': if (p.hospital_network.public_general) s += 1; break;
      case '特需部': if (p.hospital_network.special_need) s += 1; break;
      case '国际部': if (p.hospital_network.international_department) s += 1; break;
      case 'VIP部': if (p.hospital_network.vip_department) s += 1; break;
      case '私立医院': if (p.hospital_network.private_hospital) s += 2; break;
      case '昂贵医院': if (p.hospital_network.expensive_hospital) s += 2; break;
    }
  }

  // Bonus for broad network
  if (s >= maxHospitals && p.hospital_network.private_hospital) s += 1;
  if (p.direct_billing.hospital_count > 300) s += 1;

  return s;
}

function scoreBudgetAndDeductible(p: MedicalProduct, input: MedicalCustomerInput): number {
  let s = 0;

  const reference = getPriceReference(p.price_level, input.insured_age);
  if (reference) {
    const ratio = reference / input.annual_budget;
    if (ratio <= 0.7) s += 3;
    else if (ratio <= 1) s += 2;
    else if (ratio <= 1.3) s += 1;
  }

  // Deductible match
  const deductiblePrefs = input.acceptable_deductibles;
  const matchingDeductibles = p.deductible_options.filter((d) => deductiblePrefs.includes(d));
  if (matchingDeductibles.length > 0) {
    s += Math.min(matchingDeductibles.length, 2);
    if (matchingDeductibles.includes(0)) s += 1; // bonus for 0 deductible option
  }

  // Medical insurance offset
  if (input.has_social_insurance === '是' && p.deductible.medical_insurance_offset) {
    s += 1;
  }

  return Math.min(s, 6);
}

function scoreHealthFit(p: MedicalProduct, input: MedicalCustomerInput): number {
  const condition = input.pre_existing_condition;
  const supportLevel = p.pre_existing_condition.support_level;

  switch (condition) {
    case '无':
      return 3; // healthy clients fit most products
    case '轻微异常':
      return supportLevel >= 3 ? 5 : supportLevel >= 2 ? 3 : 1;
    case '明确既往症':
    case '既往理赔记录':
      return supportLevel >= 5 ? 5 : supportLevel >= 4 ? 4 : supportLevel >= 3 ? 2 : 0;
    default:
      return 2;
  }
}

function scoreOutpatientAndDirectBilling(p: MedicalProduct, input: MedicalCustomerInput): number {
  let s = 0;

  const needOutpatient = input.outpatient_need !== '不需要';
  if (needOutpatient && (p.outpatient.included || p.outpatient.optional)) {
    s += 2;
    if (p.outpatient.direct_billing) s += 1;
  } else if (!needOutpatient) {
    s += 1; // no conflict
  }

  if (input.concern_inpatient_direct_billing === '是') {
    if (p.direct_billing.inpatient) s += 1;
    if (p.direct_billing.outpatient) s += 1;
    if (p.direct_billing.hospital_count > 500) s += 1;
    else if (p.direct_billing.hospital_count > 200) s += 0.5;
  }

  return Math.min(Math.ceil(s), 5);
}

function scoreDrugAndCancerTreatment(p: MedicalProduct, input: MedicalCustomerInput): number {
  if (input.concern_outpatient_drug_device === '否') return 3; // neutral

  let s = 0;

  // Out of hospital drug
  if (p.drug_device.out_of_hospital_drug.includes('不限清单')) s += 2;
  else {
    const num = p.drug_device.out_of_hospital_drug.match(/(\d+)/);
    if (num && parseInt(num[1]) >= 1000000) s += 1;
  }

  // Cancer special drug
  if (p.drug_device.cancer_special_drug.includes('不限清单')) s += 1;
  if (p.drug_device.cancer_special_drug.includes('博鳌') || p.drug_device.cancer_special_drug.includes('未上市')) s += 1;

  // Overseas new drug
  if (p.overseas_medical.summary.includes('未上市新药')) s += 1;

  // Overseas cancer treatment
  if (p.overseas_medical.support_level >= 4) s += 1;

  return Math.min(s, 4);
}

function scoreRegionAndOverseas(p: MedicalProduct, input: MedicalCustomerInput): number {
  if (input.concern_overseas_medical === '否') return 3; // neutral

  let s = 0;

  // Region match
  const matchedRegions = input.regions.filter((r) => p.regions.includes(r));
  s += Math.min(matchedRegions.length, 2);

  // Overseas medical support
  if (p.overseas_medical.support_level >= 4) s += 2;
  else if (p.overseas_medical.support_level >= 2) s += 1;

  // Global emergency
  if (p.overseas_medical.summary.includes('全球紧急')) s += 1;

  return Math.min(s, 5);
}

function scoreFamilyFit(p: MedicalProduct, input: MedicalCustomerInput): number {
  let s = 0;

  if (input.customer_type === '儿童' && p.child_standalone) s += 2;
  else if (input.customer_type === '儿童' && !p.child_standalone) s -= 1;

  if (input.concern_maternity === '是' && p.maternity?.available) {
    s += 2;
  }

  if (p.family_discount && p.family_discount !== '待补充') s += 1;

  if (input.customer_type === '家庭' && (p.child_standalone || (p.family_discount && p.family_discount !== '待补充'))) {
    s += 1;
  }

  return Math.min(Math.max(s, 0), 3);
}

export function matchMedicalProducts(
  input: MedicalCustomerInput
): MedicalProductWithScore[] {
  // First pass: hard filter with budget at 1x
  let candidates = products
    .map((p) => {
      const filterResult = hardFilter(p, input);
      return { product: p, filterResult };
    })
    .filter((item) => item.filterResult.pass)
    .map((item) => {
      const { score: matchScore, matchTags, matchDetails } = score(item.product, input);
      return {
        ...item.product,
        match_score: matchScore,
        match_tags: matchTags,
        match_details: matchDetails,
      } as MedicalProductWithScore;
    })
    .sort((a, b) => b.match_score - a.match_score);

  // If no candidates, try with relaxed budget (1.5x)
  if (candidates.length === 0) {
    candidates = products
      .filter((p) => {
        const result = hardFilter(p, input);
        // Only relax the budget constraint - re-check without budget
        if (!result.pass && result.reason?.includes('预算')) return true;
        return result.pass;
      })
      .map((p) => {
        const { score: matchScore, matchTags, matchDetails } = score(p, input);
        return {
          ...p,
          match_score: matchScore,
          match_tags: matchTags,
          match_details: matchDetails,
        } as MedicalProductWithScore;
      })
      .sort((a, b) => b.match_score - a.match_score);
  }

  // Return top 2-4 products
  return candidates.slice(0, 4);
}
