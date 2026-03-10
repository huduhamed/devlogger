import Stripe from 'stripe';

// internal imports
import Organization from '../models/Organization.js';
import { getPlanConfig } from '../config/plans.js';
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
}) {
	const filter = orgId ? { _id: orgId } : { 'billing.customerId': customerId };
	if (!filter._id && !filter['billing.customerId']) return null;

	const update = {
		...buildPlanUpdate(plan),
	};

	if (subscriptionId) update['billing.subscriptionId'] = subscriptionId;
	if (status) update['billing.status'] = status;
	if (currentPeriodEnd) update['billing.currentPeriodEnd'] = currentPeriodEnd;
	if (customerId) update['billing.customerId'] = customerId;

	if (Object.keys(update).length === 0) return null;

	return Organization.findOneAndUpdate(filter, update, { new: true });
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
		if (!stripe) return res.status(500).json({ message: 'Stripe not configured' });

		const orgId = req.user?.organization;
		const org = await Organization.findById(orgId);

		if (!org) return res.status(404).json({ message: 'Organization not found' });

		const { plan } = req.body; // 'pro' | 'enterprise'
		if (!isPaidPlan(plan)) {
			return res.status(400).json({ message: 'Invalid plan selected' });
		}

		const priceId = PLAN_PRICE_IDS[plan];
		if (!isStripePriceId(priceId))
			return res.status(400).json({ message: 'Price not configured for selected plan' });

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
		if (!stripe) return res.status(500).json({ message: 'Stripe not configured' });

		const orgId = req.user?.organization;
		const org = await Organization.findById(orgId);

		if (!org) return res.status(404).json({ message: 'Organization not found' });
		if (!org.billing?.customerId) return res.status(400).json({ message: 'No customer to manage' });

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
		if (!stripe) return res.status(500).json({ message: 'Stripe not configured' });

		const sig = req.headers['stripe-signature'];
		if (!sig || !STRIPE_WEBHOOK_SECRET) {
			return res.status(400).json({ message: 'Missing Stripe webhook signature or secret' });
		}

		let event;

		try {
			event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
		} catch (err) {
			return res.status(400).send(`Webhook Error: ${err.message}`);
		}

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
				});
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
		if (!stripe) return res.status(500).json({ message: 'Stripe not configured' });

		const { sessionId } = req.body;
		if (!sessionId) return res.status(400).json({ message: 'Session ID required' });

		const session = await stripe.checkout.sessions.retrieve(sessionId, {
			expand: ['subscription'],
		});

		if (!session) return res.status(404).json({ message: 'Session not found' });

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
