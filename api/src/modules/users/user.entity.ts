import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id!: string;
  @Column({ unique: true }) email!: string;
  @Column({ type: 'text', nullable: true, select: false }) passwordHash!: string | null;
  @Column({ type: 'text', nullable: true, unique: true }) googleSubject!: string | null;
  @Column() nickname!: string;
  @Column({ type: 'text', nullable: true }) fullName!: string | null;
  @Column({ type: 'text', nullable: true }) learningGoal!: string | null;
  @Column({ type: 'text', nullable: true }) level!: string | null;
  @Column({ type: 'text', nullable: true }) picture!: string | null;
  @Column({ type: 'timestamptz', nullable: true }) emailVerifiedAt!: Date | null;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt!: Date;
}
