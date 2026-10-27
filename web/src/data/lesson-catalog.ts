import source from '../../../shared/lesson-catalog.json';
import type { LessonMetadata } from '../../../shared/learning';

export const lessonCatalog: readonly LessonMetadata[] = [...source].sort((a,b)=>a.order-b.order);
