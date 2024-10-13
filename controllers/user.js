// Packages
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';

// Middlewares
import { verifyData } from '../middlewares/verifyData.js';
import { authenticate } from '../middlewares/authenticate.js';
import { verifyCredentials } from '../middlewares/verifyCredentials.js';

// Variables
const prisma = new PrismaClient();
const google = new OAuth2Client();

export const getUser = [
	asyncHandler(async (req, res) => {
		const { pk } = req.user;

		const user = await prisma.user.findUnique({
			where: { pk },
			select: { id: true, username: true },
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
		username: {
			trim: true,
			notEmpty: {
				errorMessage: 'Username is required.',
				bail: true,
			},
			isLength: {
				options: { min: 4, max: 25 },
				errorMessage: 'Username must be between 4 and 25 letters.',
				bail: true,
			},
			matches: {
				options: /^(?=.*[a-zA-Z0-9]_?)/,
				errorMessage:
					'Username must only contain alphanumeric and underline characters.',
				bail: true,
			},
			custom: {
				options: username =>
					/* eslint-disable no-async-promise-executor */
					new Promise(async (resolve, reject) => {
						const existingUsername = await prisma.user.findFirst({
							where: { username },
						});
						existingUsername ? reject() : resolve();
					}),
				errorMessage: 'Username is been used.',
			},
		},
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
					/* eslint-disable no-async-promise-executor */
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
	}),
	asyncHandler(async (req, res, next) => {
		const { username, email, password } = req.data;
		const randomSalt = 10;
		await prisma.user.create({
			data: {
				username,
				email,
				password: await bcrypt.hash(password, randomSalt),
				folders: {
					create: [{ name: 'My Drive' }],
				},
			},
		});
		next();
	}),
	authenticate,
];
export const logout = [
	verifyCredentials,
	asyncHandler(async (req, res, next) => {
		const { pk, type } = req.user;

		const handleFacebookLogout = async () => {
			const user = await prisma.user.findUnique({
				where: { pk },
				select: {
					credential: {
						select: {
							subject: true,
						},
					},
				},
			});

			const url =
				`https://graph.facebook.com/${user.credential.subject}/permissions?` +
				`access_token=${facebook_client_id}|${facebook_client_secret}`;

			await fetch(url, { method: 'DELETE' });
		};

		type === 'facebook' && (await handleFacebookLogout());

		req.logout(err =>
			err
				? next(err)
				: res.json({
						success: true,
						message: 'User logout successfully.',
				  })
		);
	}),
];
export const loginWithGoogle = [
	(req, res, next) => {
		const { authorization } = req.headers;

		const token = authorization && authorization.split(' ')[1];

		const handleSetToken = () => {
			req.token = token;
			next();
		};

		token
			? handleSetToken()
			: res.status(400).json({
					success: false,
					message: 'The provided Google token is malformed.',
			  });
	},
	asyncHandler(async (req, res, next) => {
		try {
			const ticket = await google.verifyIdToken({
				idToken: req.token,
				audience: process.env.APP_GOOGLE_CLIENT_ID,
			});

			const { sub: subject } = ticket.getPayload();

			req.subject = subject;

			next();
		} catch (err) {
			err &&
				res.status(401).json({
					success: false,
					message: 'Google login is invalid.',
				});
		}
	}),
	asyncHandler(async (req, res) => {
		const provider = 'https://accounts.google.com';
		const { subject } = req;

		const credential = await prisma.credential.findUnique({
			where: { provider, subject },
			select: {
				user: {
					select: {
						pk: true,
						id: true,
						username: true,
					},
				},
			},
		});

		const handleSetSession = () => {
			req.session.subject = subject;
			res.json({
				success: true,
				message: 'Google authenticate successfully.',
			});
		};

		const handleLogin = () => {
			const { pk, ...rest } = credential.user;

			const cb = () => {
				res.json({
					success: true,
					data: {
						user: rest,
					},
					cookie: {
						exp: req.session.cookie._expires,
					},
					message: 'Google login successfully.',
				});
			};

			req.login({ pk, type: 'google' }, cb);
		};

		credential ? handleLogin() : handleSetSession();
	}),
];
export const registerWithGoogle = [
	(req, res, next) => {
		const { subject } = req.session;

		subject
			? next()
			: res.status(401).json({
					success: true,
					message: 'The provided Google token is malformed.',
			  });
	},
	verifyData({
		username: {
			trim: true,
			notEmpty: {
				errorMessage: 'Username is required.',
				bail: true,
			},
			isLength: {
				options: { min: 4, max: 25 },
				errorMessage: 'Username must be between 4 and 25 letters.',
				bail: true,
			},
			matches: {
				options: /^\w+$/,
				errorMessage:
					'Username must only contain alphanumeric and underline characters.',
				bail: true,
			},
			custom: {
				options: username =>
					/* eslint-disable no-async-promise-executor */
					new Promise(async (resolve, reject) => {
						const existingUsername = await prisma.user.findFirst({
							where: { username },
						});
						existingUsername ? reject() : resolve();
					}),
				errorMessage: 'Username is been used.',
			},
		},
	}),
	asyncHandler(async (req, res) => {
		const provider = 'https://accounts.google.com';
		const { username } = req.data;
		const { subject } = req.session;

		const user = await prisma.user.create({
			data: {
				username,
				folders: {
					create: [{ name: 'My Drive' }],
				},
			},
			select: {
				pk: true,
				id: true,
				username: true,
			},
		});

		const { pk, ...rest } = user;

		await prisma.credential.create({
			data: {
				provider,
				subject,
				userId: pk,
			},
		});

		const cb = () => {
			delete req.session.subject;
			res.json({
				success: true,
				data: rest,
				cookie: {
					exp: req.session.cookie._expires,
				},
				message: 'Google login successfully.',
			});
		};

		req.login({ pk }, cb);
	}),
];
export const loginWithFacebook = [
	(req, res, next) => {
		const { authorization } = req.headers;

		const token = authorization && authorization.split(' ')[1];

		const handleSetToken = () => {
			req.token = token;
			next();
		};

		token
			? handleSetToken()
			: res.status(400).json({
					success: false,
					message: 'The provided Google token is malformed.',
			  });
	},
	asyncHandler(async (req, res, next) => {
		const tokenResponse = await fetch(
			`https://graph.facebook.com/debug_token?input_token=${req.token}&access_token=818458357029166|c776f420aaf467241b7e85a3fc4a3717`
		);
		const { data } = await tokenResponse.json();
		const { user_id: subject, is_valid } = data;

		const handleValid = () => {
			req.subject = subject;
			next();
		};

		is_valid
			? handleValid()
			: res.status(401).json({
					success: false,
					message: 'Facebook login is invalid.',
			  });
	}),
	asyncHandler(async (req, res) => {
		const provider = 'https://connect.facebook.net';
		const { subject } = req;

		const credential = await prisma.credential.findUnique({
			where: { provider, subject },
			select: {
				user: {
					select: {
						pk: true,
						id: true,
						username: true,
					},
				},
			},
		});

		const handleSetSession = () => {
			req.session.subject = subject;
			res.json({
				success: true,
				message: 'Facebook authenticate successfully.',
			});
		};

		const handleLogin = () => {
			const { pk, ...rest } = credential.user;

			const cb = () => {
				res.json({
					success: true,
					data: {
						user: rest,
					},
					cookie: {
						exp: req.session.cookie._expires,
					},
					message: 'Facebook login successfully.',
				});
			};

			req.login({ pk, type: 'facebook' }, cb);
		};

		credential ? handleLogin() : handleSetSession();
	}),
];
export const registerWithFacebook = [
	(req, res, next) => {
		const { subject } = req.session;

		subject
			? next()
			: res.status(401).json({
					success: true,
					message: 'The provided Facebook token is malformed.',
			  });
	},
	verifyData({
		username: {
			trim: true,
			notEmpty: {
				errorMessage: 'Username is required.',
				bail: true,
			},
			isLength: {
				options: { min: 4, max: 25 },
				errorMessage: 'Username must be between 4 and 25 letters.',
				bail: true,
			},
			matches: {
				options: /^\w+$/,
				errorMessage:
					'Username must only contain alphanumeric and underline characters.',
				bail: true,
			},
			custom: {
				options: username =>
					/* eslint-disable no-async-promise-executor */
					new Promise(async (resolve, reject) => {
						const existingUsername = await prisma.user.findFirst({
							where: { username },
						});
						existingUsername ? reject() : resolve();
					}),
				errorMessage: 'Username is been used.',
			},
		},
	}),
	asyncHandler(async (req, res) => {
		const provider = 'https://connect.facebook.net';
		const { username } = req.data;
		const { subject } = req.session;

		const user = await prisma.user.create({
			data: {
				username,
				folders: {
					create: [{ name: 'My Drive' }],
				},
			},
			select: {
				pk: true,
				id: true,
				username: true,
			},
		});

		const { pk, ...rest } = user;

		await prisma.credential.create({
			data: {
				provider,
				subject,
				userId: pk,
			},
		});

		const cb = () => {
			delete req.session.subject;
			res.json({
				success: true,
				data: rest,
				cookie: {
					exp: req.session.cookie._expires,
				},
				message: 'Facebook login successfully.',
			});
		};

		req.login({ pk, type: 'facebook' }, cb);
	}),
];
