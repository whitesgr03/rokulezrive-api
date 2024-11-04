import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';

// Variables
const prisma = new PrismaClient();

export const verifyAuthorization = (req, res, next) => {
	req.headers?.authorization
		? next()
		: res.status(400).json({
				success: false,
				message: 'Authorization header is required.',
		  });
};
export const verifyBearer = (req, res, next) => {
	const { authorization } = req.headers;

	const [schema, token] = authorization.split(' ');

	const handleSetLocals = () => {
		req.token = token;
		next();
	};

	schema === 'Bearer' && token
		? handleSetLocals()
		: res.status(400).json({
				success: false,
				message: 'The auth-scheme or token are invalid.',
		  });
};
export const verifyToken = asyncHandler(async (req, res, next) => {
	try {
		const decode = jwt.verify(req.token, process.env.SUPABASE_JWT_SECRET);

		const { pk } = await prisma.user.findUnique({
			where: { id: decode.sub },
			select: {
				pk: true,
			},
		});

		req.user = {
			pk,
		};

		next();
	} catch {
		res.status(403).json({
			success: false,
			message: 'The token provided is invalid.',
		});
	}
});
