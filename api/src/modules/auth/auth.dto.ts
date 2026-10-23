import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, Length, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EmailDto {
  @ApiProperty() @Transform(({value}) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEmail() @MaxLength(254) email!: string;
}
export class LoginDto extends EmailDto {
  @ApiProperty() @IsString() @Length(1, 128) password!: string;
}
export class ProfileDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 60) @Matches(/\S/) nickname?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) fullName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) learningGoal?: string;
  @ApiPropertyOptional({enum:['pemula','menengah','lanjut']}) @IsOptional() @IsIn(['pemula','menengah','lanjut']) level?: string;
}
export class RegisterDto extends EmailDto {
  @ApiProperty({minLength:12,maxLength:128}) @IsString() @Length(12,128) password!: string;
  @ApiProperty() @IsString() @Length(1,60) @Matches(/\S/) nickname!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) fullName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) learningGoal?: string;
  @ApiPropertyOptional() @IsOptional() @IsIn(['pemula','menengah','lanjut']) level?: string;
}
export class TokenDto {
  @ApiProperty() @IsString() @Matches(/^[A-Za-z0-9_-]{43}$/) token!: string;
}
export class ResetDto extends TokenDto {
  @ApiProperty({minLength:12,maxLength:128}) @IsString() @Length(12,128) password!: string;
}
