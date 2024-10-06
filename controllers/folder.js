// Packages
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';

// Middlewares
import { verifyData } from '../middlewares/verifyData.js';

// Variables
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
						sharing: {
							select: {
								id: true,
								anyone: true,
								members: {
									select: {
										member: {
											select: {
												username: true,
											},
										},
									},
									orderBy: {
										memberId: 'asc',
									},
								},
							},
						},
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
		const { folderId } = req.params;

		const folder = await prisma.folder.findUnique({
			where: { id: folderId },
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
						sharing: {
							select: {
								id: true,
								anyone: true,
								members: {
									select: {
										member: {
											select: {
												username: true,
											},
										},
									},
									orderBy: {
										memberId: 'asc',
									},
								},
							},
						},
					},
					orderBy: {
						pk: 'asc',
					},
				},
			},
		});

		folder
			? res.json({
					success: true,
					data: folder,
					message: 'Get folder successfully.',
			  })
			: res.status(404).json({
					success: false,
					message: 'Folder could not been found.',
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
				errorMessage: 'Parent folder id is required.',
			},
		},
	}),
	asyncHandler(async (req, res, next) => {
		const { parentId } = req.data;
		const { pk: userPk } = req.user;

		const parentFolder = await prisma.folder.findUnique({
			where: { ownerId: userPk, id: parentId },
			select: {
				pk: true,
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
	asyncHandler(async (req, res) => {
		const { name } = req.data;
		const { pk: userPk } = req.user;
		const { pk: parentPk } = req.folder;

		await prisma.folder.create({
			data: {
				name,
				ownerId: userPk,
				parentId: parentPk,
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
		const { pk: userPk } = req.user;
		const { pk: parentFolderPK } = req.parentFolder;
		const { folderId } = req.params;

		const folder = await prisma.folder.findUnique({
			where: { ownerId: userPk, id: folderId, parentId: parentFolderPK },
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
		const { pk: userPk } = req.user;
		const { folderId } = req.params;

		const folder = await prisma.folder.findUnique({
			where: { ownerId: userPk, id: folderId },
			select: {
				pk: true,
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
		const findAllSubfolderPks = (result, subfolderPks, folders) =>
			subfolderPks.length === 0
				? result
				: findAllSubfolderPks(
						[...result, ...subfolderPks],
						subfolderPks.reduce(
							(previousPks, currentPk) => [
								...previousPks,
								...folders
									.splice(
										folders.findIndex(folder => folder.pk === currentPk),
										1
									)[0]
									.children.map(subfolder => subfolder.pk),
							],
							[]
						),
						folders
				  );

		await prisma.$transaction([
			prisma.folder.deleteMany({
				where: {
					ownerId: req.user.pk,
					pk: { in: findAllSubfolderPks([], [pk], [...folders]) },
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
