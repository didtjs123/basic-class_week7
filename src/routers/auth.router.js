import express from 'express';
import bcrypt from 'bcrypt'; // 비밀번호 해싱을 위한 라이브러리
import jwt from 'jsonwebtoken'; // JWT 토큰 생성을 위한 j라이브러리
import { HTTP_STATUS } from '../constants/http-status.constant.js'; // http 상태 값 호출
import { MESSAGES } from '../constants/message.constant.js'; // 메시지 호출
import { signUpValidator } from '../middlewares/validators/sign-up-validator.middleware.js'; // 회원가입 시, 요청 데이터를 검증 미들웨어
import { signInValidator } from '../middlewares/validators/sign-in-validator.middleware.js'; // 로그인 요청 시, 데이터 검증 미들웨어
import { prisma } from '../utils/prisma.util.js'; // 프리즈마 클라이언트 호출
import {
  ACCESS_TOKEN_EXPIRES_IN,
  HASH_SALT_ROUNDS,
} from '../constants/auth.constant.js'; // 인증 관련 상수 호출

// JWT 시크릿 키
import { ACCESS_TOKEN_SECRET } from '../constants/env.constant.js';

// Express 라우터 생성
const authRouter = express.Router();

// 회원가입 API
authRouter.post('/sign-up', signUpValidator, async (req, res, next) => {
  try {
    // 클라이언트로부터 받은 요청 데이터
    const { email, password, name } = req.body;

    // 중복 이메일 확인
    const existedUser = await prisma.user.findUnique({ where: { email } });

    // 이메일이 중복된 경우, 409 상태 코드와 메시지 반환
    if (existedUser) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        status: HTTP_STATUS.CONFLICT,
        message: MESSAGES.AUTH.COMMON.EMAIL.DUPLICATED,
      });
    }

    // 비밀번호 해싱, HASH_SALT_ROUNDS 이거는 숫자가 높을수록 보안성 증가
    const hashedPassword = bcrypt.hashSync(password, HASH_SALT_ROUNDS);

    // 신규 유저 생성
    const data = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // data에서 비밀번호 누락
    data.password = undefined;

    // 유저 생성 성공 시 응답
    return res.status(HTTP_STATUS.CREATED).json({
      status: HTTP_STATUS.CREATED,
      message: MESSAGES.AUTH.SIGN_UP.SUCCEED,
      data,
    });
  } catch (error) {
    // 에러 발생 시 전역 에러 핸들러로 전달
    next(error);
  }
});

// 로그인 API
authRouter.post('/sign-in', signInValidator, async (req, res, next) => {
  try {
    // 클라이언트로부터 받은 요청 데이터
    const { email, password } = req.body;

    // 이메일로 유저 정보 조회
    const user = await prisma.user.findUnique({ where: { email } });

    // 비밀번호 일치 검증
    const isPasswordMatched =
      user && bcrypt.compareSync(password, user.password);

    // 유저 정보가 없거나 비빌번호가 틀린 경우
    if (!isPasswordMatched) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        status: HTTP_STATUS.UNAUTHORIZED,
        message: MESSAGES.AUTH.COMMON.UNAUTHORIZED,
      });
    }

    // 토큰에 담을 페이로드
    const payload = { id: user.id };

    // 액세스 토큰 생성
    const accessToken = jwt.sign(payload, ACCESS_TOKEN_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });

    // 로그인 성공 응답
    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.AUTH.SIGN_IN.SUCCEED,
      data: { accessToken },
    });
  } catch (error) {
    // 에러 발생 시 전역 에러 핸들러로 전달
    next(error);
  }
});

// authRouter를 외부에서 사용할 수 있게 함
export { authRouter };
