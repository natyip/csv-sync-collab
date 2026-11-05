import type { PaginatedResponse, ConflictResponse } from '../types';

// Update port if your backend runs on a different port (e.g., 5000)
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Fetch paginated records with optional search query filtering
 */
export async function fetchRecords(
  page = 1,
  limit = 10,
  search = ''
): Promise<PaginatedResponse> {
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    search,
  });

  const response = await fetch(`${API_BASE_URL}/records?${queryParams.toString()}`);
  
  if (!response.ok) {
    throw new Error(`Error fetching records: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Submit conflict resolutions (KEEP vs. OVERWRITE) to the backend
 */
export async function resolveConflicts(
  resolutions: { id: string | number; resolution: 'KEEP' | 'OVERWRITE' }[]
): Promise<ConflictResponse> {
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

  return response.json();
}