// Packages
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { checkSchema } from 'express-validator';

// Middlewares
import { verifyData } from '../middlewares/verifyData.js';

// Variables
const prisma = new PrismaClient();

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
				subfolders: {
					select: {
						id: true,
						name: true,
						createdAt: true,
						_count: {
							select: {
								subfolders: true,
								files: true,
							},
						},
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
						createdAt: true,
						sharers: {
							select: {
								sharer: {
									select: {
										id: true,
										email: true,
									},
								},
							},
						},
						public: {
							select: {
								id: true,
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
		const { pk: userPk } = req.user;
		const { folderId } = req.params;

		const folder = await prisma.folder.findUnique({
			where: { ownerId: userPk, id: folderId },
			select: {
				id: true,
				name: true,
				parent: {
					select: {
						name: true,
						id: true,
					},
				},
				subfolders: {
					select: {
						id: true,
						name: true,
						createdAt: true,
						_count: {
							select: {
								subfolders: true,
								files: true,
							},
						},
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
						createdAt: true,
						sharers: {
							select: {
								sharer: {
									select: {
										id: true,
										email: true,
									},
								},
							},
						},
						public: {
							select: {
								id: true,
							},
						},
					},
					orderBy: {
						pk: 'asc',
					},
				},
			},
		});

		const newFiles = folder?.files.map(file => ({
			...file,
			url: cloudinary.url(`${folder.id}/${file.id}`, {
				resource_type: file.type,
				sign_url: true,
				type: 'private',
			}),
		}));

		folder
			? res.json({
					success: true,
					data: { ...folder, files: newFiles },
					message: 'Get folder successfully.',
			  })
			: res.status(404).json({
					success: false,
					message: 'Folder could not been found.',
			  });
	}),
];

export const createFolder = [
	checkSchema({
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
		folderId: {
			notEmpty: {
				errorMessage: 'Parent folder id is required.',
			},
		},
	}),
	verifyData,
	asyncHandler(async (req, res, next) => {
		const { folderId } = req.data;
		const { pk: userPk } = req.user;

		const folder = await prisma.folder.findUnique({
			where: { ownerId: userPk, id: folderId },
			select: {
				pk: true,
				parent: {
					select: {
						pk: true,
					},
				},
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
					message: 'Parent folder could not been found.',
			  });
	}),
	asyncHandler(async (req, res) => {
		const { name } = req.data;
		const { pk: userPk } = req.user;
		const { pk: folderPk, parent } = req.folder;

		const newFolder = await prisma.folder.create({
			data: {
				name,
				ownerId: userPk,
				parentId: folderPk,
			},
			select: {
				id: true,
				name: true,
				parent: {
					select: {
						name: true,
						id: true,
					},
				},
				subfolders: {
					select: {
						id: true,
						name: true,
						createdAt: true,
						_count: {
							select: {
								subfolders: true,
								files: true,
							},
						},
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
						createdAt: true,
						sharers: {
							select: {
								sharer: {
									select: {
										id: true,
										email: true,
									},
								},
							},
						},
						public: {
							select: {
								id: true,
							},
						},
					},
					orderBy: {
						pk: 'asc',
					},
				},
			},
		});

		const [currentFolder, parentFolder] = await Promise.all([
			prisma.folder.findUnique({
				where: {
					pk: folderPk,
				},
				select: {
					id: true,
					name: true,
					parent: {
						select: {
							name: true,
							id: true,
						},
					},
					subfolders: {
						select: {
							id: true,
							name: true,
							createdAt: true,
							_count: {
								select: {
									subfolders: true,
									files: true,
								},
							},
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
							createdAt: true,
							sharers: {
								select: {
									sharer: {
										select: {
											id: true,
											email: true,
										},
									},
								},
							},
							public: {
								select: {
									id: true,
								},
							},
						},
						orderBy: {
							pk: 'asc',
						},
					},
				},
			}),
			parent?.pk &&
				prisma.folder.findUnique({
					where: {
						pk: parent.pk,
					},
					select: {
						id: true,
						name: true,
						parent: {
							select: {
								name: true,
								id: true,
							},
						},
						subfolders: {
							select: {
								id: true,
								name: true,
								createdAt: true,
								_count: {
									select: {
										subfolders: true,
										files: true,
									},
								},
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
								createdAt: true,
								sharers: {
									select: {
										sharer: {
											select: {
												id: true,
												email: true,
											},
										},
									},
								},
								public: {
									select: {
										id: true,
									},
								},
							},
							orderBy: {
								pk: 'asc',
							},
						},
					},
				}),
		]);

		res.status(201).json({
			success: true,
			data: { newFolder, currentFolder, parentFolder },
			message: 'Create subfolder successfully.',
		});
	}),
];

export const updateFolder = [
	checkSchema({
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
	verifyData,
	asyncHandler(async (req, res, next) => {
		const { pk: userPk } = req.user;
		const { folderId } = req.params;

		const folder = await prisma.folder.findUnique({
			where: { ownerId: userPk, id: folderId },
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
		const { name } = req.data;
		const { folderId } = req.params;

		const currentFolder = await prisma.folder.update({
			where: { id: folderId },
			data: {
				name,
			},
			select: {
				id: true,
				name: true,
				parent: {
					select: {
						name: true,
						id: true,
					},
				},
				subfolders: {
					select: {
						id: true,
						name: true,
						createdAt: true,
						_count: {
							select: {
								subfolders: true,
								files: true,
							},
						},
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
						createdAt: true,
						sharers: {
							select: {
								sharer: {
									select: {
										id: true,
										email: true,
									},
								},
							},
						},
						public: {
							select: {
								id: true,
							},
						},
					},
					orderBy: {
						pk: 'asc',
					},
				},
			},
		});

		const parentFolder = await prisma.folder.findUnique({
			where: {
				id: currentFolder.parent.id,
			},
			select: {
				id: true,
				name: true,
				parent: {
					select: {
						name: true,
						id: true,
					},
				},
				subfolders: {
					select: {
						id: true,
						name: true,
						createdAt: true,
						_count: {
							select: {
								subfolders: true,
								files: true,
							},
						},
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
						createdAt: true,
						sharers: {
							select: {
								sharer: {
									select: {
										id: true,
										email: true,
									},
								},
							},
						},
						public: {
							select: {
								id: true,
							},
						},
					},
					orderBy: {
						pk: 'asc',
					},
				},
			},
		});

		res.json({
			success: true,
			data: { currentFolder, parentFolder },
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
				files: {
					select: {
						pk: true,
					},
				},
			},
		});

		const handleSetLocalVariable = () => {
			const { pk, files } = folder;
			req.folder = files.length === 0 ? { pk } : { pk, files, id: folderId };
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
		const folders = await prisma.folder.findMany({
			where: { ownerId: req.user.pk },
			select: {
				pk: true,
				subfolders: {
					select: {
						pk: true,
						id: true,
						files: {
							select: {
								pk: true,
							},
						},
					},
				},
			},
			orderBy: {
				pk: 'asc',
			},
		});

		// for loop recursion
		// const get = (result, arrSub, folders) => {
		// 	if (arrSub.length === 0) {
		// 		return result;
		// 	} else {
		// 		const children = [];
		// 		for (const sub of arrSub) {
		// 			const target = folders.find(folder => folder.pk === sub.pk);
		// 			if (target.subfolders.length !== 0) {
		// 				for (const sf of target.subfolders) {
		// 					children.push(sf);
		// 				}
		// 			}
		// 		}
		// 		return get([...result, ...arrSub], children, folders);
		// 	}
		// };

		const findAllDeleteFolders = (result, subfolders) =>
			subfolders.length === 0
				? result
				: findAllDeleteFolders(
						[...result, ...subfolders],
						subfolders.reduce(
							(previousSubs, currentSub) => [
								...previousSubs,
								...folders
									.splice(
										folders.findIndex(folder => folder.pk === currentSub.pk),
										1
									)[0]
									.subfolders.map(subfolder =>
										subfolder.files.length === 0
											? { pk: subfolder.pk }
											: subfolder
									),
							],
							[]
						)
				  );

		const allDeleteFolders = findAllDeleteFolders([], [req.folder]);

		const allDeleteFolderPks = allDeleteFolders.map(folder => folder.pk);
		const allDeleteFolderIds = allDeleteFolders
			.filter(folder => folder.id)
			.map(folder => folder.id);
		const allDeleteFolderFilePks = allDeleteFolders
			.filter(folder => folder.files)
			.map(folder => folder.files)
			.reduce((result, file) => result.concat(file.map(f => f.pk)), []);

		allDeleteFolderIds.length > 0 &&
			(await Promise.all(
				allDeleteFolderIds.map(folderId =>
					cloudinary.api.delete_resources_by_prefix(folderId)
				)
			));

		allDeleteFolderFilePks.length > 0
			? await prisma.$transaction([
					prisma.publicFile.deleteMany({
						where: { fileId: { in: allDeleteFolderFilePks } },
					}),
					prisma.fileSharers.deleteMany({
						where: { fileId: { in: allDeleteFolderFilePks } },
					}),
					prisma.file.deleteMany({
						where: { pk: { in: allDeleteFolderFilePks } },
					}),
					prisma.folder.deleteMany({
						where: { pk: { in: allDeleteFolderPks } },
					}),
			  ])
			: await prisma.folder.deleteMany({
					where: { pk: { in: allDeleteFolderPks } },
			  });

		const allFolders = await prisma.folder.findMany({
			where: { ownerId: req.user.pk },
			select: {
				id: true,
				name: true,
				parent: {
					select: {
						name: true,
						id: true,
					},
				},
				subfolders: {
					select: {
						id: true,
						name: true,
						createdAt: true,
						_count: {
							select: {
								subfolders: true,
								files: true,
							},
						},
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
						createdAt: true,
						sharers: {
							select: {
								sharer: {
									select: {
										id: true,
										email: true,
									},
								},
							},
						},
						public: {
							select: {
								id: true,
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
			data: allFolders,
			message: 'Delete folder successfully.',
		});
	}),
];
