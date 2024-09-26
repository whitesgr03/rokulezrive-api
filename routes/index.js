import express from 'express';

import * as userControllers from '../controllers/user.js';

const router = express.Router();

router.post('/login', userControllers.login);
router.post('/register', userControllers.register);
router.get('/logout', userControllers.logout);

router.post('/login/google', userControllers.loginWithGoogle);
router.post('/register/google', userControllers.registerWithGoogle);
router.post('/login/facebook', userControllers.loginWithFacebook);
router.post('/register/facebook', userControllers.registerWithFacebook);

export default router;
