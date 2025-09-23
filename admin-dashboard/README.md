# GAG Pets Admin Dashboard

A separate admin dashboard for managing the GAG Pets Trading Platform.

## Features

- **Sell Request Management**: Review and verify pet sell requests
- **Transaction Monitoring**: Track all platform transactions
- **User Management**: Monitor user activity and accounts
- **Credit System**: Add credits to seller accounts
- **Audit Trail**: Complete logging of all admin actions

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env` file with Firebase config:

```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

3. Start development server:

```bash
npm start
```

## Admin User Setup

To create admin users, add them to the `adminUsers` collection in Firestore with this structure:

```json
{
  "displayName": "Admin Name",
  "email": "admin@example.com",
  "role": "admin",
  "permissions": ["all"],
  "createdAt": "timestamp",
  "lastLogin": "timestamp"
}
```

## Pages

- `/` - Dashboard overview
- `/sell-requests` - Manage sell requests
- `/transactions` - View transaction history
- `/users` - User management
- `/settings` - Admin settings

## Security

- Only users in the `adminUsers` collection can access the dashboard
- All admin actions are logged for audit purposes
- Role-based permissions system
