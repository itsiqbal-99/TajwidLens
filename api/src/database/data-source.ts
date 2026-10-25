import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { readConfig } from '../config/config';
import { User } from '../modules/users/user.entity';
import { Session, AuthToken, OAuthAttempt } from '../modules/auth/auth.entity';
import { InitialAuth1760000000000 } from './1760000000000-InitialAuth';
import { UserLessonProgress } from '../modules/learning/learning.entity';
import { LearningProgress1792886400000 } from './1792886400000-LearningProgress';

export const entities = [User, Session, AuthToken, OAuthAttempt, UserLessonProgress];
const config = readConfig();
export default new DataSource({ type: 'postgres', url: config.databaseUrl, ssl: config.ssl,
  entities, migrations: [InitialAuth1760000000000,LearningProgress1792886400000], synchronize: false, migrationsRun: false, logging: false });
