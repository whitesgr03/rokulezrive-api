import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getFolder = [
	asyncHandler(async (req, res) => {
		const { pk } = req.user;
		const { folderId } = req.params;

		let where = { ownerId: pk };

		folderId ? (where.id = folderId) : (where.parentId = null);

		const folder = await prisma.folder.findFirst({
			where,
			select: {
				id: true,
				name: true,
				parent: {
					select: {
						id: true,
					},
				},
				children: {
					select: {
						id: true,
						name: true,
						createdAt: true,
					},
				},
				files: {
					select: {
						id: true,
						name: true,
						size: true,
						createdAt: true,
					},
				},
			},
		});

		res.json({
			success: true,
			data: folder,
			message: 'Get folder successfully.',
		});
	}),
];

export const createFolder = [asyncHandler(async (req, res, next) => {})];
