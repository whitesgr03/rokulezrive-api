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

export const createShared = [
	(req, res, next) => {
		const { usernames } = req.body;

		usernames
			? next()
			: res.status(400).json({
					success: false,
					message: 'Usernames are required.',
			  });
	},
	(req, res, next) => {
		const { fileId } = req.body;

		fileId
			? next()
			: res.status(400).json({
					success: false,
					message: 'File id is required.',
			  });
	},
	asyncHandler(async (req, res, next) => {
		const { fileId } = req.body;

		const file = await prisma.file.findUnique({
			where: { id: fileId },
			select: {
				pk: true,
			},
		});

		const handleSetLocalVariable = () => {
			req.file = file;
			next();
		};

		file
			? handleSetLocalVariable()
			: res.status(404).json({
					success: false,
					message: 'File could not been found.',
			  });
	}),
	asyncHandler(async (req, res, next) => {
		const { usernames } = req.body;

		const users = await prisma.user.findMany({
			where: { pk: { not: req.user.pk } },
			select: {
				username: true,
			},
			orderBy: {
				pk: 'asc',
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
		const { pk: filePk } = req.file;
		const { usernames } = req.body;

		const users = await prisma.user.findMany({
			where: { username: { in: usernames } },
			select: {
				pk: true,
			},
			orderBy: {
				pk: 'asc',
			},
		});

		const shared = users.map(user => ({
			memberId: user.pk,
			fileId: filePk,
		}));

		await prisma.sharing.createMany({
			data: shared,
		});

		res.json({
			success: true,
			message: 'Share file successfully.',
		});
	}),
];
