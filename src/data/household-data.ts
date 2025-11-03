import householdDataJson from './household-data.json';

export interface HouseholdChemicalData {
  compound_name: string;
  cas_rn: string;
  summary_paragraph: string;
}

// Load household data directly from JSON
const householdData: HouseholdChemicalData[] = householdDataJson as HouseholdChemicalData[];

export function findHouseholdChemical(compoundName: string): HouseholdChemicalData | null {
  // Normalize names for comparison (remove parentheses, extra spaces, etc.)
  const normalizeName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s*\([^)]*\)\s*/g, '') // Remove content in parentheses like "(Sevin)"
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  const normalizedSearch = normalizeName(compoundName);

  // Try exact match first
  let match = householdData.find(
    (chem) => normalizeName(chem.compound_name) === normalizedSearch
  );

  // If no exact match, try partial match
  if (!match) {
    match = householdData.find(
      (chem) => {
        const chemName = normalizeName(chem.compound_name);
        return chemName.includes(normalizedSearch) || 
               normalizedSearch.includes(chemName);
      }
    );
  }

  return match || null;
}

export function cleanSummaryText(text: string): string {
  // Remove contentReference tags and clean up the text
  return text
    .replace(/contentReference\[oaicite:\d+\]\{index=\d+\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

