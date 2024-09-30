import asyncHandler from 'express-async-handler';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

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
					message: 'Upload file is request.',
			  });
	},
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
	(req, res, next) => {
		const { ownerId } = req.folder;

		ownerId === req.user.pk
			? next()
			: res.status(403).json({
					success: false,
					message: 'This request requires higher permissions.',
			  });
	},
	asyncHandler(async (req, res) => {
		const { folderId } = req.params;
		let { originalname, buffer, size } = req.file;

		// For busboy defParanCharset issue (multer)
		originalname = Buffer.from(originalname, 'latin1').toString('utf8');

		const uploadResult = await new Promise((resolve, reject) =>
			cloudinary.uploader
				.upload_stream(
					{
						display_name: originalname,
						resource_type: 'auto',
						asset_folder: folderId,
					},
					(error, result) => (error ? reject(error) : resolve(result))
				)
				.end(buffer)
		);

		const { public_id, resource_type, secure_url } = uploadResult;

		await prisma.folder.create({
			data: {
				id: public_id,
				name: originalname,
				size,
				type: resource_type,
				secure_url,
				ownerId: req.user.pk,
				folderId,
			},
		});

		res.json({
			success: true,
			message: 'Upload file is successfully',
		});
	}),
];
