import Stripe from 'stripe';

// internal imports
import Organization from '../models/Organization.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { getPlanConfig } from '../config/plans.js';
import { sendSubscriptionConfirmationEmail } from '../utils/sendOrganizationInviteEmail.js';
import {
	FRONTEND_URL,
	STRIPE_SECRET_KEY,
	STRIPE_WEBHOOK_SECRET,
	PRODUCT_PRICE_PRO,
	PRODUCT_PRICE_ENTERPRISE,
} from '../config/env.js';

const stripe = STRIPE_SECRET_KEY
	? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
	: null;

const FRONTEND_BASE_URL = FRONTEND_URL || 'http://localhost:5173';
const PLAN_PRICE_IDS = {
	pro: PRODUCT_PRICE_PRO,
	enterprise: PRODUCT_PRICE_ENTERPRISE,
};

function isStripePriceId(value) {
	return typeof value === 'string' && value.startsWith('price_');
}

function isPaidPlan(plan) {
	return Object.hasOwn(PLAN_PRICE_IDS, plan);
}

function getPlanFromPriceId(priceId) {
	if (priceId === PRODUCT_PRICE_ENTERPRISE) return 'enterprise';
	if (priceId === PRODUCT_PRICE_PRO) return 'pro';
	return null;
}

function buildPlanUpdate(plan) {
	if (!plan) return {};

	const planConfig = getPlanConfig(plan);
	return {
		plan,
		'limits.logsPerMonth': planConfig.logsPerMonth,
		'limits.members': planConfig.members,
	};
}

async function syncOrganizationBilling({
	orgId,
	customerId,
	plan,
	subscriptionId,
	status,
	currentPeriodEnd,
	io,
}) {
	const filter = orgId ? { _id: orgId } : { 'billing.customerId': customerId };
	if (!filter._id && !filter['billing.customerId']) return null;

	const org = await Organization.findOne(filter);
	if (!org) return null;

	const previousPlan = org.plan || 'free';
	const previousStatus = org.billing?.status || null;
	const previousNotifiedPlan = org.billing?.lastPurchaseEmailPlan || null;
	const previousNotifiedSubscriptionId = org.billing?.lastPurchaseEmailSubscriptionId || null;

	if (plan) {
		const planUpdate = buildPlanUpdate(plan);
		if (planUpdate.plan) org.plan = planUpdate.plan;
		if (planUpdate['limits.logsPerMonth'])
			org.limits.logsPerMonth = planUpdate['limits.logsPerMonth'];
		if (planUpdate['limits.members']) org.limits.members = planUpdate['limits.members'];
	}

	if (!org.billing) org.billing = {};
	if (subscriptionId) org.billing.subscriptionId = subscriptionId;
	if (status) org.billing.status = status;
	if (currentPeriodEnd) org.billing.currentPeriodEnd = currentPeriodEnd;
	if (customerId) org.billing.customerId = customerId;

	const nextPlan = org.plan;
	const nextStatus = org.billing?.status || previousStatus;
	const nextSubscriptionId = org.billing?.subscriptionId || subscriptionId || null;

	const becamePaid = !isPaidPlan(previousPlan) && isPaidPlan(nextPlan);
	const changedPaidTier =
		isPaidPlan(previousPlan) && isPaidPlan(nextPlan) && previousPlan !== nextPlan;
	const becameActive =
		!['active', 'trialing'].includes(previousStatus) && ['active', 'trialing'].includes(nextStatus);
	const shouldConsiderSending =
		isPaidPlan(nextPlan) && (becamePaid || changedPaidTier || becameActive);

	let shouldSendEmail = false;
	if (shouldConsiderSending) {
		// Avoid duplicate emails for the same plan + subscription combination.
		const alreadyNotifiedForThisSubscription =
			previousNotifiedPlan === nextPlan &&
			previousNotifiedSubscriptionId &&
			nextSubscriptionId &&
			previousNotifiedSubscriptionId === nextSubscriptionId;
		shouldSendEmail = !alreadyNotifiedForThisSubscription;
	}

	if (shouldSendEmail) {
		try {
			const owner = await User.findById(org.owner).select('name email').lean();
			if (owner?.email) {
				const planConfig = getPlanConfig(nextPlan);
				const planName = nextPlan.charAt(0).toUpperCase() + nextPlan.slice(1);
				await sendSubscriptionConfirmationEmail({
					to: owner.email,
					ownerName: owner.name,
					organizationName: org.name,
					planName,
					benefits: {
						logsPerMonth: planConfig.logsPerMonth,
						members: planConfig.members,
						apiKeys: planConfig.apiKeys,
					},
					manageUrl: `${FRONTEND_BASE_URL}/organization`,
				});
				org.billing.lastPurchaseEmailAt = new Date();
				org.billing.lastPurchaseEmailPlan = nextPlan;
				org.billing.lastPurchaseEmailSubscriptionId = nextSubscriptionId || undefined;
			}
		} catch (err) {
			// Do not fail billing sync if email delivery fails.
			console.error('Subscription confirmation email error', err);
		}

		// Create in-app notification for successful plan upgrade
		try {
			const planName = nextPlan.charAt(0).toUpperCase() + nextPlan.slice(1);
			let notificationText = '';
			if (becamePaid && previousPlan === 'free') {
				notificationText = `Welcome! You've successfully upgraded to the ${planName} plan. Check your email for plan details and benefits.`;
			} else if (changedPaidTier) {
				const previousPlanName = previousPlan.charAt(0).toUpperCase() + previousPlan.slice(1);
				notificationText = `Your subscription has been upgraded from ${previousPlanName} to ${planName}. Check your email for your new plan benefits.`;
			} else if (becameActive) {
				notificationText = `Your ${planName} subscription is now active. You can now access all plan features.`;
			}

			if (notificationText) {
				const notification = await Notification.create({
					user: org.owner,
					organization: org._id,
					text: notificationText,
					data: {
						type: 'subscription_upgrade',
						plan: nextPlan,
						previousPlan,
					},
				});

				// Emit real-time notification via Socket.IO if io is available
				if (io) {
					try {
						io.to(`user:${org.owner.toString()}`).emit('notification', notification);
						io.to(`org:${org._id.toString()}`).emit('notification', notification);
					} catch (socketErr) {
						console.error('Socket.IO emit error', socketErr);
					}
				}
			}
		} catch (err) {
			// Do not fail billing sync if notification creation fails.
			console.error('An error occured, please try again later.', err);
		}
	}

	await org.save();
	return org;
}

