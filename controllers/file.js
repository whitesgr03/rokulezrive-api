// Packages
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import { checkSchema } from 'express-validator';
import { prisma } from '../lib/prisma.js';
import { cloudinary, uploadFile } from '../lib/cloudinary.js';

const upload = multer({
	storage: multer.memoryStorage(),
});

// Middlewares
import { verifyScheme } from '../middlewares/verifyScheme.js';

export const createFile = [
	upload.single('file'),
	(req, res, next) => {
		req.file
			? next()
			: res.status(400).json({
					success: false,
					message: 'File is required.',
			  });
	},
	(req, res, next) => {
		const MEGABYTE = 1000000;
		const { size } = req.file;

		size <= MEGABYTE
			? next()
			: res.status(413).json({
					success: false,
					message: 'File size must be less than 1 MB.',
			  });
	},
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
	asyncHandler(async (req, res, next) => {
		const { originalname, size, buffer } = req.file;
		const { folderId } = req.params;
		const { pk: folderPk } = req.folder;
		const { pk: userPk } = req.user;

		const upload = await uploadFile(folderId, buffer).catch(err => next(err));

		const file = await prisma.file.create({
			data: {
				id: upload.public_id.split('/')[1],
				name: Buffer.from(originalname, 'latin1').toString('utf8'), // For busboy defParanCharset issue (multer)
				size,
				type: upload.resource_type,
				ownerId: userPk,
				folderId: folderPk,
			},
			select: {
				folder: {
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
				},
			},
		});

		const parentFolder =
			file.folder.parent?.id &&
			(await prisma.folder.findUnique({
				where: { id: file.folder.parent.id },
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
			}));

		res.status(201).json({
			success: true,
			data: {
				currentFolder: file.folder,
				parentFolder,
			},
			message: 'Upload file is successfully.',
		});
	}),
];

export const updateFile = [
	checkSchema({
		name: {
			trim: true,
			notEmpty: {
				errorMessage: 'File name is required.',
				bail: true,
			},
			isLength: {
				options: { max: 200 },
				errorMessage: 'File name must be less then 200 letters.',
				bail: true,
			},
		},
	}),
	verifyScheme,
	asyncHandler(async (req, res, next) => {
		const { pk: userPk } = req.user;
		const { fileId } = req.params;

		const file = await prisma.file.findUnique({
			where: { ownerId: userPk, id: fileId },
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
	asyncHandler(async (req, res) => {
		const { name } = req.data;
		const { pk } = req.file;

		const newFile = await prisma.file.update({
			where: { pk },
			data: {
				name,
			},
			select: {
				folder: {
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
				},
			},
		});

		res.json({
			success: true,
			data: { currentFolder: newFile.folder },
			message: 'Update file successfully.',
		});
	}),
];

export const deleteFile = [
	asyncHandler(async (req, res, next) => {
		const { pk: userPk } = req.user;
		const { fileId } = req.params;

		const file = await prisma.file.findUnique({
			where: { ownerId: userPk, id: fileId },
			select: {
				pk: true,
				type: true,
				folder: {
					select: {
						id: true,
					},
				},
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
		const { fileId } = req.params;
		const { pk, type, folder } = req.file;

		const response = await cloudinary.uploader
			.destroy(`${folder.id}/${fileId}`, {
				resource_type: type,
				type: 'private',
				invalidate: true,
			})
			.catch(err => next(err));

		response.result !== 'ok' && next(response.result);

		const file = await prisma.file.delete({
			where: {
				pk,
			},
			select: {
				folder: {
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
				where: { pk: file.folder.pk },
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
			file.folder.parent?.pk &&
				prisma.folder.findUnique({
					where: { pk: file.folder.parent.pk },
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
			data: {
				currentFolder,
				parentFolder,
			},
			message: 'Delete file successfully.',
		});
	}),
];

export const getDownloadUrl = [
	asyncHandler(async (req, res, next) => {
		const { pk: userPk } = req.user;
		const { fileId } = req.params;

		const file = await prisma.file.findUnique({
			where: { id: fileId },
			select: {
				type: true,
				owner: {
					select: {
						pk: true,
					},
				},
				folder: {
					select: {
						id: true,
					},
				},
				sharers: {
					where: {
						sharerId: userPk,
					},
				},
			},
		});

		const handleSetLocalVariable = () => {
			req.file = file;
			next();
		};

		file.sharers.length === 1 || file.owner.pk === userPk
			? handleSetLocalVariable()
			: res.status(404).json({
					success: false,
					message: 'File could not been found.',
			  });
	}),
	asyncHandler(async (req, res) => {
		const { fileId } = req.params;
		const { folder, type } = req.file;

		const url = cloudinary.utils.private_download_url(
			`${folder.id}/${fileId}`,
			null,
			{
				resource_type: type,
				expires_at: Math.floor(Date.now() / 1000) + 60,
			}
		);

		res.json({
			success: true,
			data: { url },
			message: 'Get file download url successfully.',
		});
	}),
];
