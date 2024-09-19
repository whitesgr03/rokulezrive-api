import express from 'express';

import * as userControllers from '../controllers/user.js';

const router = express.Router();

router.post('/login', userControllers.login);
router.post('/register', userControllers.register);
router.get('/logout', userControllers.logout);
export default router;
