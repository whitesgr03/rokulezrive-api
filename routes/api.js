import express from 'express';

import * as fileControllers from '../controllers/file.js';
import * as folderControllers from '../controllers/folder.js';
import * as fileSharerControllers from '../controllers/fileSharer.js';
import * as publicFileControllers from '../controllers/publicFile.js';
import { getUser } from '../controllers/user.js';

import { verifyToken } from '../middlewares/verifyToken.js';

const router = express.Router();

router.get('/public/:publicId', publicFileControllers.getPublicFile);
router.post('/files/:fileId/copy', verifyCSRF, fileControllers.createCopyFile);

// Requires token
router.use(verifyToken);

// GET
router.get('/user', getUser);
router.get('/folders', folderControllers.listFolders);
router.get('/folders/:folderId', folderControllers.getFolder);
router.get('/sharedFiles', fileSharerControllers.listFileSharers);


// POST
router.post('/folders', folderControllers.createFolder);
router.post('/folders/:folderId/files', fileControllers.createFile);
router.post('/files/:fileId/sharers', fileSharerControllers.createFileSharer);
router.post('/files/:fileId/public', publicFileControllers.createPublicFile);

// PATCH
router.patch('/folders/:folderId', folderControllers.updateFolder);
router.patch('/files/:fileId', fileControllers.updateFile);

// DELETE
router.delete('/files/:fileId', fileControllers.deleteFile);
router.delete('/folders/:folderId', folderControllers.deleteFolder);
router.delete(
	'/sharedFiles/:sharedFileId',
	fileSharerControllers.deleteSharedFile
);
router.delete(
	'/files/:fileId/sharers/:sharerId',
	fileSharerControllers.deleteFileSharer
);
router.delete('/public/:publicId', publicFileControllers.deletePublicFile);

export default router;
