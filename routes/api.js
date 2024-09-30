import express from 'express';

import * as fileControllers from '../controllers/file.js';
import * as folderControllers from '../controllers/folder.js';
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
	.put(folderControllers.updateFolder)
	.delete(folderControllers.deleteFolder);

router.post('/folders/:folderId/files', fileControllers.createFile);

router
	.route('/folders/:folderId/files/:fileId')
	.delete(fileControllers.deleteFile);

export default router;
