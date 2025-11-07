import { ErrorCode, getErrorMessage, parseErrorCode } from '@/lib/types/errors';

interface ErrorMessageProps {
  error: string | null;
  code?: ErrorCode;
  onDismiss?: () => void;
}

export default function ErrorMessage({ error, code, onDismiss }: ErrorMessageProps) {
  if (!error) return null;

  // Determine the error code if not provided
  const errorCode = code || parseErrorCode(error);
  
  // Get the appropriate error message
  const displayMessage = code ? getErrorMessage(code) : error;

  // Determine icon and styling based on error type
  const getErrorStyle = (errorCode: ErrorCode) => {
    switch (errorCode) {
      case ErrorCode.NO_RELEVANT_DATA:
        return {
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      case ErrorCode.RATE_LIMIT_ERROR:
      case ErrorCode.TIMEOUT_ERROR:
        return {
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800',
          iconColor: 'text-orange-600',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
      default:
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        };
    }
  };

  const style = getErrorStyle(errorCode);

  return (
    <div className={`px-4 py-3 border-t ${style.borderColor} ${style.bgColor}`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${style.iconColor}`}>
          {style.icon}
        </div>
        <div className="flex-1">
          <p className={`text-sm font-medium ${style.textColor}`}>
            {displayMessage}
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`flex-shrink-0 ${style.iconColor} hover:opacity-70 transition-opacity`}
            aria-label="エラーを閉じる"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
