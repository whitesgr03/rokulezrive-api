import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';

// Variables
const prisma = new PrismaClient();

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

