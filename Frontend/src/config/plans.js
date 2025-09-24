export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthly: 0,
    logsPerMonth: 10000,
    members: 5,
    apiKeys: 2,
    blurb: 'Get started with logging basics',
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 19,
    logsPerMonth: 250000,
    members: 25,
    apiKeys: 10,
    blurb: 'Scale your team and log volume',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 99,
    logsPerMonth: 1000000,
    members: 200,
    apiKeys: 50,
    blurb: 'Custom limits and priority support',
  },
};

export function getPlan(plan) {
  return PLANS[plan] || PLANS.free;
}

export const PLAN_ORDER = ['free', 'pro', 'enterprise'];
