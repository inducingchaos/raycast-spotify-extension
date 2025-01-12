import { getSpotifyClient } from "../helpers/withSpotifyClient";
import { getErrorMessage } from "../helpers/getError";
import { SavedTrackObject } from "../helpers/spotify.api";

export interface MinimalTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    id: string;
    name: string;
    images: { url: string }[];
  };
  uri: string;
  duration_ms: number;
}

interface GetMySavedTracksProps {
  limit?: number;
  offset?: number;
  fetchAll?: boolean;
  onProgress?: (progress: number) => void;
}

const MAX_TRACKS_PER_REQUEST = 50;
const RATE_LIMIT_DELAY = 100; // 100ms delay between requests - safer to avoid rate limits
const BATCH_SIZE = 5; // Number of parallel requests per batch

// Helper function to split array into chunks
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export async function getMySavedTracks({ offset = 0, fetchAll = false, onProgress }: GetMySavedTracksProps) {
  const { spotifyClient } = getSpotifyClient();

  try {
    // Get initial batch and total
    const firstBatch = await spotifyClient.getMeTracks({ limit: MAX_TRACKS_PER_REQUEST, offset });
    const total = firstBatch?.total ?? 0;

    // Transform tracks to minimal format
    const transformTrack = (item: SavedTrackObject): MinimalTrack => ({
      id: item.track?.id ?? "",
      name: item.track?.name ?? "",
      artists: item.track?.artists?.map((artist) => ({ name: artist.name ?? "" })) ?? [],
      album: {
        id: item.track?.album?.id ?? "",
        name: item.track?.album?.name ?? "",
        images: item.track?.album?.images?.map((image) => ({ url: image.url ?? "" })) ?? [],
      },
      uri: item.track?.uri ?? "",
      duration_ms: item.track?.duration_ms ?? 0,
    });

    let tracks = (firstBatch?.items ?? []).map(transformTrack);

    if (fetchAll && total > MAX_TRACKS_PER_REQUEST) {
      // Calculate number of additional requests needed
      const remainingTracks = total - tracks.length;
      const totalRequests = Math.ceil(remainingTracks / MAX_TRACKS_PER_REQUEST);

      // Create array of all offsets
      const allOffsets = Array.from({ length: totalRequests }, (_, i) => (i + 1) * MAX_TRACKS_PER_REQUEST);

      // Split offsets into batches for parallel processing
      const offsetBatches = chunk(allOffsets, BATCH_SIZE);

      // Process each batch in sequence
      for (const [batchIndex, offsetBatch] of offsetBatches.entries()) {
        // Process each offset in the batch in parallel
        const batchResults = await Promise.all(
          offsetBatch.map((offset) =>
            spotifyClient.getMeTracks({ limit: MAX_TRACKS_PER_REQUEST, offset }).then((response) => {
              const items = response?.items ?? [];
              return items.map(transformTrack);
            }),
          ),
        );

        // Add batch results to tracks array
        tracks = [...tracks, ...batchResults.flat()];

        // Calculate and report progress
        const progress = Math.round(((batchIndex + 1) / offsetBatches.length) * 100);
        onProgress?.(progress);

        // Add delay between batches to avoid rate limits
        if (batchIndex < offsetBatches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));
        }
      }
    }

    return {
      items: tracks,
      total,
      hasMore: tracks.length < total,
    };
  } catch (err) {
    const error = getErrorMessage(err);
    console.log("getMySavedTracks.ts Error:", error);
    throw new Error(error);
  }
}
