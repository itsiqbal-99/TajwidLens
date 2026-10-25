import type { LessonMetadata } from '../../../../shared/learning';

// JSON is shared with the static web build; deployment keeps api/ and shared/ siblings.
const source: LessonMetadata[] = require('../../../../shared/lesson-catalog.json');
const ids = new Set<string>(), slugs = new Set<string>(), orders = new Set<number>();
if (!Array.isArray(source) || !source.length) throw new Error('Learning catalogue is missing');
for (const lesson of source) {
  if (!lesson || typeof lesson.id!=='string' || !/^[a-z0-9-]{1,80}$/.test(lesson.id)
    || typeof lesson.slug!=='string' || !/^[a-z0-9-]{1,80}$/.test(lesson.slug)
    || typeof lesson.title!=='string' || !lesson.title.trim() || typeof lesson.category!=='string' || !lesson.category.trim()
    || typeof lesson.summary!=='string' || !lesson.summary.trim()
    || !Number.isInteger(lesson.order) || lesson.order<0 || ids.has(lesson.id) || slugs.has(lesson.slug) || orders.has(lesson.order))
    throw new Error('Invalid learning catalogue');
  ids.add(lesson.id);slugs.add(lesson.slug);orders.add(lesson.order);
}
export const lessonCatalog: readonly LessonMetadata[] = Object.freeze([...source].sort((a,b)=>a.order-b.order).map(lesson=>Object.freeze(lesson)));
