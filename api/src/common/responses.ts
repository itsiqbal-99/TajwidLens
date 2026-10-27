import { ApiProperty } from "@nestjs/swagger";
export class MessageResponse {
  @ApiProperty() message!: string;
}
export class AccountResponse {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() nickname!: string;
  @ApiProperty({ type: String, nullable: true }) fullName!: string | null;
  @ApiProperty({ type: String, nullable: true }) learningGoal!: string | null;
  @ApiProperty({ type: String, nullable: true }) level!: string | null;
  @ApiProperty({ type: String, nullable: true }) picture!: string | null;
  @ApiProperty() emailVerified!: boolean;
  @ApiProperty({ type: [String] }) loginMethods!: string[];
}
