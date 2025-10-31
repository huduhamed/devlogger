// plans
export const PLANS = {
	free: {
		id: 'free',
		name: 'Free',
		priceMonthly: 0,
		logsPerMonth: 10,
		members: 3,
		apiKeys: 2,
		blurb: 'Get started with logging basics',
	},
	pro: {
		id: 'pro',
		name: 'Pro',
		priceMonthly: 19,
		logsPerMonth: 25,
		members: 15,
		apiKeys: 10,
		blurb: 'Scale your team and log volume',
	},
	enterprise: {
		id: 'enterprise',
		name: 'Enterprise',
		priceMonthly: 99,
		logsPerMonth: 100,
		members: 50,
		apiKeys: 50,
		blurb: 'Custom limits and priority support',
	},
};

// get plan
export function getPlan(plan) {
	return PLANS[plan] || PLANS.free;
}

// plan order
export const PLAN_ORDER = ['free', 'pro', 'enterprise'];
