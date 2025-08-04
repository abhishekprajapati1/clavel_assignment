# Stripe Payment Integration Setup Guide

This guide will help you set up Stripe payment integration for the Templater application to enable premium user functionality.

## Overview

The Templater application now includes a premium payment system that:
- Restricts template downloads to premium users only
- Prevents screenshots for non-premium users
- Uses Stripe for secure payment processing
- Provides one-time payment for lifetime premium access ($9.99)
- Automatically upgrades users to premium status after successful payment

## Features Implemented

### Premium Access Controls
- **Screenshot Protection**: Prevents non-premium users from taking screenshots
- **Download Restrictions**: Only premium users can download templates
- **Access Indicators**: Visual badges showing user access level
- **Upgrade Prompts**: Contextual prompts to encourage premium upgrades

### Payment Flow
- **Stripe Checkout**: Secure hosted payment page
- **Webhook Processing**: Automatic user upgrade after payment
- **Payment Verification**: Session verification for security
- **Success/Cancel Pages**: Proper user feedback

## Prerequisites

1. A Stripe account (https://stripe.com)
2. Backend server running on Python/FastAPI
3. Frontend running on Next.js
4. MongoDB database configured

## Step 1: Stripe Account Setup

### 1.1 Create Stripe Account
1. Visit https://stripe.com and create an account
2. Complete the account verification process
3. Access your Stripe Dashboard

### 1.2 Get API Keys
1. Go to **Developers > API keys** in your Stripe Dashboard
2. Copy your **Publishable key** (starts with `pk_test_` for test mode)
3. Copy your **Secret key** (starts with `sk_test_` for test mode)

### 1.3 Create Webhook Endpoint
1. Go to **Developers > Webhooks** in your Stripe Dashboard
2. Click **Add endpoint**
3. Set the endpoint URL: `https://your-backend-domain.com/api/payment/webhook`
4. Select these events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded` 
   - `payment_intent.payment_failed`
5. Copy the **Webhook signing secret** (starts with `whsec_`)

## Step 2: Environment Configuration

### 2.1 Backend Environment Variables

Add these variables to your `backend/.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Frontend URL (for redirect URLs)
FRONTEND_URL=http://localhost:3000

# Existing variables...
MONGODB_URL=mongodb://localhost:27017/templater
JWT_SECRET_KEY=your_jwt_secret_key
```

### 2.2 Frontend Environment Variables

Add these variables to your `frontend/.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# App Configuration
NEXT_PUBLIC_APP_NAME=Templater
```

## Step 3: Install Dependencies

### 3.1 Backend Dependencies
The Stripe dependency should already be in `requirements.txt`:

```bash
cd backend
pip install -r requirements.txt
```

### 3.2 Frontend Dependencies
The Stripe and UI dependencies should already be in `package.json`:

```bash
cd frontend
npm install
```

## Step 4: Database Setup

The application will automatically create the necessary database collections. Ensure your admin user has premium access by running:

```bash
cd backend
python create_admin.py
```

This creates an admin user with:
- Email: `admin@templater.com`
- Password: `Admin@123`
- Premium access: `true`

## Step 5: Testing the Payment Flow

### 5.1 Start the Applications

**Backend:**
```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 5.2 Test Payment Process

1. **Create a test user:**
   - Go to `http://localhost:3000/signup`
   - Create a new account (will be a free user by default)

2. **Trigger payment flow:**
   - Try to download a template or take a screenshot
   - You should see upgrade prompts
   - Click "Upgrade to Premium"

3. **Complete test payment:**
   - Use Stripe test card: `4242 4242 4242 4242`
   - Use any future expiry date (e.g., `12/25`)
   - Use any 3-digit CVC (e.g., `123`)
   - Complete the payment

4. **Verify upgrade:**
   - You should be redirected to the success page
   - Your account should now have premium access
   - Try downloading templates (should work now)

### 5.3 Test Stripe Webhooks Locally

For local development, use Stripe CLI to forward webhooks:

1. **Install Stripe CLI:**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows/Linux
   # Download from https://github.com/stripe/stripe-cli/releases
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server:**
   ```bash
   stripe listen --forward-to localhost:8000/api/payment/webhook
   ```

4. **Use the webhook secret from CLI output in your `.env` file**

## Step 6: Testing Screenshots Protection

### 6.1 Screenshot Prevention Features

The application includes several screenshot prevention methods:

- **Keyboard shortcuts blocked:** Print Screen, Win+Shift+S, Cmd+Shift+3/4/5
- **Right-click disabled** on protected content
- **Developer tools blocked** with F12 and Ctrl+Shift+I
- **Content blurring** when screenshot attempts are detected
- **Visual indicators** showing access status

### 6.2 Test the Protection

1. **As a free user:**
   - Try taking screenshots with various methods
   - Should see upgrade prompts and content blur
   - Download buttons should show "Upgrade Required"

2. **As a premium user:**
   - Screenshots should work normally
   - Download buttons should be functional
   - No access restrictions

## Step 7: Production Deployment

### 7.1 Stripe Production Setup

1. **Activate your Stripe account** for live payments
2. **Get production API keys** from Stripe Dashboard
3. **Update webhook endpoint** to your production domain
4. **Update environment variables** with production keys

### 7.2 Production Environment Variables

```env
# Backend Production
STRIPE_SECRET_KEY=sk_live_your_production_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
FRONTEND_URL=https://your-production-domain.com

# Frontend Production  
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_production_publishable_key
NEXT_PUBLIC_API_URL=https://your-api-domain.com
NEXT_PUBLIC_FRONTEND_URL=https://your-production-domain.com
```

### 7.3 Security Considerations

- **Use HTTPS** for all production URLs
- **Verify webhook signatures** (already implemented)
- **Validate payment amounts** server-side (already implemented)
- **Log payment events** for audit purposes
- **Monitor for suspicious activity**

## Step 8: Customization

### 8.1 Payment Amount

To change the premium price, update these files:

**Backend** (`app/api/stripe.py`):
```python
"unit_amount": 999,  # $9.99 in cents
```

**Frontend** (payment pages):
```typescript
<span className="text-5xl font-bold text-green-600">$9.99</span>
```

### 8.2 Premium Features

To add/modify premium features, update:

**Backend** (`app/middleware/premium.py`):
- Add new permission checks
- Modify access control logic

**Frontend** (components):
- Update feature descriptions
- Add new premium-only components

### 8.3 Screenshot Protection

To modify screenshot protection behavior:

**Frontend** (`components/screenshot-protection.tsx`):
- Adjust detection methods
- Customize prevention strategies
- Modify user feedback

## Troubleshooting

### Common Issues

1. **Webhook events not received:**
   - Check webhook endpoint URL is correct
   - Verify webhook secret matches
   - Check server logs for errors
   - Use Stripe CLI for local testing

2. **Payment not upgrading user:**
   - Check webhook processing logs
   - Verify user ID in session metadata
   - Check database updates
   - Review error logs

3. **Screenshot protection not working:**
   - Check browser developer tools for errors
   - Verify user access status API calls
   - Test with different browsers
   - Check JavaScript console for conflicts

4. **API proxy issues:**
   - Verify `NEXT_PUBLIC_API_URL` is correct
   - Check Next.js rewrite configuration
   - Test API endpoints directly
   - Review CORS settings

### Debug Steps

1. **Check server logs:**
   ```bash
   # Backend logs
   tail -f backend/logs/app.log
   
   # Frontend logs  
   npm run dev # Check console output
   ```

2. **Test API endpoints directly:**
   ```bash
   # Check user access
   curl -X GET "http://localhost:8000/api/payment/user-access-info" \
     -H "Cookie: access_token=your_token"
   
   # Test webhook endpoint
   curl -X POST "http://localhost:8000/api/payment/webhook" \
     -H "Content-Type: application/json" \
     -d '{"test": "webhook"}'
   ```

3. **Verify database state:**
   ```javascript
   // Connect to MongoDB and check user documents
   db.users.find({email: "test@example.com"})
   ```

## Support

For additional help:

1. **Stripe Documentation:** https://stripe.com/docs
2. **Stripe Support:** https://support.stripe.com
3. **Application Issues:** Check server logs and browser console
4. **Payment Issues:** Review Stripe Dashboard events and logs

## Security Notes

- Never expose secret keys in frontend code
- Always verify payments server-side
- Use webhook signatures for security
- Monitor for unusual payment patterns
- Keep Stripe libraries updated
- Implement proper error handling
- Use HTTPS in production
- Follow PCI compliance guidelines

---

**Note:** This integration provides a robust premium payment system with strong security measures. The screenshot protection is designed to deter casual copying while understanding that determined users can always find ways around protection. The main goal is to encourage legitimate purchases while providing value to paying customers.