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
      console.log(`Fetching all tracks in batches (total: ${total})`);

      // Calculate number of additional requests needed
      const remainingTracks = total - tracks.length;
      const totalRequests = Math.ceil(remainingTracks / MAX_TRACKS_PER_REQUEST);

      // Create array of all offsets
      const allOffsets = Array.from({ length: totalRequests }, (_, i) => (i + 1) * MAX_TRACKS_PER_REQUEST);

      // Split offsets into batches
      const offsetBatches = [];
      for (let i = 0; i < allOffsets.length; i += BATCH_SIZE) {
        offsetBatches.push(allOffsets.slice(i, i + BATCH_SIZE));
      }

      // Process each batch sequentially, but requests within batch run in parallel
      for (const [batchIndex, batchOffsets] of offsetBatches.entries()) {
        console.log(`Processing batch ${batchIndex + 1}/${offsetBatches.length}`);

        const batchPromises = batchOffsets.map((batchOffset, index) => {
          return new Promise<MinimalTrack[]>((resolve) => {
            (async () => {
              // Stagger requests within batch
              await new Promise((r) => setTimeout(r, index * RATE_LIMIT_DELAY));

              const response = await spotifyClient.getMeTracks({
                limit: MAX_TRACKS_PER_REQUEST,
                offset: batchOffset,
              });

              const batchTracks = (response?.items ?? []).map(transformTrack);
              resolve(batchTracks);
            })();
          });
        });

        // Wait for current batch to complete
        const batchResults = await Promise.all(batchPromises);
        const newTracks = batchResults.flat();
        tracks = [...tracks, ...newTracks];

        // Update progress after each batch
        const progress = Math.round((tracks.length / total) * 100);
        console.log(`Completed batch ${batchIndex + 1}/${offsetBatches.length} (${progress}%)`);
        onProgress?.(progress);

        // Add delay between batches if not the last batch
        if (batchIndex < offsetBatches.length - 1) {
          await new Promise((r) => setTimeout(r, BATCH_SIZE * RATE_LIMIT_DELAY));
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
