export interface ChemicalData {
  name: string;
  content: number;
}

export async function parseChemicalsCSV(): Promise<ChemicalData[]> {
  try {
    const response = await fetch('/api/chemicals');
    if (!response.ok) {
      throw new Error('Failed to fetch chemicals');
    }
    return await response.json();
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw error;
  }
}
