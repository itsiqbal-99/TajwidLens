import {expect,it} from 'vitest';
import {isOAuthCompletion} from './oauth-completion';

it('accepts only completion notices with known destinations, never credentials or external redirects',()=>{
  const message={type:'complete',id:'12345678-abcd-1234-abcd-123456789abc',next:'/dashboard/'};
  expect(isOAuthCompletion(message)).toBe(true);
  expect(isOAuthCompletion({...message,next:'/profile/?welcome=1'})).toBe(false);
  for(const value of [null,{}, {...message,type:'ack'}, {...message,id:'bad'}, {...message,next:'https://evil.test'}, {...message,next:'/login/'}, {...message,next:'/profile/?token=secret'}]) expect(isOAuthCompletion(value)).toBe(false);
});
