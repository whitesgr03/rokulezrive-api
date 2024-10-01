import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';

// Variables
const prisma = new PrismaClient();

export const ListShared = [
	asyncHandler(async (req, res) => {
		const { pk } = req.user;

		const sharedFiles = await prisma.sharing.findMany({
			where: { memberId: pk },
			select: {
				id: true,
				duration: true,
				createdAt: true,
				file: {
					select: {
						id: true,
						name: true,
						size: true,
						type: true,
						secure_url: true,
						owner: {
							select: {
								username: true,
							},
						},
					},
				},
			},
			orderBy: {
				pk: 'asc',
			},
		});

		res.json({
			success: true,
			data: sharedFiles,
			message: 'Get all shared files successfully.',
		});
	}),
];
