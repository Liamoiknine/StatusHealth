import agriculturalChemicalsJson from '../chemicals/agricultural-chemicals.json';
import { HouseholdChemicalDataStructured } from './household-products';

// Reuse the same interface since the structure is identical
export type AgriculturalChemicalsChemicalDataStructured = HouseholdChemicalDataStructured;

// Load agricultural chemicals data directly from JSON
const agriculturalChemicalsDataStructured: AgriculturalChemicalsChemicalDataStructured[] = 
  agriculturalChemicalsJson as AgriculturalChemicalsChemicalDataStructured[];

/**
 * Find an agricultural chemicals chemical by compound name
 */
export function findAgriculturalChemicalsChemicalStructured(compoundName: string): AgriculturalChemicalsChemicalDataStructured | null {
  // Normalize names for comparison (remove parentheses, extra spaces, etc.)
  const normalizeName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s*\([^)]*\)\s*/g, '') // Remove content in parentheses
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  const normalizedSearch = normalizeName(compoundName);

  // Try exact match first
  let match = agriculturalChemicalsDataStructured.find(
    (chem) => normalizeName(chem.compound_name) === normalizedSearch
  );

  // If no exact match, try partial match
  if (!match) {
    match = agriculturalChemicalsDataStructured.find(
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
 * Get a list of all compound names in the agricultural chemicals data
 */
export function getAllAgriculturalChemicalsCompoundNames(): string[] {
  return agriculturalChemicalsDataStructured.map((chem) => chem.compound_name);
}

