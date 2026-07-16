module.exports = (timeoutMs = 30000) => {
	return (_req, res, next) => {
		const timeoutId = setTimeout(() => {
			if (!res.headersSent) {
				res.status(408).json({
					status: false,
					httpStatus: 408,
					desc: 'Request timeout - server did not respond in time',
					timeout: timeoutMs,
				});
			}
		}, timeoutMs);

		const clearTimeoutWrapper = () => {
			clearTimeout(timeoutId);
		};

		res.on('finish', clearTimeoutWrapper);
		res.on('close', clearTimeoutWrapper);
		res.on('error', clearTimeoutWrapper);

		next();
	};
};
