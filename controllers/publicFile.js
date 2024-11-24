import asyncHandler from 'express-async-handler';
import { prisma } from '../lib/prisma.js';
import { cloudinary } from '../lib/cloudinary.js';

export const getPublicFile = [
	asyncHandler(async (req, res) => {
		const { publicId } = req.params;

		const publicFile = await prisma.publicFile.findUnique({
			where: { id: publicId },
			select: {
				file: {
					select: {
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
				createdAt: true,
			},
		});

		publicFile
			? res.json({
					success: true,
					data: {
						...publicFile.file,
						sharedAt: publicFile.createdAt,
					},
					message: 'Get public file successfully.',
			  })
			: res.status(404).json({
					success: false,
					message: 'Public file could not been found.',
			  });
	}),
];

export const createPublicFile = [
	asyncHandler(async (req, res, next) => {
		const { fileId } = req.params;
		const { pk: userPk } = req.user;

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
		const { pk: filePk } = req.file;

		const publicFile = await prisma.publicFile.create({
			data: {
				fileId: filePk,
			},
			select: {
				id: true,
				file: {
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
				},
			},
		});

		res.status(201).json({
			success: true,
			data: {
				publicFileId: publicFile.id,
				currentFolder: publicFile.file.folder,
			},
			message: 'Create public file successfully.',
		});
	}),
];

export const deletePublicFile = [
	asyncHandler(async (req, res, next) => {
		const { publicId } = req.params;
		const { pk: userPk } = req.user;

		const publicFile = await prisma.publicFile.findFirst({
			where: {
				id: publicId,
				file: {
					ownerId: userPk,
				},
			},
			select: {
				file: {
					select: { folder: { select: { pk: true } } },
				},
			},
		});

		const handleSetLocalVariable = () => {
			req.folder = publicFile.file.folder;
			next();
		};

		publicFile
			? handleSetLocalVariable()
			: res.status(404).json({
					success: false,
					message: 'Public file could not been found.',
			  });
	}),
	asyncHandler(async (req, res) => {
		const { publicId } = req.params;
		const { pk } = req.folder;

		await prisma.publicFile.delete({
			where: { id: publicId },
		});

		const currentFolder = await prisma.folder.findUnique({
			where: { pk },
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
			data: { currentFolder },
			message: 'Delete public file successfully.',
		});
	}),
];
