import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

import { verifyData } from '../middlewares/verifyData.js';
import { authenticate } from '../middlewares/authenticate.js';
import { verifyCredentials } from '../middlewares/verifyCredentials.js';

const prisma = new PrismaClient();

export const userInfo = [
	verifyCredentials,
	asyncHandler(async (req, res) => {
		const { id } = req.user;
		const user = await prisma.user.findFirst({
			where: { id },
			select: { email: true, id: true },
		});

		res
			.header({
				'Cache-Control': 'no-store',
			})
			.json({
				success: true,
				message: 'Get user info successfully.',
				data: user,
			});
	}),
];

export const login = [
	verifyData({
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
		password: {
			notEmpty: {
				errorMessage: 'The password is required.',
				bail: true,
			},
			isLength: {
				options: { min: 8 },
				errorMessage: 'The password is incorrect.',
			},
		},
	}),
	authenticate,
];
export const register = [
	verifyData({
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
			custom: {
				options: email =>
					new Promise((resolve, reject) => {
						const existingEmail = prisma.user.findFirst({
							where: { email },
						});

						existingEmail ? reject() : resolve();
					}),
				errorMessage: 'The email is been used.',
			},
		},
		password: {
			notEmpty: {
				errorMessage: 'The password is required.',
				bail: true,
			},
			isStrongPassword: {
				errorMessage:
					'The password must contain one or more numbers, special symbols, lowercase and uppercase characters, and at least 8 characters.',
			},
		},
		confirmPassword: {
			notEmpty: {
				errorMessage: 'The confirm password is required.',
				bail: true,
			},
			custom: {
				options: (confirmPassword, { req }) =>
					confirmPassword === req.body.password,
				errorMessage:
					'The confirmation password is not the same as the password.',
			},
		},
	}),
	asyncHandler(async (req, res, next) => {
		const { email, password } = req.data;
		const randomSalt = 10;
		await prisma.user.create({
			data: {
				email,
				password: await bcrypt.hash(password, randomSalt),
			},
		});
		next();
	}),
	authenticate,
];
export const logout = [
	verifyCredentials,
	(req, res, next) => {
		req.logout(err =>
			err
				? next(err)
				: res.json({
						success: true,
						message: 'User logout successfully.',
				  })
		);
	},
];
