import 'reflect-metadata';
import {DataSource} from 'typeorm';
import {readConfig} from '../config/config';
import {appEntities,appMigrations} from './schema';

export const entities=appEntities;
const config=readConfig();
export default new DataSource({type:'postgres',url:config.databaseUrl,ssl:config.ssl,
  entities,migrations:appMigrations,synchronize:false,migrationsRun:false,logging:false,
  extra:{max:config.databasePoolMax,connectionTimeoutMillis:10000,idleTimeoutMillis:30000}});
