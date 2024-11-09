import express from 'express';

import * as fileControllers from '../controllers/file.js';
import * as folderControllers from '../controllers/folder.js';
import * as fileSharerControllers from '../controllers/fileSharer.js';
import * as publicFileControllers from '../controllers/publicFile.js';

import { authorization } from '../middlewares/authorization.js';

export const apiRouter = express.Router();

apiRouter.get('/public/:publicId', publicFileControllers.getPublicFile);

// authorization
apiRouter.use(authorization);

// Folder
apiRouter.get('/folders', folderControllers.listFolders);
apiRouter.post('/folders', folderControllers.createFolder);
apiRouter.patch('/folders/:folderId', folderControllers.updateFolder);
apiRouter.delete('/folders/:folderId', folderControllers.deleteFolder);

// File
apiRouter.post('/folders/:folderId/files', fileControllers.createFile);
apiRouter.patch('/files/:fileId', fileControllers.updateFile);
apiRouter.delete('/files/:fileId', fileControllers.deleteFile);
apiRouter.get('/files/:fileId/download-url', fileControllers.getDownloadUrl);

// File Sharer
apiRouter.get('/sharedFiles', fileSharerControllers.listFileSharers);
apiRouter.post(
	'/files/:fileId/sharers',
	fileSharerControllers.createFileSharer
);
apiRouter.delete(
	'/files/:fileId/sharers/:sharerId',
	fileSharerControllers.deleteFileSharer
);
apiRouter.delete(
	'/sharedFiles/:sharedFileId',
	fileSharerControllers.deleteSharedFile
);

// Public File
apiRouter.post('/files/:fileId/public', publicFileControllers.createPublicFile);
apiRouter.delete('/public/:publicId', publicFileControllers.deletePublicFile);
