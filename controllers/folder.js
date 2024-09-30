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
					orderBy: {
						pk: 'asc',
					},
				},
				files: {
					select: {
						id: true,
						name: true,
						size: true,
						type: true,
						secure_url: true,
						createdAt: true,
					},
					orderBy: {
						pk: 'asc',
					},
				},
			},
			orderBy: {
				pk: 'asc',
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

export const updateFolder = [
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
	}),
	asyncHandler(async (req, res, next) => {
		const { folderId } = req.params;

		const folder = await prisma.folder.findUnique({
			where: { id: folderId },
			select: {
				ownerId: true,
			},
		});

		const handleSetLocalVariable = () => {
			req.folder = folder;
			next();
		};

		folder
			? handleSetLocalVariable()
			: res.status(404).json({
					success: false,
					message: 'Folder could not been found.',
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
		const { folderId } = req.params;

		await prisma.folder.update({
			where: { id: folderId },
			data: {
				name,
			},
		});

		res.json({
			success: true,
			message: 'Update folder successfully.',
		});
	}),
];

export const deleteFolder = [
	asyncHandler(async (req, res, next) => {
		const { folderId } = req.params;

		const folder = await prisma.folder.findUnique({
			where: { id: folderId },
			select: {
				pk: true,
				ownerId: true,
			},
		});

		const handleSetLocalVariable = () => {
			req.folder = folder;
			next();
		};

		folder
			? handleSetLocalVariable()
			: res.status(404).json({
					success: false,
					message: 'Folder could not been found.',
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
		const { pk } = req.folder;

		const folders = await prisma.folder.findMany({
			where: { ownerId: req.user.pk },
			select: {
				pk: true,
				children: {
					select: {
						pk: true,
					},
				},
			},
			orderBy: {
				pk: 'asc',
			},
		});

		// for loop recursion
		// const get = (result, arrPk, folders) => {
		// 	if (arrPk.length === 0) {
		// 		return result;
		// 	} else {
		// 		const f = [...folders];
		// 		const children = [];
		// 		for (const p of arrPk) {
		// 			const target = f.find(folder => folder.pk === p);
		// 			if (target.children.length !== 0) {
		// 				for (const f of target.children) {
		// 					children.push(f.pk);
		// 				}
		// 			}
		// 		}
		// 		return get([...result, ...arrPk], children, f);
		// 	}
		// };
		// console.log(get([], [pk], folders));
		const findAllSubfolderPks = (result, subfolderPks, folders) => {
			const copyFolders = [...folders];
			return subfolderPks.length === 0
				? result
				: findAllSubfolderPks(
						[...result, ...subfolderPks],
						subfolderPks.reduce(
							(previousPks, currentPk) => [
								...previousPks,
								...copyFolders
									.splice(
										copyFolders.findIndex(folder => folder.pk === currentPk),
										1
									)[0]
									.children.map(subfolder => subfolder.pk),
							],
							[]
						),
						copyFolders
				  );
		};

		await prisma.$transaction([
			prisma.folder.deleteMany({
				where: {
					ownerId: req.user.pk,
					pk: { in: findAllSubfolderPks([], [pk], folders) },
				},
			}),
			prisma.file.deleteMany({
				where: { ownerId: req.user.pk, folderId: null },
			}),
		]);

		res.json({
			success: true,
			message: 'Delete folder successfully.',
		});
	}),
];
