// plans
export const PLANS = {
	free: {
		id: 'free',
		name: 'Free',
		priceMonthly: 0,
		logsPerMonth: 20,
		members: 3,
		apiKeys: 0,
		blurb: 'Get started with logging basics',
	},
	pro: {
		id: 'pro',
		name: 'Pro',
		priceMonthly: 15,
		logsPerMonth: 200,
		members: 10,
		apiKeys: 10,
		blurb: 'Affordable collaboration for growing teams with real production usage',
		popular: true,
	},
	enterprise: {
		id: 'enterprise',
		name: 'Enterprise',
		priceMonthly: 49,
		logsPerMonth: 500,
		members: 50,
		apiKeys: 20,
		blurb: 'High-volume logging, larger teams and room to scale before custom contracts',
	},
};

// get plan
export function getPlan(plan) {
	return PLANS[plan] || PLANS.free;
}

// plan order
export const PLAN_ORDER = ['free', 'pro', 'enterprise'];
