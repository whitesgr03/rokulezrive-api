import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import { prisma } from '../lib/prisma.js';

export const authorization = [
	(req, res, next) => {
		req.headers?.authorization
			? next()
			: res.status(400).json({
					success: false,
					message: 'Authorization header is required.',
			  });
	},
	(req, res, next) => {
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
	},
	(req, res, next) => {
		try {
			const { sub } = jwt.verify(req.token, process.env.SUPABASE_JWT_SECRET);

			req.sub = sub;

			next();
		} catch {
			res.status(403).json({
				success: false,
				message: 'The token provided is invalid.',
			});
		}
	},
	asyncHandler(async (req, res, next) => {
		const user = await prisma.user.findUnique({
			where: { id: req.sub },
			select: {
				pk: true,
			},
		});

		const handleSetLocals = () => {
			req.user = {
				pk: user.pk,
			};
			next();
		};

		user
			? handleSetLocals()
			: res.status(404).json({
					success: false,
					message: 'User could not been found.',
			  });
	}),
];
