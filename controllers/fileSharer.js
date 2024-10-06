import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';

// Variables
const prisma = new PrismaClient();

export const listFileSharers = [
	asyncHandler(async (req, res) => {
		const { pk: userPk } = req.user;

		const sharedFiles = await prisma.fileSharers.findMany({
			where: { sharerId: userPk },
			select: {
				sharedAt: true,
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
				sharedAt: 'asc',
			},
		});

		res.json({
			success: true,
			data: sharedFiles,
			message: 'Get shared files successfully.',
		});
	}),
];

export const deleteFileSharer = [
	asyncHandler(async (req, res, next) => {
		const { pk: userPk } = req.user;
		const { sharedFilesId } = req.params;

		const sharedFile = await prisma.file.findUnique({
			where: { id: sharedFilesId },
			select: {
				pk: true,
				sharers: {
					where: {
						sharerId: userPk,
					},
				},
			},
		});

		const handleSetLocalVariable = () => {
			req.sharedFile = sharedFile;
			next();
		};

		sharedFile.sharers.length
			? handleSetLocalVariable()
			: res.status(404).json({
					success: false,
					message: 'Shared file could not been found.',
			  });
	}),
	asyncHandler(async (req, res) => {
		const { pk: userPk } = req.user;
		const { pk: sharedFilePk } = req.sharedFile;

		await prisma.file.update({
			where: { pk: sharedFilePk },
			data: {
				sharers: {
					deleteMany: [
						{
							sharerId: userPk,
						},
					],
				},
			},
		});

		res.json({
			success: true,
			message: 'Delete shared file successfully.',
		});
	}),
];
