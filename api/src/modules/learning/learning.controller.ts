import { Body, Controller, Get, Param, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiCookieAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthRequest, SessionGuard } from '../auth/session.guard';
import { LearningService } from './learning.service';
import { EmptyLearningDto, LearningDashboardDto, LearningProgressListDto, LessonParamsDto, LessonProgressDto } from './learning.dto';

@ApiTags('Learning') @ApiCookieAuth() @UseGuards(SessionGuard)
@ApiResponse({status:401,description:'Session missing or expired'})
@ApiResponse({status:400,description:'Unknown input fields or invalid lesson identifier'})
@ApiResponse({status:404,description:'Lesson not in the current catalogue'})
@Controller('learning')
export class LearningController {
  constructor(private learning:LearningService) {}
  @Get('dashboard') @ApiResponse({status:200,type:LearningDashboardDto})
  dashboard(@Req() req:AuthRequest,@Query() _query:EmptyLearningDto) {return this.learning.dashboard(req.user.id);}
  @Get('progress') @ApiResponse({status:200,type:LearningProgressListDto})
  progress(@Req() req:AuthRequest,@Query() _query:EmptyLearningDto) {return this.learning.progress(req.user.id);}
  @Get('progress/:lessonId') @ApiResponse({status:200,type:LessonProgressDto})
  detail(@Req() req:AuthRequest,@Param() params:LessonParamsDto,@Query() _query:EmptyLearningDto) {return this.learning.detail(req.user.id,params.lessonId);}
  @Put('progress/:lessonId/start') @ApiResponse({status:200,type:LessonProgressDto})
  @ApiBody({schema:{type:'object',additionalProperties:false}})
  start(@Req() req:AuthRequest,@Param() params:LessonParamsDto,@Body() _body:EmptyLearningDto,@Query() _query:EmptyLearningDto) {return this.learning.start(req.user.id,params.lessonId);}
  @Put('progress/:lessonId/complete') @ApiResponse({status:403,description:'Manual completion removed; pass a server-evaluated lesson quiz'})
  @ApiBody({schema:{type:'object',additionalProperties:false}})
  complete(@Req() _req:AuthRequest,@Param() params:LessonParamsDto,@Body() _body:EmptyLearningDto,@Query() _query:EmptyLearningDto) {return this.learning.rejectManualCompletion(params.lessonId);}
}
