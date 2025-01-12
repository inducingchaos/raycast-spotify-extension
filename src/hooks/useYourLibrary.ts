import { useCachedPromise } from "@raycast/utils";
import { getUserPlaylists } from "../api/getUserPlaylists";
import { getMySavedAlbums } from "../api/getMySavedAlbums";
import { getFollowedArtists } from "../api/getFollowedArtists";
import { getMySavedShows } from "../api/getMySavedShows";
import { getMySavedEpisodes } from "../api/getMySavedEpisodes";
import { useMySavedTracks } from "./useMySavedTracks";

type UseMyLibraryProps = {
  execute?: boolean;
  keepPreviousData?: boolean;
};

export function useYourLibrary(options: UseMyLibraryProps = {}) {
  const { savedTracksData: tracksData, savedTracksIsLoading: tracksLoading } = useMySavedTracks({
    options: {
      execute: options.execute !== false,
      keepPreviousData: options.keepPreviousData,
    },
  });

  const {
    data = [],
    error,
    isLoading,
  } = useCachedPromise(
    () =>
      Promise.all([
        getUserPlaylists(),
        getMySavedAlbums(),
        getFollowedArtists(),
        getMySavedShows(),
        getMySavedEpisodes(),
      ]),
    [],
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
  };
}
