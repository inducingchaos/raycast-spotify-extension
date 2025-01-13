import { Image, ActionPanel, Action, Icon } from "@raycast/api";
import { useMe } from "../hooks/useMe";
import { ListOrGridItem } from "./ListOrGridItem";
import { FooterAction } from "./FooterAction";
import { PlayAction } from "./PlayAction";
import { TracksList } from "./TracksList";
import { MinimalTrack } from "../api/getMySavedTracks";
import { RefreshAction } from "./RefreshAction";

type PlaylistLikedTracksItemProps = {
  type: "grid" | "list";
  tracks?: {
    items: MinimalTrack[];
    total: number;
  };
  onRefresh?: () => void;
};

export default function PlaylistLikedTracksItem({ type, tracks, onRefresh }: PlaylistLikedTracksItemProps) {
  const { meData } = useMe();
  const title = "Liked Songs";
  const icon: Image.ImageLike = { source: "https://misc.scdn.co/liked-songs/liked-songs-64.png" };
  const uri = `spotify:user:${meData?.id}:collection`;

  return (
    <ListOrGridItem
      type={type}
      icon={icon}
      title={title}
      content={icon}
      accessories={[{ text: `${tracks?.total || 0} songs` }]}
      actions={
        <ActionPanel>
          {meData?.id && <PlayAction playingContext={uri} />}
          {meData?.id && (
            <Action.Push
              title="Show Songs"
              icon={{ source: Icon.AppWindowList }}
              shortcut={{ modifiers: ["cmd", "shift"], key: "a" }}
              target={<TracksList tracks={tracks?.items} />}
            />
          )}
          {onRefresh && <RefreshAction onRefresh={onRefresh} />}
          <FooterAction url={"https://open.spotify.com/collection/tracks"} uri={uri} title={title} />
        </ActionPanel>
      }
    />
  );
}
