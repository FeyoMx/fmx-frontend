import { useEffect, useMemo, useState } from "react";

type UseIncrementalListOptions = {
  initialCount: number;
  step: number;
};

function useIncrementalList<T>(items: T[], options: UseIncrementalListOptions) {
  const { initialCount, step } = options;
  const [visibleCount, setVisibleCount] = useState(initialCount);

  useEffect(() => {
    setVisibleCount(initialCount);
  }, [items, initialCount]);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = visibleCount < items.length;

  const showMore = () => {
    setVisibleCount((current) => Math.min(items.length, current + step));
  };

  return {
    visibleItems,
    visibleCount,
    totalCount: items.length,
    hasMore,
    showMore,
  };
}

export { useIncrementalList };
