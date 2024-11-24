import { expect, describe, it, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { apiRouter } from '../../routes/api';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { cloudinary } from '../../lib/cloudinary';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

vi.mock('jsonwebtoken');
vi.mock('../../lib/cloudinary');

describe('Public file paths', () => {
	describe('Authorization', () => {
		it('should respond with a 400 status code and message if no "authorization" header passed', async () => {
			const { status, body } = await request(app).post(
				`/api/files/fakeId/public`
			);

			expect(status).toBe(400);
			expect(body).toStrictEqual({
				success: false,
				message: 'Authorization header is required.',
			});
		});
		it('should respond with a 400 status code and message if the auth schema is invalid', async () => {
			const { status, body } = await request(app)
				.get(`/api/files/fakeId/public`)
				.set('Authorization', 'Public token');

			expect(status).toBe(400);
			expect(body).toStrictEqual({
				success: false,
				message: 'The auth-scheme or token are invalid.',
			});
		});
		it('should respond with a 400 status code and message if token is empty', async () => {
			const { status, body } = await request(app)
				.get(`/api/files/fakeId/public`)
				.set('Authorization', 'Bearer ');

			expect(status).toBe(400);
			expect(body).toStrictEqual({
				success: false,
				message: 'The auth-scheme or token are invalid.',
			});
		});
		it('should respond with a 403 status code and message if token is invalid', async () => {
			jwt.verify.mockImplementationOnce(() => {
				throw new Error();
			});

			const { status, body } = await request(app)
				.get(`/api/files/fakeId/public`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(403);
			expect(body).toStrictEqual({
				success: false,
				message: 'The token provided is invalid.',
			});
		});
		it('should respond with a 404 status code and message if user is not found', async () => {
			jwt.verify.mockReturnValueOnce({ sub: 'mockSub' });

			const { status, body } = await request(app)
				.get(`/api/files/fakeId/public`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(404);
			expect(body).toStrictEqual({
				success: false,
				message: 'User could not been found.',
			});
		});
	});
	describe('GET /public/:publicId', () => {
		it(`should respond with a 404 status code and message if the file is not found`, async () => {
			const { status, body } = await request(app).get(`/api/public/fakeId`);

			expect(status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.message).toBe('Public file could not been found.');
		});
		it(`should return the data of public file`, async () => {
			const userId = '1';
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			const otherUserDefaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: { not: user.pk } },
			});
			const otherUserFile = await prisma.file.create({
				data: {
					id: '1',
					name: 'file',
					ownerId: otherUserDefaultFolder.ownerId,
					folderId: otherUserDefaultFolder.pk,
					size: 123,
					type: 'image',
				},
			});

			const publicFile = await prisma.publicFile.create({
				data: {
					fileId: otherUserFile.pk,
				},
			});

			const { status, body } = await request(app).get(
				`/api/public/${publicFile.id}`
			);

			expect(status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.message).toBe('Get public file successfully.');
			expect(body.data.name).toBe(otherUserFile.name);
			expect(body.data.size).toBe(otherUserFile.size);
			expect(body.data.type).toBe(otherUserFile.type);
		});
	});
	describe('GET /public/:publicId/download-url', () => {
		it(`should respond with a 404 status code and message if the public file is not found`, async () => {
			const { status, body } = await request(app).get(
				`/api/public/fakeId/download-url`
			);

			expect(status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.message).toBe(
				'The public file you are looking for could not be found.'
			);
		});
		it(`should response the download URL of public file`, async () => {
			const userId = '1';
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			const defaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: user.pk },
			});
			const file = await prisma.file.create({
				data: {
					id: '1',
					name: 'file',
					ownerId: user.pk,
					folderId: defaultFolder.pk,
					size: 123,
					type: 'image',
					public: {
						create: {
							createdAt: new Date(),
						},
					},
				},
				include: { public: true },
			});

			const mockUrl = 'url';

			cloudinary.utils.private_download_url.mockReturnValueOnce(mockUrl);

			const { status, body } = await request(app).get(
				`/api/public/${file.public.id}/download-url`
			);

			expect(status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.message).toBe('Get Public file download url successfully.');
			expect(body.data.url).toBe(mockUrl);
			expect(cloudinary.utils.private_download_url).toBeCalledTimes(1);
		});
	});
	describe('POST /files/:fileId/public', () => {
		it(`should respond with a 404 status code and message if the file is not found`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: '1' });
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			const otherUserDefaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: { not: user.pk } },
			});
			const otherUserFile = await prisma.file.create({
				data: {
					id: '1',
					name: 'file',
					ownerId: otherUserDefaultFolder.ownerId,
					folderId: otherUserDefaultFolder.pk,
					size: 123,
					type: 'image',
				},
			});

			const { status, body } = await request(app)
				.post(`/api/files/${otherUserFile.id}/public`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.message).toBe('File could not been found.');
		});
		it(`should create a new public file`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: '1' });
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			const defaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: user.pk },
			});
			const file = await prisma.file.create({
				data: {
					id: '1',
					name: 'file',
					ownerId: user.pk,
					folderId: defaultFolder.pk,
					size: 123,
					type: 'image',
				},
			});

			const { status, body } = await request(app)
				.post(`/api/files/${file.id}/public`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(201);
			expect(body.success).toBe(true);
			expect(body.data).toHaveProperty('publicFileId');
			expect(body.data.currentFolder.files[0].id).toBe(file.id);
			expect(body.data.currentFolder.files[0].public).not.toBeNull();
			expect(body.message).toBe('Create public file successfully.');
		});
	});
	describe('DELETE /public/:publicId', () => {
		it(`should respond with a 404 status code and message if the file is not found`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: '1' });
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			const otherUserDefaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: { not: user.pk } },
			});
			const otherUserFile = await prisma.file.create({
				data: {
					id: '1',
					name: 'file',
					ownerId: otherUserDefaultFolder.ownerId,
					folderId: otherUserDefaultFolder.pk,
					size: 123,
					type: 'image',
				},
			});

			const otherUserPublicFile = await prisma.publicFile.create({
				data: {
					fileId: otherUserFile.pk,
				},
			});

			const { status, body } = await request(app)
				.delete(`/api/public/${otherUserPublicFile}`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.message).toBe('Public file could not been found.');
		});
		it(`should delete a specified public file`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: '1' });
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			const defaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: user.pk },
			});
			const file = await prisma.file.create({
				data: {
					id: '1',
					name: 'file',
					ownerId: user.pk,
					folderId: defaultFolder.pk,
					size: 123,
					type: 'image',
				},
			});

			const publicFile = await prisma.publicFile.create({
				data: {
					fileId: file.pk,
				},
			});

			const { status, body } = await request(app)
				.delete(`/api/public/${publicFile.id}`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.message).toBe('Delete public file successfully.');
			expect(body.data.currentFolder.files[0].id).toBe(file.id);
			expect(body.data.currentFolder.files[0].public).toBeNull();
		});
	});
});
