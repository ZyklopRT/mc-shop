# Shop System Refactor Documentation

This document outlines the comprehensive refactoring of the shop management system to improve maintainability, scalability, and consistency with project best practices.

## Overview

The shop system has been refactored from a single monolithic file into a well-structured, modular architecture that follows the project's established patterns.

## Key Improvements

### 1. **Separation of Concerns**

- **Validation Schemas**: Moved to `src/lib/validations/shop.ts`
- **Type Definitions**: Centralized in `src/lib/types/shop.ts`
- **Server Actions**: Split into focused files (`shops.ts`, `shop-items.ts`)
- **Utility Functions**: Extracted to `src/server/utils/shop-utils.ts`
- **Custom Hooks**: Created `src/lib/hooks/use-shop-management.ts`

### 2. **Consistent Error Handling**

- Standardized error response format using `ShopActionResult<T>` type
- Centralized error handling utility functions
- Improved error messages and validation feedback

### 3. **Type Safety Improvements**

- Comprehensive TypeScript interfaces for all shop-related data
- Strict typing for database queries and responses
- Reusable Prisma include configurations

### 4. **Performance Optimizations**

- Query optimization with proper includes
- Pagination support for large datasets
- Efficient filtering and sorting utilities

### 5. **Scalability Enhancements**

- Modular architecture allows for easy extension
- Bulk operations support
- Flexible query building utilities

## File Structure

```
src/
├── lib/
│   ├── types/
│   │   └── shop.ts                 # Type definitions
│   ├── validations/
│   │   └── shop.ts                 # Zod validation schemas
│   └── hooks/
│       └── use-shop-management.ts  # Custom React hook
├── server/
│   ├── actions/
│   │   ├── shops.ts                # Shop CRUD operations
│   │   └── shop-items.ts           # Shop item operations
│   └── utils/
│       └── shop-utils.ts           # Shared utility functions
```

## API Changes

### Before (Monolithic)

```typescript
// Single large file (341 lines) with mixed concerns and inconsistent patterns
// Everything in src/server/actions/shop-actions.ts

const result = await createShop(data);
if (result.success) {
  console.log(result.shop); // Inconsistent response structure
}
```

### After (Clean Modular)

```typescript
// Clean separation of concerns with focused imports
import { createShop } from "~/server/actions/shops";
import { addItemToShop } from "~/server/actions/shop-items";
import type { CreateShopData } from "~/lib/validations/shop";
import { validateShopOwnership } from "~/server/utils/shop-utils";

const result = await createShop(data);
if (result.success) {
  console.log(result.data); // Consistent ShopActionResult<T> structure
}
```

## Validation Schemas

### Shop Operations

- `createShopSchema`: Shop creation validation
- `updateShopSchema`: Shop update validation with optional fields
- `deleteShopSchema`: Shop deletion validation
- `getShopsSchema`: Query parameter validation with pagination
- `searchShopsSchema`: Search query validation

### Shop Item Operations

- `addShopItemSchema`: Adding items to shops
- `updateShopItemSchema`: Updating item prices and availability
- `removeShopItemSchema`: Removing items from shops

## Type Definitions

### Core Types

- `ShopActionResult<T>`: Standardized action result type
- `ShopWithDetails`: Shop with owner and item count
- `ShopWithItems`: Shop with full item details
- `ShopItemWithItem`: Shop item with full item information

### Request/Response Types

- `CreateShopRequest`: Shop creation payload
- `UpdateShopRequest`: Shop update payload
- `ShopListResponse`: Paginated shop list response
- `ShopDetailsResponse`: Detailed shop information response

### Utility Types

- `ShopPermissions`: User permissions for shop operations
- `ShopFilters`: Query filtering options
- `ShopSortOptions`: Sorting configurations
- `ShopStats`: Shop statistics interface

## Utility Functions

### Ownership & Permissions

- `validateShopOwnership()`: Check shop ownership
- `getShopPermissions()`: Get user permissions for shop
- `validateShopItemOwnership()`: Check shop item ownership

