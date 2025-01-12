import { useCachedPromise } from "@raycast/utils";
import { getMySavedTracks } from "../api/getMySavedTracks";
import { useCallback, useEffect, useState } from "react";
import { LocalStorage, showToast, Toast } from "@raycast/api";

const CACHE_NAMESPACE = "spotify-library";
const TRACKS_CACHE_KEY = `${CACHE_NAMESPACE}-tracks`;

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
  const [showProgress, setShowProgress] = useState(false);

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchTracks = useCallback(
    async (limit?: number, offset?: number, fetchAll?: boolean) => {
      try {
        // Try to get from cache first
        const cached = await LocalStorage.getItem<string>(TRACKS_CACHE_KEY);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          // Only use cache if we have all tracks and total matches
          if (parsedCache.items.length === parsedCache.total) {
            console.log("Using cached tracks:", parsedCache.items.length);
            return parsedCache;
          }
        }

        const result = await getMySavedTracks({
          limit,
          offset,
          fetchAll,
          onProgress: (progress) => {
            setFetchProgress(progress);
            setShowProgress(true);
          },
        });

        // Only cache complete results
        if (result.items.length === result.total) {
          await LocalStorage.setItem(TRACKS_CACHE_KEY, JSON.stringify(result));
          console.log("Cached tracks:", result.items.length);
        }

        return result;
      } catch (error) {
        if (error instanceof Error && error.message.includes("429")) {
          showToast({
            style: Toast.Style.Failure,
            title: "Rate limit exceeded",
            message: "Please wait a moment before trying again",
          });
        } else {
          showToast({
            style: Toast.Style.Failure,
            title: "Failed to fetch tracks",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
        throw error;
      }
    },
    [], // No dependencies needed since setFetchProgress is stable
  );

  const { data, error, isLoading } = useCachedPromise(fetchTracks, [limit, offset, fetchAll], {
    execute: options?.execute !== false,
    keepPreviousData: true, // Always keep previous data to avoid flickering
  });

  // Reset progress when loading starts
  useEffect(() => {
    if (isLoading) {
      setFetchProgress(0);
      setShowProgress(true);
    } else if (fetchProgress === 100) {
      // Show completion toast then hide progress after a delay
      showToast({
        style: Toast.Style.Success,
        title: "Library loaded successfully",
        message: `${data?.total || 0} tracks available`,
      });
      const timer = setTimeout(() => setShowProgress(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, fetchProgress, data?.total]);

  // Show loading toast with progress
  useEffect(() => {
    if (isLoading && showProgress && fetchProgress > 0 && fetchProgress < 100) {
      showToast({
        style: Toast.Style.Animated,
        title: `Loading your library...`,
        message: `${fetchProgress}% complete`,
      });
    }
  }, [isLoading, showProgress, fetchProgress]);

  return {
    savedTracksData: data,
    savedTracksError: error,
    savedTracksIsLoading: isLoading && showProgress,
    fetchProgress: isLoading ? fetchProgress : 100,
  };
}
