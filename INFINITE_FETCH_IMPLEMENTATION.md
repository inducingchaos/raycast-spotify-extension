# Spotify Library Infinite Fetch Implementation

## Current Status

✅ Initial implementation successful:

- Infinite fetching works with proper rate limiting
- Search functionality correctly filters items
- Parallel fetching with staggered requests working
- Memory optimization through data minimization
- Progress tracking with visual feedback
- ✅ Persistent caching between command instances working

### Remaining Issues

1. **Fetch Optimization**

   - ✅ Fixed parallel fetching during initial load by:
     - Making library data fetch wait for tracks to complete
     - Using execute condition in useCachedPromise
   - ✅ Subsequent loads correctly use cache without refetching
   - ✅ Progress indicator completion fixed

2. **Loading UX Improvements**

   - ✅ Added progress information during initial load
   - ✅ Added loading toasts with progress percentage
   - ✅ Added completion toast with item count
   - ✅ Added rate limit error handling with user feedback
   - ✅ Generalized messages for library-wide use
   - ✅ Fixed progress completion

3. **Search Results Refinement**

   - ✅ Standardized track display format across all views
   - Performance issues with large result sets (200+ tracks)
   - Need pagination or result limiting strategy:
     ```typescript
     // Proposed approach:
     - Limit initial search results (10-50 tracks)
     - Add "Refine your search to see more results" message
     - Consider section-based pagination
     ```

4. **UI Consistency**
   - ✅ Standardized track display format:
     - Title | Artists | Duration (with album art)
     - Artists shown in dimmed grey text
     - Duration shown on the right
   - ✅ Consistent format across all views (initial, search, and filtered results)
   - ✅ Removed library number to focus on essential track information

## Memory Investigation Notes

- Memory issue resolved with data minimization
- Performance improvements:
  - Memoized fetch functions to prevent re-renders
  - Wrapped progress updates in useEffect
  - Optimized dependency arrays to prevent double fetching
  - Reduced rate limit delay to 25ms (from 100ms)
  - Parallelized track fetching with staggered requests (5 requests per batch)
  - Simplified track data structure and UI components:
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
    }
    ```
  - Unified track handling:
    - Single MinimalTrack type across all components
    - Consistent transformation from Spotify API types
    - Simplified action panel with core functionality
    - Proper type safety in list components
- Next steps:
  1. Re-enable UI components
  2. Test with larger libraries
  3. Consider implementing chunked caching if issues resurface

## Overview

This implementation adds infinite fetching and caching to Spotify's library sections, starting with tracks. This pattern can be applied to other library sections (playlists, albums, etc.) in the future.

## Current Issues

- No infinite fetching for saved tracks
- Memory limitations due to loading all tracks at once
- Search requires full dataset before filtering
- Rate limiting constraints (30-second rolling window)
- No caching strategy

## Implementation Requirements

### API Constraints

- Limited to 50 tracks per request
- Must respect 30-second rolling window rate limit
- `/me/tracks` endpoint for saved tracks

### Core Features to Implement

1. **Pagination**

   - Frontend pagination in Raycast interface
   - Initial load strategy with progressive enhancement
   - Loading state improvements

2. **Search Implementation**

   - Need full dataset for accurate filtering
   - Progressive loading with initial results
   - Custom loading indicators for large libraries

3. **Caching Strategy**
   Options to consider:
   - Time-based cache invalidation (1 hour)
   - Forward-fetch from last known total
   - Hybrid approach:
     - Daily full refresh
     - Forward-fetch for new additions
     - Handle deletion edge cases

### Edge Cases

- Deleted songs causing offset issues
- Large libraries requiring extended load times
- Rate limit handling
- Cache invalidation scenarios

## Implementation Plan

### Phase 1: Basic Pagination ✅

1. ✅ Modify `getMySavedTracks.ts` to support proper pagination
   - Added offset and limit parameters
   - Implemented fetchAll option with rate limiting
   - Added debug logging for testing
   - Reduced rate limit delay to 200ms for testing
2. ✅ Implement progressive loading in UI
   - Created `useMySavedTracks` hook for caching and pagination
   - Updated `useYourLibrary` to use the new hook
   - Enabled caching by default with `useCachedPromise`
3. ✅ Add loading state improvements
   - Added progress tracking to `getMySavedTracks`
   - Exposed fetch progress through hooks
   - Added progress calculation and reporting

### Phase 2: Search Enhancement

1. Implement efficient data structure for search
2. Add progressive search results
3. Optimize filtering performance

### Phase 3: Caching

1. ✅ Implement caching layer
   - Using Raycast's `useCachedPromise` for automatic caching
   - Cache invalidation handled by Raycast
2. Add cache invalidation strategy
3. Handle edge cases (deletions, additions)

## Testing Strategy

- Test with various library sizes
- Verify rate limit handling
- Validate cache behavior
- Edge case coverage

## Future Considerations

- Apply similar patterns to other library sections
- Performance monitoring
- User feedback collection

## Progress Log

### 2024-03-21

- Implemented basic pagination in `getMySavedTracks.ts`
- Added debug logging for testing and monitoring
- Reduced rate limit delay to 200ms (from 1000ms) for testing
- Created `useMySavedTracks` hook with caching support
- Updated `useYourLibrary` to use new hook
- Added progress tracking for better UX
- Next steps:
  1. Test the current implementation with the UI
  2. Implement search optimizations
  3. Add cache invalidation strategy

### 2024-03-22

- ✅ Successfully implemented persistent caching between command instances
- ✅ Cache validation working - subsequent loads use cached data
- Identified issues:
  1. Initial load triggers parallel fetches (investigated but not resolved)
     - Potential causes:
       - useCachedPromise re-execution on tracksLoading changes
       - Race condition with execute conditions
       - Interaction between useYourLibrary and useMySavedTracks hooks
     - Possible solutions to explore later:
       - Consolidate fetching into a single useCachedPromise call
       - Use useRef to track fetch state
       - Add debounce to prevent rapid re-fetches
  2. Progress indicator gets stuck at 94%
- Next steps:
  1. Implement search optimizations
  2. Add cache invalidation strategy
  3. Revisit double fetching issue after core functionality is stable

## TODOs

- [ ] Remove debug console.logs before PR
- [ ] Document usage of `getMySavedTracks` for other implementations
- [ ] Add tests for pagination and rate limiting
- [ ] Create example implementation for other library sections
- [ ] Investigate and fix double fetching issue

## Implementation Notes

### Caching Strategy

Current implementation:

- Using LocalStorage for persistent caching between command instances
- Cache validation checks total item count
- Only caches complete results
- ✅ Subsequent loads correctly use cached data
- ✅ Initial load optimized to prevent parallel fetches

### Progress Tracking

Current implementation:

- Progress calculated based on total items vs fetched items
- Progress updates after each batch fetch
- ✅ Progress completion working correctly
- Loading and completion toasts use library-wide terminology

### Usage Examples

```typescript
// Basic usage with default caching
const { savedTracksData } = useMySavedTracks();

