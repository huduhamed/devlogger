export const PLANS = {
  free: {
    logsPerMonth: 10000,
    members: 5,
    apiKeys: 2,
  },
  pro: {
    logsPerMonth: 250000,
    members: 25,
    apiKeys: 10,
  },
  enterprise: {
    logsPerMonth: 1000000,
    members: 200,
    apiKeys: 50,
  },
};

export function getPlanConfig(plan) {
  return PLANS[plan] || PLANS.free;
}
