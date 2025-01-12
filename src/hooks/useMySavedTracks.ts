import { useCachedPromise } from "@raycast/utils";
import { getMySavedTracks } from "../api/getMySavedTracks";

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
  const { data, error, isLoading, revalidate } = useCachedPromise(
    (limit?: number, offset?: number, fetchAll?: boolean) => getMySavedTracks({ limit, offset, fetchAll }),
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
  };
}
