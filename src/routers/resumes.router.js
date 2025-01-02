import express from 'express';
import { HTTP_STATUS } from '../constants/http-status.constant.js';
import { MESSAGES } from '../constants/message.constant.js'; 
import { createResumeValidator } from '../middlewares/validators/create-resume-validator.middleware.js'; // 이력서 검증 미들웨어
import { updateResumeValidator } from '../middlewares/validators/update-resume-validator.middleware.js'; // 이력서 검증 미들웨어
import { prisma } from '../utils/prisma.util.js';

const resumesRouter = express.Router();

// 이력서 생성 API
resumesRouter.post('/', createResumeValidator, async (req, res, next) => {
  try {
    const user = req.user; // 이력서 검증 미들웨어에서 받은 user
    const { title, content } = req.body; // 요청 데이터
    const authorId = user.id; // 작성자 ID

    // 이력서 데이터 등록
    const data = await prisma.resume.create({
      data: { authorId, title, content },
    });

    // 성공 응답 반환
    return res.status(HTTP_STATUS.CREATED).json({
      status: HTTP_STATUS.CREATED,
      message: MESSAGES.RESUMES.CREATE.SUCCEED,
      data,
    });
  } catch (error) {
    next(error); // 에러 처리
  }
});

// 이력서 목록 조회 API
resumesRouter.get('/', async (req, res, next) => {
  try {
    const user = req.user; // 이력서 검증 미들웨어에서 받은 user
    const authorId = user.id; // 작성자 ID
    let { sort } = req.query; // 정렬 옵션
    sort = sort?.toLowerCase() !== 'asc' ? 'desc' : 'asc'; // 내림차순(desc)이 기본 정렬
    // toLowerCase는 대소문자를 구분하지 않고 전부 소문자로 변환함

    // 이력서 목록 조회
    let data = await prisma.resume.findMany({
      where: { authorId }, // 작성자ID가 일치하는 데이터 조회
      orderBy: { createdAt: sort }, // 생성 시간 순으로 조회
      include: { author: true }, // 작성자 테이블에서 작성자ID가 해당되는 데이터 포함(include)하여 조회 
    });

    // 배열 요소 재배치 -> 가시성 좋은 데이터를 제공하기 위함
    data = data.map((resume) => ({
      id: resume.id,
      authorName: resume.author.name,
      title: resume.title,
      content: resume.content,
      status: resume.status,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    }));

    // 성공 응답 반환
    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.RESUMES.READ_LIST.SUCCEED,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// 이력서 상세 조회 API
resumesRouter.get('/:id', async (req, res, next) => {
  try {
    const user = req.user; // 이력서 검증 미들웨어에서 받은 user
    const authorId = user.id; // 작성자 ID
    const { id } = req.params; // 이력서 ID

    // 이력서 존재 검증
    let data = await prisma.resume.findUnique({
      where: { id: +id, authorId }, // 작성자ID가 일치하는 이력서 데이터 조회
      include: { author: true }, // 해당 작성자 정보도 포함하여 조회
    });

    // 이력서가 조회되지 않을 경우
    if (!data) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        status: HTTP_STATUS.NOT_FOUND,
        message: MESSAGES.RESUMES.COMMON.NOT_FOUND,
      });
    }

    // 데이터 준비
    data = {
      id: data.id,
      authorName: data.author.name,
      title: data.title,
      content: data.content,
      status: data.status,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    // 성공 응답 반환
    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.RESUMES.READ_DETAIL.SUCCEED,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// 이력서 수정 API
resumesRouter.put('/:id', updateResumeValidator, async (req, res, next) => {
  try {
    const user = req.user; // 이력서 검증 미들웨어에서 받은 user
    const authorId = user.id; // 작성자 ID
    const { id } = req.params; // 이력서 ID
    const { title, content } = req.body; // 수정할 데이터

    // 이력서 존재 검증
    let existedResume = await prisma.resume.findUnique({
      where: { id: +id, authorId },
    });

    // 이력서가 없을 경우
    if (!existedResume) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        status: HTTP_STATUS.NOT_FOUND,
        message: MESSAGES.RESUMES.COMMON.NOT_FOUND,
      });
    }

    // 이력서 수정
    const data = await prisma.resume.update({
      where: { id: +id, authorId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
      },
    });

    // 성공 응답 반환
    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.RESUMES.UPDATE.SUCCEED,
      data,
    });
  } catch (error) {
    next(error);
  }
});

// 이력서 삭제 API
resumesRouter.delete('/:id', async (req, res, next) => {
  try {
    const user = req.user; // 이력서 검증 미들웨어에서 받은 user
    const authorId = user.id; // 작성자 ID
    const { id } = req.params; // 이력서 ID

    // 이력서 존재 여부 확인
    let existedResume = await prisma.resume.findUnique({
      where: { id: +id, authorId },
    });

    if (!existedResume) {
      // 이력서 없으면 404 응답
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        status: HTTP_STATUS.NOT_FOUND,
        message: MESSAGES.RESUMES.COMMON.NOT_FOUND,
      });
    }

    // 이력서 삭제
    const data = await prisma.resume.delete({ where: { id: +id, authorId } });

    // 성공 응답 반환
    return res.status(HTTP_STATUS.OK).json({
      status: HTTP_STATUS.OK,
      message: MESSAGES.RESUMES.DELETE.SUCCEED,
      data: { id: data.id },
    });
  } catch (error) {
    next(error);
  }
});

export { resumesRouter };
