import { useCachedPromise } from "@raycast/utils";
import { getMySavedTracks } from "../api/getMySavedTracks";
import { useCallback, useEffect, useState } from "react";
import { LocalStorage, showToast, Toast } from "@raycast/api";
import { MinimalTrack } from "../api/getMySavedTracks";

const CACHE_NAMESPACE = "spotify-library";
const LIBRARY_CACHE_KEY = `${CACHE_NAMESPACE}-saved`;
const ITEMS_PER_PAGE = 50;

type UseMySavedTracksProps = {
  fetchAll?: boolean;
  options?: {
    execute?: boolean;
    keepPreviousData?: boolean;
  };
};

export function useMySavedTracks({ fetchAll = false, options }: UseMySavedTracksProps = {}) {
  const [fetchProgress, setFetchProgress] = useState<number>(0);
  const [showProgress, setShowProgress] = useState(false);
  const [isBackgroundUpdate, setIsBackgroundUpdate] = useState(false);
  const [backgroundData, setBackgroundData] = useState<MinimalTrack[] | null>(null);

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchLibrary = useCallback(async () => {
    try {
      // Try to get from cache first
      const cached = await LocalStorage.getItem<string>(LIBRARY_CACHE_KEY);
      let cachedData;
      if (cached) {
        cachedData = JSON.parse(cached);
      }

      // Quick check for total count
      const quickCheck = await getMySavedTracks({ limit: 1, offset: 0, fetchAll: false });

      // If we have valid cache and totals match, use it
      if (cachedData && cachedData.items.length === quickCheck.total) {
        setFetchProgress(100);
        return cachedData.items;
      }

      // If we have cache but totals don't match, use cache and update in background
      if (cachedData) {
        setIsBackgroundUpdate(true);
        // Start background update
        getMySavedTracks({
          limit: ITEMS_PER_PAGE,
          offset: 0,
          fetchAll: true,
          onProgress: (progress) => {
            setFetchProgress(progress);
            setShowProgress(true);
          },
        }).then(async (result) => {
          await LocalStorage.setItem(LIBRARY_CACHE_KEY, JSON.stringify(result));
          setBackgroundData(result.items);
          setFetchProgress(100);

          // Show completion toast
          showToast({
            style: Toast.Style.Success,
            title: "Library updated",
            message: `${result.items.length} items available`,
          });

          // Clean up states after a short delay
          setTimeout(() => {
            setIsBackgroundUpdate(false);
            setShowProgress(false);
            setFetchProgress(0);
          }, 1500);
        });

        // Return stale cache immediately
        return cachedData.items;
      }

      // No cache or invalid cache, fetch fresh
      const result = await getMySavedTracks({
        limit: ITEMS_PER_PAGE,
        offset: 0,
        fetchAll: true,
        onProgress: (progress) => {
          setFetchProgress(progress);
          setShowProgress(true);
        },
      });

      // Cache complete results
      await LocalStorage.setItem(LIBRARY_CACHE_KEY, JSON.stringify(result));
      setFetchProgress(100);

      return result.items;
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
  }, [fetchAll]);

  const { data, error, isLoading, revalidate } = useCachedPromise(
    fetchLibrary,
    [], // No dependencies since we handle pagination internally
    {
      execute: options?.execute !== false,
      keepPreviousData: true, // Always keep previous data to avoid flickering
    },
  );

  // Update data when background fetch completes
  useEffect(() => {
    if (backgroundData) {
      revalidate();
      setBackgroundData(null);
    }
  }, [backgroundData, revalidate]);

  // Handle loading states and completion
  useEffect(() => {
    let toastTimer: NodeJS.Timeout;
    let cleanupTimer: NodeJS.Timeout;

    if (isLoading && !isBackgroundUpdate) {
      setFetchProgress(0);
      setShowProgress(true);
    } else if (!isLoading && data && !isBackgroundUpdate) {
      // Show completion toast when loading finishes and we have data
      toastTimer = setTimeout(() => {
        showToast({
          style: Toast.Style.Success,
          title: "Library loaded successfully",
          message: `${data.length || 0} items available`,
        });
      }, 100); // Small delay to ensure states are settled

      cleanupTimer = setTimeout(() => setShowProgress(false), 1500);
    }

    return () => {
      if (toastTimer) clearTimeout(toastTimer);
      if (cleanupTimer) clearTimeout(cleanupTimer);
    };
  }, [isLoading, data, isBackgroundUpdate]);

  // Show loading toast with progress
  useEffect(() => {
    if (showProgress && fetchProgress > 0 && isBackgroundUpdate) {
      showToast({
        style: Toast.Style.Animated,
        title: "Updating your library...",
        message: `${fetchProgress}% complete`,
      });
    } else if (showProgress && fetchProgress > 0) {
      showToast({
        style: Toast.Style.Animated,
        title: "Loading your library...",
        message: `${fetchProgress}% complete`,
      });
    }
  }, [showProgress, fetchProgress, isBackgroundUpdate]);

  return {
    savedTracksData: data ? { items: data, total: data.length } : undefined,
    savedTracksError: error,
    savedTracksIsLoading: isLoading && showProgress && !isBackgroundUpdate,
    fetchProgress: isLoading ? fetchProgress : 100,
    revalidate,
  };
}
