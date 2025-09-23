#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

console.log("🚀 Setting up GAG Pets Admin Dashboard...\n");

// Create .env file if it doesn't exist
const envPath = path.join(__dirname, ".env");
const envExamplePath = path.join(__dirname, "env.example");

if (!fs.existsSync(envPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log("✅ Created .env file from template");
  } else {
    const envContent = `# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id_here
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
REACT_APP_FIREBASE_APP_ID=your_app_id_here

# Admin Configuration
REACT_APP_ADMIN_EMAIL=admin@example.com
REACT_APP_PLATFORM_NAME=GAG Pets Trading Platform`;

    fs.writeFileSync(envPath, envContent);
    console.log("✅ Created .env file");
  }
} else {
  console.log("ℹ️  .env file already exists");
}

// Create admin user setup instructions
const adminSetupPath = path.join(__dirname, "ADMIN_SETUP.md");
const adminSetupContent = `# Admin User Setup

To create admin users for the dashboard, add them to the \`adminUsers\` collection in Firestore with this structure:

\`\`\`json
{
  "displayName": "Admin Name",
  "email": "admin@example.com",
  "role": "admin",
  "permissions": ["all"],
  "createdAt": "timestamp",
  "lastLogin": "timestamp"
}
\`\`\`

## Roles:
- \`admin\`: Full access to all features
- \`staff\`: Limited access to sell requests and transactions

## Permissions:
- \`all\`: Full permissions
- \`sell_requests\`: Can manage sell requests
- \`transactions\`: Can view transactions
- \`users\`: Can manage users
- \`settings\`: Can modify settings

## Example Admin User:
\`\`\`json
{
  "displayName": "John Admin",
  "email": "john@admin.com",
  "role": "admin",
  "permissions": ["all"],
  "createdAt": "2024-01-01T00:00:00Z",
  "lastLogin": "2024-01-01T00:00:00Z"
}
\`\`\`
`;

fs.writeFileSync(adminSetupPath, adminSetupContent);
console.log("✅ Created ADMIN_SETUP.md with instructions");

console.log("\n🎉 Setup complete!");
console.log("\nNext steps:");
console.log("1. Update .env file with your Firebase configuration");
console.log("2. Create admin users in Firestore (see ADMIN_SETUP.md)");
console.log("3. Run: npm install");
console.log("4. Run: npm start");
console.log("\nHappy admin-ing! 🚀");
