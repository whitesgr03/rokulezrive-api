import express from 'express';

import * as fileControllers from '../controllers/file.js';
import * as folderControllers from '../controllers/folder.js';
import * as sharedControllers from '../controllers/share.js';
import { getUser } from '../controllers/user.js';

import { verifyCredentials } from '../middlewares/verifyCredentials.js';

const router = express.Router();

router.route('/shared/:shareId').get(sharedControllers.getShared);

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
	.route('/folders/:folderId/files/:fileId')
	.put(fileControllers.updateFile)
	.delete(fileControllers.deleteFile);

router.route('/shared').get(sharedControllers.ListShared);

router.put('/files/:fileId/sharing/:shareId', sharedControllers.updateSharing);

export default router;
