import { expect, describe, it, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { apiRouter } from '../../routes/api';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

vi.mock('jsonwebtoken');

describe('File sharer paths', () => {
	describe('Authorization', () => {
		it('should respond with a 400 status code and message if no "authorization" header passed', async () => {
			const { status, body } = await request(app).get(`/api/sharedFiles`);

			expect(status).toBe(400);
			expect(body).toStrictEqual({
				success: false,
				message: 'Authorization header is required.',
			});
		});
		it('should respond with a 400 status code and message if the auth schema is invalid', async () => {
			const { status, body } = await request(app)
				.get(`/api/sharedFiles`)
				.set('Authorization', 'Public token');

			expect(status).toBe(400);
			expect(body).toStrictEqual({
				success: false,
				message: 'The auth-scheme or token are invalid.',
			});
		});
		it('should respond with a 400 status code and message if token is empty', async () => {
			const { status, body } = await request(app)
				.get(`/api/sharedFiles`)
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
				.get(`/api/sharedFiles`)
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
				.get(`/api/sharedFiles`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(404);
			expect(body).toStrictEqual({
				success: false,
				message: 'User could not been found.',
			});
		});
	});
	describe('GET /sharedFiles', () => {
		it(`should return a list of authorized user's shared files`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({ where: { id: userId } });
			const otherUserDefaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: { not: user.pk } },
			});

			const mockData = [
				{
					id: '1',
					name: 'file',
					ownerId: otherUserDefaultFolder.ownerId,
					folderId: otherUserDefaultFolder.pk,
					size: 123,
					type: 'image',
					sharers: {
						createMany: {
							data: [
								{
									sharerId: user.pk,
								},
							],
						},
					},
				},
				{
					id: '2',
					name: 'Second file',
					ownerId: otherUserDefaultFolder.ownerId,
					folderId: otherUserDefaultFolder.pk,
					size: 123,
					type: 'image',
					sharers: {
						createMany: {
							data: [
								{
									sharerId: user.pk,
								},
							],
						},
					},
				},
			];

			await prisma.$transaction(
				mockData.map(data => prisma.file.create({ data }))
			);

			const { status, body } = await request(app)
				.get('/api/sharedFiles')
				.set('Authorization', 'Bearer token');

			expect(status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.message).toBe('Get shared files successfully.');
			expect(body.data[0].file.id).toBe(mockData[0].id);
			expect(body.data[0].file.name).toBe(mockData[0].name);
			expect(body.data[1].file.id).toBe(mockData[1].id);
			expect(body.data[1].file.name).toBe(mockData[1].name);
		});
	});
	describe('POST /files/:fileId/sharers', () => {
		it(`should respond with a 400 status code and fields if email field is not provided`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
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
				.post(`/api/files/${file.id}/sharers`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.fields).toHaveProperty('email');
		});
		it(`should respond with a 404 status code and message if file is not found`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			const otherUserDefaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: { not: user.pk } },
				include: {
					owner: true,
				},
			});
			const otherUserFile = await prisma.file.create({
				data: {
					id: '1',
					name: 'file',
					size: 123,
					type: 'image',
					ownerId: otherUserDefaultFolder.owner.pk,
					folderId: otherUserDefaultFolder.pk,
				},
			});
			const { status, body } = await request(app)
				.post(`/api/files/${otherUserFile.id}/sharers`)
				.set('Authorization', 'Bearer token')
				.type('json')
				.send({ email: user.email });

			expect(status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.message).toBe('File could not been found.');
		});
		it(`should respond with a 400 status code and fields if sharer is not found`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
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
				.post(`/api/files/${file.id}/sharers`)
				.set('Authorization', 'Bearer token')
				.type('json')
				.send({ email: 'error@email.com' });

			expect(status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.fields.email).toBe('email is invalid.');
		});
		it(`should respond with a 400 status code and fields if sharer is file owner`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
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
				.post(`/api/files/${file.id}/sharers`)
				.set('Authorization', 'Bearer token')
				.type('json')
				.send({ email: user.email });

			expect(status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.fields.email).toBe('email is invalid.');
		});
		it(`should respond with a 400 status code and fields if sharer has shared with this file`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			const otherUser = await prisma.user.findFirst({
				where: { id: { not: userId } },
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
					sharers: {
						createMany: {
							data: [
								{
									sharerId: otherUser.pk,
								},
							],
						},
					},
				},
			});

			const { status, body } = await request(app)
				.post(`/api/files/${file.id}/sharers`)
				.set('Authorization', 'Bearer token')
				.type('json')
				.send({ email: otherUser.email });

			expect(status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.fields.email).toBe('email is invalid.');
		});
		it(`should share file to other user`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			const otherUser = await prisma.user.findFirst({
				where: { id: { not: userId } },
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
				.post(`/api/files/${file.id}/sharers`)
				.set('Authorization', 'Bearer token')
				.type('json')
				.send({ email: otherUser.email });

			expect(status).toBe(201);
			expect(body.success).toBe(true);
			expect(body.message).toBe('Create file sharer successfully.');
			expect(body.data.newShare.sharer.id).toBe(otherUser.id);
			expect(body.data.newShare.sharer.email).toBe(otherUser.email);
		});
	});
	describe('DELETE /files/:fileId/sharers/:sharerId', () => {
		it(`should respond with a 404 status code and message if sharer is not found`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
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
				.delete(`/api/files/${file.id}/sharers/fakeId`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.message).toBe('File could not been found.');
		});
		it(`should respond with a 404 status code and message if file is not found`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			const anotherUserDefaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: { not: user.pk } },
			});
			const anotherUserFile = await prisma.file.create({
				data: {
					id: '1',
					name: 'file',
					ownerId: anotherUserDefaultFolder.ownerId,
					folderId: anotherUserDefaultFolder.pk,
					size: 123,
					type: 'image',
				},
			});

			const { status, body } = await request(app)
				.delete(`/api/files/${anotherUserFile.id}/sharers/${user.id}`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.message).toBe('File could not been found.');
		});
		it(`should respond with a 404 status code and message if file is not shared with specified users`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			const otherUser = await prisma.user.findFirst({
				where: { id: { not: userId } },
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
				.delete(`/api/files/${file.id}/sharers/${otherUser.id}`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.message).toBe('File could not been found.');
		});
		it(`should delete one of the sharers of the specified file`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			const otherUser = await prisma.user.findFirst({
				where: { id: { not: userId } },
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
					sharers: {
						createMany: {
							data: [
								{
									sharerId: otherUser.pk,
								},
							],
						},
					},
				},
			});

			const { status, body } = await request(app)
				.delete(`/api/files/${file.id}/sharers/${otherUser.id}`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.message).toBe('Delete file sharer successfully.');
			expect(body.data.currentFolder.files[0].sharers.length).toBe(0);
		});
	});
	describe('DELETE /sharedFiles/:sharedFileId', () => {
		it(`should respond with a 404 status code and message if file is not found`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });

			const { status, body } = await request(app)
				.delete(`/api/sharedFiles/fakeId`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.message).toBe('Shared file could not been found.');
		});
		it(`should respond with a 404 status code and message if file is not shared with authorized user`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			const anotherUserDefaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: { not: user.pk } },
			});
			const anotherUserFile = await prisma.file.create({
				data: {
					id: '1',
					name: 'file',
					ownerId: anotherUserDefaultFolder.ownerId,
					folderId: anotherUserDefaultFolder.pk,
					size: 123,
					type: 'image',
				},
			});
			const { status, body } = await request(app)
				.delete(`/api/sharedFiles/${anotherUserFile.id}`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.message).toBe('Shared file could not been found.');
		});
		it(`should delete one of the shared files specified by the authorized user`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			const anotherUserDefaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: { not: user.pk } },
			});
			const anotherUserFile = await prisma.file.create({
				data: {
					id: '1',
					name: 'file',
					ownerId: anotherUserDefaultFolder.ownerId,
					folderId: anotherUserDefaultFolder.pk,
					size: 123,
					type: 'image',
					sharers: {
						createMany: {
							data: [
								{
									sharerId: user.pk,
								},
							],
						},
					},
				},
			});
			const { status, body } = await request(app)
				.delete(`/api/sharedFiles/${anotherUserFile.id}`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.message).toBe('Delete shared file successfully.');
		});
	});
});
