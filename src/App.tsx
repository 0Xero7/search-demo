import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import _ from 'lodash';

// Define interfaces for our data structures
interface SearchResult {
  id?: number | string;
  title?: string;
  name?: string;
  description?: string;
  score?: number;
  [key: string]: any; // For any additional properties in results
}

const SearchApp: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [threshold, setThreshold] = useState<number>(0.5);
  const [fast, setFast] = useState<boolean>(false);
  const [limit, setLimit] = useState<number>(10);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [requestTime, setRequestTime] = useState<number | null>(null);

  // Create a debounced search function
  const debouncedSearch = useCallback(
    _.debounce(async (search: string, threshold: number, fast: boolean, limit: number): Promise<void> => {
      if (!search) {
        setResults([]);
        setRequestTime(null);
        return;
      }

      setLoading(true);
      setError(null);
      setRequestTime(null);
      
      const startTime: number = performance.now();
      
      try {
        const url: string = `https://po65lcryad.execute-api.us-east-1.amazonaws.com/dev/search?search=${encodeURIComponent(search)}&optimized=${fast}&limit=${limit}&threshold=${threshold}`;
        
        const response: Response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data: SearchResult[] = await response.json();
        const endTime: number = performance.now();
        setRequestTime(endTime - startTime);
        setResults(data);
      } catch (err) {
        console.error('Error fetching search results:', err);
        setError('Failed to fetch results. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  // Trigger search when parameters change
  useEffect(() => {
    debouncedSearch(searchTerm, threshold, fast, limit);
  }, [debouncedSearch, searchTerm, threshold, fast, limit]);

  // Handlers with proper types
  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };

  const handleThresholdChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setThreshold(parseFloat(e.target.value));
  };

  const handleLimitChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setLimit(parseInt(e.target.value, 10) || 1);
  };

  const handleFastToggle = (): void => {
    setFast(!fast);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-10 pt-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Semantic Search Engine</h1>
          <p className="text-gray-600">Advanced search with customizable parameters</p>
        </div>
        
        {/* Search Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Enter your search query..."
                className="w-full p-4 pl-12 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-4 top-4 h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Threshold slider */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relevance Threshold
              </label>
              <div className="flex items-center">
                <span className="text-xs text-gray-500 mr-2">0.0</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={threshold}
                  onChange={handleThresholdChange}
                  className="flex-grow h-2 rounded-lg appearance-none bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-500 ml-2">1.0</span>
              </div>
              <div className="text-center mt-1 font-medium text-blue-600">{threshold.toFixed(2)}</div>
            </div>
            
            {/* Limit input */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Result Limit
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={limit}
                onChange={handleLimitChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {/* Fast toggle */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Mode
              </label>
              <div className="flex items-center">
                <span className={`mr-3 font-medium ${!fast ? 'text-blue-600' : 'text-gray-500'}`}>Standard</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={fast} 
                    onChange={handleFastToggle} 
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
                <span className={`ml-3 font-medium ${fast ? 'text-blue-600' : 'text-gray-500'}`}>Fast</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Results Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Search Results</h2>
            {requestTime !== null && !loading && (
              <div className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">
                Request time: {requestTime.toFixed(2)} ms
              </div>
            )}
          </div>
          
          {/* Loading state */}
          {loading && (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {/* Error state */}
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">
              <div className="font-medium">Error</div>
              <div>{error}</div>
            </div>
          )}
          
          {/* Empty state */}
          {!loading && !error && results.length === 0 && searchTerm && (
            <div className="py-12 text-center text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-4 text-lg">No results found</p>
              <p className="mt-2">Try adjusting your search terms or filters</p>
            </div>
          )}
          
          {/* Results list */}
          {!loading && !error && results.length > 0 && (
            <ul className="divide-y divide-gray-200">
              {results.map((result: SearchResult, index: number) => (
                <li key={index} className="py-5 transition-colors hover:bg-gray-50 rounded-lg px-3">
                  {result.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchApp;