import type { PaginatedResponse, ResolutionItem, ConflictResponse, UploadCsvSuccess } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Fetch paginated and searched records from the backend.
 */
export async function fetchRecord(
  page: number = 1,
  limit: number = 10,
  search: string = ''
): Promise<PaginatedResponse> {
  const url = `${API_BASE_URL}/records?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Error fetching records: ${response.statusText}`);
  }

  const json: PaginatedResponse = await response.json();
  return json;
}

/**
 * Submit user conflict resolutions to the backend.
 */
export async function resolveConflicts(resolutions: ResolutionItem[]): Promise<ConflictResponse> {
  const response = await fetch(`${API_BASE_URL}/resolve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resolutions }),
  });

  if (!response.ok) {
    throw new Error(`Error resolving conflicts: ${response.statusText}`);
  }

  const json: ConflictResponse = await response.json();
  return json;
}

/**
 * Upload a CSV file via multipart/form-data to the backend upload endpoint.
 * Returns response containing message and stats (or triggers conflicts via socket listeners).
 */
export async function uploadCsv(file: File): Promise<UploadCsvSuccess> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    // Do NOT set Content-Type header manually for FormData; browser handles it automatically.
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Error uploading CSV file: ${response.statusText}`);
  }

  const json: UploadCsvSuccess = await response.json();
  return json;
}