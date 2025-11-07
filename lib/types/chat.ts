export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface ChatRequest {
  message: string;
}

import { ErrorCode } from './errors';

export interface ChatResponse {
  response: string;
  sources?: string[];
  error?: string;
  errorCode?: ErrorCode;
}
