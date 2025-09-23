# 🔄 Integration Test Guide

## How the Two Projects Work Together

### **Main Platform (Port 3000)**

- Users can create accounts and login
- Users can create sell requests for their pets
- Users can browse and buy pets from marketplace
- **NO admin functionality** - admins cannot login here

### **Admin Dashboard (Port 8088)**

- Separate project for staff/admin users only
- Staff can review sell requests from main platform
- Staff can approve/reject pets and add credit to sellers
- Staff can view transaction history

## 🧪 Complete Test Workflow

### **Step 1: Test Main Platform**

1. Go to `http://localhost:3000`
2. Create a user account or login
3. Go to "Sell" page
4. Fill out pet information
5. Complete custody process
6. Submit sell request
7. ✅ **Result**: Sell request should be created in Firebase

### **Step 2: Test Admin Dashboard**

1. Go to `http://localhost:8088`
2. Login with admin credentials
3. Go to "Sell Requests" page
4. ✅ **Result**: Should see the sell request from Step 1

### **Step 3: Admin Review Process**

1. In admin dashboard, click on a sell request
2. Review pet details and custody information
3. Click "Verify & Approve" or "Reject"
4. If approved, add credit amount for seller
5. ✅ **Result**: Pet should appear in main platform marketplace

### **Step 4: Test Marketplace**

1. Go back to main platform (`http://localhost:3000`)
2. Go to "Marketplace"
3. ✅ **Result**: Approved pets should be visible for purchase

## 🔧 Setup Requirements

### **Firebase Configuration**

Both projects must use the same Firebase project:

- Same `projectId`
- Same `authDomain`
- Same Firestore database

### **Admin User Setup**

1. Create admin user in Firebase Auth
2. Add admin user to `adminUsers` collection in Firestore
3. Use same credentials in both projects

### **Collections Structure**

```
Firestore Collections:
├── users (main platform users)
├── sellRequests (shared between projects)
├── pets (marketplace pets)
├── transactions (shared between projects)
├── adminUsers (admin dashboard users)
└── staffActions (admin actions log)
```

## 🚨 Troubleshooting

### **Sell Requests Not Appearing in Admin Dashboard**

- Check Firebase configuration matches
- Verify `sellRequests` collection exists
- Check admin user has proper permissions

### **Admin Dashboard Not Loading**

- Ensure admin user exists in `adminUsers` collection
- Check Firebase Auth user exists
- Verify email matches exactly

### **Pets Not Appearing in Marketplace**

- Check if sell request was approved
- Verify `MarketplaceService.addPetToMarketplace` was called
- Check `pets` collection in Firestore

## 📊 Data Flow

```
User (Main Platform) → Creates Sell Request → Firebase Firestore
                                                      ↓
Admin (Admin Dashboard) ← Reads Sell Requests ← Firebase Firestore
                                                      ↓
Admin Approves → Updates Status → Adds to Marketplace → Firebase Firestore
                                                      ↓
User (Main Platform) ← Sees Pet in Marketplace ← Firebase Firestore
```

## ✅ Success Criteria

- [ ] Users can create sell requests in main platform
- [ ] Admin can see sell requests in admin dashboard
- [ ] Admin can approve/reject sell requests
- [ ] Approved pets appear in main platform marketplace
- [ ] Users can purchase pets from marketplace
- [ ] Credit is properly added to sellers
- [ ] Transactions are recorded correctly

## 🎯 Next Steps

1. Test the complete workflow
2. Create sample data for testing
3. Verify all integrations work correctly
4. Deploy both projects to production
