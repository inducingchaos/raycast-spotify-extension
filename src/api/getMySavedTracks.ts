import { getErrorMessage } from "../helpers/getError";
import { SimplifiedTrackObject } from "../helpers/spotify.api";
import { getSpotifyClient } from "../helpers/withSpotifyClient";

type GetMySavedTracksProps = {
  limit?: number;
  offset?: number;
  fetchAll?: boolean;
};

type GetMySavedTracksResponse = {
  items: SimplifiedTrackObject[];
  total: number;
  hasMore: boolean;
};

const RATE_LIMIT_DELAY = 200; // 200ms delay between requests - adjusted for testing
const MAX_TRACKS_PER_REQUEST = 50;

export async function getMySavedTracks({
  limit = MAX_TRACKS_PER_REQUEST,
  offset = 0,
  fetchAll = false,
}: GetMySavedTracksProps = {}): Promise<GetMySavedTracksResponse> {
  const { spotifyClient } = getSpotifyClient();
  const allTracks: SimplifiedTrackObject[] = [];

  try {
    // Initial request to get total count and first batch
    const initialResponse = await spotifyClient.getMeTracks({
      limit: Math.min(limit, MAX_TRACKS_PER_REQUEST),
      offset,
    });

    const total = initialResponse?.total ?? 0;
    const tracks = (initialResponse?.items ?? []).map((item) => ({ ...item.track }));
    allTracks.push(...tracks);

    // If fetchAll is true, continue fetching until we have all tracks or hit the limit
    if (fetchAll && tracks.length === MAX_TRACKS_PER_REQUEST) {
      let currentOffset = offset + tracks.length;

      while (currentOffset < total && (limit ? currentOffset < limit : true)) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));

        const response = await spotifyClient.getMeTracks({
          limit: MAX_TRACKS_PER_REQUEST,
          offset: currentOffset,
        });

        const nextTracks = (response?.items ?? []).map((item) => ({ ...item.track }));
        allTracks.push(...nextTracks);

        if (nextTracks.length < MAX_TRACKS_PER_REQUEST) break;
        currentOffset += nextTracks.length;
      }
    }

    return {
      items: allTracks as SimplifiedTrackObject[],
      total,
      hasMore: total > offset + allTracks.length,
    };
  } catch (err) {
    const error = getErrorMessage(err);
    console.log("getMySavedTracks.ts Error:", error);
    throw new Error(error);
  }
}
