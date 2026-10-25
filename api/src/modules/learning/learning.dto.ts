import { IsString, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LessonParamsDto {
  @ApiProperty({example:'pengantar'}) @IsString() @MaxLength(80) @Matches(/^[a-z0-9-]+$/) lessonId!:string;
}
export class EmptyLearningDto {}
export class LessonProgressDto {
  @ApiProperty() lessonId!:string;
  @ApiProperty({enum:['NOT_STARTED','IN_PROGRESS','COMPLETED']}) status!:string;
  @ApiProperty({type:String,format:'date-time',nullable:true}) startedAt!:string|null;
  @ApiProperty({type:String,format:'date-time',nullable:true}) completedAt!:string|null;
  @ApiProperty({type:String,format:'date-time',nullable:true}) lastAccessedAt!:string|null;
  @ApiProperty({type:String,format:'date-time',nullable:true}) updatedAt!:string|null;
}
export class LearningSummaryDto {
  @ApiProperty() totalLessons!:number;
  @ApiProperty() completedLessons!:number;
  @ApiProperty() inProgressLessons!:number;
  @ApiProperty() progressPercentage!:number;
}
export class ContinueLessonDto {
  @ApiProperty() lessonId!:string;
  @ApiProperty() title!:string;
  @ApiProperty() category!:string;
  @ApiProperty() summary!:string;
  @ApiProperty() href!:string;
}
export class CompletedLessonDto {
  @ApiProperty() lessonId!:string;
  @ApiProperty() title!:string;
  @ApiProperty() href!:string;
  @ApiProperty({format:'date-time'}) completedAt!:string;
}
export class LessonStateDto {
  @ApiProperty() lessonId!:string;
  @ApiProperty({enum:['NOT_STARTED','IN_PROGRESS','COMPLETED']}) status!:string;
}
export class LearningDashboardDto {
  @ApiProperty({type:LearningSummaryDto}) summary!:LearningSummaryDto;
  @ApiProperty({type:ContinueLessonDto,nullable:true}) continueLearning!:ContinueLessonDto|null;
  @ApiProperty({type:String,nullable:true}) lastAccessedLessonId!:string|null;
  @ApiProperty({type:[CompletedLessonDto]}) completedLessons!:CompletedLessonDto[];
  @ApiProperty() allCompleted!:boolean;
  @ApiProperty({type:[LessonStateDto]}) lessonStates!:LessonStateDto[];
}
export class LearningProgressListDto { @ApiProperty({type:[LessonProgressDto]}) lessons!:LessonProgressDto[]; }
