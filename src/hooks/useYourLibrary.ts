import { useCachedPromise } from "@raycast/utils";
import { getUserPlaylists } from "../api/getUserPlaylists";
import { getMySavedAlbums } from "../api/getMySavedAlbums";
import { getFollowedArtists } from "../api/getFollowedArtists";
import { getMySavedShows } from "../api/getMySavedShows";
import { getMySavedEpisodes } from "../api/getMySavedEpisodes";
import { useMySavedTracks } from "./useMySavedTracks";
import { useCallback } from "react";

type UseMyLibraryProps = {
  execute?: boolean;
  keepPreviousData?: boolean;
};

export function useYourLibrary(options: UseMyLibraryProps = {}) {
  const {
    savedTracksData: tracksData,
    savedTracksIsLoading: tracksLoading,
    fetchProgress: tracksFetchProgress,
  } = useMySavedTracks({
    fetchAll: true,
    options: {
      execute: options.execute !== false,
      keepPreviousData: options.keepPreviousData,
    },
  });

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchLibraryData = useCallback(
    async () => {
      const [playlists, albums, artists, shows, episodes] = await Promise.all([
        getUserPlaylists(),
        getMySavedAlbums(),
        getFollowedArtists(),
        getMySavedShows(),
        getMySavedEpisodes(),
      ]);
      return [playlists, albums, artists, shows, episodes];
    },
    [], // No dependencies needed since all fetch functions are stable
  );

  const {
    data = [],
    error,
    isLoading,
  } = useCachedPromise(
    fetchLibraryData,
    [], // No dependencies needed since fetchLibraryData is memoized
    {
      keepPreviousData: options.keepPreviousData,
    },
  );

  const [playlistsData, albumsData, artistsData, showsData, episodesData] = data;

  return {
    myLibraryData: {
      playlists: playlistsData,
      albums: albumsData,
      artists: artistsData,
      tracks: tracksData,
      shows: showsData,
      episodes: episodesData,
    },
    myLibraryError: error,
    myLibraryIsLoading: isLoading || tracksLoading,
    tracksFetchProgress,
  };
}
