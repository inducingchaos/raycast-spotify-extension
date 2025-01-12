import { useCachedPromise } from "@raycast/utils";
import { getMySavedTracks } from "../api/getMySavedTracks";
import { useState } from "react";

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

  const { data, error, isLoading, revalidate } = useCachedPromise(
    async (limit?: number, offset?: number, fetchAll?: boolean) => {
      const result = await getMySavedTracks({
        limit,
        offset,
        fetchAll,
        onProgress: (progress) => setFetchProgress(progress),
      });
      return result;
    },
    [limit, offset, fetchAll],
    {
      execute: options?.execute !== false,
      keepPreviousData: options?.keepPreviousData,
    },
  );

  return {
    savedTracksData: data,
    savedTracksError: error,
    savedTracksIsLoading: isLoading,
    savedTracksRevalidate: revalidate,
    fetchProgress: isLoading ? fetchProgress : 100,
  };
}
