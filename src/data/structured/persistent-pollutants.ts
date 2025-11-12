import persistantPollutantsJson from '../chemicals/persistent-pollutants.json';
import { HouseholdChemicalDataStructured } from './household-products';

// Reuse the same interface since the structure is identical
export type PersistantPollutantsChemicalDataStructured = HouseholdChemicalDataStructured;

// Load persistent pollutants data directly from JSON
const persistantPollutantsDataStructured: PersistantPollutantsChemicalDataStructured[] = 
  persistantPollutantsJson as PersistantPollutantsChemicalDataStructured[];

/**
 * Find a persistent pollutants chemical by compound name
 */
export function findPersistantPollutantsChemicalStructured(compoundName: string): PersistantPollutantsChemicalDataStructured | null {
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
  let match = persistantPollutantsDataStructured.find(
    (chem) => normalizeName(chem.compound_name) === normalizedSearch
  );

  // If no exact match, try partial match
  if (!match) {
    match = persistantPollutantsDataStructured.find(
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
 * Get a list of all compound names in the persistent pollutants data
 */
export function getAllPersistantPollutantsCompoundNames(): string[] {
  return persistantPollutantsDataStructured.map((chem) => chem.compound_name);
}

