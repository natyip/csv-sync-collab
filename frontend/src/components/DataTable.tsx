import type { RecordItem } from '../types';

interface DataTableProps {
  records: RecordItem[];
  loading: boolean;
  error?: string | null;
}

export function DataTable({ records, loading, error }: DataTableProps) {
  // 1. Error State
  if (error) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 rounded-xl border border-red-200">
        <p className="font-semibold">Failed to load table records</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  // 2. Initial Loading State (when no records are loaded yet)
  if (loading && records.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
        <p className="text-sm">Loading records from server...</p>
      </div>
    );
  }

  // 3. Empty State (loaded successfully, but zero results returned)
  if (!loading && records.length === 0) {
    return (
      <div className="p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200">
        <p className="font-medium text-gray-800">No records found</p>
        <p className="text-sm text-gray-500 mt-1">Try modifying your search query or sync new records.</p>
      </div>
    );
  }

  // 4. Data Table Display
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-xs">
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
        <thead className="bg-gray-50 text-gray-700 font-semibold">
          <tr>
            <th className="px-6 py-3.5">ID</th>
            <th className="px-6 py-3.5">Post ID</th>
            <th className="px-6 py-3.5">Name</th>
            <th className="px-6 py-3.5">Email</th>
            <th className="px-6 py-3.5">Body</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-gray-600">
          {records.map((record) => (
            <tr key={record.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                {record.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {record.postId ?? '-'}
              </td>
              <td className="px-6 py-4 font-medium text-gray-800 whitespace-nowrap">
                {record.name}
              </td>
              <td className="px-6 py-4 text-blue-600 whitespace-nowrap">
                {record.email}
              </td>
              <td className="px-6 py-4 max-w-xs truncate" title={record.body}>
                {record.body}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}