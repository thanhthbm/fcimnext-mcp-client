export class LlmError extends Error {
  public readonly provider: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(params: {
    message: string;
    provider: string;
    statusCode?: number;
    details?: unknown;
  }) {
    super(params.message);

    this.name = "LlmError";
    this.provider = params.provider;
    this.statusCode = params.statusCode ?? 502;
    this.details = params.details;
  }
}
