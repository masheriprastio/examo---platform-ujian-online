/**
 * Utility untuk debounce function calls
 * Berguna untuk menghindari multiple rapid calls (e.g., save pada setiap keystroke)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Hook untuk debounced state updates
 * Mengatasi issue: form changes terlalu cepat menyebabkan data loss
 */
export function useDebouncedCallback<T extends (...args: any[]) => void>(
  callback: T,
  wait: number = 500
): (...args: Parameters<T>) => void {
  const debouncedFn = debounce(callback, wait);
  return debouncedFn;
}
