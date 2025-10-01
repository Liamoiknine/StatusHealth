import { parseChemicalsCSV, ChemicalData } from '@/lib/csv-parser-server';
import Link from 'next/link';

interface ChemicalPageProps {
  params: {
    name: string;
  };
}

export default async function ChemicalPage({ params }: ChemicalPageProps) {
  const { name } = await params;
  const chemicalName = decodeURIComponent(name);
  const chemicals: ChemicalData[] = await parseChemicalsCSV();
  
  const chemical = chemicals.find(c => c.name === chemicalName);
  
  if (!chemical) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Chemical Not Found</h1>
          <p className="text-gray-600 mb-8">The chemical "{chemicalName}" was not found.</p>
          <Link 
            href="/" 
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Chemical List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Link 
            href="/" 
            className="inline-block text-blue-600 hover:text-blue-800 mb-8 transition-colors"
          >
            ← Back to Chemical List
          </Link>
          
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              {chemical.name}
            </h1>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-4 border-b border-gray-200">
                <span className="text-lg font-medium text-gray-700">Chemical Name:</span>
                <span className="text-lg text-gray-900">{chemical.name}</span>
              </div>
              
              <div className="flex justify-between items-center py-4 border-b border-gray-200">
                <span className="text-lg font-medium text-gray-700">Value:</span>
                <span className="text-2xl font-bold text-gray-900">{chemical.content}</span>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Additional Information</h2>
              <p className="text-gray-600">
                This chemical has a content value of {chemical.content}. 
                Higher values may indicate greater exposure levels.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
