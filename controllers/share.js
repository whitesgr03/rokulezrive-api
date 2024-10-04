import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';

// Variables
const prisma = new PrismaClient();

export const ListShared = [
	asyncHandler(async (req, res) => {
		const { pk } = req.user;

		const sharedFiles = await prisma.sharing.findMany({
			where: {
				members: {
					some: {
						member: { pk: pk },
					},
				},
			},
			select: {
				file: {
					select: {
						id: true,
						name: true,
						size: true,
						type: true,
						secure_url: true,
						owner: {
							select: { username: true },
						},
					},
				},
				members: {
					select: {
						sharedAt: true,
					},
				},
			},
		});

		res.json({
			success: true,
			data: sharedFiles,
			message: 'Get all shared files successfully.',
		});
	}),
];
export const updateSharing = [
	(req, res, next) => {
		const { anyone, usernames } = req.body;

		typeof anyone === 'boolean' && Array.isArray(usernames)
			? next()
			: res.status(400).json({
					success: false,
					message: 'Payloads are invalid.',
			  });
	},
	asyncHandler(async (req, res, next) => {
		const { shareId } = req.params;

		shareId
			? next()
			: res.status(404).json({
					success: false,
					message: 'share id parameter is required.',
			  });
	}),
	asyncHandler(async (req, res, next) => {
		const { fileId } = req.params;

		const file = await prisma.file.findUnique({
			where: { id: fileId },
		});

		file
			? next()
			: res.status(404).json({
					success: false,
					message: 'File could not been found.',
			  });
	}),
	asyncHandler(async (req, res, next) => {
		const { usernames } = req.body;

		const users = await prisma.user.findMany({
			select: {
				username: true,
			},
			orderBy: {
				username: 'asc',
			},
		});

		const invalidUsernames = usernames.reduce((result, currentUsername) => {
			const index = users.findIndex(u => u.username === currentUsername);
			index !== -1 && users.splice(index, 1);
			return index === -1 ? [...result, currentUsername] : result;
		}, []);

		invalidUsernames.length === 0
			? next()
			: res.status(400).json({
					success: false,
					data: invalidUsernames,
					fields: {
						username: 'There are invalid usernames.',
					},
			  });
	}),
	asyncHandler(async (req, res) => {
		const { shareId } = req.params;
		const { anyone, usernames } = req.body;

		const users = await prisma.user.findMany({
			where: { username: { in: usernames } },
			select: {
				pk: true,
			},
			orderBy: {
				pk: 'asc',
			},
		});

		await prisma.sharing.update({
			where: { id: shareId },
			data: {
				anyone,
				members: {
					deleteMany: {},
					createMany: {
						data: users.map(user => ({ memberId: user.pk })),
					},
				},
			},
		});

		res.json({
			success: true,
			message: 'Updated file share successfully.',
		});
	}),
];
