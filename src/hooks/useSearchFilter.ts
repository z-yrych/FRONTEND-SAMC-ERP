import { useState, useMemo } from 'react';

export function useSearchFilter<T>(
  items: T[],
  searchFields: (keyof T)[],
  additionalFilters?: (item: T) => boolean
) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    let results = items;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          return value?.toString().toLowerCase().includes(query);
        })
      );
    }

    // Apply additional filters if provided
    if (additionalFilters) {
      results = results.filter(additionalFilters);
    }

    return results;
  }, [items, searchQuery, searchFields, additionalFilters]);

  return {
    searchQuery,
    setSearchQuery,
    filteredItems,
  };
}
