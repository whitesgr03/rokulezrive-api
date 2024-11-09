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

describe('Folder paths', () => {
	describe('Authorization', () => {
		it('should respond with a 400 status code and message if no "authorization" header passed', async () => {
			const { status, body } = await request(app).get('/api/folders');

			expect(status).toBe(400);
			expect(body).toStrictEqual({
				success: false,
				message: 'Authorization header is required.',
			});
		});
		it('should respond with a 400 status code and message if the auth schema is invalid', async () => {
			const { status, body } = await request(app)
				.get('/api/folders')
				.set('Authorization', 'Public token');

			expect(status).toBe(400);
			expect(body).toStrictEqual({
				success: false,
				message: 'The auth-scheme or token are invalid.',
			});
		});
		it('should respond with a 400 status code and message if token is empty', async () => {
			const { status, body } = await request(app)
				.get('/api/folders')
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
				.get('/api/folders')
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
				.get('/api/folders')
				.set('Authorization', 'Bearer token');

			expect(status).toBe(404);
			expect(body).toStrictEqual({
				success: false,
				message: 'User could not been found.',
			});
		});
	});
	describe('GET /folders', () => {
		it(`should return a list of authorized user's folders`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({ where: { id: userId } });
			const defaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: user.pk },
			});

			const mockData = {
				name: 'new subFolder',
				ownerId: user.pk,
				parentId: defaultFolder.pk,
			};

			await prisma.folder.create({
				data: mockData,
			});

			const { status, body } = await request(app)
				.get('/api/folders')
				.set('Authorization', 'Bearer token');

			expect(status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.message).toBe('Get all folders successfully.');
			expect(body.data.length).toBe(2);
			expect(body.data[0].name).toBe('My Drive');
			expect(body.data[1].name).toBe(mockData.name);
			expect(body.data[1].parent.id).toBe(defaultFolder.id);
		});
	});
	describe('POST /folders', () => {
		it(`should respond with a 400 status code and fields if name field is not provided`, async () => {
			jwt.verify.mockReturnValueOnce({ sub: '1' });

			const mockData = { folderId: '1' };

			const { status, body } = await request(app)
				.post('/api/folders')
				.set('Authorization', 'Bearer token')
				.type('json')
				.send(mockData);

			expect(status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.fields).toHaveProperty('name');
		});
		it(`should respond with a 400 status code and fields if folderId field is not provided`, async () => {
			jwt.verify.mockReturnValueOnce({ sub: '1' });

			const mockData = { name: 'test' };

			const { status, body } = await request(app)
				.post('/api/folders')
				.set('Authorization', 'Bearer token')
				.type('json')
				.send(mockData);

			expect(status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.fields).toHaveProperty('folderId');
		});
		it(`should respond with a 404 status code and message if parent folder of the new folder is not found`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({ where: { id: userId } });
			const anotherUserDefaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: { not: user.pk } },
			});

			const mockData = {
				name: 'New Folder',
				folderId: anotherUserDefaultFolder.id,
			};

			const { status, body } = await request(app)
				.post('/api/folders')
				.set('Authorization', 'Bearer token')
				.type('json')
				.send(mockData);
			expect(status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.message).toBe('Parent folder could not been found.');
		});
		it(`should create a new folder within the default folder`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({ where: { id: userId } });
			const defaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: user.pk },
			});

			const mockData = {
				name: 'New Folder',
				folderId: defaultFolder.id,
			};

			const { status, body } = await request(app)
				.post('/api/folders')
				.set('Authorization', 'Bearer token')
				.type('json')
				.send(mockData);

			expect(status).toBe(201);
			expect(body.success).toBe(true);
			expect(body.message).toBe('Create subfolder successfully.');
			expect(body.data.newFolder.name).toBe(mockData.name);
			expect(body.data.currentFolder.id).toBe(mockData.folderId);
			expect(body.data).not.haveOwnProperty('parentFolder');
		});
		it(`should create a new folder within the subFolder`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({ where: { id: userId } });
			const defaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: user.pk },
			});
			const subfolder = await prisma.folder.create({
				data: {
					name: 'subfolder',
					ownerId: user.pk,
					parentId: defaultFolder.pk,
				},
			});

			const mockData = {
				name: 'New Folder',
				folderId: subfolder.id,
			};

			const { status, body } = await request(app)
				.post('/api/folders')
				.set('Authorization', 'Bearer token')
				.type('json')
				.send(mockData);

			expect(status).toBe(201);
			expect(body.success).toBe(true);
			expect(body.message).toBe('Create subfolder successfully.');
			expect(body.data.newFolder.name).toBe(mockData.name);
			expect(body.data.currentFolder.id).toBe(mockData.folderId);
			expect(body.data.parentFolder.id).toBe(defaultFolder.id);
		});
	});
	describe('PATCH /folders/:folderId', () => {
		it(`should respond with a 400 status code and fields if name field is not provided`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: '1' });
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			const defaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: user.pk },
			});

			const mockData = {};

			const { status, body } = await request(app)
				.patch(`/api/folders/${defaultFolder.id}`)
				.set('Authorization', 'Bearer token')
				.type('json')
				.send(mockData);

			expect(status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.fields).toHaveProperty('name');
		});
		it(`should respond with a 404 status code and message if updated folder is not found`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({ where: { id: userId } });
			const anotherUserDefaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: { not: user.pk } },
			});

			const mockData = {
				name: 'New Name',
			};

			const { status, body } = await request(app)
				.patch(`/api/folders/${anotherUserDefaultFolder.id}`)
				.set('Authorization', 'Bearer token')
				.type('json')
				.send(mockData);

			expect(status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.message).toBe('Folder could not been found.');
		});
		it(`should respond with a 404 status code and message if updated folder is default folder`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({ where: { id: userId } });
			const defaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: user.pk },
			});

			const mockData = {
				name: 'New Name',
			};

			const { status, body } = await request(app)
				.patch(`/api/folders/${defaultFolder.id}`)
				.set('Authorization', 'Bearer token')
				.type('json')
				.send(mockData);

			expect(status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.message).toBe('Folder could not been found.');
		});
		it(`should update a specified folder`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({ where: { id: userId } });
			const defaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: user.pk },
			});
			const subfolder = await prisma.folder.create({
				data: {
					name: 'subfolder',
					ownerId: user.pk,
					parentId: defaultFolder.pk,
				},
			});

			const mockData = {
				name: 'New Name',
			};

			const { status, body } = await request(app)
				.patch(`/api/folders/${subfolder.id}`)
				.set('Authorization', 'Bearer token')
				.type('json')
				.send(mockData);

			expect(status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.message).toBe('Update folder successfully.');
			expect(body.data.currentFolder.name).toBe(mockData.name);
			expect(body.data.parentFolder.id).toBe(defaultFolder.id);
		});
	});
	describe('DELETE /folders/:folderId', () => {
		it(`should respond with a 404 status code and fields if deleted folder is not found`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({ where: { id: userId } });
			const anotherUserDefaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: { not: user.pk } },
			});

			const { status, body } = await request(app)
				.delete(`/api/folders/${anotherUserDefaultFolder.id}`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.message).toBe('Folder could not been found.');
		});
		it(`should respond with a 404 status code and message if deleted folder is default folder`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({ where: { id: userId } });
			const defaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: user.pk },
			});

			const { status, body } = await request(app)
				.delete(`/api/folders/${defaultFolder.id}`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.message).toBe('Folder could not been found.');
		});
		it(`should respond with a 400 status code and fields if "allFolderIdsWithFiles" field is send but not all are strings`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			const defaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: user.pk },
			});

			const subfolder = await prisma.folder.create({
				data: {
					name: 'subfolder',
					ownerId: user.pk,
					parentId: defaultFolder.pk,
				},
			});

			const secondSubfolder = await prisma.folder.create({
				data: {
					name: 'second-subfolder',
					ownerId: user.pk,
					parentId: subfolder.pk,
				},
			});

			const mockData = {
				folderIds: [1, secondSubfolder.id, 1, 1231, true, '12', 34],
			};

			const errorIds = mockData.folderIds.map(id => typeof id !== 'string');
			const errorFields = {};
			for (const [index, error] of errorIds.entries()) {
				error &&
					(errorFields[`folderIds[${index}]`] = 'Folder id must be string');
			}

			const { status, body } = await request(app)
				.delete(`/api/folders/${subfolder.id}`)
				.set('Authorization', 'Bearer token')
				.type('json')
				.send(mockData);

			expect(status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.fields).toStrictEqual(errorFields);
		});
		it(`should delete a specified folder within the default folder`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({ where: { id: userId } });
			const defaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: user.pk },
			});
			const firstCreatedSubfolder = await prisma.folder.create({
				data: {
					name: 'subfolder',
					ownerId: user.pk,
					parentId: defaultFolder.pk,
				},
			});
			const secondCreatedSubfolder = await prisma.folder.create({
				data: {
					name: 'subfolder',
					ownerId: user.pk,
					parentId: defaultFolder.pk,
				},
			});

			const { status, body } = await request(app)
				.delete(`/api/folders/${firstCreatedSubfolder.id}`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.message).toBe('Delete folder successfully.');
			expect(body.data.currentFolder.subfolders[0].id).toBe(
				secondCreatedSubfolder.id
			);
			expect(body.data).not.haveOwnProperty('parentFolder');
		});
		it(`should delete a specified folder within the subFolder`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({ where: { id: userId } });
			const defaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: user.pk },
			});
			const subfolder = await prisma.folder.create({
				data: {
					name: 'subfolder',
					ownerId: user.pk,
					parentId: defaultFolder.pk,
				},
			});
			const firstCreatedSubfolder = await prisma.folder.create({
				data: {
					name: 'subfolder',
					ownerId: user.pk,
					parentId: subfolder.pk,
				},
			});
			const secondCreatedSubfolder = await prisma.folder.create({
				data: {
					name: 'subfolder',
					ownerId: user.pk,
					parentId: subfolder.pk,
				},
			});

			const { status, body } = await request(app)
				.delete(`/api/folders/${firstCreatedSubfolder.id}`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.message).toBe('Delete folder successfully.');
			expect(body.data.currentFolder.subfolders[0].id).toBe(
				secondCreatedSubfolder.id
			);
			expect(body.data.parentFolder.subfolders[0]._count.subfolders).toBe(1);
		});
		it(`should delete all subfolders and files of the specified folder`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			const defaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: user.pk },
			});

			const firstCreatedSubfolder = await prisma.folder.create({
				data: {
					name: 'subfolder',
					ownerId: user.pk,
					parentId: defaultFolder.pk,
				},
			});
			const secondCreatedSubfolder = await prisma.folder.create({
				data: {
					name: 'subfolder',
					ownerId: user.pk,
					parentId: defaultFolder.pk,
				},
			});

			await prisma.file.create({
				data: {
					id: '1',
					name: 'file',
					ownerId: user.pk,
					folderId: firstCreatedSubfolder.pk,
					size: 123,
					type: 'image',
				},
			});

			const mockData = {
				folderIds: [secondCreatedSubfolder.id],
			};

			const { status, body } = await request(app)
				.delete(`/api/folders/${firstCreatedSubfolder.id}`)
				.set('Authorization', 'Bearer token')
				.type('json')
				.send(mockData);

			expect(status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.message).toBe('Delete folder successfully.');
			expect(body.data.currentFolder.subfolders[0].id).toBe(
				secondCreatedSubfolder.id
			);
			expect(body.data.currentFolder.files.length).toBe(0);
			expect(body.data).not.haveOwnProperty('parentFolder');
			expect(cloudinary.api.delete_resources_by_prefix).toBeCalledTimes(
				mockData.folderIds.length
			);
		});
	});
});
