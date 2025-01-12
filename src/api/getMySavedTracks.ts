import { getSpotifyClient } from "../helpers/withSpotifyClient";
import { getErrorMessage } from "../helpers/getError";

interface MinimalTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  uri: string;
}

interface GetMySavedTracksProps {
  limit?: number;
  offset?: number;
  fetchAll?: boolean;
  onProgress?: (progress: number) => void;
}

const MAX_TRACKS_PER_REQUEST = 50;
const RATE_LIMIT_DELAY = 100; // 100ms delay between requests

export async function getMySavedTracks({
  limit = MAX_TRACKS_PER_REQUEST,
  offset = 0,
  fetchAll = false,
  onProgress,
}: GetMySavedTracksProps) {
  const { spotifyClient } = getSpotifyClient();

  try {
    const firstBatch = await spotifyClient.getMeTracks({ limit: MAX_TRACKS_PER_REQUEST, offset });
    const total = firstBatch?.total ?? 0;

    // Transform tracks to minimal format
    const transformTrack = (item: any): MinimalTrack => ({
      id: item.track.id,
      name: item.track.name,
      artists: item.track.artists.map((artist: any) => ({ name: artist.name })),
      album: {
        name: item.track.album.name,
        images: item.track.album.images.map((image: any) => ({ url: image.url })),
      },
      uri: item.track.uri,
    });

    let tracks = (firstBatch?.items ?? []).map(transformTrack);

    if (fetchAll) {
      console.log(`Fetching all tracks (total: ${total})`);

      while (tracks.length < total) {
        await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_DELAY));

        const nextTracks = await spotifyClient.getMeTracks({
          limit: MAX_TRACKS_PER_REQUEST,
          offset: tracks.length,
        });

        tracks = [...tracks, ...(nextTracks?.items ?? []).map(transformTrack)];

        const progress = Math.round((tracks.length / total) * 100);
        console.log(`Fetched ${tracks.length}/${total} tracks (${progress}%)`);
        onProgress?.(progress);

        if (!nextTracks?.items?.length) break;
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
