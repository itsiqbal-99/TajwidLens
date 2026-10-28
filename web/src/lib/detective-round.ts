import type {TajweedAnnotation,TajweedRule,TajweedVerse} from '@/data/tajweed-types';

export type DetectiveTarget=TajweedAnnotation&{rule:TajweedRule};

export function buildDetectiveTargets(verse:TajweedVerse,rules:Record<string,TajweedRule>,preferredHukumIds:string[]):DetectiveTarget[]{
  const targets:DetectiveTarget[]=[];
  for(const hukumId of preferredHukumIds){
    const annotation=verse.annotations.find(item=>rules[item.ruleId]?.hukumId===hukumId && !targets.some(target=>item.start<target.end&&item.end>target.start));
    if(annotation)targets.push({...annotation,rule:rules[annotation.ruleId]});
  }
  return targets.sort((a,b)=>a.start-b.start);
}
