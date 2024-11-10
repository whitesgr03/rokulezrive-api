import { expect, describe, it, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { apiRouter } from '../../routes/api';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { cloudinary, uploadFile } from '../../lib/cloudinary';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

vi.mock('jsonwebtoken');
vi.mock('../../lib/cloudinary');

describe('File paths', () => {
	describe('Authorization', () => {
		it('should respond with a 400 status code and message if no "authorization" header passed', async () => {
			const { status, body } = await request(app).get(`/api/folders/id/files`);

			expect(status).toBe(400);
			expect(body).toStrictEqual({
				success: false,
				message: 'Authorization header is required.',
			});
		});
		it('should respond with a 400 status code and message if the auth schema is invalid', async () => {
			const { status, body } = await request(app)
				.get(`/api/folders/id/files`)
				.set('Authorization', 'Public token');

			expect(status).toBe(400);
			expect(body).toStrictEqual({
				success: false,
				message: 'The auth-scheme or token are invalid.',
			});
		});
		it('should respond with a 400 status code and message if token is empty', async () => {
			const { status, body } = await request(app)
				.get(`/api/folders/id/files`)
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
				.get(`/api/folders/id/files`)
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
				.get(`/api/folders/id/files`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(404);
			expect(body).toStrictEqual({
				success: false,
				message: 'User could not been found.',
			});
		});
	});
	describe('GET /files/:fileId/download-url', () => {
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
				.get(`/api/files/${otherUserFile.id}/download-url`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.message).toBe('File could not been found.');
		});
		it(`should return the download URL of file if authorized user is owner`, async () => {
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

			const mockUrl = 'url';

			cloudinary.utils.private_download_url.mockReturnValueOnce(mockUrl);

			const { status, body } = await request(app)
				.get(`/api/files/${file.id}/download-url`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.message).toBe('Get file download url successfully.');
			expect(body.data.url).toBe(mockUrl);
			expect(cloudinary.utils.private_download_url).toBeCalledTimes(1);
		});
		it(`should return the download URL of file if authorized user is sharer`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
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

			const mockUrl = 'url';

			cloudinary.utils.private_download_url.mockReturnValueOnce(mockUrl);

			const { status, body } = await request(app)
				.get(`/api/files/${otherUserFile.id}/download-url`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.message).toBe('Get file download url successfully.');
			expect(body.data.url).toBe(mockUrl);
			expect(cloudinary.utils.private_download_url).toBeCalledTimes(1);
		});
	});
	describe('POST /folders/:folderId/files', () => {
		it(`should respond with a 400 status code and message if upload file is not provided`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			const defaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: user.pk },
			});

			const { status, body } = await request(app)
				.post(`/api/folders/${defaultFolder.id}/files`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.message).toBe('File is required.');
		});
		it(`should respond with a 413 status code and message if upload file greater than 1 MB`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			const defaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: user.pk },
			});

			const { status, body } = await request(app)
				.post(`/api/folders/${defaultFolder.id}/files`)
				.set('Authorization', 'Bearer token')
				.attach('file', `${__dirname}/test.pdf`);

			expect(status).toBe(413);
			expect(body.success).toBe(false);
			expect(body.message).toBe('File size must be less than 1 MB.');
		});
		it(`should respond with a 404 status code and fields if folder is not found`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({ where: { id: userId } });
			const otherUserDefaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: { not: user.pk } },
			});

			const { status, body } = await request(app)
				.post(`/api/folders/${otherUserDefaultFolder.id}/files`)
				.set('Authorization', 'Bearer token')
				.attach('file', `${__dirname}/setup.js`);

			expect(status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.message).toBe('Folder could not been found.');
		});
		it(`should create a new file within the default folder`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({
				where: { id: userId },
			});
			const defaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: user.pk },
			});

			const mockUploadResult = {
				public_id: 'fewrw/fdadas',
				resource_type: 'raw',
			};

			uploadFile.mockResolvedValueOnce(mockUploadResult);

			const { status, body } = await request(app)
				.post(`/api/folders/${defaultFolder.id}/files`)
				.set('Authorization', 'Bearer token')
				.attach('file', `${__dirname}/setup.js`);

			expect(status).toBe(201);
			expect(body.success).toBe(true);
			expect(body.message).toBe('Upload file is successfully.');
			expect(body.data.currentFolder.files[0].id).toBe(
				mockUploadResult.public_id.split('/')[1]
			);
			expect(body.data.currentFolder.files[0].type).toBe(
				mockUploadResult.resource_type
			);
			expect(body.data).not.haveOwnProperty('parentFolder');
			expect(uploadFile).toBeCalledTimes(1);
		});
		it(`should create a new file within the subfolder`, async () => {
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

			const mockUploadResult = {
				public_id: 'abc/def',
				resource_type: 'image',
			};

			uploadFile.mockResolvedValueOnce(mockUploadResult);

			const { status, body } = await request(app)
				.post(`/api/folders/${subfolder.id}/files`)
				.set('Authorization', 'Bearer token')
				.attach('file', `${__dirname}/setup.js`);

			expect(status).toBe(201);
			expect(body.success).toBe(true);
			expect(body.message).toBe('Upload file is successfully.');
			expect(body.data.currentFolder.files[0].id).toBe(
				mockUploadResult.public_id.split('/')[1]
			);
			expect(body.data.currentFolder.files[0].type).toBe(
				mockUploadResult.resource_type
			);
			expect(body.data.parentFolder.subfolders[0]._count.files).toBe(1);
			expect(uploadFile).toBeCalledTimes(1);
		});
	});
	describe('PATCH /files/:fileId', () => {
		it(`should respond with a 400 status code and fields if name field is not provided`, async () => {
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
				.patch(`/api/files/${file.id}`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(400);
			expect(body.success).toBe(false);
			expect(body.fields).toHaveProperty('name');
		});
		it(`should respond with a 404 status code and message if updated file is not found`, async () => {
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

			const mockData = {
				name: 'new file',
			};

			const { status, body } = await request(app)
				.patch(`/api/files/${otherUserFile.id}`)
				.set('Authorization', 'Bearer token')
				.type('json')
				.send(mockData);

			expect(status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.message).toBe('File could not been found.');
		});
		it(`should update a specified file`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({ where: { id: userId } });
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

			const mockData = {
				name: 'New Name',
			};

			const { status, body } = await request(app)
				.patch(`/api/files/${file.id}`)
				.set('Authorization', 'Bearer token')
				.type('json')
				.send(mockData);

			expect(status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.message).toBe('Update file successfully.');
			expect(body.data.currentFolder.files[0].name).toBe(mockData.name);
		});
	});
	describe('DELETE /files/:fileId', () => {
		it(`should respond with a 404 status code and fields if deleted file is not found`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
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
				.delete(`/api/files/${otherUserFile.id}`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(404);
			expect(body.success).toBe(false);
			expect(body.message).toBe('File could not been found.');
		});
		it(`should delete a specified file within the default folder`, async () => {
			const userId = '1';
			jwt.verify.mockReturnValueOnce({ sub: userId });
			const user = await prisma.user.findUnique({ where: { id: userId } });
			const defaultFolder = await prisma.folder.findFirst({
				where: { name: 'My Drive', ownerId: user.pk },
			});
			const firstCreatedFile = await prisma.file.create({
				data: {
					id: '1',
					name: 'file',
					ownerId: user.pk,
					folderId: defaultFolder.pk,
					size: 123,
					type: 'image',
				},
			});
			const secondCreatedFile = await prisma.file.create({
				data: {
					id: '2',
					name: 'second file',
					ownerId: user.pk,
					folderId: defaultFolder.pk,
					size: 123,
					type: 'image',
				},
			});

			cloudinary.uploader.destroy.mockResolvedValueOnce({
				result: 'ok',
			});

			const { status, body } = await request(app)
				.delete(`/api/files/${firstCreatedFile.id}`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.message).toBe('Delete file successfully.');
			expect(body.data.currentFolder.files[0].id).toBe(secondCreatedFile.id);
			expect(body.data).not.haveOwnProperty('parentFolder');
			expect(cloudinary.uploader.destroy).toBeCalledTimes(1);
		});
		it(`should delete a specified file within the subFolder`, async () => {
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
			const firstCreatedFile = await prisma.file.create({
				data: {
					id: '1',
					name: 'file',
					ownerId: user.pk,
					folderId: subfolder.pk,
					size: 123,
					type: 'image',
				},
			});
			const secondCreatedFile = await prisma.file.create({
				data: {
					id: '2',
					name: 'second file',
					ownerId: user.pk,
					folderId: subfolder.pk,
					size: 123,
					type: 'image',
				},
			});

			cloudinary.uploader.destroy.mockResolvedValueOnce({
				result: 'ok',
			});

			const { status, body } = await request(app)
				.delete(`/api/files/${firstCreatedFile.id}`)
				.set('Authorization', 'Bearer token');

			expect(status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.message).toBe('Delete file successfully.');
			expect(body.data.currentFolder.files[0].id).toBe(secondCreatedFile.id);
			expect(body.data.parentFolder.subfolders[0]._count.files).toBe(1);
			expect(cloudinary.uploader.destroy).toBeCalledTimes(1);
		});
	});
});
