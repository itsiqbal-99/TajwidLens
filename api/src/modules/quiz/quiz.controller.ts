import {Body,Controller,Get,HttpCode,Param,Post,Put,Query,Req,UseGuards} from '@nestjs/common';
import {ApiCookieAuth,ApiOperation,ApiResponse,ApiTags} from '@nestjs/swagger';
import {SessionGuard,AuthRequest} from '../auth/session.guard';
import {LessonParamsDto} from '../learning/learning.dto';
import {OptionalSessionGuard,PracticeRequest} from './optional-session.guard';
import {QuizService} from './quiz.service';
import {DetectiveService} from './detective.service';
import {ReviewService} from './review.service';
import {AnswersDto,AttemptParamsDto,AvailabilityDto,DetectiveAnswerDto,DetectiveDto,DetectiveQueryDto,DetectiveResultDto,EmptyQuizDto,MistakeListDto,QuizAttemptDto,ReviewParamsDto,ReviewQueryDto} from './quiz.dto';

@ApiTags('Lesson Quiz') @Controller('quiz')
@ApiResponse({status:400,description:'Invalid input, incomplete/duplicate answers or unexpected fields'})
@ApiResponse({status:401,description:'Session missing or expired'}) @ApiResponse({status:404,description:'Unknown or non-owned attempt/lesson'})
@ApiResponse({status:409,description:'Question bank unavailable or question content withdrawn'}) @ApiResponse({status:410,description:'Attempt expired'})
export class QuizController {
  constructor(private quiz:QuizService) {}
  @Get('lessons/:lessonId/availability') @UseGuards(OptionalSessionGuard) @ApiResponse({status:200,type:AvailabilityDto})
  availability(@Req() req:PracticeRequest,@Param() params:LessonParamsDto,@Query() _query:EmptyQuizDto) {return this.quiz.availability(params.lessonId,req.user?.id);}
  @Post('lessons/:lessonId/attempts') @UseGuards(SessionGuard) @ApiCookieAuth() @HttpCode(201) @ApiResponse({status:201,type:QuizAttemptDto})
  create(@Req() req:AuthRequest,@Param() params:LessonParamsDto,@Body() _body:EmptyQuizDto,@Query() _query:EmptyQuizDto) {return this.quiz.create(req.user.id,params.lessonId);}
  @Get('attempts/:attemptId') @UseGuards(SessionGuard) @ApiCookieAuth() @ApiResponse({status:200,type:QuizAttemptDto})
  get(@Req() req:AuthRequest,@Param() params:AttemptParamsDto,@Query() _query:EmptyQuizDto) {return this.quiz.get(req.user.id,params.attemptId);}
  @Put('attempts/:attemptId/answers') @UseGuards(SessionGuard) @ApiCookieAuth() @ApiResponse({status:200,type:QuizAttemptDto})
  @ApiOperation({summary:'Persist answer selections without evaluation or feedback'})
  save(@Req() req:AuthRequest,@Param() params:AttemptParamsDto,@Body() body:AnswersDto,@Query() _query:EmptyQuizDto) {return this.quiz.saveAnswers(req.user.id,params.attemptId,body.answers);}
  @Post('attempts/:attemptId/submit') @UseGuards(SessionGuard) @ApiCookieAuth() @HttpCode(200) @ApiResponse({status:200,type:QuizAttemptDto})
  @ApiOperation({summary:'Idempotent server evaluation; only a passed seven-question lesson quiz can complete a lesson'})
  submit(@Req() req:AuthRequest,@Param() params:AttemptParamsDto,@Body() body:AnswersDto,@Query() _query:EmptyQuizDto) {return this.quiz.submit(req.user.id,params.attemptId,body.answers);}
}
@ApiTags('Tajwid Detective') @Controller('detective') @UseGuards(OptionalSessionGuard)
@ApiResponse({status:400,description:'Invalid challenge or answer'}) @ApiResponse({status:403,description:'Challenge belongs to a different session'})
@ApiResponse({status:409,description:'Question withdrawn'}) @ApiResponse({status:410,description:'Challenge expired'}) @ApiResponse({status:429,description:'Rate limit exceeded'})
export class DetectiveController {
  constructor(private detective:DetectiveService) {}
  @Get('questions') @ApiResponse({status:200,type:DetectiveDto})
  @ApiOperation({summary:'One published identification question; no guest database attempt'})
  next(@Req() req:PracticeRequest,@Query() query:DetectiveQueryDto) {return this.detective.next(req.user?.id ?? null,query.previousId);}
  @Post('answer') @HttpCode(200) @ApiResponse({status:200,type:DetectiveResultDto})
  answer(@Req() req:PracticeRequest,@Body() body:DetectiveAnswerDto,@Query() _query:EmptyQuizDto) {return this.detective.answer(req.user?.id ?? null,body.token,body.optionId);}
}
@ApiTags('Mistake Replay') @Controller('reviews/mistakes') @UseGuards(SessionGuard) @ApiCookieAuth()
@ApiResponse({status:401,description:'Session required'}) @ApiResponse({status:404,description:'Review not owned by this user'})
export class ReviewController {
  constructor(private reviews:ReviewService) {}
  @Get() @ApiResponse({status:200,type:MistakeListDto})
  list(@Req() req:AuthRequest,@Query() query:ReviewQueryDto) {return this.reviews.list(req.user.id,query.cursor);}
  @Post(':reviewId/practice') @HttpCode(201) @ApiResponse({status:201,type:QuizAttemptDto}) @ApiResponse({status:409,description:'No valid published alternative for this concept'})
  practice(@Req() req:AuthRequest,@Param() params:ReviewParamsDto,@Body() _body:EmptyQuizDto,@Query() _query:EmptyQuizDto) {return this.reviews.practice(req.user.id,params.reviewId);}
}
