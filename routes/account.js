import express from 'express';

import * as userControllers from '../controllers/user.js';

const router = express.Router();

router.get('/user', userControllers.userInfo);
router.post('/login', userControllers.login);
router.post('/register', userControllers.register);
router.get('/logout', userControllers.logout);

router.post('/login/google', userControllers.googleLogin);
router.post('/register/google', userControllers.googleRegister);
router.post('/login/facebook', userControllers.facebookLogin);
router.post('/register/facebook', userControllers.facebookRegister);

export default router;
