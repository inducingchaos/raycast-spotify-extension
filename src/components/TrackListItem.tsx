import { Image, List } from "@raycast/api";
import { MinimalTrack } from "../api/getMySavedTracks";
import { TrackActionPanel } from "./TrackActionPanel";

interface TrackListItemProps {
  track: MinimalTrack;
  startIndex?: number;
  showGoToAlbum?: boolean;
}

export default function TrackListItem({ track, startIndex = 0, showGoToAlbum }: TrackListItemProps) {
  const subtitle = `${track.artists.map((a) => a.name).join(", ")} • ${track.album.name}`;
  const icon: Image.ImageLike | undefined = track.album.images[0]?.url
    ? {
        source: track.album.images[0].url,
      }
    : undefined;

  return (
    <List.Item
      title={track.name}
      subtitle={subtitle}
      icon={icon}
      accessories={[{ text: `#${startIndex + 1}` }]}
      actions={<TrackActionPanel title={track.name} track={track} album={track.album} showGoToAlbum={showGoToAlbum} />}
    />
  );
}
