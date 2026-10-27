import {EntityManager,EntityTarget,ObjectLiteral} from 'typeorm';

// Raw DML follows the same schema as TypeORM, including isolated PostgreSQL test schemas.
export function sqlTable(manager:EntityManager,entity:EntityTarget<ObjectLiteral>) {
  return manager.connection.getMetadata(entity).tablePath.split('.').map(part=>manager.connection.driver.escape(part)).join('.');
}
