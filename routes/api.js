import express from 'express';

import * as fileControllers from '../controllers/file.js';
import * as folderControllers from '../controllers/folder.js';
import * as fileSharerControllers from '../controllers/fileSharer.js';
import { getUser } from '../controllers/user.js';

import { verifyCredentials } from '../middlewares/verifyCredentials.js';

const router = express.Router();

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
	'/sharedFiles/:sharedFilesId',
	fileSharerControllers.deleteFileSharer
);

export default router;
