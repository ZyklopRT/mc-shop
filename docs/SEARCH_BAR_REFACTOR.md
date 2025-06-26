# Search Bar Refactoring

## Overview

The global search bar component has been refactored to follow best practices and the established codebase architecture. The original 575-line component has been split into multiple focused components and hooks.

## Architecture Changes

### Before Refactoring

- Single large component with 575 lines
- Mixed UI and business logic concerns
- Inline event handlers and state management
- Complex conditional logic for different modes

### After Refactoring

- **Separated concerns** into multiple focused files
- **Custom hooks** for business logic
- **Utility functions** for navigation logic
- **Configuration constants** for maintainability
- **Reusable components** following ShadCN patterns

## New File Structure

### Constants

- `src/lib/constants/search-config.ts` - Search configuration and types

### Hooks

- `src/hooks/use-global-search.ts` - Main search state and API logic
- `src/hooks/use-search-keyboard.ts` - Keyboard navigation handling

### Utilities

- `src/lib/utils/search-navigation.ts` - Navigation logic utilities

### Components

- `src/components/search/search-type-filter.tsx` - Search type dropdown
- `src/components/search/search-results-dropdown.tsx` - Results display
- `src/components/search/global-search-bar.tsx` - Main component (simplified)

## Key Improvements

### 1. Separation of Concerns

- **UI Components**: Focus only on rendering and user interaction
- **Hooks**: Manage state and side effects
- **Utilities**: Handle pure business logic functions
- **Constants**: Centralize configuration

### 2. Reusability

- Components can be easily reused in different contexts
- Hooks can be shared across components
- Utilities can be tested in isolation

### 3. Maintainability

- Smaller, focused files are easier to understand and modify
- Clear separation makes testing easier
- Configuration is centralized and easily changeable

### 4. Type Safety

- Proper TypeScript types throughout
- Better error handling and validation
- Consistent interfaces between components

## Component Usage

The refactored `GlobalSearchBar` maintains the same external API:

```tsx
<GlobalSearchBar
  mode="dropdown" // or "callback"
  placeholder="Search..."
  searchCallbacks={{
    onPlayerSearch: (criteria) => {
      /* handle */
    },
    onItemSearch: (criteria) => {
      /* handle */
    },
    onGeneralSearch: (criteria) => {
      /* handle */
    },
  }}
  onSearchExecuted={() => {
    /* callback */
  }}
/>
```

## Benefits

1. **Better Testing**: Each piece can be unit tested independently
2. **Easier Debugging**: Smaller, focused components are easier to debug
3. **Code Reuse**: Hooks and utilities can be shared
4. **Performance**: Better optimization opportunities with smaller components
5. **Developer Experience**: Clearer code structure and better IntelliSense

## Configuration

Search behavior is now configured in `src/lib/constants/search-config.ts`:

```typescript
export const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 3,
  DEBOUNCE_DELAY: 300,
  MAX_RESULTS: 10,
  MAX_DROPDOWN_HEIGHT: "max-h-96",
} as const;
```

## Next Steps

- Add unit tests for the new hooks and utilities
- Consider extracting more common search patterns
- Implement search result caching if needed
- Add analytics hooks for search behavior tracking
