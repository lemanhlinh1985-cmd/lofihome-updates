"""Small uploads; reconstruct the exact audited full RBZ on a GitHub runner.

No owner keys or credentials are stored in this file. Cloud mode uses only the
job's repository-scoped GITHUB_TOKEN through GitHub CLI.
"""
from pathlib import Path
import argparse
import hashlib
import json
import os
import re
import struct
import subprocess
import tempfile
import time
import urllib.parse
import urllib.request
import zipfile

REPO='lemanhlinh1985-cmd/lofihome-updates'
PREFIX='phao_chi_v305_corner_component'
PATCH=PREFIX+'/update_patch.json'
DELTA_NAME='LOFIHOME_UPLOAD_DELTA.zip'
MAX=3_000_000_000
PUBLIC_KEY_SHA='2c7ca65676cbedd2c6de67d7aa325f4f581d0ca961bae3280742598741e73d28'

def digest(path):
    with open(path,'rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()

def checksum(value):
    if not isinstance(value,str) or not re.fullmatch('[0-9a-f]{64}',value):raise ValueError('Invalid digest')
    return value

def file_name(name):
    if not isinstance(name,str) or not (name==PREFIX+'.rb' or name.startswith(PREFIX+'/')):raise ValueError('Foreign path')
    for part in name.split('/'):
        if not part or part in ('.','..') or re.search(r'[\\:\x00-\x1f<>"|?*]',part) or part.endswith(('.',' ')) or re.match(r'^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\.|$)',part,re.I):raise ValueError('Invalid path')
    if any(s in name.lower() for s in ('khoa_chu_so_huu','quan_ly_khoa','cap_ma_khoa','quan_ly_phat_hanh','/hosts.yml','/.git/','/portable_library/files/')):raise ValueError('Private or obsolete file')
    return name

def inventory(path):
    rows={};seen=set();total=0
    with zipfile.ZipFile(path) as z:
        if not 1<=len(z.infolist())<=10000:raise ValueError('Invalid entry count')
        for info in z.infolist():
            n=file_name(info.filename)
            if n.lower() in seen or info.flag_bits & ~0x808 or info.compress_type not in (0,8) or (info.external_attr>>16)&0o170000==0o120000:raise ValueError('Invalid ZIP entry')
            total+=info.file_size
            if total>MAX:raise ValueError('Archive too large')
            seen.add(n.lower());h=hashlib.sha256();overlap=b''
            with z.open(info) as f:
                for data in iter(lambda:f.read(1024*1024),b''):
                    if re.search(rb'-----BEGIN (?:RSA |EC |ENCRYPTED )?PRIVATE KEY-----',overlap+data):raise ValueError('Private key detected')
                    overlap=data[-80:];h.update(data)
            rows[n]=dict(size=info.file_size,sha256=h.hexdigest())
    return rows

def metadata(path):
    return dict(bytes=path.stat().st_size,sha256=digest(path))




def reconstruct(base,delta,output):
    with zipfile.ZipFile(delta) as z:
        if set(z.namelist())!={'index.json','literals.bin'} or len(z.infolist())!=2 or z.getinfo('index.json').file_size>5_000_000 or z.getinfo('literals.bin').file_size>MAX:raise ValueError('Invalid delta ZIP')
        spec=json.loads(z.read('index.json'))
        if spec['format']!='LOFIHOME_ARCHIVE_DELTA_1' or len(spec['ops'])>40000:raise ValueError('Invalid delta')
        if metadata(base)!={k:spec['base'][k] for k in ('bytes','sha256')}:raise ValueError('Wrong base archive')
        if not 22<=spec['target']['bytes']<=MAX:raise ValueError('Invalid target size')
        count=0
        with open(base,'rb') as b,z.open('literals.bin') as l,open(output,'xb') as out:
            for operation in spec['ops']:
                if not isinstance(operation,list) or len(operation)!=3:raise ValueError('Invalid operation')
                kind,offset,length=operation
                if kind not in ('b','l') or type(offset)!=int or type(length)!=int or offset<0 or length<0:raise ValueError('Invalid range')
                src=b if kind=='b' else l
                limit=spec['base']['bytes'] if kind=='b' else z.getinfo('literals.bin').file_size
                if offset+length>limit or count+length>spec['target']['bytes']:raise ValueError('Range outside archive')
                src.seek(offset)
                while length:
                    data=src.read(min(length,4*1024*1024))
                    if not data:raise ValueError('Missing delta data')
                    out.write(data);length-=len(data);count+=len(data)
        if metadata(output)!={k:spec['target'][k] for k in ('bytes','sha256')}:raise ValueError('Reconstructed archive differs')
        return spec

def verify_pair(full,quick,manifest):
    entries=inventory(full);patch=inventory(quick)
    if metadata(full)!={k:manifest[k] for k in ('bytes','sha256')} or metadata(quick)!={k:manifest['quick'][k] for k in ('bytes','sha256')}:raise ValueError('Asset mismatch')
    with zipfile.ZipFile(quick) as z:
        if z.getinfo(PATCH).file_size>8_000_000:raise ValueError('Large patch index')
        index=json.loads(z.read(PATCH))
    if index.get('format')!='LOFIHOME_PATCH_1' or index.get('version')!=manifest['version'] or index.get('full_sha256')!=manifest['sha256'] or index.get('files')!=entries:raise ValueError('Patch index differs from full release')
    if any(data!=entries.get(n) for n,data in patch.items() if n!=PATCH):raise ValueError('Patch file differs from full release')
    if entries.get(PREFIX+'/license_public.pem',{}).get('sha256')!=PUBLIC_KEY_SHA:raise ValueError('Owner changed')
    with zipfile.ZipFile(full) as z:
        for n in (PREFIX+'.rb',PREFIX+'/main.rb'):
            if b'PhaoChiV305CornerLiteHost.allow_load?' not in z.read(n):raise ValueError('Host guard missing')
        if f"ext.version = 'V{manifest['version']}-SU2023-ONLY'".encode() not in z.read(PREFIX+'.rb'):raise ValueError('Version mismatch')
        for n in ('portable_library.rb','portable_payloads.rb','portable_library/library.dat','portable_library/payload_index.json','portable_library/manifest.json','material_library/catalog.json','licensing.rb','license_store.rb','html/license.html','html/license.js','update_archive.rb','internet_update.rb'):
            if PREFIX+'/'+n not in entries:raise ValueError('Required file missing')
    return len(entries)

def gh(*args):
    return subprocess.check_output(['gh',*args],stderr=subprocess.PIPE)

def api(path,*args):return json.loads(gh('api',path,*args))

def asset_url(url):
    parsed=urllib.parse.urlsplit(url)
    if parsed.scheme!='https' or parsed.netloc!='github.com' or parsed.query or parsed.fragment or not re.fullmatch('/'+re.escape(REPO)+r'/releases/download/v317\.[0-9]+/LOFIHOME_[A-Za-z0-9_-]+\.rbz',parsed.path):raise ValueError('Foreign release URL')
    return parsed.path.split('/')[-1]

def cloud(release_id,delta_sha,quick_sha,manifest_sha):
    if not re.fullmatch('[1-9][0-9]{1,15}',release_id):raise ValueError('Invalid release ID')
    for value in (delta_sha,quick_sha,manifest_sha):checksum(value)
    endpoint=f'repos/{REPO}/releases/{release_id}'
    release=api(endpoint);tag=release['tag_name']
    if not release['draft'] or release['prerelease'] or not re.fullmatch(r'v317\.[0-9]+',tag):raise ValueError('Expected draft')
    assets=api(endpoint+'/assets?per_page=100')
    names={a['name']:a for a in assets}
    quick_names=[n for n in names if re.fullmatch(r'LOFIHOME_V317_[0-9]+_CAP_NHAT_NHANH\.rbz',n)]
    if len(quick_names)!=1:raise ValueError('Missing quick RBZ')
    with tempfile.TemporaryDirectory() as temp:
        temp=Path(temp)
        for name,sha in ((DELTA_NAME,delta_sha),(quick_names[0],quick_sha),('latest.json',manifest_sha)):
            item=names[name]
            if item['state']!='uploaded' or item['digest']!='sha256:'+sha or item['size']>100_000_000:raise ValueError('Draft asset mismatch')
            data=gh('api',f'repos/{REPO}/releases/assets/{item["id"]}','-H','Accept: application/octet-stream')
            if hashlib.sha256(data).hexdigest()!=sha:raise ValueError('Downloaded asset mismatch')
            (temp/name).write_bytes(data)
        manifest=json.loads((temp/'latest.json').read_text('utf-8'))
        if manifest['format']!='LOFIHOME_UPDATE_1' or manifest['product']!='LOFIHOME' or manifest['sketchup_major']!=23 or tag!='v'+manifest['version']:raise ValueError('Invalid manifest')
        name=asset_url(manifest['url'])
        if '/'+tag+'/' not in manifest['url'] or asset_url(manifest['quick']['url'])!=quick_names[0] or '/'+tag+'/' not in manifest['quick']['url']:raise ValueError('Wrong target tag')
        if set(names)-{DELTA_NAME,quick_names[0],'latest.json',name}:raise ValueError('Unexpected release assets')
        with zipfile.ZipFile(temp/DELTA_NAME) as z:spec=json.loads(z.read('index.json'))
        base_name=asset_url(spec['base']['url']);base=temp/base_name
        # gh follows GitHub's HTTPS asset CDN; no arbitrary remote executable.
        base_tag=spec['base']['url'].split('/')[-2]
        if int(base_tag.split('.')[-1])>=int(tag.split('.')[-1]):raise ValueError('Base must be older')
        gh('release','download',base_tag,'-R',REPO,'--pattern',base_name,'--dir',str(temp))
        full=temp/name;reconstruct(base,temp/DELTA_NAME,full)
        verify_pair(full,temp/quick_names[0],manifest)
        latest=api(f'repos/{REPO}/releases/latest')
        if int(latest['tag_name'].split('.')[-1])>=int(tag.split('.')[-1]):raise ValueError('A same/newer version is already Latest')
        # Re-read by ID before every mutation. Never overwrite published assets.
        if not api(endpoint)['draft']:raise ValueError('Draft was changed externally')
        if name in names:
            a=names[name]
            if a['digest']!='sha256:'+manifest['sha256'] or a['size']!=manifest['bytes'] or a['state']!='uploaded':raise ValueError('Existing full asset conflict')
        else:gh('release','upload',tag,str(full),'-R',REPO)
        final=api(endpoint+'/assets?per_page=100');by_name={a['name']:a for a in final}
        expected={name:manifest['sha256'],quick_names[0]:quick_sha,'latest.json':manifest_sha,DELTA_NAME:delta_sha}
        if set(by_name)!=set(expected) or any(by_name[n]['digest']!='sha256:'+s or by_name[n]['state']!='uploaded' for n,s in expected.items()):raise ValueError('Final asset verification failed')
        latest=api(f'repos/{REPO}/releases/latest')
        if int(latest['tag_name'].split('.')[-1])>=int(tag.split('.')[-1]) or not api(endpoint)['draft']:raise ValueError('Promotion race')
        gh('api',endpoint,'--method','PATCH','-F','draft=false','-F','prerelease=false','-f','make_latest=true')
        print('Published verified full and quick release '+tag,flush=True)


if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('command',choices=['cloud'])
    for n in ('release-id','delta-sha','quick-sha','manifest-sha'):parser.add_argument('--'+n,required=True)
    args=parser.parse_args();cloud(args.release_id,args.delta_sha,args.quick_sha,args.manifest_sha)
