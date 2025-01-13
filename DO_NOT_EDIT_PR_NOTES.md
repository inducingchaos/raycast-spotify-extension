# 'Your Library': Fetch ALL Liked Tracks - Needed For Proper Functionality

# Summary

## Problem

The 'Your Library' command needs your entire library dataset for accurate search results.

Spotify's API has limits: [50 tracks per request](https://developer.spotify.com/documentation/web-api/reference/get-users-saved-tracks), and a [rolling 30-second rate limit window](https://developer.spotify.com/documentation/web-api/concepts/rate-limits).

This requires a balanced consideration of UX, performance, and API constraints.

I implemented infinite fetching and caching to solve this.

> Note: This PR only focuses on the "Liked Tracks" aspect of the 'Your Library' command, as well as the overlying architecture for other content types.
>
> - Podcasts
> - Albums
> - Artists
> - Playlists
>
> and similar will need to be implemented separately.

## Solution

- Recursively fetch the _entire_ library.
- Cross-instance caching with intelligent updates.
- API data minification to avoid memory issues.
- UX improvements to offset architectural challenges.

# Details

## Implemented

1. Data Fetching

   - Batched parallel requests (5 parallel per batch, 50 tracks per request). Individual requests are too slow, and combining them all would inevitably hit rate limits.
   - Artificial delay between batches (100ms) to avoid rate limits.

2. Caching

   - Persisted between Raycast runs (commands) using a SWR-like strategy.
   - Revalidated against your library on every run, using the total track count (done by fetching a single track from `me/tracks`). Upon revalidation, the search results are instantly updated.
   - Manual refresh action for re-fetching the entire library, installed as a default action for every list item type. Just hit `cmd + r`.

3. Response Model + Memory Optimization

   - Removed unnecessary data structures for simplicity and performance:

   ```typescript
   interface MinimalTrack {
     id: string;
     name: string;
     artists: { name: string }[];
     album: {
       id: string;
       name: string;
       images: { url: string }[];
     };
     uri: string;
     duration_ms: number;
   }
   ```

4. UX Improvements

   - Library loading/updating indicators with a progress percentage and completion notifications.

5. Miscellaneous

- Improved the action panel for songs to include more relevant actions.
- Changed the default 'enter' action to play, rather than open in Spotify - standardizing the default action across all library sections.
- Made Liked Tracks list item UI consistent between the initial results and the filtered results - changing the filtered results layout from `Title | Artists · Album | TrackID` to `Title | Artists | Duration`.

## Known Issues

- Data minimization can only get us so far.

  A more bulletproof solution may require either:

  1. Intra-fetch data-offloading to disk.
  2. A more sophisticated caching strategy.
  3. A 3rd party API that can outsource recursive fetching, caching, and filtering for querying on-demand.

  I can confirm this is suitable for libraries up to 2,000 songs. Before minimizing the data, this many tracks would result in a memory heap overflow.

- Double-fetching in development.

  Not critical, but it's a point for improvement. Could be React's mounting behavior in dev mode, or a race condition related to the `execute` condition (needs more investigation):

  ```typescript
  //  `useYourLibrary.ts`
  execute: options.execute !== false && !tracksLoading;
  //  `useMySavedTracks.ts`
  execute: options?.execute !== false;
  ```

- Inconsistent progress/loading completion state.

  Sometimes the progress remains stuck at its last percentage instead of displaying the confirmation toast. This may exclusively exist in development when hot-rebuilding the extension.

- Search results are not paginated or limited.

  Due to the workings of Raycast's list filtering - data cannot be reduced/limited before being rendered as the list is filtered (at runtime?) using the item's titles to index the search.

  Keep in mind, the results page is displayed in categories - which further complicates pagination & limiting.

  There are a few options here:

  1. Provide custom filtering, which (without a library) adds complexity and drastically reduces the search UX.
  2. Leverage a pagination implementation to preserve the default Raycast filtering, while programmatically reducing the number of items displayed.
  3. Leave it as-is, and eat the performance hit of a large list.

  If section-based pagination/limiting is implemented (e.g., top 6 search results per section), consider adding a "Refine your search to see more results" message to the bottom bar (where toasts are displayed) or at the very bottom of the list (where someone would scroll to for additional tracks).

- Overall performance is acceptable, but not optimal.

  1. The delay to fetch new data is an inevitable side effect of Spotify's API.
  2. The initial results flash in/out once when loaded, as well as when refreshed.
  3. Search input can lag when excessive track results are displayed.
  4. Even on cache hit, the duration between running the command and seeing results is too much.
  5. The loading indicator jitters on the progress percentage update.

- Error handling is not yet implemented.

  For edge-case rate limit errors, old-versioned cache data, and other rare issues, simply re-running the command is satisfactory for me. User-testing has proved the current state of the extension to be reliable.

- Cache validation is not perfect.

  If the library is modified but the total track count remains the same, the cache will not be invalidated. Without re-fetching the entire library - there really isn't a better way to know if the cache is stale.

  Some alternatives:

  1. Using a 3rd party API that can observe changes.
  2. Time-based cache invalidation (1 hour, 1 day, etc.).
  3. Forward/backward fetching from the last known total to validate the tracks most likely to be stale.
  4. A hybrid approach, that uses the current strategy in combination with 2 and 3.

# Additional Context

Every previous commit contains an AI-generated note containing the status of the PR, and any other information relevant to the commit.

100% of the commits in this PR are AI-generated. 🍾🤯
