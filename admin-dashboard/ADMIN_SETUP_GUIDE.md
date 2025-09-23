# 🔐 Admin User Setup Guide

## Quick Setup (Recommended)

### Step 1: Create Firebase Auth User

**Option A: Using Firebase Console (Recommended)**

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to **Authentication** (left sidebar)
4. Click **"Users"** tab
5. Click **"Add user"**
6. Enter email: `admin@example.com`
7. Enter password: `admin123` (or your chosen password)
8. Click **"Add user"**

**Option B: Using Main Platform**

1. Go to your main platform: `http://localhost:3000`
2. Click "Sign Up" and create an account with email: `admin@example.com`
3. Use a strong password

### Step 2: Add to Admin Collection

1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Go to **Firestore Database**
4. Click **"Start collection"**
5. Collection ID: `adminUsers`
6. Click **"Next"**
7. Add these fields:

| Field         | Type      | Value               |
| ------------- | --------- | ------------------- |
| `displayName` | string    | `Admin User`        |
| `email`       | string    | `admin@example.com` |
| `role`        | string    | `admin`             |
| `permissions` | array     | `["all"]`           |
| `createdAt`   | timestamp | `Now`               |
| `lastLogin`   | timestamp | `Now`               |

8. Click **"Save"**

### Step 3: Test Login

1. Go to admin dashboard: `http://localhost:8088`
2. Login with the email and password you created
3. You should see the admin dashboard!

## User Roles

### Admin

- Full access to all features
- Can manage users, settings, everything

### Staff

- Limited access to sell requests and transactions
- Cannot modify settings or manage users

## Example Admin User Structure

```json
{
  "displayName": "John Admin",
  "email": "john@admin.com",
  "role": "admin",
  "permissions": ["all"],
  "createdAt": "2024-01-01T00:00:00Z",
  "lastLogin": "2024-01-01T00:00:00Z"
}
```

## Example Staff User Structure

```json
{
  "displayName": "Jane Staff",
  "email": "jane@staff.com",
  "role": "staff",
  "permissions": ["sell_requests", "transactions"],
  "createdAt": "2024-01-01T00:00:00Z",
  "lastLogin": "2024-01-01T00:00:00Z"
}
```

## Troubleshooting

### Can't Login?

1. Make sure the email exists in Firebase Auth
2. Make sure the user exists in `adminUsers` collection
3. Check that the email matches exactly

### Permission Denied?

1. Make sure the user has the correct role
2. Check that permissions array includes required permissions

### Still Having Issues?

1. Check browser console for errors
2. Verify Firebase configuration
3. Make sure both projects use the same Firebase project