// Paginated usage
const { savedTracksData } = useMySavedTracks({
  limit: 50,
  offset: 100,
  fetchAll: false,
});

// With loading states and progress
const { savedTracksData, savedTracksIsLoading, savedTracksError, fetchProgress } = useMySavedTracks();
```

## Search Implementation

### Explored Solutions

1. **Limit Results After Filtering**

   - Attempted to limit displayed tracks to 6 after filtering
   - Failed because it prevented Raycast's built-in filtering from accessing full dataset
   - Would miss potential matches in non-displayed data

2. **Custom Search with Result Limiting**

   - Implemented basic case-insensitive search across stringified objects
   - Could limit to 6 results easily
   - Much worse search experience compared to Raycast's built-in filtering
   - Would need complex scoring system to match Raycast's quality:
     - Title exact matches
     - Starts with matches
     - Contains word matches
     - Artist/album matches
     - Proper weightings and sorting

3. **Pagination Without Re-fetching**
   - Explored Raycast's pagination API
   - Designed for dynamic loading scenarios
   - Not suitable for our use case where all data is already loaded
   - Would still limit searchable dataset

### Final Decision

Chose to keep Raycast's built-in filtering with no result limiting because:

- Superior search experience (partial matches, smart filtering)
- Works across all track properties automatically
- Maintains consistency with other Raycast extensions
- Performance impact of rendering 200+ items is acceptable tradeoff for better search

### Potential Future Improvements

1. **Hybrid Approach**

   - Keep Raycast's filtering but implement custom result ranking
   - Show best matches first while keeping all results searchable
   - Would require deeper integration with Raycast's List component

2. **Virtual List**

   - If performance becomes issue, implement virtual scrolling
   - Only render visible items while keeping full dataset searchable
   - Would need to ensure compatibility with Raycast's List component

3. **Smart Caching**
   - Current caching works well for subsequent loads
   - Could explore more sophisticated caching strategies if needed
   - Focus on optimizing initial load experience

### Current Implementation

- Uses Raycast's built-in filtering
- Shows all matching results (no artificial limits)
- Caches full dataset for quick subsequent searches
- Maintains best possible search experience for users
