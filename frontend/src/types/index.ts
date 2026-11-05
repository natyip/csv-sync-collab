export interface RecordItem {
  id: string | number;
  postId?: string | number;
  name: string;
  email: string;
  body: string;
  updatedAt?: string;
}

export interface PaginationMetadata {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  limit: number;
}

export interface PaginatedResponse {
  data: RecordItem[];
  meta: PaginationMetadata;
}

export interface ConflictItem {
  id: string | number;
  existingRecord: RecordItem;
  incomingRecord: RecordItem;
}

export interface ConflictResponse {
  success: boolean;
  message?: string;
  conflicts?: ConflictItem[];
  updatedCount?: number;
}