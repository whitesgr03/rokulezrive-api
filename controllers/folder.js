// Packages
import asyncHandler from 'express-async-handler';
import { checkSchema } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { cloudinary } from '../lib/cloudinary.js';

// Middlewares
import { verifyScheme } from '../middlewares/verifyScheme.js';

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
	verifyScheme,
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
	verifyScheme,
	asyncHandler(async (req, res, next) => {
		const { pk: userPk } = req.user;
		const { folderId } = req.params;

		const folder = await prisma.folder.findUnique({
			where: {
				id: folderId,
				ownerId: userPk,
				NOT: {
					parent: null,
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
	checkSchema({
		'folderIds.*': {
			isString: {
				errorMessage: 'Folder id must be string',
			},
			optional: true,
		},
	}),
	verifyScheme,
	asyncHandler(async (req, res, next) => {
		const { pk: userPk } = req.user;
		const { folderId } = req.params;

		const folders =
			req.data?.folderIds &&
			(await prisma.folder.findMany({
				where: {
					ownerId: userPk,
					id: { in: req.data.folderIds },
				},
			}));

		const deletedFolder = await prisma.folder.findUnique({
			where: {
				ownerId: userPk,
				id: folderId,
				NOT: {
					parent: null,
				},
			},
			select: {
				_count: {
					select: {
						files: true,
					},
				},
			},
		});

		const handleSetLocalVariable = () => {
			const { _count } = deletedFolder;
			req.deletedFolder = { id: req.params.folderId, _count };
			next();
		};

		req.data?.folderIds?.length === folders?.length && deletedFolder
			? handleSetLocalVariable()
			: res.status(404).json({
					success: false,
					message: 'Folder could not been found.',
			  });
	}),
	asyncHandler(async (req, res, next) => {
		const { id } = req.deletedFolder;

		req.data?.folderIds &&
			(await Promise.all(
				req.data.folderIds.map(folderId =>
					cloudinary.api.delete_resources_by_prefix(folderId, {
						type: 'private',
					})
				)
			).catch(err => next(err)));

		const deletedFolder = await prisma.folder.delete({
			where: { id },
			select: {
				parent: {
					select: {
						pk: true,
						parent: {
							select: {
								pk: true,
							},
						},
					},
				},
			},
		});

		const [currentFolder, parentFolder] = await Promise.all([
			prisma.folder.findUnique({
				where: { pk: deletedFolder.parent.pk },
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
			deletedFolder.parent.parent?.pk &&
				prisma.folder.findUnique({
					where: { pk: deletedFolder.parent.parent.pk },
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

		res.json({
			success: true,
			data: { currentFolder, parentFolder },
			message: 'Delete folder successfully.',
		});
	}),
];
