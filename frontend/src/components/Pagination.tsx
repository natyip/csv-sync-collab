import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginatedResponse } from '../types';

interface PaginationProps {
  pagination: PaginatedResponse['pagination'];
  onPageChange: (newPage: number) => void;
  loading?: boolean;
}

export function Pagination({ pagination, onPageChange, loading }: PaginationProps) {
  const { currentPage, totalPages, totalRecords, limit } = pagination;

  if (totalRecords === 0) return null;

  const startRecord = (currentPage - 1) * limit + 1;
  const endRecord = Math.min(currentPage * limit, totalRecords);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-1 border-t border-gray-200">
      <div className="text-sm text-gray-600">
        Showing <span className="font-semibold text-gray-900">{startRecord}</span> to{' '}
        <span className="font-semibold text-gray-900">{endRecord}</span> of{' '}
        <span className="font-semibold text-gray-900">{totalRecords}</span> results
      </div>

      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1 || loading}
          className="inline-flex items-center space-x-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <span className="px-3 py-1.5 text-sm font-medium text-gray-700">
          Page {currentPage} of {totalPages || 1}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages || loading}
          className="inline-flex items-center space-x-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}