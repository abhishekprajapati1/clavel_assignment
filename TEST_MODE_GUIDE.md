# Test Mode Guide - Stripe Payment Integration

This guide explains how to test the premium payment system in development mode without setting up webhooks.

## 🎯 **Quick Start Testing**

### **Option 1: Use Test Upgrade Button (Recommended)**

1. **Sign in** to your account
2. **Go to Payment Page**: `/payment`
3. **Click the Yellow Test Button**: "🧪 Test Upgrade (Dev Only)"
4. **Instant Premium Access**: Your account is immediately upgraded
5. **Test Features**: Try downloading templates and taking screenshots

### **Option 2: Simulate Full Payment Flow**

1. **Create Stripe Checkout**: Click "Upgrade to Premium" 
2. **Complete Test Payment**: Use card `4242 4242 4242 4242`
3. **Return to Success Page**: You'll see "Payment Processing"
4. **Try Webhook Processing**: Click "🔗 Process Payment Webhook" (recommended)
5. **Alternative Manual Upgrade**: Click "🧪 Manual Test Upgrade" button
6. **Premium Access Granted**: Account upgraded for testing

## 🔧 **Why This Is Needed**

### **In Production (With Webhooks):**
```
User Pays → Stripe Webhook → Auto-Upgrade → Premium Access ✅
```

### **In Test Mode (With Auto-Upgrade):**
```
User Pays → Auto-Upgrade Detects Payment → Premium Access ✅
```

### **In Test Mode (Backup Manual):**
```
User Pays → No Auto-Upgrade → Manual Webhook/Test Required 🧪
```

## 📋 **Complete Testing Checklist**

### **1. Authentication Testing**
- [ ] Create new user account
- [ ] Sign in successfully  
- [ ] Access payment page

### **2. Free User Restrictions**
- [ ] Try to download template → Should show upgrade prompt
- [ ] Try to take screenshot → Should show upgrade prompt
- [ ] Verify "Free" badge appears on templates

### **3. Payment Flow Testing**  
- [ ] Click "Upgrade to Premium" → Redirects to Stripe
- [ ] Use test card `4242 4242 4242 4242`
- [ ] Complete checkout → Returns to success page
- [ ] Click test upgrade button → Instant premium access

### **4. Premium User Features**
- [ ] Download templates successfully
- [ ] Take screenshots without restrictions
- [ ] Verify "Premium" badge appears
- [ ] Access all premium features

### **5. Admin Testing**
- [ ] Sign in as admin (`admin@templater.com` / `Admin@123`)
- [ ] Verify automatic premium access
- [ ] Test all admin features

## 🧪 **Test Accounts**

### **Admin Account (Auto-Premium)**
```
Email: admin@templater.com
Password: Admin@123
Access: Full Premium (automatic)
```

### **Test User Account**  
```
Create your own via signup
Access: Free (upgrade with test button)
```

## 🚨 **Common Issues & Solutions**

### **Issue: "Payment Processing" Stuck**
**Solution 1:** Click the blue "🔗 Process Payment Webhook" button (recommended)
**Solution 2:** Click the yellow "🧪 Force Test Upgrade" button (fallback)

### **Issue: "Session Verification Failed"**  
**Solution:** Try the webhook trigger first, then use manual test upgrade

### **Issue: Payment Status Shows "Paid" but Premium is "No"**
**Solution:** The new auto-upgrade feature should handle this automatically, or use the webhook trigger button

### **Issue: No Test Buttons Visible**
**Solution:** Ensure `NODE_ENV=development` in your `.env.local`

### **Issue: Download Still Blocked After Upgrade**
**Solution:** Refresh the page or check user access info endpoint

## 🔍 **API Testing Commands**

### **Check User Access Status**
```bash
curl -X GET http://localhost:8000/api/payment/user-access-info \
  -H "Cookie: access_token=YOUR_TOKEN"
```

### **Manual Test Upgrade**
```bash
curl -X POST http://localhost:8000/api/payment/test-upgrade-user \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=YOUR_TOKEN" \
  -d '{}'
```

### **Trigger Webhook Processing**
```bash
curl -X POST http://localhost:8000/api/payment/trigger-webhook-test/SESSION_ID \
  -H "Content-Type: application/json" \
  -H "Cookie: access_token=YOUR_TOKEN"
```

### **Check Stripe Configuration**
```bash
curl -X GET http://localhost:8000/api/payment/config-test
```

## 📱 **Frontend Testing Flow**

### **Step 1: Access Payment Page**
- URL: `http://localhost:3000/payment`
- Should show current account status
- Should display upgrade options

### **Step 2: Test Mode Indicators**
- Blue webhook trigger button visible in development  
- Yellow test upgrade button visible in development
- Warning text about test mode
- Clear upgrade options displayed

### **Step 3: Premium Feature Testing**
- Try template downloads
- Test screenshot protection
- Verify access indicators update

## 🔧 **Developer Tools**

### **Browser Console Debugging**
- Check for API errors
- Monitor React Query cache updates
- Verify access status changes

### **Network Tab Monitoring**
- Watch API calls to `/api/payment/*`
- Check response status codes
- Verify successful upgrades

## 📝 **Environment Setup**

### **Required Variables**
```env
# Backend .env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
FRONTEND_URL=http://localhost:3000

# Frontend .env.local  
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=development
```

### **Optional (Skip in Test Mode)**
```env
# Not needed for basic testing
STRIPE_WEBHOOK_SECRET=whsec_...
```

## 🎯 **Testing Scenarios**

### **Scenario 1: New User Journey**
1. Sign up → Free account
2. Try premium feature → Upgrade prompt
3. Go to payment → See pricing
4. Use test upgrade → Instant premium
5. Use premium features → Success

### **Scenario 2: Admin User**
1. Sign in as admin → Auto premium
2. Access all features → No restrictions
3. Test admin-specific functions

### **Scenario 3: Payment Flow (New Auto-Upgrade)**
1. Click "Upgrade to Premium"
2. Redirected to Stripe checkout  
3. Complete with test card
4. Return to success page
5. Auto-upgrade detects payment and upgrades user
6. If stuck, use webhook trigger button

### **Scenario 4: Manual Payment Flow**
1. Click "Upgrade to Premium"
2. Redirected to Stripe checkout
3. Complete with test card
4. Return to success page
5. Click "🔗 Process Payment Webhook"
6. Fallback: Use "🧪 Manual Test Upgrade"

## 🚀 **Production Deployment Notes**

When deploying to production:

1. **Add webhook secret**: `STRIPE_WEBHOOK_SECRET=whsec_...`
2. **Use live Stripe keys**: `sk_live_...` and `pk_live_...`  
3. **Set production URLs**: Update frontend/backend URLs
4. **Remove test buttons**: Won't show in production
5. **Enable webhooks**: Automatic user upgrades will work
6. **Auto-upgrade backup**: Even without webhooks, the verify-session endpoint now auto-upgrades users when payment is complete

## 📞 **Support**

If testing issues persist:

1. **Check server logs**: Look for database errors
2. **Verify environment**: Ensure all variables are set
3. **Test API directly**: Use curl commands above
4. **Clear browser cache**: Reset cookies and localStorage
5. **Restart servers**: Both frontend and backend

---

**Happy Testing! 🧪**

Remember: Test mode is designed to be easy and flexible. Use the test upgrade buttons liberally to test all premium features without going through the full payment flow every time.