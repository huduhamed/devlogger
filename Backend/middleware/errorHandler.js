// centralized error handling middleware
function errorHandler(err, req, res, next) {
	// eslint-disable-line no-unused-vars
	const status = err.statusCode || 500;

	const payload = {
		success: false,
		message: err.message || 'Internal Server Error',
		requestId: req.requestId,
	};

	if (process.env.NODE_ENV !== 'production') {
		if (err.cause) payload.cause = err.cause.message || String(err.cause);
		payload.stack = err.stack;
	}

	return res.status(status).json(payload);
}

export default errorHandler;
