import householdDataFinalJson from '../chemicals/household-products.json';

export interface SummarySection {
  header: string;
  content: string;
  bullets?: string[];
}

export interface HouseholdChemicalDataStructured {
  compound_name: string;
  cas_rn: string;
  summary_sections: SummarySection[];
  sources: string[];
}

// Load household data directly from JSON
const householdDataStructured: HouseholdChemicalDataStructured[] = 
  householdDataFinalJson as HouseholdChemicalDataStructured[];

/**
 * Find a household chemical by compound name
 */
export function findHouseholdChemicalStructured(compoundName: string): HouseholdChemicalDataStructured | null {
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
  let match = householdDataStructured.find(
    (chem) => normalizeName(chem.compound_name) === normalizedSearch
  );

  // If no exact match, try partial match
  if (!match) {
    match = householdDataStructured.find(
      (chem) => {
        const chemName = normalizeName(chem.compound_name);
        return chemName.includes(normalizedSearch) || 
               normalizedSearch.includes(chemName);
      }
    );
  }

  return match || null;
}

/**
 * Clean and normalize section content text
 */
export function cleanSectionContent(text: string): string {
  // Remove contentReference tags and clean up the text
  return text
    .replace(/contentReference\[oaicite:\d+\]\{index=\d+\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Group sections by header and combine content
 */
export interface GroupedSection {
  header: string;
  content: string; // Combined content from all sections with the same header
  bullets?: string[]; // Combined bullets if any
}

export function groupSectionsByHeader(
  sections: SummarySection[]
): GroupedSection[] {
  const grouped: Record<string, { contents: string[]; bullets: string[] }> = {};

  // Group sections by header
  sections.forEach((section) => {
    const header = section.header.trim();
    const content = cleanSectionContent(section.content);
    
    if (!grouped[header]) {
      grouped[header] = { contents: [], bullets: [] };
    }
    
    if (content) {
      grouped[header].contents.push(content);
    }

    // Collect bullets if present
    if (section.bullets && Array.isArray(section.bullets)) {
      grouped[header].bullets.push(...section.bullets);
    }
  });

  // Combine content for each header
  const result: GroupedSection[] = Object.entries(grouped)
    .map(([header, data]) => ({
      header,
      content: data.contents.join(' ').trim(),
      bullets: data.bullets.length > 0 ? data.bullets : undefined,
    }))
    .filter((section) => section.content.length > 0 || (section.bullets && section.bullets.length > 0));

  return result;
}

/**
 * Get all available section headers across all chemicals
 */
export function getAllSectionHeaders(): string[] {
  const headers = new Set<string>();
  
  householdDataStructured.forEach((chemical) => {
    chemical.summary_sections.forEach((section) => {
      if (section.header.trim()) {
        headers.add(section.header.trim());
      }
    });
  });

  return Array.from(headers).sort();
}

/**
 * Get a list of all compound names in the structured data
 */
export function getAllCompoundNames(): string[] {
  return householdDataStructured.map((chem) => chem.compound_name);
}

