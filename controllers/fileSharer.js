import asyncHandler from 'express-async-handler';

import { checkSchema } from 'express-validator';
import { prisma } from '../lib/prisma.js';

// Middlewares
import { verifyScheme } from '../middlewares/verifyScheme.js';

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
						owner: {
							select: {
								email: true,
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

export const deleteSharedFile = [
	asyncHandler(async (req, res, next) => {
		const { pk: userPk } = req.user;
		const { sharedFileId } = req.params;

		const sharedFile = await prisma.file.findUnique({
			where: { id: sharedFileId },
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

export const createFileSharer = [
	checkSchema({
		email: {
			trim: true,
			toLowerCase: true,
			notEmpty: {
				errorMessage: 'The email is required.',
				bail: true,
			},
			isEmail: {
				errorMessage: 'The email must be in the correct format.',
				bail: true,
			},
			normalizeEmail: {
				errorMessage: 'The email must be in standard format.',
				bail: true,
			},
		},
	}),
	verifyScheme,
	asyncHandler(async (req, res, next) => {
		const { pk: userPk } = req.user;
		const { fileId } = req.params;

		const sharedFile = await prisma.file.findUnique({
			where: { ownerId: userPk, id: fileId },
			select: {
				pk: true,
			},
		});

		const handleSetLocalVariable = () => {
			req.sharedFile = sharedFile;
			next();
		};

		sharedFile
			? handleSetLocalVariable()
			: res.status(404).json({
					success: false,
					message: 'File could not been found.',
			  });
	}),
	asyncHandler(async (req, res, next) => {
		const { pk: userPk } = req.user;
		const { pk: sharedFilePk } = req.sharedFile;
		const { email } = req.data;

		const sharer = await prisma.user.findFirst({
			where: {
				pk: { not: userPk },
				email,
				sharedFiles: {
					none: {
						fileId: sharedFilePk,
					},
				},
			},
			select: {
				email: true,
				pk: true,
			},
		});

		const handleSetLocalVariable = () => {
			req.sharer = sharer;
			next();
		};

		sharer
			? handleSetLocalVariable()
			: res.status(404).json({
					success: false,
					fields: {
						email: 'email is invalid.',
					},
					message: 'email is invalid.',
			  });
	}),
	asyncHandler(async (req, res) => {
		const { pk: sharerPk } = req.sharer;
		const { pk: sharedFilePk } = req.sharedFile;

		const file = await prisma.file.update({
			where: { pk: sharedFilePk },
			data: {
				sharers: {
					createMany: {
						data: [
							{
								sharerId: sharerPk,
							},
						],
					},
				},
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
				sharers: {
					where: {
						sharerId: sharerPk,
					},
					select: {
						sharer: {
							select: {
								id: true,
								email: true,
							},
						},
					},
				},
			},
		});

		res.status(201).json({
			success: true,
			data: {
				newShare: file.sharers[0],
				currentFolder: file.folder,
			},
			message: 'Create file sharer successfully.',
		});
	}),
];

export const deleteFileSharer = [
	asyncHandler(async (req, res, next) => {
		const { pk: userPk } = req.user;
		const { fileId } = req.params;

		const sharedFile = await prisma.file.findUnique({
			where: {
				ownerId: userPk,
				id: fileId,
			},
			select: {
				pk: true,
			},
		});

		const handleSetLocalVariable = () => {
			req.sharedFile = sharedFile;
			next();
		};

		sharedFile
			? handleSetLocalVariable()
			: res.status(404).json({
					success: false,
					message: 'File could not been found.',
			  });
	}),
	asyncHandler(async (req, res, next) => {
		const { sharerId } = req.params;
		const { pk: sharedFilePk } = req.sharedFile;

		const sharer = await prisma.user.findUnique({
			where: {
				id: sharerId,
				sharedFiles: {
					some: {
						fileId: sharedFilePk,
					},
				},
			},
			select: {
				pk: true,
			},
		});

		const handleSetLocalVariable = () => {
			req.sharer = sharer;
			next();
		};

		sharer
			? handleSetLocalVariable()
			: res.status(404).json({
					success: false,
					message: 'Sharer could not been found.',
			  });
	}),
	asyncHandler(async (req, res) => {
		const { pk: sharedFilePk } = req.sharedFile;
		const { pk: sharerPk } = req.sharer;

		const file = await prisma.file.update({
			where: {
				pk: sharedFilePk,
			},
			data: {
				sharers: {
					deleteMany: [
						{
							sharerId: sharerPk,
						},
					],
				},
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
			data: { currentFolder: file.folder },
			message: 'Delete file sharer successfully.',
		});
	}),
];
