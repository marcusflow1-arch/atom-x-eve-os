import React from 'react';
import { toast } from 'react-hot-toast';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { mapError, logError } from './ErrorMapper';

/**
 * Standardized toast notifications with error mapping
 */

const TOAST_CONFIG = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: 'rgba(15, 23, 42, 0.95)',
    color: '#fff',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '12px',
    padding: '16px',
  },
};

/**
 * Show error toast with mapped message
 */
export function showError(error, context = '') {
  const mapped = mapError(error);
  logError(error, context);

  toast.error(
    (t) => (
      <div className="flex items-start gap-3">
        <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-white mb-1">{mapped.userMessage}</p>
          {mapped.canRetry && (
            <p className="text-xs text-slate-400">You can try again.</p>
          )}
        </div>
      </div>
    ),
    {
      ...TOAST_CONFIG,
      style: {
        ...TOAST_CONFIG.style,
        border: '1px solid rgba(239, 68, 68, 0.3)',
      },
    }
  );

  return mapped;
}

/**
 * Show success toast
 */
export function showSuccess(message) {
  toast.success(
    (t) => (
      <div className="flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-white">{message}</p>
        </div>
      </div>
    ),
    {
      ...TOAST_CONFIG,
      style: {
        ...TOAST_CONFIG.style,
        border: '1px solid rgba(34, 197, 94, 0.3)',
      },
    }
  );
}

/**
 * Show info toast
 */
export function showInfo(message) {
  toast(
    (t) => (
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-white">{message}</p>
        </div>
      </div>
    ),
    {
      ...TOAST_CONFIG,
      style: {
        ...TOAST_CONFIG.style,
        border: '1px solid rgba(59, 130, 246, 0.3)',
      },
    }
  );
}

/**
 * Show warning toast
 */
export function showWarning(message) {
  toast(
    (t) => (
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-white">{message}</p>
        </div>
      </div>
    ),
    {
      ...TOAST_CONFIG,
      style: {
        ...TOAST_CONFIG.style,
        border: '1px solid rgba(234, 179, 8, 0.3)',
      },
    }
  );
}

/**
 * Show loading toast that can be dismissed programmatically
 */
export function showLoading(message = 'Loading...') {
  return toast.loading(
    (t) => (
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-white">{message}</p>
        </div>
      </div>
    ),
    TOAST_CONFIG
  );
}

/**
 * Dismiss a specific toast
 */
export function dismissToast(toastId) {
  toast.dismiss(toastId);
}