import { useCachedPromise } from "@raycast/utils";
import { getMySavedTracks } from "../api/getMySavedTracks";
import { useCallback, useEffect, useState } from "react";
import { LocalStorage, showToast, Toast } from "@raycast/api";

const CACHE_NAMESPACE = "spotify-library";
const LIBRARY_CACHE_KEY = `${CACHE_NAMESPACE}-saved`;

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
  fetchAll = true, // Default to true since we want to cache all items for search
  options,
}: UseMySavedTracksProps = {}) {
  const [fetchProgress, setFetchProgress] = useState<number>(0);
  const [showProgress, setShowProgress] = useState(false);

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchLibrary = useCallback(
    async (limit?: number, offset?: number, fetchAll?: boolean) => {
      try {
        // Try to get from cache first
        const cached = await LocalStorage.getItem<string>(LIBRARY_CACHE_KEY);
        if (cached) {
          const parsedCache = JSON.parse(cached);
          // Only use cache if we have all items and total matches
          if (parsedCache.items.length === parsedCache.total) {
            console.log("Using cached library:", parsedCache.items.length);
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
          await LocalStorage.setItem(LIBRARY_CACHE_KEY, JSON.stringify(result));
          console.log("Cached library:", result.items.length);

          // Set progress to 100% when we have all items
          setFetchProgress(100);
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
            title: "Failed to load library",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
        throw error;
      }
    },
    [], // No dependencies needed since setFetchProgress is stable
  );

  const { data, error, isLoading } = useCachedPromise(fetchLibrary, [limit, offset, fetchAll], {
    execute: options?.execute !== false,
    keepPreviousData: true, // Always keep previous data to avoid flickering
  });

  // Handle loading states and completion
  useEffect(() => {
    if (isLoading) {
      setFetchProgress(0);
      setShowProgress(true);
    } else if (!isLoading && data) {
      // Show completion toast when loading finishes and we have data
      showToast({
        style: Toast.Style.Success,
        title: "Library loaded successfully",
        message: `${data.total || 0} items available`,
      });
      const timer = setTimeout(() => setShowProgress(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, data]);

  // Show loading toast with progress
  useEffect(() => {
    if (showProgress && fetchProgress > 0) {
      showToast({
        style: Toast.Style.Animated,
        title: "Loading your library...",
        message: `${fetchProgress}% complete`,
      });
    }
  }, [showProgress, fetchProgress]);

  return {
    savedTracksData: data,
    savedTracksError: error,
    savedTracksIsLoading: isLoading && showProgress,
    fetchProgress: isLoading ? fetchProgress : 100,
  };
}
