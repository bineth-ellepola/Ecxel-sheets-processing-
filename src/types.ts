// Types for the Excel Tool application

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RowData {
  [key: string]: string | number | boolean;
}

export interface ProcessedRow {
  id: string;
  data: RowData;
  status: 'pending' | 'processing' | 'success' | 'failure';
  statusCode?: number;
  response?: string;
  error?: string;
  requestBody?: any;
}

export interface ApiResponse {
  status: number;
  data?: string;
  message?: string;
}

export interface ApiConfig {
  loginUrl: string;
  dataEndpoint: string;
  authToken?: string;
}
