import express from 'express'; // express 프레임워크 호출
import { SERVER_PORT } from './constants/env.constant.js'; // 환경 변수에서 서버 포트 호출
import { errorHandler } from './middlewares/error-handler.middleware.js'; // 전역 에러 핸들러 미들웨어 호출
import { HTTP_STATUS } from './constants/http-status.constant.js'; // HTTP 상태 코드를 정의한 상수 호출
import { apiRouter } from './routers/index.js'; // API 라우터 호출

// express 애플리케이션 생성
const app = express();

// JSON 형식 데이터를 파싱하기 위한 미들웨어
app.use(express.json());

// URL-encoded 형식데이터 파싱하기 위한 미들웨어
app.use(express.urlencoded({ extended: true }));

// 서버 연결 상태 확인을 위한 API
app.get('/health-check', (req, res) => {
  // 상태 코드를 200(OK)으로 설정하고 응답 메시지를 보냅니다.
  return res.status(HTTP_STATUS.OK).send(`I'm healthy.`);
});

// api경로에 대한 라우터를 등록
app.use('/api', apiRouter);

// 전역 에러 핸들러 미들웨어 등록
app.use(errorHandler);

// 서버 실행
app.listen(SERVER_PORT, () => {
  console.log(`서버가 ${SERVER_PORT}번 포트에서 실행 중입니다.`);
});