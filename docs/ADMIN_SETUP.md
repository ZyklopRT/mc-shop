# Admin Setup Guide

## Making Users Admin

To grant a user admin privileges for modpack management, you need to update their record in the database.

### Via Database Console

1. Connect to your PostgreSQL database
2. Run the following SQL command:

```sql
UPDATE "User" SET "isAdmin" = true WHERE "mcUsername" = 'your_minecraft_username';
```

Replace `'your_minecraft_username'` with the actual Minecraft username of the user you want to make admin.

### Via Prisma Studio (Development)

1. Start Prisma Studio: `npx prisma studio`
2. Navigate to the `User` model
3. Find the user you want to make admin
4. Set the `isAdmin` field to `true`
5. Save the changes

### Via Environment Variable (Development Only)

For development, you can set a default admin username in your `.env` file:

```env
DEFAULT_ADMIN_USERNAME=your_minecraft_username
```

Then add this to your registration process or seed script to automatically make that user an admin.

## Admin Permissions

Admin users can:

- Access `/admin/modpacks` - Modpack management dashboard
- Upload new modpacks
- Edit and delete modpacks
- Set modpacks as featured or active/inactive
- View download statistics and user analytics

## Current Admin Features

### Phase 1 (Implemented)

- ✅ Admin user flag in database
- ✅ Admin permission checks in pages
- ✅ Basic modpack CRUD operations
- ✅ Admin-only navigation links

### Future Phases

- 🔄 File upload and processing
- 🔄 Mod scanning and metadata extraction
- 🔄 Version comparison and changelogs
- 🔄 Download analytics and tracking

## Security Notes

- Admin privileges are required for all modpack management operations
- Users without admin privileges are redirected to the public modpack page
- Admin checks are performed both in UI components and server actions
- File uploads (when implemented) will have additional security validation

## Making Your First Admin

After setting up the system:

1. Register a user account normally through `/auth/register`
2. Use one of the methods above to grant admin privileges
3. Navigate to `/admin/modpacks` to access the management interface

## Troubleshooting

### "Admin privileges required" error

- Verify the user has `isAdmin = true` in the database
- Check that you're logged in with the correct account
- Clear browser cache and sign out/in again

### Can't access admin pages

- Ensure the database migration for the `isAdmin` field has been applied
- Verify your user record exists and has the correct username

### Permission denied on file operations

- This will be relevant in later phases when file uploads are implemented
- Ensure proper file system permissions on the modpack storage directory
