import express from 'express';

import * as userControllers from '../controllers/user.js';

const router = express.Router();

router
	.route('/login')
	.get(userControllers.loginGet)
	.post(userControllers.loginPost);
router
	.route('/register')
	.get(userControllers.registerGet)
	.post(userControllers.registerPost);

router.get('/logout', userControllers.logout);
export default router;
