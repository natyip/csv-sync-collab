import { useEffect, useState, useCallback, useRef } from 'react';
import { Database, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { fetchRecord } from './services/api';
import { initSocket, disconnectSocket } from './services/socket';
import { DataTable } from './components/DataTable';
import { SearchBar } from './components/SearchBar';
import { Pagination } from './components/Pagination';
import { FileUpload } from './components/FileUpload';
import type { RecordItem, PaginatedResponse } from './types';

function App() {
  const [records, setRecords] = useState<RecordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState<boolean>(false);

  // Pagination & Search state
  const [page, setPage] = useState<number>(1);
  const [search, setSearch] = useState<string>('');
  const [pagination, setPagination] = useState<PaginatedResponse['pagination']>({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 10,
  });

  // Refs to maintain current page/search values inside persistent socket listeners without stale closures
  const pageRef = useRef(page);
  const searchRef = useRef(search);

  useEffect(() => {
    pageRef.current = page;
    searchRef.current = search;
  }, [page, search]);

  const loadRecords = useCallback(async (currentPage: number, searchQuery: string) => {
    try {
      setError(null);
      const response = await fetchRecord(currentPage, 10, searchQuery);
      setRecords(response.data);
      setPagination(response.pagination);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load records';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // 1. WebSocket Connection Effect (Runs ONCE on mount, doesn't tear down on page changes)
  useEffect(() => {
    const socket = initSocket();

    socket.on('connect', () => {
      setIsSocketConnected(true);
    });

    socket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    socket.on('DATA_UPDATED', () => {
      console.log('🔄 Data updated broadcast received. Refreshing current view...');
      loadRecords(pageRef.current, searchRef.current);
    });

    return () => {
      disconnectSocket();
    };
  }, [loadRecords]);

  // 2. Data Fetching Effect (Runs whenever page or search changes)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRecords(page, search);
  }, [page, search, loadRecords]);

  // Wrap handleSearch in useCallback so its reference is stable
  const handleSearch = useCallback((query: string) => {
    setSearch(query);
    setPage(1); // Reset to first page on new search
  }, []);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900">
                CSV Sync & Collaboration
              </h1>
              <p className="text-xs text-gray-500">Real-time data synchronization dashboard</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
                isSocketConnected
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {isSocketConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-green-600 animate-pulse" />
                  <span>Live Sync Active</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-red-600" />
                  <span>Disconnected</span>
                </>
              )}
            </div>

            <button
              onClick={() => loadRecords(page, search)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg transition"
              title="Refresh Records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* File Upload Component Section */}
          <FileUpload onUploadComplete={() => loadRecords(page, search)} />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Records Management</h2>
              <p className="text-sm text-gray-500">
                View, search, and manage synchronized CSV records with real-time conflict resolution.
              </p>
            </div>

            {/* Search Input */}
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Table */}
          <DataTable records={records} loading={loading} error={error} />

          {/* Pagination Controls */}
          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
}

export default App;