# Spotify Library Infinite Fetch Implementation

## Current Status

Investigating memory issues with track fetching. Current diagnostic approach:

1. Temporarily disabled track-related UI components to isolate API data handling
2. Reduced rate limit delay to 100ms for faster testing
3. Keeping infinite fetch implementation for proper search functionality

## Memory Investigation Notes

- Memory issue occurs after fetching all tracks (~1912 tracks in 39 batches)
- Issue persists even with UI components disabled (if confirmed)
- Next steps:
  1. Confirm if memory issue is purely data-related
  2. Consider optimizing track data structure
  3. Explore memory-efficient caching strategies

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

## TODOs

- [ ] Remove debug console.logs before PR
- [ ] Document usage of `getMySavedTracks` for other implementations
- [ ] Add tests for pagination and rate limiting
- [ ] Create example implementation for other library sections

## Implementation Notes

### Caching Strategy

- Using Raycast's built-in `useCachedPromise` for automatic caching
- Cache is invalidated automatically when:
  - Dependencies change (limit, offset, fetchAll)
  - Revalidate is called
  - Component is unmounted
- Cache is preserved between command invocations

### Progress Tracking

- Progress is calculated based on total tracks vs fetched tracks
- Progress is reported through hooks for UI feedback
- Progress updates after each batch fetch
- Progress is reset when starting a new fetch

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
