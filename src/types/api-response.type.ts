export type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T | null;
  errors?: unknown;
  timestamp: string;
};
