import { useCachedPromise } from "@raycast/utils";
import { getMySavedTracks } from "../api/getMySavedTracks";
import { useCallback, useEffect, useState } from "react";

type UseMySavedTracksProps = {
  limit?: number;
  offset?: number;
  fetchAll?: boolean;
  options?: {
    execute?: boolean;
    keepPreviousData?: boolean;
  };
};

export function useMySavedTracks({
  limit,
  offset,
  fetchAll = true, // Default to true since we want to cache all tracks for search
  options,
}: UseMySavedTracksProps = {}) {
  const [fetchProgress, setFetchProgress] = useState<number>(0);

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchTracks = useCallback(
    async (limit?: number, offset?: number, fetchAll?: boolean) => {
      const result = await getMySavedTracks({
        limit,
        offset,
        fetchAll,
        onProgress: (progress) => setFetchProgress(progress),
      });
      return result;
    },
    [], // No dependencies needed since setFetchProgress is stable
  );

  const { data, error, isLoading } = useCachedPromise(fetchTracks, [limit, offset, fetchAll], {
    execute: options?.execute !== false,
    keepPreviousData: options?.keepPreviousData,
  });

  // Reset progress when loading starts
  useEffect(() => {
    if (isLoading) {
      setFetchProgress(0);
    }
  }, [isLoading]);

  return {
    savedTracksData: data,
    savedTracksError: error,
    savedTracksIsLoading: isLoading,
    fetchProgress: isLoading ? fetchProgress : 100,
  };
}
