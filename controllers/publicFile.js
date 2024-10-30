import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

// Variables
const prisma = new PrismaClient();

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_API_KEY,
	api_secret: process.env.CLOUDINARY_API_SECRET,
	signature_algorithm: 'sha256',
});

export const getPublicFile = [
	asyncHandler(async (req, res) => {
		const { publicId } = req.params;

		const publicFile = await prisma.publicFile.findUnique({
			where: { id: publicId },
			select: {
				file: {
					select: {
						id: true,
						name: true,
						size: true,
						type: true,
						folder: {
							select: {
								id: true,
							},
						},
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

		const { id, folder, ...file } = publicFile.file;

		const url = cloudinary.utils.private_download_url(
			`${folder.id}/${id}`,
			null,
			{
				resource_type: file.type,
				expires_at: Math.floor(Date.now() / 1000) + 60,
			}
		);

		publicFile
			? res.json({
					success: true,
					data: {
						...file,
						url,
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

		const { id } = await prisma.publicFile.create({
			data: {
				fileId: filePk,
			},
		});

		res.status(201).json({
			success: true,
			data: id,
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
		});

		publicFile
			? next()
			: res.status(404).json({
					success: false,
					message: 'Public file could not been found.',
			  });
	}),
	asyncHandler(async (req, res) => {
		const { publicId } = req.params;

		await prisma.publicFile.delete({
			where: { id: publicId },
		});

		res.json({
			success: true,
			message: 'Delete public file successfully.',
		});
	}),
];
