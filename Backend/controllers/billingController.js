import Stripe from 'stripe';

// internal imports
import Organization from '../models/Organization.js';
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

// billing
export function getBillingConfig(_req, res) {
	const configured = Boolean(STRIPE_SECRET_KEY && PRODUCT_PRICE_PRO && PRODUCT_PRICE_ENTERPRISE);
	res.json({
		configured,
		prices: {
			pro: Boolean(PRODUCT_PRICE_PRO),
			enterprise: Boolean(PRODUCT_PRICE_ENTERPRISE),
		},
		frontendUrl: FRONTEND_URL || 'http://localhost:5173',
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
		const priceId = plan === 'enterprise' ? PRODUCT_PRICE_ENTERPRISE : PRODUCT_PRICE_PRO;
		if (!priceId)
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
			success_url: `${FRONTEND_URL}/organization?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${FRONTEND_URL}/organization`,
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
			return_url: `${FRONTEND_URL}/organization`,
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
		let event;

		try {
			event = stripe.webhooks.constructEvent(req.rawBody, sig, STRIPE_WEBHOOK_SECRET);
		} catch (err) {
			return res.status(400).send(`Webhook Error: ${err.message}`);
		}

		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object;
				const orgId = session.metadata?.orgId;
				const plan = session.metadata?.plan;
				const subscriptionId = session.subscription;

				if (orgId && subscriptionId) {
					await Organization.findByIdAndUpdate(orgId, {
						plan: plan === 'enterprise' ? 'enterprise' : 'pro',
						'billing.subscriptionId': subscriptionId,
						'billing.status': 'active',
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

				const currentPeriodEnd = new Date(sub.current_period_end * 1000);
				const org = await Organization.findOne({ 'billing.customerId': customerId });

				if (org) {
					await Organization.updateOne(
						{ _id: org._id },
						{
							'billing.subscriptionId': sub.id,
							'billing.status': status,
							'billing.currentPeriodEnd': currentPeriodEnd,
						}
					);
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
