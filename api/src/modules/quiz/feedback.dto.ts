import {IsIn,IsInt,IsOptional,IsString,IsUUID,Max,MaxLength,Min,Matches} from 'class-validator';
import {ApiProperty,ApiPropertyOptional} from '@nestjs/swagger';
import type {FeedbackCategory} from '../../../../shared/question-feedback';
export const feedbackCategories:Record<FeedbackCategory,string>=require('../../../../shared/question-feedback-categories.json');
export class FeedbackParamsDto {@ApiProperty() @IsUUID() questionId!:string;}
export class FeedbackDto {
  @ApiProperty({description:'Stable UUID for safe submission retry'}) @IsUUID() requestId!:string;
  @ApiProperty() @IsInt() @Min(1) @Max(2147483647) questionVersion!:number;
  @ApiProperty({enum:Object.keys(feedbackCategories)}) @IsIn(Object.keys(feedbackCategories)) category!:FeedbackCategory;
  @ApiPropertyOptional({maxLength:2000}) @IsOptional() @IsString() @MaxLength(2000) description?:string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() attemptId?:string;
  @ApiPropertyOptional({description:'Post-answer guest receipt, never an answer key'}) @IsOptional() @IsString() @MaxLength(2048) @Matches(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/) token?:string;
}
export class FeedbackReceiptDto {
  @ApiProperty() message!:string;
}
