import express from 'express';
import { authRouter } from './auth.router.js';
import { usersRouter } from './users.router.js';
import { resumesRouter } from './resumes.router.js';
import { requireAccessToken } from '../middlewares/require-access-token.middleware.js';


// 라우터 생성
const apiRouter = express.Router();


// 라우터 등록
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/resumes', requireAccessToken, resumesRouter);


// 외부에서 사용할 수 있게 함
export { apiRouter };
