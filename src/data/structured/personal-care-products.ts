import personalCareProductsJson from '../chemicals/personal-care-products.json';
import { HouseholdChemicalDataStructured } from './household-products';

// Reuse the same interface since the structure is identical
export type PersonalCareProductsChemicalDataStructured = HouseholdChemicalDataStructured;

// Load personal care products data directly from JSON
const personalCareProductsDataStructured: PersonalCareProductsChemicalDataStructured[] = 
  personalCareProductsJson as PersonalCareProductsChemicalDataStructured[];

/**
 * Find a personal care products chemical by compound name
 */
export function findPersonalCareProductsChemicalStructured(compoundName: string): PersonalCareProductsChemicalDataStructured | null {
  // Normalize names for comparison (remove parentheses, extra spaces, etc.)
  const normalizeName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s*\([^)]*\)\s*/g, '') // Remove content in parentheses like "(DPP)"
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  const normalizedSearch = normalizeName(compoundName);

  // Try exact match first
  let match = personalCareProductsDataStructured.find(
    (chem) => normalizeName(chem.compound_name) === normalizedSearch
  );

  // If no exact match, try partial match
  if (!match) {
    match = personalCareProductsDataStructured.find(
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
 * Get a list of all compound names in the personal care products data
 */
export function getAllPersonalCareProductsCompoundNames(): string[] {
  return personalCareProductsDataStructured.map((chem) => chem.compound_name);
}

