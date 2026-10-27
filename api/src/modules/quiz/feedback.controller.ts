import {Body,Controller,HttpCode,Param,Post,Query,Req,UseGuards} from '@nestjs/common';
import {Throttle} from '@nestjs/throttler';
import {ApiResponse,ApiTags} from '@nestjs/swagger';
import {OptionalSessionGuard,PracticeRequest} from './optional-session.guard';
import {EmptyQuizDto} from './quiz.dto';
import {FeedbackDto,FeedbackParamsDto,FeedbackReceiptDto} from './feedback.dto';
import {FeedbackService} from './feedback.service';
@ApiTags('Question feedback') @Controller('questions') @UseGuards(OptionalSessionGuard)
export class FeedbackController {
  constructor(private feedback:FeedbackService){}
  @Post(':questionId/feedback') @HttpCode(202) @Throttle({default:{limit:5,ttl:60000}})
  @ApiResponse({status:202,type:FeedbackReceiptDto}) @ApiResponse({status:400,description:'Invalid category/version/receipt'})
  @ApiResponse({status:403,description:'Report context does not belong to this session'}) @ApiResponse({status:404,description:'Submitted question not owned'})
  @ApiResponse({status:409,description:'Immutable version changed or request ID reused'}) @ApiResponse({status:429,description:'Report rate limit exceeded'})
  report(@Req() req:PracticeRequest,@Param() params:FeedbackParamsDto,@Body() body:FeedbackDto,@Query() _query:EmptyQuizDto){return this.feedback.report(req.user?.id ?? null,params.questionId,body);}
}
