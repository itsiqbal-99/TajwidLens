import {describe,expect,it} from 'vitest';
import type {TajweedRule,TajweedVerse} from '@/data/tajweed-types';
import {buildDetectiveTargets} from './detective-round';

const rule=(id:string,hukumId:string)=>({id,hukumId,categoryId:id,category:id,topicId:'test',topic:'test'} as TajweedRule);

describe('buildDetectiveTargets',()=>{
  it('memilih satu tanda per hukum dan menolak rentang yang bertumpuk',()=>{
    const verse={number:1,text:'abcdefghij',annotations:[
      {id:'a',ruleId:'a',hukumId:'a',start:4,end:6,quote:'ef'},
      {id:'b',ruleId:'b',hukumId:'b',start:0,end:3,quote:'abc'},
      {id:'c',ruleId:'c',hukumId:'c',start:2,end:5,quote:'cde'},
    ]} satisfies TajweedVerse;
    expect(buildDetectiveTargets(verse,{a:rule('a','a'),b:rule('b','b'),c:rule('c','c')},['a','b','c']).map(item=>item.id)).toEqual(['b','a']);
  });
});
