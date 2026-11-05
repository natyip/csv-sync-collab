import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SearchBar({
  onSearch,
  placeholder = 'Search records by name, email, or body...',
  debounceMs = 300,
}: SearchBarProps) {
  const [term, setTerm] = useState<string>('');
  const isFirstRun = useRef(true);

  useEffect(() => {
    // Skip firing on initial component mount
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    const handler = setTimeout(() => {
      onSearch(term);
    }, debounceMs);

    return () => {
      clearTimeout(handler);
    };
  }, [term, onSearch, debounceMs]);

  const handleClear = () => {
    setTerm('');
    onSearch('');
  };

  return (
    <div className="relative w-full sm:max-w-xs">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
        <Search className="w-4 h-4" />
      </div>

      <input
        type="text"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
      />

      {term && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition"
          title="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}