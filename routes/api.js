import express from 'express';
import * as folderControllers from '../controllers/folder.js';

import { verifyCredentials } from '../middlewares/verifyCredentials.js';

const router = express.Router();

router.use(verifyCredentials);
router.route('/folders/:folder').get(folderControllers.getFolder);
export default router;
