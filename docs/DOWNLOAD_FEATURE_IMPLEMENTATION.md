# Modpack Download Feature Implementation

## Overview

This document summarizes the implementation of the modpack download feature that extracts and serves only the `mods` folder from uploaded modpack ZIP files.

## Features Implemented

### 1. Download Server Actions

**File:** `src/server/actions/modpacks/download.ts`

- **`downloadModpack(modpackId: string)`**: Downloads a specific modpack version
- **`downloadLatestModpack(modpackName: string)`**: Downloads the latest version of a modpack by name

#### Key Functionality:

- Extracts only the `mods/` folder from the stored ZIP file
- Creates a new ZIP file containing just the mod `.jar` files
- Records download analytics in the database
- Validates modpack accessibility (public and active)
- Handles client IP and user agent tracking

### 2. API Route Handlers

**Files:**

- `src/app/api/modpacks/[id]/download/route.ts` - Download specific version
- `src/app/api/modpacks/latest/[name]/download/route.ts` - Download latest version

#### Features:

- Serves ZIP files with appropriate HTTP headers
- Handles error responses with JSON
- Sets proper Content-Disposition for file downloads
- Implements cache control headers

### 3. UI Integration

#### ModpackSidebar Component

**File:** `src/components/modpacks/ModpackSidebar.tsx`

- Added functional download button that links to `/api/modpacks/{id}/download`
- Shows file size in the download button
- Integrates with existing permissions and layout

#### Modpacks Listing Page

**File:** `src/app/modpacks/page.tsx`

- "Download Latest" button links to `/api/modpacks/latest/{name}/download`
- Uses URL encoding for modpack names
- Maintains existing design and functionality

## Technical Implementation Details

### File Processing Pipeline

1. **Input**: Modpack ID or name
2. **Validation**: Check if modpack exists and is accessible
3. **File Reading**: Read stored ZIP file from `data/modpacks/versions/`
4. **Extraction**: Extract only `.jar` files from `mods/` directory
5. **Repackaging**: Create new ZIP with just the mods folder
6. **Analytics**: Record download statistics
7. **Response**: Serve the new ZIP file

### Database Integration

- Increments `downloadCount` on each download
- Records detailed download log in `ModpackDownload` table
- Tracks user ID (if authenticated), IP address, and user agent
- Uses database transactions for consistency

### Error Handling

- Validates modpack existence and accessibility
- Handles file system errors gracefully
- Provides user-friendly error messages
- Logs detailed errors for debugging

### Security Considerations

- Only serves public and active modpacks
- Validates all inputs using Zod schemas
- Tracks downloads for analytics and abuse prevention
- Uses proper HTTP headers for file downloads

## API Endpoints

### Download Specific Version

```
GET /api/modpacks/{id}/download
```

- Downloads a specific modpack version by ID
- Returns ZIP file with mods folder only

### Download Latest Version

```
GET /api/modpacks/latest/{name}/download
```

- Downloads the latest version of a modpack by name
- Automatically finds the most recent active version

## File Structure

### Input (Stored Modpack)

```
data/modpacks/versions/{modpack-name}/{version}/
└── modpack.zip
    ├── config/
    ├── mods/
    │   ├── mod1.jar
    │   ├── mod2.jar
    │   └── mod3.jar
    └── other-files/
```

### Output (Downloaded File)

```
{modpack-name}-{version}-mods.zip
└── mods/
    ├── mod1.jar
    ├── mod2.jar
    └── mod3.jar
```

## Usage Examples

### Download from UI

1. **Specific Version**: Visit modpack details page → Click "Download" in sidebar
2. **Latest Version**: Visit modpacks listing → Click "Download Latest"

### Direct API Usage

```bash
# Download specific version
curl -O "http://localhost:3000/api/modpacks/{modpack-id}/download"

# Download latest version
curl -O "http://localhost:3000/api/modpacks/latest/MyModpack/download"
```

## Analytics & Tracking

### Download Statistics

- Total download count per modpack
- Individual download records with timestamps
- User tracking (if authenticated)
- IP address and user agent logging

### Database Records

- `Modpack.downloadCount` - Total downloads
- `ModpackDownload` - Individual download logs

## Error Responses

### Common Error Cases

- **404**: Modpack not found
- **403**: Modpack not public or inactive
- **500**: File system or processing errors

### Response Format

```json
{
  "error": "Modpack not found"
}
```

## Performance Considerations

### Optimization Features

- Streams file processing for large modpacks
- Efficient ZIP operations with AdmZip
- Database transactions for consistency
- Proper HTTP headers for browser caching

### Scalability

- Ready for CDN integration
- Supports large file downloads
- Efficient memory usage during processing

## Future Enhancements

### Planned Improvements

- Download resumption support
- Bandwidth limiting and rate limiting
- Download statistics dashboard
- Batch download capabilities
- Torrent/P2P distribution support

### Integration Opportunities

- Discord bot notifications
- Download links in server announcements
- Automated update notifications
- Launcher integration

## Testing

### Manual Testing Steps

1. Upload a modpack through admin interface
2. Visit modpack details page
3. Click download button
4. Verify downloaded ZIP contains only mods folder
5. Test "Download Latest" from listing page

### Validation Points

- File integrity (checksums match)
- Correct file structure (mods folder only)
- Analytics recording (download count increments)
- Error handling (private/inactive modpacks)

## Troubleshooting

### Common Issues

- **Permission Errors**: Ensure write access to `data/modpacks/`
- **File Not Found**: Verify modpack was uploaded successfully
- **Large Downloads**: Check timeout settings for large files

### Debug Information

- Server logs show detailed processing steps
- Database records track all download attempts
- Error responses include helpful messages

---

## Implementation Summary

✅ **Server Actions**: Download logic with analytics  
✅ **API Routes**: HTTP endpoints for file serving  
✅ **UI Integration**: Functional download buttons  
✅ **File Processing**: Mods-only ZIP extraction  
✅ **Analytics**: Download tracking and statistics  
✅ **Error Handling**: Comprehensive validation and logging  
✅ **Security**: Access control and input validation

The download feature is now fully functional and ready for production use!
