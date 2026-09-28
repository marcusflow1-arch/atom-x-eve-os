import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

export function makeRewardFixture() {
  const tables = new Map(), schemas = new Map(), writes = [];
  let serial = 0, fault = null;
  const copy = (value) => structuredClone(value);
  const rows = (name) => { if (!tables.has(name)) tables.set(name, []); return tables.get(name); };
  const getPath = (row, path) => path.split('.').reduce((value, part) => value?.[part], row);
  const setPath = (row, path, value) => {
    const parts = path.split('.'); let node = row;
    for (const part of parts.slice(0, -1)) node = node[part] ??= {};
    node[parts.at(-1)] = copy(value);
  };
  function matches(row, query) {
    return Object.entries(query).every(([key, expected]) => {
      if (key === '$or') return expected.some((part) => matches(row, part));
      if (key === '$and') return expected.every((part) => matches(row, part));
      const value = getPath(row, key), values = Array.isArray(value) ? value : [value];
      if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
        return Object.entries(expected).every(([op, wanted]) => {
          if (op === '$exists') return (value !== undefined) === wanted;
          if (op === '$in') return values.some((item) => wanted.includes(item));
          if (op === '$nin') return values.every((item) => !wanted.includes(item));
          if (op === '$ne') return !values.includes(wanted);
          if (op === '$eq') return values.includes(wanted);
          if (op === '$lte') return value <= wanted;
          if (op === '$gte') return value >= wanted;
          if (op === '$lt') return value < wanted;
          throw new Error('Unsupported fixture query '+op);
        });
      }
      return value === expected;
    });
  }
  function schema(name) {
    if (name === 'User') return { properties: {} };
    if (!schemas.has(name)) {
      const original = 'base44/entities/'+name+'.jsonc';
      const kebab = 'base44/entities/'+name.replace(/[A-Z]/g, (c, i) => (i ? '-' : '')+c.toLowerCase())+'.jsonc';
      schemas.set(name, JSON.parse(readFileSync(existsSync(original) ? original : kebab, 'utf8')));
    }
    return schemas.get(name);
  }
  function allowed(rule, actor, row) {
    if (rule === undefined || rule === true) return true;
    if (rule === false) return false;
    return Object.entries(rule).every(([key, value]) => {
      if (key === '$or') return value.some((part) => allowed(part, actor, row));
      if (key === '$and') return value.every((part) => allowed(part, actor, row));
      if (key === 'user_condition') return Object.entries(value).every(([field, expected]) => actor?.[field] === expected);
      const expected = (item) => item === '{{user.id}}' ? actor?.id : item;
      const field = key.replace(/^data\./, '');
      if (key.startsWith('data.') && value && typeof value === 'object') {
        return matches(row, { [field]: Object.fromEntries(Object.entries(value).map(([op, items]) => [
          op, Array.isArray(items) ? items.map(expected) : expected(items),
        ])) });
      }
      return getPath(row, field) === expected(value);
    });
  }
  function validate(name, row) {
    const def = schema(name);
    for (const field of def.required || []) assert.notEqual(row[field], undefined, name+'.'+field+' required');
    for (const [field, value] of Object.entries(row)) {
      const prop = def.properties?.[field];
      if (prop?.enum && value != null) assert.ok(prop.enum.includes(value), name+'.'+field+' invalid: '+value);
    }
  }
  function guard(name, operation, actor, row) {
    if (!allowed(schema(name).rls?.[operation], actor, row)) throw Object.assign(new Error('Forbidden'), { status:403 });
  }
  function trip(name, operation, phase, data) {
    if (fault?.({ name, operation, phase, data })) {
      fault = null;
      throw Object.assign(new Error('Injected '+phase+' '+name+' '+operation+' failure'), { status:503 });
    }
  }
  const service = { id:'admin', role:'admin' };
  function entities(actor = service) {
    return new Proxy({}, { get: (_, name) => {
      const select = async (query={}, sort='', limit=1000, skip=0) => {
        trip(name,'filter','before',query);
        const selected = rows(name).filter((row) => matches(row,query) && allowed(schema(name).rls?.read,actor,row));
        const field = sort?.replace(/^-/, '');
        if (field) selected.sort((a,b) => String(getPath(a,field)||'').localeCompare(String(getPath(b,field)||''))*(sort.startsWith('-')?-1:1));
        return copy(selected.slice(skip,skip+limit));
      };
      const create = (data) => {
        trip(name,'create','before',data);
        const defaults = Object.fromEntries(Object.entries(schema(name).properties||{}).filter(([,p]) => p.default!==undefined).map(([key,p]) => [key,copy(p.default)]));
        const row = {...defaults,...copy(data),id:name+'-'+(++serial),created_date:new Date(1700000000000+serial).toISOString()};
        guard(name,'create',actor,row); validate(name,row); rows(name).push(row);
        writes.push({ name, operation:'create', id:row.id, data:copy(data) });
        trip(name,'create','after',data); return copy(row);
      };
      const update = (id,data) => {
        trip(name,'update','before',data);
        const row=rows(name).find((row)=>row.id===id);
        if(!row)throw Object.assign(new Error('Not found'),{status:404});
        guard(name,'update',actor,row); validate(name,{...row,...data}); Object.assign(row,copy(data));
        writes.push({name,operation:'update',id,data:copy(data)});
        trip(name,'update','after',data); return copy(row);
      };
      return {
        filter:select, list:(sort,limit,skip)=>select({},sort,limit,skip),
        get:async(id)=>{
          trip(name,'get','before',{id});
          const row=rows(name).find((row)=>row.id===id);
          if(!row)throw Object.assign(new Error('Not found'),{status:404});
          guard(name,'read',actor,row); return copy(row);
        },
        create:async(data)=>create(data), update:async(id,data)=>update(id,data),
        upsert:async(records,{key})=>{
          trip(name,'upsert','before',records);
          let created=0,updated=0; const result=[];
          for(const input of records){
            const keys=Array.isArray(key)?key:[key];
            const found=rows(name).find((row)=>keys.every((field)=>row[field]===input[field]));
            if(found){result.push(update(found.id,input));updated++;}else{result.push(create(input));created++;}
          }
          trip(name,'upsert','after',records);
          return {created,updated,records:result};
        },
        updateMany:async(query,changes)=>{
          trip(name,'updateMany','before',changes);
          let updated=0;
          for(const row of rows(name).filter((row)=>matches(row,query))){
            guard(name,'update',actor,row);
            const next=copy(row);
            for(const [op,fields] of Object.entries(changes))for(const [field,value] of Object.entries(fields)){
              const current=getPath(next,field);
              if(op==='$set')setPath(next,field,value);
              else if(op==='$inc')setPath(next,field,(current??0)+value);
              else if(op==='$max')setPath(next,field,Math.max(current??-Infinity,value));
              else if(op==='$addToSet')setPath(next,field,[...new Set([...(current||[]),value])]);
              else if(op==='$push')setPath(next,field,[...(current||[]),value]);
              else throw new Error('Unsupported fixture update '+op);
            }
            validate(name,next);Object.assign(row,next);updated++;
            writes.push({name,operation:'updateMany',id:row.id,data:copy(changes)});
          }
          trip(name,'updateMany','after',changes);
          return {success:true,updated,has_more:false};
        },
      };
    }});
  }
  return { tables, rows, writes, entities, service, failOnce:(predicate)=>{fault=predicate;}, reset:()=>{tables.clear();writes.length=0;serial=0;fault=null;} };
}
