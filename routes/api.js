import express from 'express';

import * as fileControllers from '../controllers/file.js';
import * as folderControllers from '../controllers/folder.js';
import * as fileSharerControllers from '../controllers/fileSharer.js';
import * as publicFileControllers from '../controllers/publicFile.js';
import { getUser } from '../controllers/user.js';

import { verifyCredentials } from '../middlewares/verifyCredentials.js';
import { verifyCSRF } from '../middlewares/verifyCSRF.js';

const router = express.Router();

router.get('/public/:publicId', publicFileControllers.getPublicFile);

router.use(verifyCredentials);

router.get('/user', getUser);

router
	.route('/folders')
	.get(folderControllers.listFolders)
	.post(folderControllers.createFolder);

router
	.route('/folders/:folderId')
	.get(folderControllers.getFolder)
	.patch(folderControllers.updateFolder)
	.delete(folderControllers.deleteFolder);

router.post('/folders/:folderId/files', fileControllers.createFile);

router
	.route('/files/:fileId')
	.patch(fileControllers.updateFile)
	.delete(fileControllers.deleteFile);

router.get('/sharedFiles', fileSharerControllers.listFileSharers);
router.delete(
	'/sharedFiles/:sharedFileId',
	fileSharerControllers.deleteSharedFile
);

router.post('/files/:fileId/sharers', fileSharerControllers.createFileSharer);
router.delete(
	'/files/:fileId/sharers/:sharerId',
	fileSharerControllers.deleteFileSharer
);

router.post('/files/:fileId/public', publicFileControllers.createPublicFile);
router.delete('/public/:publicId', publicFileControllers.deletePublicFile);

router.post('/files/:fileId/copy', fileControllers.createCopyFile);

export default router;
