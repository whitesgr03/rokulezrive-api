export const verifyCredentials = (req, res, next) => {
	req.isAuthenticated()
		? next()
		: res.status(401).json({
				success: false,
				message: 'User is not authenticated.',
		  });
};
