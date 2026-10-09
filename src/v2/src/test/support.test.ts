import {describe,it,expect} from 'vitest';
import {services,STIPEND,supportTotal} from '@/lib/support';
describe('Reference financial rules',()=>{
 it('provides a 150000 naira monthly stipend',()=>expect(STIPEND).toBe(150000));
 for(const [id,price] of [['hub',35000],['meals',30000],['laptop',25000],['transport',20000],['accommodation',45000],['data',15000],['health',10000],['allowance',25000]] as const)it(id+' monthly price',()=>expect(services.find(s=>s.id===id)?.price).toBe(price));
 it('deducts subscribed services from the stipend',()=>expect(STIPEND-supportTotal(['laptop','data','health','allowance'])).toBe(75000));
 it('does not bill an unsubscribed service',()=>expect(supportTotal(['data'])).toBe(15000));
});