// billing
export function getBillingConfig(_req, res) {
	const configured = Boolean(
		STRIPE_SECRET_KEY &&
		isStripePriceId(PRODUCT_PRICE_PRO) &&
		isStripePriceId(PRODUCT_PRICE_ENTERPRISE),
	);
	res.json({
		configured,
		prices: {
			pro: isStripePriceId(PRODUCT_PRICE_PRO),
			enterprise: isStripePriceId(PRODUCT_PRICE_ENTERPRISE),
		},
		frontendUrl: FRONTEND_BASE_URL,
	});
}

// checkout session
export async function createCheckoutSession(req, res, next) {
	try {
		if (!stripe)
			return res
				.status(500)
				.json({ message: 'Billing is temporarily unavailable. Please try again shortly.' });

		const orgId = req.user?.organization;
		const org = await Organization.findById(orgId);

		if (!org) return res.status(404).json({ message: 'Workspace not found.' });

		const { plan } = req.body; // 'pro' | 'enterprise'
		if (!isPaidPlan(plan)) {
			return res.status(400).json({ message: 'Please select a valid plan.' });
		}

		const priceId = PLAN_PRICE_IDS[plan];
		if (!isStripePriceId(priceId))
			return res
				.status(400)
				.json({ message: 'This plan is not available right now. Please try again later.' });

		// Ensure customer
		let customerId = org.billing?.customerId;

		if (!customerId) {
			const customer = await stripe.customers.create({
				name: org.name,
				metadata: { orgId: org._id.toString(), slug: org.slug },
			});

			customerId = customer.id;
			org.billing = { ...(org.billing || {}), customerId };

			await org.save();
		}

		const session = await stripe.checkout.sessions.create({
			mode: 'subscription',
			customer: customerId,
			line_items: [{ price: priceId, quantity: 1 }],
			success_url: `${FRONTEND_BASE_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${FRONTEND_BASE_URL}/pricing`,
			metadata: { orgId: org._id.toString(), plan },
		});

		return res.status(200).json({ url: session.url });
	} catch (err) {
		next(err);
	}
}

export async function createPortalSession(req, res, next) {
	try {
		if (!stripe)
			return res
				.status(500)
				.json({ message: 'Billing is temporarily unavailable. Please try again shortly.' });

		const orgId = req.user?.organization;
		const org = await Organization.findById(orgId);

		if (!org) return res.status(404).json({ message: 'Workspace not found.' });
		if (!org.billing?.customerId)
			return res
				.status(400)
				.json({ message: 'No billing account was found for this workspace yet.' });

		const portal = await stripe.billingPortal.sessions.create({
			customer: org.billing.customerId,
			return_url: `${FRONTEND_BASE_URL}/organization`,
		});

		return res.status(200).json({ url: portal.url });
	} catch (err) {
		next(err);
	}
}

