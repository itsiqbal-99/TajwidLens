import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { readConfig } from '../config/config';
import { User } from '../modules/users/user.entity';
import { Session, AuthToken, OAuthAttempt } from '../modules/auth/auth.entity';
import { InitialAuth1760000000000 } from './1760000000000-InitialAuth';

export const entities = [User, Session, AuthToken, OAuthAttempt];
const config = readConfig();
export default new DataSource({ type: 'postgres', url: config.databaseUrl, ssl: config.ssl,
  entities, migrations: [InitialAuth1760000000000], synchronize: false, migrationsRun: false, logging: false });
