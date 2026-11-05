export interface RecordItem {
  id: string | number;
  postId?: string | number;
  name: string;
  email: string;
  body: string;
  updatedAt?: string;
}

// export interface PaginationMetadata {
//   currentPage: number;
//   totalPages: number;
//   totalRecords: number;
//   limit: number;
// }

export interface PaginatedResponse {
  success: boolean;
  data: RecordItem[];
  pagination: {
    totalRecords: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  };
}
export interface ConflictItem {
  id: string | number;
  existingRecord: RecordItem;
  incomingRecord: RecordItem;
}

export interface ConflictResolutionStats {
  overwritten: number;
  kept: number;
}

export interface UploadCsvSuccess {
  success: boolean;
  message: string;
  errors: number  | undefined;
}

export interface ConflictResponse {
  success: boolean;
  message: string;
  stats: ConflictResolutionStats;
}

export interface ResolutionItem {
  id: number;
  action: 'KEEP' | 'OVERWRITE';
  incomingData?: {
    postId: number | string;
    name: string;
    email: string;
    body: string;
  };
}