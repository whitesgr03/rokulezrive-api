import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

import { verifyData } from '../middlewares/verifyData.js';
import { authenticate } from '../middlewares/authenticate.js';

const prisma = new PrismaClient();

export const loginPost = [
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
export const registerPost = [
	verifyData({
		schema: {
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
						new Promise(async (resolve, reject) => {
							const existingEmail = await prisma.user.findFirst({
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
		},
		template: 'register',
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
export const logout = asyncHandler(async (req, res, next) => {
	req.isAuthenticated()
		? req.logout(err => (err ? next(err) : res.redirect('/')))
		: res.redirect('/drive/files');
});
