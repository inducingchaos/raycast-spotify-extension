import { List } from "@raycast/api";
import { SimplifiedTrackObject } from "../helpers/spotify.api";
import TrackListItem from "./TrackListItem";

type TracksSectionProps = {
  tracks: SimplifiedTrackObject[] | undefined;
  limit?: number;
  title?: string;
  queueTracks?: boolean;
};

export function TracksSection({ tracks, limit, title = "Songs", queueTracks }: TracksSectionProps) {
  if (!tracks) return null;

  // If limit is specified, only show that many tracks
  const limitedTracks = limit ? tracks.slice(0, limit) : tracks;

  return (
    <List.Section title={`${title} (${limitedTracks.length} tracks)`}>
      {limitedTracks.map((track, index) => {
        return (
          <TrackListItem
            key={`${track.id}-${index}`}
            track={track}
            album={track.album}
            showAddToSaved
            showGoToAlbum
            tracksToQueue={queueTracks ? tracks.filter((t) => t.id !== track.id) : undefined}
          />
        );
      })}
    </List.Section>
  );
}
