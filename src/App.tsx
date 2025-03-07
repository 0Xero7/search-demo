import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
import _ from 'lodash';

// Define interfaces for our data structures
interface SearchResult {
  id?: number | string;
  name?: string;
  location?: string;
  text?: string;
  summary?: string;
  score?: number;
  [key: string]: any; // For any additional properties in results
}

interface TimingMetrics {
  embeddings: number;
  search: number;
  total: number;
}

const SearchApp: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [threshold, setThreshold] = useState<number>(0.5);
  const [fast, setFast] = useState<boolean>(false);
  const [limit, setLimit] = useState<number>(10);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [timingMetrics, setTimingMetrics] = useState<TimingMetrics | null>(null);
  const [speed, setSpeed] = useState<number>(0);
  const [dataset, setDataset] = useState<string>('reviews');
  const [filtersExpanded, setFiltersExpanded] = useState<boolean>(false);

  // Create a debounced search function
  const debouncedSearch = useCallback(
    _.debounce(async (search: string, threshold: number, fast: boolean, limit: number, speed: number, dataset: string): Promise<void> => {
      if (!search) {
        setResults([]);
        setTimingMetrics(null);
        return;
      }

      setLoading(true);
      setError(null);
      setTimingMetrics(null);

      const startTime: number = performance.now();

      try {
        // const url: string = `http://54.167.27.251:8080/search?search=${encodeURIComponent(search)}&optimized=${fast}&limit=${limit}&threshold=${threshold}`;
        const url: string = `https://po65lcryad.execute-api.us-east-1.amazonaws.com/dev/search?search=${encodeURIComponent(search)}&optimized=${fast}&limit=${limit}&threshold=${threshold}&speed=${speed}&dataset=${dataset}`;

        const response: Response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data: any = await response.json();
        const endTime: number = performance.now();
        const totalTime = endTime - startTime;

        // For demo purposes, we'll simulate the metrics
        // In a real implementation, these would come from the API
        // Assuming the API doesn't return timing metrics yet
        const embeddingsTime = data['embedding_time']; // 30% of total time
        const searchTime = data['search_time']; // 60% of total time

        setTimingMetrics({
          embeddings: embeddingsTime / 1_000_000,
          search: searchTime / 1_000_000,
          total: totalTime
        });

        const rawResults = data['results'];
        const processedResults: SearchResult[] = rawResults.map((result: any) => {
          try {
            const jsonData = JSON.parse(result.text);
            return (
              {
                name: jsonData['name'],
                location: jsonData['location'],
                summary: jsonData['summary'],
                text: jsonData['text'],
                score: jsonData['score']
              });
          } catch (e) {
            return (
              {
                text: result.text,
              }
            );
          }
        });

        setResults(processedResults);
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
    debouncedSearch(searchTerm, threshold, fast, limit, speed, dataset);
  }, [debouncedSearch, searchTerm, threshold, fast, limit, speed, dataset]);

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

  const handleSpeedChange = (newSpeed: number): void => {
    setSpeed(newSpeed);
  };

  const handleDatasetChange = (newDataset: string): void => {
    setDataset(newDataset);
  };

  const toggleFilters = (): void => {
    setFiltersExpanded(!filtersExpanded);
  };

  // Generate summary of current filter settings
  const getFilterSummary = (): string => {
    const summaries = [
      `Threshold: ${threshold.toFixed(2)}`,
      `Limit: ${limit}`,
      `Mode: ${fast ? 'Fast' : 'Standard'}`,
      `Speed: ${(speed === 0 ? "Normal" : speed === 1 ? "Fast" : "Fastest")}`,
      `Dataset: ${dataset.charAt(0).toUpperCase() + dataset.slice(1)}`
    ];
    return summaries.join(' · ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-10 pt-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">Enterprise Search Platform</h1>
          <p className="text-gray-600 text-lg">Advanced semantic search with precision controls</p>
        </div>

        {/* Search Panel */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-8 border border-gray-100">
          <div className="mb-8">
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Enter your search query..."
                className="w-full p-5 pl-14 text-lg border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300 shadow-sm"
              />
              <svg className="absolute left-5 top-5 h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Filter controls toggle */}
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <button
                onClick={toggleFilters}
                className="flex items-center text-blue-600 font-medium hover:text-blue-800 focus:outline-none transition-colors duration-200"
              >
                <span className="mr-2">{filtersExpanded ? 'Hide Filters' : 'Show Filters'}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 transition-transform duration-300 ${filtersExpanded ? 'transform rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={filtersExpanded ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
                </svg>
              </button>

              {!filtersExpanded && (
                <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
                  {getFilterSummary()}
                </div>
              )}
            </div>
          </div>

          {/* Collapsible filter panel */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${filtersExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Threshold slider */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-lg shadow-sm border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Relevance Threshold
                </label>
                <div className="flex items-center">
                  <span className="text-xs text-gray-500 mr-3">0.0</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={threshold}
                    onChange={handleThresholdChange}
                    className="flex-grow h-2 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${threshold * 100}%, #e5e7eb ${threshold * 100}%, #e5e7eb 100%)`
                    }}
                  />
                  <span className="text-xs text-gray-500 ml-3">1.0</span>
                </div>
                <div className="text-center mt-2 font-medium text-blue-600">{threshold.toFixed(2)}</div>
              </div>

              {/* Limit input */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-lg shadow-sm border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Result Limit
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={limit}
                    onChange={handleLimitChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-300"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500">results</span>
                  </div>
                </div>
              </div>

              {/* Fast toggle */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-lg shadow-sm border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
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
                    <div className="w-14 h-7 bg-gray-300 peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:shadow-md after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                  <span className={`ml-3 font-medium ${fast ? 'text-blue-600' : 'text-gray-500'}`}>Fast</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Speed selection */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-lg shadow-sm border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Processing Speed
                </label>
                <div className="flex bg-gray-200 rounded-lg p-1">
                  {[0, 1, 2].map((speedOption) => (
                    <button
                      key={speedOption}
                      onClick={() => handleSpeedChange(speedOption)}
                      className={`flex-1 py-2 px-2 text-center rounded-lg transition-all duration-300 flex flex-col justify-center items-center ${speed === speedOption
                        ? 'bg-white text-blue-700 font-semibold shadow-md transform scale-[1.02]'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      <div className="flex flex-col items-center justify-center h-full space-y-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                          {speedOption === 0 && (
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                          )}
                          {speedOption === 1 && (
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                          )}
                          {speedOption === 2 && (
                            <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                          )}
                        </svg>
                        <span className="text-center">
                          {
                            speedOption === 0 ? "Normal" :
                              speedOption === 1 ? "Fast" :
                                speedOption === 2 ? "Fastest" : ""
                          }
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dataset selection */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-5 rounded-lg shadow-sm border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Dataset Selection
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: 'reviews', icon: 'M8.5 2.687c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z' },
                    { value: 'places', icon: 'M12.166 8.94c-.524 1.062-1.234 2.12-1.96 3.07A31.493 31.493 0 0 1 8 14.58a31.481 31.481 0 0 1-2.206-2.57c-.726-.95-1.436-2.008-1.96-3.07C3.304 7.867 3 6.862 3 6a5 5 0 0 1 10 0c0 .862-.305 1.867-.834 2.94zM8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10z' }
                  ].map(({ value, icon }) => (
                    <label
                      key={value}
                      className={`flex flex-col items-center justify-center rounded-lg border-2 transition-all duration-300 cursor-pointer h-full ${dataset === value
                        ? 'bg-blue-50 border-blue-500 shadow-md transform scale-[1.02]'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                    >
                      <input
                        type="radio"
                        name="dataset"
                        value={value}
                        checked={dataset === value}
                        onChange={() => handleDatasetChange(value)}
                        className="sr-only"
                      />
                      <div className="flex flex-col items-center justify-center h-full space-y-3 py-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${dataset === value ? 'text-blue-600' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 16 16">
                          <path d={icon} />
                        </svg>
                        <span className={`font-medium ${dataset === value ? 'text-blue-700' : 'text-gray-700'}`}>
                          {value.charAt(0).toUpperCase() + value.slice(1)}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
          {/* Header */}
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Search Results</h2>
            </div>

            {/* Timing Metrics */}
            {timingMetrics !== null && !loading && (
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="text-sm px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 text-green-700 rounded-lg font-medium flex flex-col items-center shadow-sm border border-green-100">
                  <span className="text-xs text-green-600 mb-1">Embeddings</span>
                  <span className="font-bold">{timingMetrics.embeddings.toFixed(2)} ms</span>
                </div>
                <div className="text-sm px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg font-medium flex flex-col items-center shadow-sm border border-blue-100">
                  <span className="text-xs text-blue-600 mb-1">Search</span>
                  <span className="font-bold">{timingMetrics.search.toFixed(2)} ms</span>
                </div>
                <div className="text-sm px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 rounded-lg font-medium flex flex-col items-center shadow-sm border border-purple-100">
                  <span className="text-xs text-purple-600 mb-1">Total</span>
                  <span className="font-bold">{timingMetrics.total.toFixed(2)} ms</span>
                </div>
              </div>
            )}
          </div>

          {/* Loading state */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Searching for results...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4 border border-red-100 shadow-sm">
              <div className="font-medium">Error</div>
              <div>{error}</div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && results.length === 0 && searchTerm && (
            <div className="py-12 text-center text-gray-500">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <li key={index} className="py-5 transition-colors hover:bg-blue-50 rounded-lg px-4 group cursor-pointer">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold group-hover:bg-blue-200 transition-colors mt-1">
                      {index + 1}
                    </div>
                    <div className="ml-4 flex-1">
                      {/* Name */}
                      {result.name && (
                        <div className="flex items-center mb-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <h3 className="font-medium text-lg text-gray-900">{result.name}</h3>
                        </div>
                      )}

                      {/* Location */}
                      {result.location && (
                        <div className="flex items-center mb-2 text-sm text-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>{result.location}</span>
                        </div>
                      )}

                      {/* Text/Summary Content */}
                      <div className="text-gray-700 leading-relaxed">
                        {result.text || result.summary}
                      </div>
                    </div>

                    {/* Score (if available) */}
                    {result.score !== undefined && (
                      <div className="ml-3 text-sm font-medium text-gray-500 group-hover:text-blue-600 transition-colors self-start mt-1">
                        <div className="bg-gray-100 group-hover:bg-blue-100 px-2 py-1 rounded transition-colors">
                          Score: {result.score.toFixed(3)}
                        </div>
                      </div>
                    )}
                  </div>
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