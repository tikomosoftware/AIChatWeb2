// Error codes enum
export enum ErrorCode {
  VECTOR_DB_ERROR = "VECTOR_DB_ERROR",
  EMBEDDING_ERROR = "EMBEDDING_ERROR",
  LLM_ERROR = "LLM_ERROR",
  RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR",
  TIMEOUT_ERROR = "TIMEOUT_ERROR",
  NO_RELEVANT_DATA = "NO_RELEVANT_DATA",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

// Error messages in Japanese
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.VECTOR_DB_ERROR]: "データベースへの接続に失敗しました。",
  [ErrorCode.EMBEDDING_ERROR]: "質問の処理中にエラーが発生しました。",
  [ErrorCode.LLM_ERROR]: "回答の生成中にエラーが発生しました。",
  [ErrorCode.RATE_LIMIT_ERROR]: "現在、リクエストが集中しています。しばらく待ってから再度お試しください。",
  [ErrorCode.TIMEOUT_ERROR]: "処理がタイムアウトしました。もう一度お試しください。",
  [ErrorCode.NO_RELEVANT_DATA]: "申し訳ございません。ご質問に関連する情報がデータベースに見つかりませんでした。",
  [ErrorCode.VALIDATION_ERROR]: "入力内容が正しくありません。",
  [ErrorCode.UNKNOWN_ERROR]: "予期しないエラーが発生しました。",
};

// Error response interface
export interface ErrorResponse {
  error: string;
  code?: ErrorCode;
  message?: string;
}

// Helper function to get error message
export function getErrorMessage(code: ErrorCode | string): string {
  if (Object.values(ErrorCode).includes(code as ErrorCode)) {
    return ERROR_MESSAGES[code as ErrorCode];
  }
  return ERROR_MESSAGES[ErrorCode.UNKNOWN_ERROR];
}

// Helper function to parse error code from message
export function parseErrorCode(errorMessage: string): ErrorCode {
  // Check if the error message contains a known error code
  for (const [code, message] of Object.entries(ERROR_MESSAGES)) {
    if (errorMessage.includes(message)) {
      return code as ErrorCode;
    }
  }
  return ErrorCode.UNKNOWN_ERROR;
}
