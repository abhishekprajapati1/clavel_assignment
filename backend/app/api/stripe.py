import stripe
from fastapi import APIRouter, HTTPException, Request, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime
import json
import logging

from app.core.database import get_database
from app.core.config import settings
from app.api.auth import get_current_user
from app.schemas.auth import UserDetailsResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize Stripe with settings
stripe.api_key = settings.STRIPE_SECRET_KEY
logger.info("Stripe API initialized successfully")

@router.post("/create-checkout-session")
async def create_checkout_session(
    request: Request,
    current_user: UserDetailsResponse = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    """Create a Stripe checkout session for premium upgrade"""

    try:
        # Check if user is already premium
        user_collection = db.templater.users
        user_doc = await user_collection.find_one({"_id": ObjectId(current_user.id)})

        if user_doc and user_doc.get("is_premium", False):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has premium access"
            )

        # Create or get Stripe customer
        stripe_customer_id = user_doc.get("stripe_customer_id") if user_doc else None

        if not stripe_customer_id:
            # Create new Stripe customer
            customer = stripe.Customer.create(
                email=current_user.email,
                name=f"{current_user.first_name} {current_user.last_name}",
                metadata={"user_id": current_user.id}
            )
            stripe_customer_id = customer.id

            # Update user with Stripe customer ID
            await user_collection.update_one(
                {"_id": ObjectId(current_user.id)},
                {"$set": {"stripe_customer_id": stripe_customer_id}}
            )

        # Create checkout session
        session = stripe.checkout.Session.create(
            customer=stripe_customer_id,
            payment_method_types=["card"],
            mode="payment",
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "unit_amount": 999,  # $9.99 for premium access
                    "product_data": {
                        "name": "Templater Premium Access",
                        "description": "Unlock template downloads and screenshot permissions",
                        "images": []
                    }
                },
                "quantity": 1
            }],
            success_url=f"{settings.FRONTEND_URL}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{settings.FRONTEND_URL}/payment/cancel",
            metadata={
                "user_id": current_user.id,
                "upgrade_type": "premium"
            }
        )

        logger.info(f"Created checkout session {session.id} for user {current_user.id}")
        return {"checkout_url": session.url, "session_id": session.id}

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment processing error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error creating checkout session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create checkout session"
        )


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    db: AsyncIOMotorClient = Depends(get_database)
):
    """Handle Stripe webhook events"""

    payload = await request.body()
    sig_header = request.headers.get('stripe-signature')

    # Handle webhook signature verification (optional in test mode)
    if settings.STRIPE_WEBHOOK_SECRET:
        # Production mode - verify webhook signature
        if not sig_header:
            logger.error("Missing stripe-signature header")
            raise HTTPException(status_code=400, detail="Missing stripe-signature header")

        try:
            # Verify webhook signature
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            logger.error(f"Invalid payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {e}")
            raise HTTPException(status_code=400, detail="Invalid signature")
    else:
        # Test mode - skip signature verification
        logger.warning("STRIPE_WEBHOOK_SECRET not set - skipping signature verification (test mode)")
        try:
            event = json.loads(payload.decode('utf-8'))
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # Handle the event
    try:
        if event['type'] == 'checkout.session.completed':
            await handle_checkout_session_completed(event['data']['object'], db)
        elif event['type'] == 'payment_intent.succeeded':
            await handle_payment_intent_succeeded(event['data']['object'], db)
        elif event['type'] == 'payment_intent.payment_failed':
            await handle_payment_failed(event['data']['object'], db)
        else:
            logger.info(f"Unhandled event type: {event['type']}")

        return {"status": "success"}

    except Exception as e:
        logger.error(f"Error handling webhook: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook processing failed"
        )


async def handle_checkout_session_completed(session, db: AsyncIOMotorClient):
    """Handle successful checkout session completion"""

    user_id = session.get('metadata', {}).get('user_id')
    if not user_id:
        logger.error("No user_id in session metadata")
        return

    try:
        user_collection = db.templater.users

        # Update user to premium status
        result = await user_collection.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "is_premium": True,
                    "premium_activated_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
            }
        )

        if result.modified_count > 0:
            logger.info(f"Successfully upgraded user {user_id} to premium")

            # Log the upgrade for analytics
            upgrades_collection = db.templater.premium_upgrades
            await upgrades_collection.insert_one({
                "user_id": ObjectId(user_id),
                "stripe_session_id": session['id'],
                "amount_paid": session.get('amount_total', 0),
                "currency": session.get('currency', 'usd'),
                "created_at": datetime.utcnow()
            })
        else:
            logger.error(f"Failed to update user {user_id} to premium")

    except Exception as e:
        logger.error(f"Error upgrading user {user_id} to premium: {str(e)}")


async def handle_payment_intent_succeeded(payment_intent, db: AsyncIOMotorClient):
    """Handle successful payment intent"""
    logger.info(f"Payment succeeded: {payment_intent['id']}")


async def handle_payment_failed(payment_intent, db: AsyncIOMotorClient):
    """Handle failed payment"""
    logger.warning(f"Payment failed: {payment_intent['id']}")


