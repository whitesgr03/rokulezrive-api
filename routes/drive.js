import express from 'express';

import * as fileControllers from '../controllers/file.js';

import { verifyCredentials } from '../middlewares/verifyCredentials.js';

const router = express.Router();

router.use(verifyCredentials);

router
  .route('/files/create')
  .get(fileControllers.fileCreateGet);
router.get('/files', fileControllers.fileList);

router.get('/shared', fileControllers.sharedList);

router.get('/', fileControllers.index);

export default router;
