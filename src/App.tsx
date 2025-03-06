import React, { useState, useEffect, useCallback } from 'react';
import _ from 'lodash';

const SearchApp = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [threshold, setThreshold] = useState(0.5);
  const [fast, setFast] = useState(false);
  const [limit, setLimit] = useState(10);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requestTime, setRequestTime] = useState(null);

  // Create a debounced search function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    _.debounce(async (search, threshold, fast, limit) => {
      if (!search) {
        setResults([]);
        setRequestTime(null);
        return;
      }

      setLoading(true);
      setError(null);
      setRequestTime(null);
      
      const startTime = performance.now();
      
      try {
        const url = `http://54.167.27.251:8080/search?search=${encodeURIComponent(search)}&optimized=${fast}&limit=${limit}&threshold=${threshold}`;
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        const endTime = performance.now();
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

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">Search Interface</h1>
      
      <div className="space-y-4">
        {/* Search input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search Term
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Enter search term..."
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        {/* Threshold slider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Threshold: {threshold}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        
        {/* Fast checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="fast"
            checked={fast}
            onChange={(e) => setFast(e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="fast" className="text-sm font-medium text-gray-700">
            Fast (Optimized)
          </label>
        </div>
        
        {/* Limit input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Result Limit
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value, 10) || 1)}
            className="w-32 p-2 border border-gray-300 rounded"
          />
        </div>
      </div>
      
      {/* Results section */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Results</h2>
        
        {loading && <div className="text-gray-500">Loading...</div>}
        
        {error && <div className="text-red-500">{error}</div>}
        
        {requestTime !== null && !loading && (
          <div className="text-sm text-gray-600 mb-2">
            Request time: {requestTime.toFixed(2)} ms
          </div>
        )}
        
        {!loading && !error && results.length === 0 && searchTerm && (
          <div className="text-gray-500">No results found</div>
        )}
        
        {!loading && !error && results.length > 0 && (
          <ul className="divide-y divide-gray-200">
            {results.map((result, index) => (
              <li key={index} className="py-3">
                {result.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SearchApp;