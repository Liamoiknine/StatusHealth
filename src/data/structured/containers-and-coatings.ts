import containersAndCoatingsJson from '../chemicals/containers-and-coatings.json';
import { HouseholdChemicalDataStructured } from './household-products';

// Reuse the same interface since the structure is identical
export type ContainersAndCoatingsChemicalDataStructured = HouseholdChemicalDataStructured;

// Load containers and coatings data directly from JSON
const containersAndCoatingsDataStructured: ContainersAndCoatingsChemicalDataStructured[] = 
  containersAndCoatingsJson as ContainersAndCoatingsChemicalDataStructured[];

/**
 * Find a containers and coatings chemical by compound name
 */
export function findContainersAndCoatingsChemicalStructured(compoundName: string): ContainersAndCoatingsChemicalDataStructured | null {
  // Normalize names for comparison (remove parentheses, extra spaces, etc.)
  const normalizeName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s*\([^)]*\)\s*/g, '') // Remove content in parentheses like "(BPA)"
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  };

  const normalizedSearch = normalizeName(compoundName);

  // Try exact match first
  let match = containersAndCoatingsDataStructured.find(
    (chem) => normalizeName(chem.compound_name) === normalizedSearch
  );

  // If no exact match, try partial match
  if (!match) {
    match = containersAndCoatingsDataStructured.find(
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
 * Get a list of all compound names in the containers and coatings data
 */
export function getAllContainersAndCoatingsCompoundNames(): string[] {
  return containersAndCoatingsDataStructured.map((chem) => chem.compound_name);
}

