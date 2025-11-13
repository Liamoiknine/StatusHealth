import categoryOverviewsAgriculturalChemicals from './agricultural-chemicals.json';
import categoryOverviewsContainersAndCoatings from './containers-and-coatings.json';
import categoryOverviewsHouseholdProducts from './household-products.json';
import categoryOverviewsIndustrialChemicals from './industrial-chemicals.json';
import categoryOverviewsPersistentPollutants from './persistent-pollutants.json';
import categoryOverviewsPersonalCareProducts from './personal-care-products.json';
import allChemicalsOverview from './all-chemicals-overview.json';

export interface CategoryOverviewSection {
  header: string;
  content: string;
  bullets?: string[];
  sources?: string[];
}

export interface CategoryOverview {
  category_name: string;
  summary_sections: CategoryOverviewSection[];
  sources: string[];
}

/**
 * Map category names to their overview data
 * 
 * To add a new category:
 * 1. Create a new JSON file in this directory (e.g., `category-overviews-[category-name].json`)
 * 2. Import it at the top of this file: `import categoryOverviews[CategoryName] from './category-overviews-[category-name].json';`
 * 3. Add an entry to the map below with the exact category name as it appears in your data
 * 
 * Example:
 * import categoryOverviewsHouseholdProducts from './category-overviews-household-products.json';
 * 
 * const categoryOverviewsMap: Record<string, CategoryOverview> = {
 *   'Agricultural Chemicals': categoryOverviewsAgriculturalChemicals as CategoryOverview,
 *   'Household Products': categoryOverviewsHouseholdProducts as CategoryOverview,
 * };
 */
const categoryOverviewsMap: Record<string, CategoryOverview> = {
  'Agricultural Chemicals': categoryOverviewsAgriculturalChemicals as CategoryOverview,
  'Containers & Coatings': categoryOverviewsContainersAndCoatings as CategoryOverview,
  'Household Products': categoryOverviewsHouseholdProducts as CategoryOverview,
  'Industrial Chemicals': categoryOverviewsIndustrialChemicals as CategoryOverview,
  'Persistent Pollutants': categoryOverviewsPersistentPollutants as CategoryOverview,
  'Personal Care Products': categoryOverviewsPersonalCareProducts as CategoryOverview,
};

/**
 * Find category overview data by category name
 */
export function findCategoryOverview(categoryName: string): CategoryOverview | null {
  // Normalize names for comparison
  const normalizeName = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .trim();
  };

  const normalizedSearch = normalizeName(categoryName);

  // Try exact match first
  const exactMatch = Object.keys(categoryOverviewsMap).find(
    (key) => normalizeName(key) === normalizedSearch
  );

  if (exactMatch) {
    return categoryOverviewsMap[exactMatch];
  }

  // Try partial match
  const partialMatch = Object.keys(categoryOverviewsMap).find(
    (key) => {
      const normalizedKey = normalizeName(key);
      return normalizedKey.includes(normalizedSearch) || 
             normalizedSearch.includes(normalizedKey);
    }
  );

  return partialMatch ? categoryOverviewsMap[partialMatch] : null;
}

/**
 * Get all available category names in the overviews data
 */
export function getAllCategoryNames(): string[] {
  return Object.keys(categoryOverviewsMap);
}

/**
 * Get the overview for "All Chemical Exposures" state
 */
export function getAllChemicalsOverview(): CategoryOverview {
  return allChemicalsOverview as CategoryOverview;
}

