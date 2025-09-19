import { ZodError } from 'zod';

// validation
export function validate(schema) {
	return async function (req, res, next) {
		try {
			const data = await schema.parseAsync({
				body: req.body,
				params: req.params,
				query: req.query,
			});

			// merge parsed body back
			if (data.body) req.body = data.body;
			return next();
		} catch (err) {
			if (err instanceof ZodError) {
				return res.status(400).json({
					success: false,
					message: 'Validation failed',
					issues: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
				});
			}

			return next(err);
		}
	};
}
