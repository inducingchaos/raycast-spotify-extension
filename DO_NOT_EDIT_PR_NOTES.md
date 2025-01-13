# 'Your Library': Fetch ALL Liked Tracks - Needed For Proper Functionality

## Problem

The 'Your Library' command needs your entire library dataset for accurate search results.

Spotify's API has limits:

- [50 tracks per request](https://developer.spotify.com/documentation/web-api/reference/get-users-saved-tracks)
- [Rolling 30-second rate limit window](https://developer.spotify.com/documentation/web-api/concepts/rate-limits)

This requires a balanced consideration of UX, performance, and API constraints. I implemented infinite fetching and caching to solve this.

> **Note**: This PR only focuses on the "Liked Tracks" aspect of the 'Your Library' command, as well as the overlying architecture for other content types.
>
> Future implementations needed for:
>
> - Podcasts
> - Albums
> - Artists
> - Playlists

## Solution

### Overview

- Recursively fetch the _entire_ library
- Cross-instance caching with intelligent updates
- API data minification to avoid memory issues
- UX improvements to offset architectural challenges

## Implementation Details

### 1. Data Fetching

- Batched parallel requests
  - 5 parallel requests per batch
  - 50 tracks per request
  - Individual requests are too slow
  - Combined requests hit rate limits
- Artificial delay between batches
  - 100ms to avoid rate limits
  - Exponential backoff (3 retries)

### 2. Caching

- Persisted between Raycast runs using SWR-like strategy
- Revalidation on every run
  - Uses total track count
  - Single track fetch from `me/tracks`
  - Instant search result updates
- Manual refresh action
  - Re-fetches entire library
  - Default action for all list items
  - Accessible via `cmd + r`

### 3. Response Model + Memory Optimization

Minimized data structure:

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

### 4. UX Improvements

- Library loading/updating indicators
  - Progress percentage
  - Completion notifications

### 5. Miscellaneous

- Enhanced action panel for songs
- Standardized default actions
  - 'Enter' now plays instead of opening Spotify
- Consistent Liked Tracks list item UI
  - Changed filtered results layout
  - Now shows: `Title | Artists | Duration`
- Changed default behavior to close window after play actions

## Known Issues

### Memory Management

Data minimization limitations may require:

1. Intra-fetch data-offloading to disk
2. More sophisticated caching strategy
3. 3rd party API for outsourcing operations

Current solution supports ~2,000 songs (verified)

- Pre-allocated result array reduces memory pressure
- Previous versions had memory heap overflow

### Development Issues

- Double-fetching observed
  - Possibly React dev mode behavior
  - Potential race condition:
  ```typescript
  //  useYourLibrary.ts
  execute: options.execute !== false && !tracksLoading;
  //  useMySavedTracks.ts
  execute: options?.execute !== false;
  ```

### UI/UX Challenges

1. Progress/Loading State

   - Progress sometimes sticks at last percentage
   - May be dev-only issue during hot-reload

2. Search Results

   - No pagination/limits due to Raycast list filtering
   - Categories complicate pagination
   - Potential solutions:
     - Custom filtering (reduces UX)
     - Programmatic pagination
     - Accept performance trade-off

3. Performance
   - API-imposed fetch delays
   - Initial results flash
   - Search lag with large results
   - Cache hit latency
   - Progress indicator jitter

### Error Handling

- Not fully implemented
- Current workaround: command re-run
- User testing shows reliability

### Cache Validation

Limitations:

- Misses changes when total track count unchanged
- Alternative approaches:
  1. 3rd party change observation
  2. Time-based invalidation
  3. Forward/backward validation
  4. Hybrid strategy

---

_100% of the changes in this PR are AI-generated (except this one!). 🍾🤯 EDIT: not anymore!_
