import { List } from "@raycast/api";
import { SimplifiedAlbumObject, SimplifiedPlaylistObject, SimplifiedTrackObject } from "../helpers/spotify.api";
import { useAlbumTracks } from "../hooks/useAlbumTracks";
import { usePlaylistTracks } from "../hooks/usePlaylistTracks";
import TrackListItem from "./TrackListItem";
import { useState } from "react";

const TRACKS_PER_PAGE = 50;

type TracksListProps = {
  album?: SimplifiedAlbumObject;
  playlist?: SimplifiedPlaylistObject;
  tracks?: SimplifiedTrackObject[];
  showGoToAlbum?: boolean;
};

export function TracksList({ album, playlist, tracks, showGoToAlbum }: TracksListProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const { albumTracksData, albumTracksIsLoading } = useAlbumTracks({
    albumId: album?.id,
    options: {
      execute: Boolean(album),
    },
  });

  const { playlistTracksData, playlistTracksIsLoading } = usePlaylistTracks({
    playlistId: playlist?.id,
    options: {
      execute: Boolean(playlist),
    },
  });

  const allTracks = albumTracksData?.items || playlistTracksData?.items || tracks;
  const isLoading = albumTracksIsLoading || playlistTracksIsLoading;

  if (!allTracks) {
    return (
      <List searchBarPlaceholder="Search songs" isLoading={isLoading}>
        <List.EmptyView title="No tracks found" />
      </List>
    );
  }

  const startIndex = currentPage * TRACKS_PER_PAGE;
  const endIndex = startIndex + TRACKS_PER_PAGE;
  const currentTracks = allTracks.slice(startIndex, endIndex);
  const hasMore = endIndex < allTracks.length;

  return (
    <List
      searchBarPlaceholder="Search songs"
      isLoading={isLoading}
      onSelectionChange={(id) => {
        // When user scrolls near the end, load more
        if (id && parseInt(id) >= endIndex - 10 && hasMore) {
          setCurrentPage(currentPage + 1);
        }
      }}
    >
      {currentTracks.map((track, index) => (
        <TrackListItem
          key={`${track.id}${startIndex + index}`}
          playingContext={album?.uri || playlist?.uri}
          track={track}
          album={album || track.album}
          showGoToAlbum={showGoToAlbum}
        />
      ))}
    </List>
  );
}
