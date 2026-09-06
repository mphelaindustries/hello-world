/**
 * Scores a scraped tender against the company profile (0-100).
 * Deliberately simple and explainable — every point is traceable to a reason,
 * which is what gets shown in the "Why this matched" panel.
 */
export function scoreTender(tender, profile) {
  const reasons = [];
  let score = 0;

  const text = `${tender.title} ${tender.description ?? ''} ${tender.category ?? ''}`.toLowerCase();

  // 1. Keyword / category fit (max 40)
  const keywords = (profile.keywords ?? []).map((k) => k.toLowerCase());
  const hits = keywords.filter((k) => text.includes(k));
  if (hits.length) {
    const points = Math.min(40, hits.length * 12);
    score += points;
    reasons.push(`Matches your work areas: ${hits.join(', ')} (+${points})`);
  }

  // 2. Province fit (max 20)
  const provinces = profile.provinces ?? [];
  if (tender.province && provinces.includes(tender.province)) {
    score += 20;
    reasons.push(`Located in ${tender.province}, one of your operating provinces (+20)`);
  } else if (tender.province && provinces.length) {
    reasons.push(`Outside your usual provinces (${tender.province})`);
  }

  // 3. CIDB grading fit (max 20)
  if (tender.cidbGrade && profile.cidbGrade) {
    const needed = parseInt(String(tender.cidbGrade), 10);
    const have = parseInt(String(profile.cidbGrade), 10);
    if (!Number.isNaN(needed) && !Number.isNaN(have)) {
      if (have >= needed) {
        score += 20;
        reasons.push(`Your CIDB ${profile.cidbGrade} meets the required ${tender.cidbGrade} (+20)`);
      } else {
        score -= 15;
        reasons.push(`Requires CIDB ${tender.cidbGrade}, you hold ${profile.cidbGrade} (-15)`);
      }
    }
  }

  // 4. Contract value inside your comfort band (max 10)
  if (tender.value && profile.maxContractValue) {
    if (tender.value <= profile.maxContractValue) {
      score += 10;
      reasons.push('Contract value within your capacity (+10)');
    } else {
      reasons.push('Contract value above your usual capacity');
    }
  }

  // 5. Enough time left to prepare (max 10)
  if (tender.closingDate) {
    const days = Math.ceil((new Date(tender.closingDate) - Date.now()) / 86400000);
    if (days >= 7) {
      score += 10;
      reasons.push(`${days} days until closing (+10)`);
    } else if (days >= 0) {
      reasons.push(`Only ${days} day(s) until closing`);
    } else {
      score -= 50;
      reasons.push('Already closed (-50)');
    }
  }

  return {
    matchScore: Math.max(0, Math.min(100, score)),
    matchReasons: reasons,
  };
}
