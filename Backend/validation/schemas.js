import { z } from 'zod';

// tighten password
const passwordPolicyMessage =
	'Password must be at least 8 characters and include at least one letter and one number.';

const passwordPolicyRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

// singup schema
export const signUpSchema = z.object({
	body: z.object({
		name: z.string().min(2).max(50),
		email: z.string().email(),
		password: z.string().regex(passwordPolicyRegex, passwordPolicyMessage),
		inviteToken: z.string().min(1).optional(),
	}),
});

//signin schema
export const signInSchema = z.object({
	body: z.object({
		email: z.string().email(),
		password: z.string().min(8),
	}),
});

// create log schema
export const createLogSchema = z.object({
	body: z.object({
		title: z.string().min(1),
		description: z.string().optional().default(''),
		level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
		tags: z.union([z.array(z.string()), z.string()]).optional(),
	}),
});

// update log schema
export const updateLogSchema = z.object({
	body: z.object({
		title: z.string().min(1).optional(),
		description: z.string().optional(),
		level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
		tags: z.union([z.array(z.string()), z.string()]).optional(),
	}),
	params: z.object({ id: z.string().min(1) }),
});
