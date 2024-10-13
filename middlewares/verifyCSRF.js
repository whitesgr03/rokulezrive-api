export const verifyCSRF = (req, res, next) => {
	req.xhr
		? next()
		: res.status(403).json({
				success: false,
				message: 'This request requires higher permissions.',
		  });
};
