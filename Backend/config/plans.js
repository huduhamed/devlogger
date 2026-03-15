// plans
export const PLANS = {
	free: {
		logsPerMonth: 20,
		members: 3,
		apiKeys: 2,
	},
	pro: {
		logsPerMonth: 200,
		members: 10,
		apiKeys: 5,
	},
	enterprise: {
		logsPerMonth: 500,
		members: 50,
		apiKeys: 25,
	},
};

export function getPlanConfig(plan) {
	return PLANS[plan] || PLANS.free;
}
