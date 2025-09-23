// Simple script to help you set up admin user
// Run this after creating the Firebase Auth user

console.log("🔐 Admin Setup Instructions");
console.log("==========================");
console.log("");
console.log("1. FIRST: Create Firebase Auth User");
console.log("   - Go to: https://console.firebase.google.com");
console.log("   - Select your project");
console.log("   - Go to Authentication → Users");
console.log('   - Click "Add user"');
console.log("   - Email: admin@example.com");
console.log("   - Password: admin123");
console.log('   - Click "Add user"');
console.log("");
console.log("2. THEN: Add to Admin Collection");
console.log("   - Go to Firestore Database");
console.log("   - Create collection: adminUsers");
console.log("   - Add document with these fields:");
console.log('     - displayName: "Admin User"');
console.log('     - email: "admin@example.com"');
console.log('     - role: "admin"');
console.log('     - permissions: ["all"]');
console.log("     - createdAt: (current timestamp)");
console.log("     - lastLogin: (current timestamp)");
console.log("");
console.log("3. FINALLY: Test Login");
console.log("   - Go to: http://localhost:8088");
console.log("   - Login with: admin@example.com / admin123");
console.log("");
console.log("✅ That's it! The admin dashboard should work now.");
