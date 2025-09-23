# 🧪 Test Sell Request Workflow

## Current Issue Analysis

The sell request workflow might have issues with:

1. **Data structure mismatch** between custody flow and sell request creation
2. **Missing required fields** in the sell request
3. **Admin dashboard not reading** sell requests correctly

## 🔍 Step-by-Step Test

### **Test 1: Create Sell Request**

1. Go to `http://localhost:3000`
2. Login/Register as a user
3. Go to "Sell" page
4. Fill out pet form:
   - Name: "Test Dragon"
   - Type: "Dragon"
   - Rarity: "rare"
   - Age: "full-grown"
   - Price: "100"
   - Description: "A beautiful test dragon"
5. Upload an image
6. Click "Submit for Custody"
7. **Expected**: Should move to custody flow

### **Test 2: Custody Process**

1. In custody flow, click "Start Custody Process"
2. **Expected**: Should create custody request
3. **Expected**: Should show bot friend request step
4. **Expected**: Should complete custody process
5. **Expected**: Should call `onCustodyComplete` with proper data

### **Test 3: Sell Request Creation**

1. After custody completes, check browser console
2. **Expected**: Should see "Sell request created successfully!" alert
3. **Expected**: Should navigate to dashboard
4. **Expected**: Should create document in `sellRequests` collection

### **Test 4: Admin Dashboard**

1. Go to `http://localhost:8088`
2. Login with admin credentials
3. Go to "Sell Requests" page
4. **Expected**: Should see the sell request from Test 1-3

## 🐛 Common Issues & Fixes

### **Issue 1: Custody Data Mismatch**

**Problem**: `custodyData` doesn't have expected structure
**Fix**: Check what data is actually passed to `onCustodyComplete`

### **Issue 2: Missing Required Fields**

**Problem**: Sell request missing required fields
**Fix**: Ensure all required fields are present in `SellRequest` interface

### **Issue 3: Firebase Permission Issues**

**Problem**: Can't read/write to Firestore
**Fix**: Check Firebase rules and authentication

### **Issue 4: Admin Dashboard Not Loading**

**Problem**: Admin dashboard can't read sell requests
**Fix**: Check Firebase configuration and admin user setup

## 🔧 Debug Steps

1. **Check Browser Console** for errors
2. **Check Firebase Console** for created documents
3. **Check Network Tab** for failed requests
4. **Verify Firebase Rules** allow read/write access

## 📊 Expected Data Flow

```
User Form → Pet Data → Custody Flow → Custody Complete → Sell Request → Firebase → Admin Dashboard
```

## ✅ Success Criteria

- [ ] User can complete sell form
- [ ] Custody flow completes successfully
- [ ] Sell request is created in Firebase
- [ ] Admin dashboard shows the sell request
- [ ] No console errors
- [ ] Proper data structure maintained
