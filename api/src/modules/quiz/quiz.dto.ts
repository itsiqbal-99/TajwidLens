import {ArrayMaxSize,ArrayMinSize,ArrayUnique,IsArray,IsOptional,IsString,IsUUID,Matches,MaxLength,ValidateNested} from 'class-validator';
import {Type} from 'class-transformer';
import {ApiProperty,ApiPropertyOptional} from '@nestjs/swagger';

export class EmptyQuizDto {}
export class AttemptParamsDto {@ApiProperty({format:'uuid'}) @IsUUID() attemptId!:string;}
export class ReviewParamsDto {@ApiProperty({format:'uuid'}) @IsUUID() reviewId!:string;}
export class AnswerDto {
  @ApiProperty({format:'uuid',description:'Attempt item ID returned by the server'}) @IsUUID() questionId!:string;
  @ApiProperty() @IsString() @Matches(/^[A-Za-z0-9_-]{1,50}$/) optionId!:string;
}
export class AnswersDto {
  @ApiProperty({type:[AnswerDto],minItems:1,maxItems:7}) @IsArray() @ArrayMinSize(1) @ArrayMaxSize(7)
  @ArrayUnique((answer:AnswerDto)=>answer.questionId) @ValidateNested({each:true}) @Type(()=>AnswerDto) answers!:AnswerDto[];
}
export class DetectiveQueryDto {@ApiPropertyOptional({format:'uuid'}) @IsOptional() @IsUUID() previousId?:string;}
export class DetectiveAnswerDto {
  @ApiProperty({description:'Short-lived signed question challenge; contains no answer key'}) @IsString() @MaxLength(2048) @Matches(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/) token!:string;
  @ApiProperty() @IsString() @Matches(/^[A-Za-z0-9_-]{1,50}$/) optionId!:string;
}
export class ReviewQueryDto {@ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(180) @Matches(/^[A-Za-z0-9_-]+$/) cursor?:string;}
export class OptionResponseDto {@ApiProperty() id!:string;@ApiProperty() label!:string;}
export class VerseResponseDto {
  @ApiProperty() surah!:number;@ApiProperty() ayah!:number;@ApiProperty() text!:string;
  @ApiProperty() start!:number;@ApiProperty() end!:number;@ApiProperty({enum:['utf16']}) offsetUnit!:string;@ApiProperty() edition!:string;
}
export class PublicQuestionDto {
  @ApiProperty({format:'uuid'}) id!:string;@ApiProperty({enum:['MULTIPLE_CHOICE','TAJWID_IDENTIFICATION']}) type!:string;
  @ApiProperty() prompt!:string;@ApiProperty({type:[OptionResponseDto]}) options!:OptionResponseDto[];
  @ApiProperty({type:VerseResponseDto,nullable:true}) verse!:VerseResponseDto|null;
}
export class AttemptQuestionDto extends PublicQuestionDto {@ApiProperty({type:String,nullable:true}) selectedOptionId!:string|null;}
export class SourceResponseDto {@ApiProperty() title!:string;@ApiProperty() location!:string;@ApiPropertyOptional() url?:string;}
export class FeedbackDto extends PublicQuestionDto {
  @ApiProperty() questionId!:string;
  @ApiPropertyOptional({enum:['AUTOMATED_SOURCE'],description:'Deterministic source validation, not expert question review'}) validation?:string;
  @ApiProperty() selectedOptionId!:string;@ApiProperty({description:'Revealed only after submission/Detective answer'}) correctOptionId!:string;
  @ApiProperty() correct!:boolean;@ApiProperty() explanation!:string;@ApiProperty({type:[SourceResponseDto]}) sources!:SourceResponseDto[];@ApiProperty() contentVersion!:number;
}
export class QuizResultDto {
  @ApiProperty() correctCount!:number;@ApiProperty() totalQuestions!:number;@ApiProperty() percentage!:number;
  @ApiProperty() passed!:boolean;@ApiProperty() completionVerified!:boolean;@ApiProperty({type:[FeedbackDto]}) feedback!:FeedbackDto[];
}
export class QuizAttemptDto {
  @ApiProperty({format:'uuid'}) id!:string;@ApiProperty() lessonId!:string;
  @ApiProperty({enum:['LESSON_QUIZ','DETECTIVE','REPLAY']}) mode!:string;@ApiProperty({enum:['IN_PROGRESS','SUBMITTED','EXPIRED']}) status!:string;
  @ApiProperty({format:'date-time'}) createdAt!:string;@ApiProperty({format:'date-time'}) expiresAt!:string;
  @ApiProperty({type:String,nullable:true,format:'date-time'}) submittedAt!:string|null;
  @ApiProperty({type:[AttemptQuestionDto]}) questions!:AttemptQuestionDto[];
  @ApiProperty({type:QuizResultDto,nullable:true,description:'Null before submission. Correct answers/explanations only live here after submission.'}) result!:QuizResultDto|null;
}
export class AvailabilityDto {
  @ApiProperty() lessonId!:string;@ApiProperty() available!:boolean;@ApiProperty() eligibleCount!:number;
  @ApiProperty({enum:[7]}) requiredQuestions!:number;@ApiProperty() reason!:string;@ApiProperty() message!:string;
  @ApiProperty({type:String,nullable:true,format:'uuid'}) resumeAttemptId!:string|null;
}
export class ChallengeDto {@ApiProperty() token!:string;@ApiProperty({type:PublicQuestionDto}) question!:PublicQuestionDto;}
export class DetectiveDto {
  @ApiProperty() available!:boolean;@ApiProperty({enum:['guest','account']}) storage!:string;@ApiProperty() message!:string;
  @ApiProperty({type:ChallengeDto,nullable:true}) challenge!:ChallengeDto|null;
}
export class DetectiveResultDto {
  @ApiProperty({nullable:true,description:"Owned attempt context or signed guest feedback receipt, after answering only"}) reporting!:{attemptId:string}|{token:string}|null;@ApiProperty({type:FeedbackDto}) feedback!:FeedbackDto;@ApiProperty() saved!:boolean;@ApiProperty() needsReview!:boolean;}
export class MistakeDto {
  @ApiProperty({format:'uuid'}) id!:string;@ApiProperty() lessonId!:string;@ApiProperty() conceptId!:string;@ApiProperty() conceptLabel!:string;
  @ApiProperty({enum:['NEEDS_REVIEW','IMPROVED']}) status!:string;@ApiProperty({format:'date-time'}) lastMistakeAt!:string;
  @ApiProperty({type:String,nullable:true,format:'date-time'}) improvedAt!:string|null;@ApiProperty() practiceAvailable!:boolean;
}
export class MistakeListDto {@ApiProperty() needsReviewCount!:number;@ApiProperty({type:[MistakeDto]}) items!:MistakeDto[];@ApiProperty({type:String,nullable:true}) nextCursor!:string|null;}
