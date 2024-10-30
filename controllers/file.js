// Packages
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';
import { checkSchema } from 'express-validator';

// Middlewares
import { verifyData } from '../middlewares/verifyData.js';

// Variables
const prisma = new PrismaClient();
const upload = multer({
	storage: multer.memoryStorage(),
});

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
	signature_algorithm: 'sha256',
});

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
		const { folderId } = req.params;
		const { buffer } = req.file;

		await new Promise(resolve =>
			cloudinary.uploader
				.upload_stream(
					{
						resource_type: 'auto',
						public_id_prefix: folderId,
						type: 'private',
						access_mode: 'public',
						use_filename_as_display_name: false,
					},
					(err, result) => {
						const handleSetLocalVariable = () => {
							req.upload = result;
							resolve();
							next();
						};
						err ? next(err) : handleSetLocalVariable();
					}
				)
				.end(buffer)
		);
	}),
	async (req, res, next) => {
		const { public_id, resource_type } = req.upload;
		const { originalname, size } = req.file;
		const { pk: folderPk } = req.folder;
		const { pk: userPk } = req.user;

		try {
			await prisma.file.create({
				data: {
					id: public_id.split('/')[1],
					name: Buffer.from(originalname, 'latin1').toString('utf8'), // For busboy defParanCharset issue (multer)
					size,
					type: resource_type,
					ownerId: userPk,
					folderId: folderPk,
				},
			});
			res.status(201).json({
				success: true,
				message: 'Upload file is successfully',
			});
		} catch (err) {
			await cloudinary.uploader.destroy(public_id, { resource_type });
			next(err);
		}
	},
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
	verifyData,
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

		await prisma.file.update({
			where: { pk },
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
		const { type, folder } = req.file;

		const response = await cloudinary.uploader.destroy(
			`${folder.id}/${fileId}`,
			{ resource_type: type, type: 'authenticated', invalidate: true }
		);

		response.result === 'ok'
			? next()
			: response.result === 'not found'
			? next('Not found')
			: next(response.result);
	}),
	asyncHandler(async (req, res) => {
		const { pk } = req.file;

		await prisma.$transaction([
			prisma.fileSharers.deleteMany({
				where: {
					fileId: pk,
				},
			}),
			prisma.publicFile.deleteMany({
				where: {
					fileId: pk,
				},
			}),
			prisma.file.delete({
				where: {
					pk,
				},
			}),
		]);

		res.json({
			success: true,
			message: 'Delete file successfully.',
		});
	}),
];

export const createCopyFile = [
	asyncHandler(async (req, res, next) => {
		const userPk = req.user?.pk;
		const { fileId } = req.params;

		const file = await prisma.file.findUnique({
			where: { id: fileId },
			select: {
				type: true,
				ownerId: true,
				folder: {
					select: {
						id: true,
					},
				},
				public: true,
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

		file.public || file.sharers.length === 1 || file.ownerId === userPk
			? handleSetLocalVariable()
			: res.status(404).json({
					success: false,
					message: 'File could not been found.',
			  });
	}),
	asyncHandler(async (req, res) => {
		const { fileId } = req.params;
		const { folder, type } = req.file;

		const originFileUrl = cloudinary.url(`${folder.id}/${fileId}`, {
			resource_type: type,
			sign_url: true,
			type: 'authenticated',
		});

		const copyFile = await cloudinary.uploader.upload(originFileUrl, {
			resource_type: type,
			type: 'upload',
			access_mode: 'public',
			use_filename_as_display_name: false,
			return_delete_token: true,
			invalidate: true,
			access_control: [
				{ access_type: 'token' },
				{
					access_type: 'anonymous',
					start: new Date().toISOString,
					end: new Date(Date.now() + 1000 * 60).toISOString,
				},
			],
		});

		const { secure_url, delete_token } = copyFile;

		res.json({
			success: true,
			data: {
				secure_url,
				delete_token,
				cloud_name: process.env.CLOUDINARY_NAME,
			},
			message: 'Create copy resource successfully ',
		});
	}),
];