### Query Building

- `buildShopWhereClause()`: Dynamic query filtering
- `buildShopOrderBy()`: Dynamic sorting
- `formatLocation()`: Location coordinate formatting
- `calculateDistance()`: Distance calculation between locations

### Data Validation

- `validateMinecraftItem()`: Check if item exists
- `isItemInShop()`: Check if item is already in shop
- `handleShopError()`: Centralized error handling

## Custom Hook: useShopManagement

A comprehensive React hook for shop management operations:

```typescript
const {
  shops,
  currentShop,
  isLoading,
  error,
  loadShops,
  loadShopDetails,
  handleCreateShop,
  handleUpdateShop,
  handleDeleteShop,
  clearError,
  clearCurrentShop,
} = useShopManagement();
```

### Features

- Automatic state management
- Toast notifications for user feedback
- Error handling and recovery
- Optimistic updates for better UX

## Usage Guide

### Import Structure

1. **Shop Operations**: Import from the specific action files

   ```typescript
   // Shop CRUD operations
   import {
     createShop,
     updateShop,
     deleteShop,
     getShops,
     getShopDetails,
   } from "~/server/actions/shops";

   // Shop item operations
   import {
     addItemToShop,
     updateShopItem,
     removeItemFromShop,
   } from "~/server/actions/shop-items";
   ```

2. **Types and Validation**: Import from centralized locations

   ```typescript
   import type { CreateShopData, ShopWithDetails } from "~/lib/types/shop";
   import { createShopSchema } from "~/lib/validations/shop";
   ```

3. **Utilities**: Import helper functions when needed
   ```typescript
   import {
     validateShopOwnership,
     formatLocation,
   } from "~/server/utils/shop-utils";
   ```

### Development Guidelines

1. Always import from specific action files - no re-exports
2. Use centralized type definitions for consistency
3. Apply validation schemas for all form inputs
4. Leverage the `useShopManagement` hook for React components
5. Use utility functions to avoid code duplication

## Best Practices

### 1. **Validation**

- Always use Zod schemas for both client and server validation
- Import schemas from the centralized validation files
- Use type-safe form handling with react-hook-form

### 2. **Error Handling**

- Use the standardized `ShopActionResult<T>` type
- Display user-friendly error messages
- Implement proper loading states

### 3. **Performance**

- Use pagination for large datasets
- Include only necessary data in queries
- Implement optimistic updates where appropriate

### 4. **Type Safety**

- Use TypeScript interfaces consistently
- Avoid `any` types
- Leverage type inference where possible

## Testing Considerations

The refactored structure enables better testing:

1. **Unit Tests**: Each utility function can be tested independently
2. **Integration Tests**: Server actions can be tested with mocked dependencies
3. **Component Tests**: The custom hook can be tested in isolation
4. **E2E Tests**: Consistent API structure makes E2E testing more reliable

## Future Enhancements

The modular structure enables easy addition of:

1. **Shop Categories**: Add category management system
2. **Advanced Filtering**: Location-based search, price ranges
3. **Shop Analytics**: Performance metrics and statistics
4. **Shop Templates**: Predefined shop configurations
5. **Bulk Operations**: Mass shop management features
6. **Real-time Updates**: WebSocket integration for live shop updates

## Clean Architecture

The refactored system uses a clean, direct import structure with no re-exports or redundant code. Each file has a single, clear responsibility:

- **`shops.ts`**: All shop CRUD operations
- **`shop-items.ts`**: All shop item management
- **`shop-utils.ts`**: Shared utility functions
- **`shop.ts` (types)**: Type definitions
- **`shop.ts` (validations)**: Validation schemas

## Conclusion

This refactoring significantly improves the shop system's maintainability, scalability, and developer experience. The clean modular architecture follows established project patterns and enables future enhancements with minimal impact on existing functionality. No redundant code or re-exports means a cleaner, more maintainable codebase.
