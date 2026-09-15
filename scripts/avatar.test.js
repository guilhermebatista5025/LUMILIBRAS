import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { deflateSync } from 'node:zlib';
import { readFile } from 'node:fs/promises';
import express from 'express';
import { createAvatarRouter, validarAvatar } from '../server/routes/avatar.js';
import { recorteFoto } from '../src/lib/avatarCrop.js';

function png(tamanho = 512) {
  const chunk = (tipo, data) => {
    const buffer = Buffer.alloc(data.length + 12);
    buffer.writeUInt32BE(data.length); buffer.write(tipo, 4); data.copy(buffer, 8);
    let crc = 0xffffffff;
    for (const byte of buffer.subarray(4, buffer.length - 4)) {
      crc ^= byte;
      for (let i=0;i<8;i++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
    buffer.writeUInt32BE((crc ^ 0xffffffff) >>> 0, buffer.length - 4);
    return buffer;
  };
  const header = Buffer.alloc(13); header.writeUInt32BE(tamanho); header.writeUInt32BE(tamanho,4); header[8]=8; header[9]=6;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(Buffer.alloc((tamanho*4+1)*tamanho,0))),chunk('IEND',Buffer.alloc(0))]);
}

test('recorte central e limites mantêm a imagem preenchida em retrato e paisagem', () => {
  assert.deepEqual(recorteFoto(800,400,1), { x:200,y:0,lado:400,centro:{x:.5,y:.5} });
  assert.equal(recorteFoto(400,800,2).lado,200);
  for (const [w,h] of [[800,400],[400,800],[10,10]]) for (const zoom of [0,1,2,4,20]) {
    const r=recorteFoto(w,h,zoom,{x:-10,y:10});
    assert(r.x>=0 && r.y>=0 && r.x+r.lado<=w && r.y+r.lado<=h);
  }
});

test('upload aceita PNG de 512px e rejeita dimensões, conteúdo ou tamanho inválidos', () => {
  assert(validarAvatar(png()));
  assert(!validarAvatar(png(500)));
  assert(!validarAvatar(Buffer.from('<svg onload="alert(1)"/>')));
  assert(!validarAvatar(Buffer.concat([png(),Buffer.alloc(2*1024*1024)])));
  const corrompido=png(); corrompido[50]^=255;
  assert(!validarAvatar(corrompido));
});

test('API salva, recupera, substitui só a própria foto e preserva o arquivo anterior em falhas', async t => {
  const arquivos=new Map(); let falhar=false, chamadas=0;
  const app=express();
  const storage = { from(bucket) {
    assert.equal(bucket,'lumilibras-avatars');
    return {async upload(path,bytes,options){
      chamadas++;assert.equal(path,'conta-a/avatar.png');assert.equal(options.upsert,true);
      if(falhar)return {error:{message:'Bucket not found',statusCode:'404'}};
      arquivos.set(path,bytes);return {error:null};
    },async download(path){return arquivos.has(path)?{data:new Blob([arquivos.get(path)]),error:null}:{error:{message:'Object not found',statusCode:'404'}}}};
  }};
  app.use('/avatar',createAvatarRouter(async()=>({user:{id:'conta-a'},supabase:{storage}})));
  const server=app.listen(0,'127.0.0.1');await once(server,'listening');
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const url=`http://127.0.0.1:${server.address().port}/avatar`;
  assert.equal((await fetch(url)).status,204);
  const body=png();
  const salvo=await fetch(`${url}?user=conta-b`,{method:'PUT',headers:{'content-type':'image/png'},body});
  assert.equal(salvo.status,200);assert((await salvo.json()).fotoUrl.includes('conta-a'));
  const lido=await fetch(`${url}?user=conta-b`);
  assert.equal(lido.status,200);assert.equal(lido.headers.get('cache-control'),'private, no-store');
  assert.deepEqual(Buffer.from(await lido.arrayBuffer()),body);
  assert.equal((await fetch(url,{method:'PUT',headers:{'content-type':'image/png'},body:Buffer.alloc(2*1024*1024+1)})).status,413);
  assert.equal((await fetch(url,{method:'PUT',headers:{'content-type':'image/svg+xml'},body:'<svg/>'})).status,422);
  assert.equal(chamadas,1);
  falhar=true;
  assert.equal((await fetch(url,{method:'PUT',headers:{'content-type':'image/png'},body})).status,503);
  assert.deepEqual(arquivos.get('conta-a/avatar.png'),body);
});

test('políticas do bucket isolam contas e bloqueiam leitura anônima', async t => {
  const {PGlite}=await import('../.runtime/game-db-test/node_modules/@electric-sql/pglite/dist/index.js');
  const db=new PGlite();t.after(()=>db.close());
  await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
    create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id serial primary key,bucket_id text,name text,metadata jsonb);
    alter table storage.objects enable row level security;
    grant usage on schema storage,auth to authenticated,anon;
    grant select,insert,update on storage.objects to authenticated,anon;
    grant usage on sequence storage.objects_id_seq to authenticated;
    select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);`);
  await db.exec(await readFile(new URL('../supabase/migrations/20260915140000_profile_avatars.sql',import.meta.url),'utf8'));
  const bucket=(await db.query('select * from storage.buckets')).rows[0];
  assert.equal(bucket.public,false);assert.equal(bucket.file_size_limit,2097152);
  await db.exec("set role authenticated; insert into storage.objects(bucket_id,name) values('lumilibras-avatars','11111111-1111-4111-8111-111111111111/avatar.png')");
  await assert.rejects(db.exec("insert into storage.objects(bucket_id,name) values('lumilibras-avatars','22222222-2222-4222-8222-222222222222/avatar.png')"),/row-level security/);
  await db.exec("update storage.objects set metadata='{}'");
  await assert.rejects(db.exec("update storage.objects set name='../../outra.png'"),/row-level security/);
  await db.exec("select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',false)");
  assert.equal((await db.query('select * from storage.objects')).rows.length,0);
  await db.exec('reset role; set role anon');
  assert.equal((await db.query('select * from storage.objects')).rows.length,0);
});
