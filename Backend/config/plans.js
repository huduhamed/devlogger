// plans
export const PLANS = {
	free: {
		logsPerMonth: 10,
		members: 5,
		apiKeys: 2,
	},
	pro: {
		logsPerMonth: 50,
		members: 15,
		apiKeys: 10,
	},
	enterprise: {
		logsPerMonth: 100,
		members: 25,
		apiKeys: 20,
	},
};

export function getPlanConfig(plan) {
	return PLANS[plan] || PLANS.free;
}
