import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';

import { verifyData } from '../middlewares/verifyData.js';

const prisma = new PrismaClient();

export const listFolders = [
	asyncHandler(async (req, res) => {
		const { pk } = req.user;

		const folders = await prisma.folder.findMany({
			where: { ownerId: pk },
			select: {
				id: true,
				name: true,
				parent: {
					select: {
						name: true,
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
			orderBy: {
				createdAt: 'asc',
			},
		});

		res.json({
			success: true,
			data: folders,
			message: 'Get all folders successfully.',
		});
	}),
];

export const getFolder = [
	asyncHandler(async (req, res) => {
		const { pk } = req.user;
		const { folderId } = req.params;

		const folder = await prisma.folder.findFirst({
			where: { ownerId: pk, folderId },
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

export const createFolder = [
	verifyData({
		name: {
			trim: true,
			notEmpty: {
				errorMessage: 'Folder name is required.',
				bail: true,
			},
			isLength: {
				options: { max: 200 },
				errorMessage: 'Folder name must be less then 200 letters.',
				bail: true,
			},
		},
		parentId: {
			notEmpty: {
				errorMessage: 'Parent ID is required.',
			},
		},
	}),
	asyncHandler(async (req, res, next) => {
		const { parentId } = req.body;

		const parentFolder = await prisma.folder.findUnique({
			where: { id: parentId },
			select: {
				pk: true,
				ownerId: true,
			},
		});

		const handleSetLocalVariable = () => {
			req.folder = parentFolder;
			next();
		};

		parentFolder
			? handleSetLocalVariable()
			: res.status(404).json({
					success: false,
					message: 'Parent folder could not been found.',
			  });
	}),
	asyncHandler(async (req, res, next) => {
		const { ownerId } = req.folder;

		ownerId === req.user.pk
			? next()
			: res.status(403).json({
					success: false,
					message: 'This request requires higher permissions.',
			  });
	}),
	asyncHandler(async (req, res) => {
		const { name } = req.body;
		const { pk: ownerId } = req.user;
		const { pk: parentId } = req.folder;

		await prisma.folder.create({
			data: {
				name,
				ownerId,
				parentId,
			},
		});

		res.json({
			success: true,
			message: 'Create subfolder successfully.',
		});
	}),
];
