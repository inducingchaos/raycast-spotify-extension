import { Action, ActionPanel } from "@raycast/api";
import { MinimalTrack } from "../api/getMySavedTracks";

interface TrackActionPanelProps {
  title: string;
  track: MinimalTrack;
  album: MinimalTrack["album"];
  showGoToAlbum?: boolean;
}

export function TrackActionPanel({ title, track, album, showGoToAlbum }: TrackActionPanelProps) {
  return (
    <ActionPanel title={title}>
      <ActionPanel.Section>
        <Action.OpenInBrowser
          title="Open in Spotify"
          url={`spotify:track:${track.id}`}
          shortcut={{ modifiers: ["cmd"], key: "o" }}
        />
        {showGoToAlbum && (
          <Action.OpenInBrowser
            title="Go to Album"
            url={`spotify:album:${album.id}`}
            shortcut={{ modifiers: ["cmd", "shift"], key: "a" }}
          />
        )}
      </ActionPanel.Section>
    </ActionPanel>
  );
}
