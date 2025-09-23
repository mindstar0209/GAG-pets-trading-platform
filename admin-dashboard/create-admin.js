const admin = require("firebase-admin");

// Initialize Firebase Admin (you'll need to download service account key)
// 1. Go to Firebase Console → Project Settings → Service Accounts
// 2. Click "Generate new private key"
// 3. Save the JSON file as "service-account-key.json" in this folder
// 4. Uncomment the line below and update the path

// const serviceAccount = require("./service-account-key.json");

// For now, we'll use the default credentials (if you're running from Firebase project)
try {
  admin.initializeApp({
    // credential: admin.credential.cert(serviceAccount),
  });
} catch (error) {
  console.log("❌ Please set up Firebase Admin SDK credentials first");
  console.log("📖 See instructions in ADMIN_SETUP_GUIDE.md");
  process.exit(1);
}

const db = admin.firestore();

async function createAdminUser() {
  try {
    const adminUser = {
      displayName: "Super Admin",
      email: "admin@gagpets.com",
      role: "admin",
      permissions: ["all"],
      createdAt: new Date(),
      lastLogin: new Date(),
    };

    // Add to adminUsers collection
    const docRef = await db.collection("adminUsers").add(adminUser);
    console.log("✅ Admin user created in Firestore with ID:", docRef.id);

    // Also create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: adminUser.email,
      displayName: adminUser.displayName,
      password: "admin123", // Change this!
    });

    console.log("✅ Firebase Auth user created:", userRecord.uid);
    console.log("\n🎉 Admin setup complete!");
    console.log("Email:", adminUser.email);
    console.log("Password: admin123 (CHANGE THIS!)");
    console.log("\n📝 Next steps:");
    console.log("1. Go to http://localhost:8088");
    console.log("2. Login with the credentials above");
    console.log("3. Change the password in the admin dashboard");
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    console.log(
      "\n💡 Alternative: Use the manual setup method in ADMIN_SETUP_GUIDE.md"
    );
  }
}

createAdminUser();
