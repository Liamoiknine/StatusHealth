import industrialChemicalsJson from '../chemicals/industrial-chemicals.json';
import { HouseholdChemicalDataStructured } from './household-products';

// Reuse the same interface since the structure is identical
export type IndustrialChemicalsChemicalDataStructured = HouseholdChemicalDataStructured;

// Load industrial chemicals data directly from JSON
const industrialChemicalsDataStructured: IndustrialChemicalsChemicalDataStructured[] = 
  industrialChemicalsJson as IndustrialChemicalsChemicalDataStructured[];

/**
 * Find an industrial chemicals chemical by compound name
 */
export function findIndustrialChemicalsChemicalStructured(compoundName: string): IndustrialChemicalsChemicalDataStructured | null {
  // Normalize names for comparison (remove parentheses, extra spaces, etc.)
  const normalizeName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s*\([^)]*\)\s*/g, '') // Remove content in parentheses like "(o-Cresol)"
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  const normalizedSearch = normalizeName(compoundName);

  // Try exact match first
  let match = industrialChemicalsDataStructured.find(
    (chem) => normalizeName(chem.compound_name) === normalizedSearch
  );

  // If no exact match, try partial match
  if (!match) {
    match = industrialChemicalsDataStructured.find(
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
 * Get a list of all compound names in the industrial chemicals data
 */
export function getAllIndustrialChemicalsCompoundNames(): string[] {
  return industrialChemicalsDataStructured.map((chem) => chem.compound_name);
}