@router.get("/verify-session/{session_id}")
async def verify_session(
    session_id: str,
    current_user: UserDetailsResponse = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    """Verify payment session and return user's premium status"""

    try:
        # Retrieve the session from Stripe
        session = stripe.checkout.Session.retrieve(session_id)

        # Verify the session belongs to the current user
        if session.metadata.get('user_id') != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Session does not belong to current user"
            )

        # Get updated user status from database
        user_collection = db.templater.users
        user_doc = await user_collection.find_one({"_id": ObjectId(current_user.id)})

        # Check if payment is completed but user is not yet premium (auto-upgrade)
        is_premium = user_doc.get("is_premium", False) if user_doc else False

        # If payment is completed but user is not premium, upgrade them automatically
        # This handles cases where webhooks didn't process or in test mode
        if session.payment_status == "paid" and not is_premium:
            logger.info(f"Auto-upgrading user {current_user.id} - payment complete but not premium")

            try:
                # Update user to premium status
                result = await user_collection.update_one(
                    {"_id": ObjectId(current_user.id)},
                    {
                        "$set": {
                            "is_premium": True,
                            "premium_activated_at": datetime.utcnow(),
                            "updated_at": datetime.utcnow()
                        }
                    }
                )

                if result.modified_count > 0:
                    logger.info(f"Successfully auto-upgraded user {current_user.id} to premium")
                    is_premium = True

                    # Log the upgrade for analytics
                    upgrades_collection = db.templater.premium_upgrades
                    await upgrades_collection.insert_one({
                        "user_id": ObjectId(current_user.id),
                        "stripe_session_id": session.id,
                        "amount_paid": session.amount_total or 0,
                        "currency": session.currency or 'usd',
                        "auto_upgraded": True,
                        "created_at": datetime.utcnow()
                    })
                else:
                    logger.warning(f"Failed to auto-upgrade user {current_user.id} to premium")

            except Exception as e:
                logger.error(f"Error auto-upgrading user {current_user.id} to premium: {str(e)}")

        return {
            "session_id": session_id,
            "payment_status": session.payment_status,
            "is_premium": is_premium,
            "amount_paid": session.amount_total,
            "currency": session.currency
        }

    except stripe.error.StripeError as e:
        logger.error(f"Stripe error verifying session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid session ID"
        )
    except Exception as e:
        logger.error(f"Error verifying session: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify session"
        )


@router.get("/user-access-info")
async def get_user_access_info(
    current_user: UserDetailsResponse = Depends(get_current_user),
    db: AsyncIOMotorClient = Depends(get_database)
):
    """Get user's current access information"""

    try:
        user_collection = db.templater.users
        user_doc = await user_collection.find_one({"_id": ObjectId(current_user.id)})

        is_premium = user_doc.get("is_premium", False) if user_doc else False
        is_admin = current_user.role == "admin"
        has_access = is_premium or is_admin

        return {
            "user_id": current_user.id,
            "email": current_user.email,
            "role": current_user.role,
            "is_premium": is_premium,
            "has_premium_access": has_access,
            "can_download": has_access,
            "can_screenshot": has_access,
            "premium_activated_at": user_doc.get("premium_activated_at") if user_doc else None,
            "upgrade_required": not has_access
        }

    except Exception as e:
        logger.error(f"Error getting user access info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user access information"
        )




@router.get("/config-test")
async def test_stripe_config():
    """Test Stripe configuration and connectivity"""

    config_status = {
        "stripe_configured": False,
        "environment_variables": {
            "STRIPE_SECRET_KEY": bool(settings.STRIPE_SECRET_KEY),
            "STRIPE_WEBHOOK_SECRET": bool(settings.STRIPE_WEBHOOK_SECRET),
            "FRONTEND_URL": bool(settings.FRONTEND_URL)
        },
        "stripe_api_accessible": False,
        "webhook_mode": "production" if settings.STRIPE_WEBHOOK_SECRET else "test",
        "errors": [],
        "warnings": []
    }

    # Check if required environment variables are set
    if settings.STRIPE_SECRET_KEY and settings.FRONTEND_URL:
        config_status["stripe_configured"] = True
    else:
        if not settings.STRIPE_SECRET_KEY:
            config_status["errors"].append("STRIPE_SECRET_KEY not set")
        if not settings.FRONTEND_URL:
            config_status["errors"].append("FRONTEND_URL not set")

    # Add warning about webhook secret in test mode
    if not settings.STRIPE_WEBHOOK_SECRET:
        config_status["warnings"].append("STRIPE_WEBHOOK_SECRET not set - webhook signature verification disabled (test mode)")

    # Test Stripe API connectivity
    try:
        # Try to retrieve account information to test API key
        account = stripe.Account.retrieve()
        config_status["stripe_api_accessible"] = True
        config_status["account_id"] = account.id
        config_status["account_country"] = account.country
        config_status["charges_enabled"] = account.charges_enabled
    except stripe.error.AuthenticationError as e:
        config_status["errors"].append(f"Stripe authentication failed: {str(e)}")
    except stripe.error.StripeError as e:
        config_status["errors"].append(f"Stripe API error: {str(e)}")
    except Exception as e:
        config_status["errors"].append(f"Unexpected error: {str(e)}")

    return config_status
