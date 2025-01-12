import { ComponentProps, useState } from "react";
import { Grid, List } from "@raycast/api";
import { View } from "./components/View";
import { useYourLibrary } from "./hooks/useYourLibrary";
import { ArtistsSection } from "./components/ArtistsSection";
import { AlbumsSection } from "./components/AlbumsSection";
import { TracksSection } from "./components/TracksSection";
import { PlaylistsSection } from "./components/PlaylistsSection";
import { ShowsSection } from "./components/ShowsSection";
import { EpisodesSection } from "./components/EpisodesSection";
import { getPreferenceValues } from "@raycast/api";

const filters = {
  all: "All",
  playlists: "Playlists",
  albums: "Albums",
  artists: "Artists",
  tracks: "Songs",
  shows: "Podcasts & Shows",
  episodes: "Episodes",
} as const;

type FilterValue = keyof typeof filters;

function YourLibraryCommand() {
  const [searchText, setSearchText] = useState("");
  const [searchFilter, setSearchFilter] = useState<FilterValue>(getPreferenceValues()["Default-View"] ?? "all");
  const { myLibraryData, myLibraryIsLoading, tracksFetchProgress } = useYourLibrary({
    keepPreviousData: true,
  });

  const sharedProps: ComponentProps<typeof List> = {
    searchBarPlaceholder: "Search your library",
    isLoading: myLibraryIsLoading,
    searchText,
    onSearchTextChange: setSearchText,
    filtering: true,
  };

  const showList =
    searchFilter === "all" || searchFilter === "playlists" || searchFilter === "tracks" || searchFilter === "episodes";

  if (showList) {
    return (
      <List
        {...sharedProps}
        searchBarAccessory={
          <List.Dropdown
            tooltip="Filter search"
            value={searchFilter}
            onChange={(newValue) => setSearchFilter(newValue as FilterValue)}
          >
            {Object.entries(filters).map(([value, label]) => (
              <List.Dropdown.Item key={value} title={label} value={value} />
            ))}
          </List.Dropdown>
        }
      >
        {myLibraryIsLoading && tracksFetchProgress < 100 && (
          <List.EmptyView title={`Loading your library... ${tracksFetchProgress}%`} />
        )}
        {!myLibraryIsLoading && (
          <>
            {searchFilter === "all" && (
              <>
                <PlaylistsSection
                  type="list"
                  limit={searchText ? undefined : 6}
                  playlists={myLibraryData?.playlists?.items}
                />
                <AlbumsSection type="list" limit={searchText ? undefined : 6} albums={myLibraryData?.albums?.items} />
                <ArtistsSection
                  type="list"
                  limit={searchText ? undefined : 6}
                  artists={myLibraryData?.artists?.items}
                />
                <TracksSection
                  limit={searchText ? undefined : 6}
                  tracks={myLibraryData?.tracks?.items}
                  title="Liked Songs"
                />
                <ShowsSection type="list" limit={searchText ? undefined : 6} shows={myLibraryData?.shows?.items} />
                <EpisodesSection
                  limit={searchText ? undefined : 6}
                  episodes={myLibraryData?.episodes?.items}
                  title="Saved Episodes"
                />
              </>
            )}

            {searchFilter === "tracks" && <TracksSection tracks={myLibraryData?.tracks?.items} title="Liked Songs" />}
            {searchFilter === "episodes" && (
              <EpisodesSection episodes={myLibraryData?.episodes?.items} title="Saved Episodes" />
            )}

            {searchFilter === "playlists" && (
              <PlaylistsSection type="list" playlists={myLibraryData?.playlists?.items} />
            )}
          </>
        )}
      </List>
    );
  }

  return (
    <Grid
      {...sharedProps}
      searchBarAccessory={
        <Grid.Dropdown
          tooltip="Filter search"
          value={searchFilter}
          onChange={(newValue) => setSearchFilter(newValue as FilterValue)}
        >
          {Object.entries(filters).map(([value, label]) => (
            <Grid.Dropdown.Item key={value} title={label} value={value} />
          ))}
        </Grid.Dropdown>
      }
    >
      {searchFilter === "artists" && <ArtistsSection type="grid" columns={5} artists={myLibraryData?.artists?.items} />}

      {searchFilter === "albums" && <AlbumsSection type="grid" columns={5} albums={myLibraryData?.albums?.items} />}

      {searchFilter === "shows" && <ShowsSection type="grid" columns={5} shows={myLibraryData?.shows?.items} />}
    </Grid>
  );
}

export default function Command() {
  return (
    <View>
      <YourLibraryCommand />
    </View>
  );
}
