import { useState, useEffect } from 'react';

// Example custom hook
export function useExampleHook<T>(initialValue: T) {
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    // Some effect
  }, [value]);
  return [value, setValue];
} 