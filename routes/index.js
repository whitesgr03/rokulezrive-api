import express from 'express';

import * as userControllers from '../controllers/user.js';

import { verifyCSRF } from '../middlewares/verifyCSRF.js';

const router = express.Router();

router.post('/login', verifyCSRF, userControllers.login);
router.post('/register', verifyCSRF, userControllers.register);
router.post('/logout', verifyCSRF, userControllers.logout);

router.post('/login/google', verifyCSRF, userControllers.loginWithGoogle);
router.post('/register/google', verifyCSRF, userControllers.registerWithGoogle);
router.post('/login/facebook', verifyCSRF, userControllers.loginWithFacebook);
router.post(
	'/register/facebook',
	verifyCSRF,
	userControllers.registerWithFacebook
);

export default router;