export async function stripeWebhook(req, res) {
	try {
		if (!stripe)
			return res
				.status(500)
				.json({ message: 'Billing is temporarily unavailable. Please try again shortly.' });

		const sig = req.headers['stripe-signature'];
		if (!sig || !STRIPE_WEBHOOK_SECRET) {
			return res.status(400).json({ message: 'An error occured, please try again.' });
		}

		let event;

		try {
			event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
		} catch (err) {
			return res.status(400).send(`Webhook Error: ${err.message}`);
		}

		const io = req.app.get('io');
		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object;
				const orgId = session.metadata?.orgId;
				const customerId = session.customer;
				const plan = isPaidPlan(session.metadata?.plan)
					? session.metadata.plan
					: getPlanFromPriceId(session.line_items?.data?.[0]?.price?.id);
				const subscriptionId = session.subscription;

				if ((orgId || customerId) && subscriptionId) {
					await syncOrganizationBilling({
						orgId,
						customerId,
						plan,
						subscriptionId,
						status: 'active',
						io,
					});
				}
				break;
			}
			case 'customer.subscription.updated':
			case 'customer.subscription.created':

			case 'customer.subscription.deleted': {
				const sub = event.data.object;
				const customerId = sub.customer;
				const status = sub.status;
				const plan = getPlanFromPriceId(sub.items?.data?.[0]?.price?.id);
				const currentPeriodEnd = new Date(sub.current_period_end * 1000);

				await syncOrganizationBilling({
					customerId,
					plan,
					subscriptionId: sub.id,
					status,
					currentPeriodEnd,
					io,
				});
				break;
			}
			case 'invoice.payment_failed': {
				const invoice = event.data.object;
				const customerId = invoice.customer;

				try {
					const org = await Organization.findOne({
						'billing.customerId': customerId,
					});

					if (org) {
						const notification = await Notification.create({
							user: org.owner,
							organization: org._id,
							text: 'Payment failed for your subscription. Please update your payment method to avoid service interruption.',
							data: {
								type: 'payment_failed',
								subscriptionId: invoice.subscription,
								attemptCount: invoice.attempt_count || 1,
							},
						});

						// Emit real-time notification via Socket.IO if io is available
						if (io) {
							try {
								io.to(`user:${org.owner.toString()}`).emit('notification', notification);
								io.to(`org:${org._id.toString()}`).emit('notification', notification);
							} catch (socketErr) {
								console.error('Socket.IO emit error', socketErr);
							}
						}
					}
				} catch (err) {
					console.error('Payment failed notification error', err);
				}

				break;
			}
			default:
				break;
		}

		res.json({ received: true });
	} catch (err) {
		console.error('Stripe webhook error', err);
		res.status(500).end();
	}
}

// verify checkout session
export async function verifyCheckoutSession(req, res, next) {
	try {
		if (!stripe)
			return res
				.status(500)
				.json({ message: 'Billing is temporarily unavailable. Please try again shortly.' });

		const { sessionId } = req.body;
		if (!sessionId)
			return res
				.status(400)
				.json({ message: 'Missing checkout session details. Please try again.' });

		const session = await stripe.checkout.sessions.retrieve(sessionId, {
			expand: ['subscription'],
		});

		if (!session) return res.status(404).json({ message: 'An error occured, please try again.' });

		const subscription =
			session.subscription && typeof session.subscription === 'object'
				? session.subscription
				: null;
		const plan = isPaidPlan(session.metadata?.plan)
			? session.metadata.plan
			: getPlanFromPriceId(subscription?.items?.data?.[0]?.price?.id);
		const subscriptionStatus = subscription?.status || null;
		const isSuccessful =
			session.status === 'complete' &&
			(!subscriptionStatus || ['active', 'trialing'].includes(subscriptionStatus));

		if (isSuccessful && (session.metadata?.orgId || session.customer)) {
			await syncOrganizationBilling({
				orgId: session.metadata?.orgId,
				customerId: session.customer,
				plan,
				subscriptionId: subscription?.id || session.subscription,
				status: subscriptionStatus || 'active',
				currentPeriodEnd: subscription?.current_period_end
					? new Date(subscription.current_period_end * 1000)
					: undefined,
			});
		}

		return res.status(200).json({
			success: isSuccessful,
			status: session.status,
			paymentStatus: session.payment_status,
			subscriptionStatus,
			subscriptionId: session.subscription,
		});
	} catch (err) {
		next(err);
	}
}
