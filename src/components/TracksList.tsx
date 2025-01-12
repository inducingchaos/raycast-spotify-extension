import { List } from "@raycast/api";
import { SimplifiedPlaylistObject, SimplifiedTrackObject } from "../helpers/spotify.api";
import { useAlbumTracks } from "../hooks/useAlbumTracks";
import { usePlaylistTracks } from "../hooks/usePlaylistTracks";
import TrackListItem from "./TrackListItem";
import { useState } from "react";
import { MinimalTrack } from "../api/getMySavedTracks";

const TRACKS_PER_PAGE = 50;

type MinimalAlbum = {
  id: string;
  name: string;
  images: { url: string }[];
};

type TracksListProps = {
  album?: MinimalAlbum;
  playlist?: SimplifiedPlaylistObject;
  tracks?: MinimalTrack[];
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

  // Transform album/playlist tracks to MinimalTrack format
  const transformTrack = (track: SimplifiedTrackObject): MinimalTrack => ({
    id: track.id ?? "",
    name: track.name ?? "",
    artists: track.artists?.map((artist) => ({ name: artist.name ?? "" })) ?? [],
    album: {
      id: track.album?.id ?? "",
      name: track.album?.name ?? "",
      images: track.album?.images?.map((image) => ({ url: image.url ?? "" })) ?? [],
    },
    uri: track.uri ?? "",
    duration_ms: track.duration_ms ?? 0,
  });

  const allTracks =
    tracks ||
    (albumTracksData?.items ? albumTracksData.items.map(transformTrack) : undefined) ||
    (playlistTracksData?.items ? playlistTracksData.items.map(transformTrack) : undefined);
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
      {currentTracks.map((track) => (
        <TrackListItem key={`${track.id}`} track={track} showGoToAlbum={showGoToAlbum} />
      ))}
    </List>
  );
}
