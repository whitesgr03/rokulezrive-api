import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Variables
const prisma = new PrismaClient();

export const verifyToken = (req, res, next) => {
	const { authorization } = req.headers;
	const token = authorization && authorization.split(' ')[1];

	const decode = token && jwt.verify(token, process.env.SUPABASE_JWT_SECRET);

	const handleSetLocals = async () => {
		const { sub } = decode;

		const user = await prisma.user.findUnique({
			where: { id: sub },
			select: {
				pk: true,
			},
		});

		req.user = {
			pk: user.pk,
		};

		next();
	};

	decode
		? handleSetLocals()
		: res.status(400).json({
				success: false,
				message: 'The token provided is invalid.',
		  });
};
