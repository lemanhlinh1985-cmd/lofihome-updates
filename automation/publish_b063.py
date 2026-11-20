"""Publish the one reviewed B-063 r2 bundle; never modify signed host feeds.

--check and --plan are offline. --publish is restricted to the real repository,
the current main commit, and the pinned 317.197 -> 317.198 release transition.
All assets are built and verified before the first GitHub release mutation.
"""
from pathlib import Path
import argparse
import hashlib
import importlib.util
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request
import zipfile

sys.dont_write_bytecode = True
REPO = 'lemanhlinh1985-cmd/lofihome-updates'
FORMAT = 'LOFIHOME_B063_RELEASE_1'
COMMON_TAG = 'cnc-library-b063-r2'
SKETCHUP_TAG = 'v317.198'
INSTALLER_ROOT = 'B-063_CAP_NHAT_6_PHAN_MEM'
INSTALLER_NAME = INSTALLER_ROOT + '.zip'
FAST_SHA = '9cc066184b34b21cfb06b5651739a43d3dc08b1f7a77f7d490954b693ae286b8'
EXE_SHA = '052c8488e343e965e581ee142aaf0b24286643e9acf33fb74fa8952f3b04385a'
SOURCE_SHA = '1e41c874e93b78f9a7669684d723dfdb7c2a0ae1478c026b1efbba9ca80c602a'
CANONICAL = {
    'B-063.json': (769050, SOURCE_SHA),
    'B-063.dxf': (2422422, '51f5271613861d0cd8248ac81db6f50acc49f1fd930166ee1dd779f5b45b7f1f'),
    'B-063.svg': (392124, '37266a64d17ab9a57224d0c56d6b92ecc9973c08cfa7abf83a4ec0d831ef80c9'),
    'B-063.png': (464048, 'a3c714f71677aefd2683f94847607bad6edf4417ca56949cfea91fbc425c3422'),
    'B-063_chi_tiet.png': (111007, '3920c49f134caeed46ad174c5283a81d3cdc4e23dddbcf26dc228d854f8e5ed9'),
}
BASE = {
    'full': {'url':f'https://github.com/{REPO}/releases/download/v317.197/LOFIHOME_V317_197_SU2021_PLUS_NHOM_ZALO.rbz',
             'bytes':1705799057, 'sha256':'a19ee689cfe37e6b640dac13aa2c49290b51d849e9eab9efa66ae3d14860ebe0'},
    'quick': {'url':f'https://github.com/{REPO}/releases/download/v317.197/LOFIHOME_V317_197_CAP_NHAT_NHANH.rbz',
              'bytes':66629565, 'sha256':'eb1866d0d855b522fa7c686459a1d156fdcfee0666f24bafdae10c705acc95ed'},
}
TARGET = {
    'full': {'url':f'https://github.com/{REPO}/releases/download/{SKETCHUP_TAG}/LOFIHOME_V317_198_SU2021_PLUS_NHOM_ZALO.rbz',
             'bytes':1707978169, 'sha256':'93d652787565690bd41dfaa0835b0a3bc5c46549dd305f93386795cbcc82c0a2'},
    'quick': {'url':f'https://github.com/{REPO}/releases/download/{SKETCHUP_TAG}/LOFIHOME_V317_198_CAP_NHAT_NHANH.rbz',
              'bytes':68809937, 'sha256':'18bc5f6b1d9b5392bac4e632542a05e20f01a7dabef6435945f734a28de9eab2'},
}
DELTA = {
    'full': (2663245, '1c6e82ed1346bd00ef1253825bc978fc64ecd0f6a705c6dfa04db8a06f593e96'),
    'quick': (2819729, '9bd4a6913deeac122c728615840d8b0907e4efc1404348814ff8054510f3b897'),
}
HOST_COUNTS = {'sketchup':29, 'corel':13, 'aspire':13, 'autocad':13, 'jdp':8, 'rhino':13}
CHUNK = 4 * 1024 * 1024


def need(condition, message):
    if not condition:
        raise ValueError(message)


def digest(path):
    with Path(path).open('rb') as source:
        return hashlib.file_digest(source, 'sha256').hexdigest()


def metadata(path):
    return {'bytes':Path(path).stat().st_size, 'sha256':digest(path)}


def meta_only(value):
    return {key:value[key] for key in ('bytes', 'sha256')}


def check_meta(value):
    need(isinstance(value, dict) and type(value.get('bytes')) is int and value['bytes'] >= 0, 'Invalid byte count')
    need(isinstance(value.get('sha256'), str) and re.fullmatch('[0-9a-f]{64}', value['sha256']), 'Invalid SHA-256')


def relative(name):
    need(isinstance(name, str) and name and not name.startswith('/') and '\\' not in name, 'Invalid relative path')
    for part in name.split('/'):
        need(part not in ('', '.', '..') and not part.endswith(('.', ' ')) and not re.search(r'[\x00-\x1f<>:"|?*]', part), 'Unsafe path: ' + name)
        need(not re.fullmatch(r'(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])(?:\..*)?', part, re.I), 'Reserved filename')
    return name


def file_tree(root):
    root = Path(root)
    need(root.is_dir() and not root.is_symlink(), 'Missing or linked input directory: ' + str(root))
    output = {}
    for path in root.rglob('*'):
        need(not path.is_symlink(), 'Symbolic links are not accepted: ' + str(path))
        if path.is_file():
            name = relative(path.relative_to(root).as_posix())
            need(name.lower() not in {x.lower() for x in output}, 'Case-colliding paths')
            output[name] = path
        else:
            need(path.is_dir(), 'Unsupported filesystem entry')
    return output


def json_read(path):
    need(Path(path).stat().st_size <= 8_000_000, 'JSON file too large')
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def checked_file(path, expected):
    check_meta(expected)
    need(Path(path).is_file() and not Path(path).is_symlink(), 'Missing input: ' + str(path))
    need(metadata(path) == meta_only(expected), 'File does not match pinned bytes/SHA-256: ' + str(path))


def artifact(path):
    path = Path(path)
    return {'path':path, **metadata(path)}


def release_definition(tag, title, paths, explanation):
    assets = {Path(path).name:artifact(path) for path in paths}
    identity = {'format':FORMAT, 'repository':REPO, 'tag':tag,
                'assets':{name:meta_only(item) for name,item in sorted(assets.items())}}
    fingerprint = hashlib.sha256(json.dumps(identity, sort_keys=True, separators=(',', ':')).encode()).hexdigest()
    body = explanation + '\n\n<!-- LOFIHOME_B063_RELEASE_1 ' + fingerprint + ' -->'
    return {'tag':tag, 'name':title, 'body':body, 'identity':fingerprint, 'assets':assets}


def build_installer(runtime, output):
    files = file_tree(runtime)
    destination = output / INSTALLER_NAME
    temporary = output / (INSTALLER_NAME + '.building')
    need(not temporary.exists(), 'Remove the incomplete local .building file before retrying')
    try:
        with zipfile.ZipFile(temporary, 'w', compression=zipfile.ZIP_STORED, allowZip64=True) as archive:
            for name, path in sorted(files.items()):
                info = zipfile.ZipInfo(INSTALLER_ROOT + '/' + name, date_time=(1980, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_STORED
                info.create_system = 3
                info.external_attr = 0o100644 << 16
                info.file_size = path.stat().st_size
                with archive.open(info, 'w') as target, path.open('rb') as source:
                    shutil.copyfileobj(source, target, CHUNK)
        if destination.exists():
            need(metadata(destination) == metadata(temporary), 'Existing installer differs; use a new output directory')
        else:
            temporary.rename(destination)
    finally:
        temporary.unlink(missing_ok=True)
    return destination


def check_bundle(repo_root, output):
    root = repo_root / 'cnc-library/B-063'
    need(not output.is_relative_to(root), 'Build output must be outside the pinned input tree')
    spec = json_read(root / 'RELEASE_SPEC.json')
    need(spec.get('format') == FORMAT and spec.get('baseline') == BASE, 'Wrong release contract or baseline sources')
    wanted = spec.get('files')
    need(isinstance(wanted, dict) and 1 <= len(wanted) <= 20000, 'Missing pinned file inventory')
    actual = file_tree(root)
    actual.pop('RELEASE_SPEC.json', None)
    need(set(actual) == set(wanted), 'Pinned file inventory has missing or extra files')
    for name, expected in wanted.items():
        relative(name)
        check_meta(expected)
        need(expected['bytes'] < 100_000_000, 'A repository file reaches the 100 MB limit')
        checked_file(actual[name], expected)
    for name, (size, sha) in CANONICAL.items():
        checked_file(root / name, {'bytes':size, 'sha256':sha})
    sample = json_read(root / 'B-063.json')
    need(sample.get('format') == 'lofihome-mau-v1' and len(sample.get('samples', [])) == 1, 'Wrong canonical pack')
    sample = sample['samples'][0]
    need((sample['id'], sample['name'], sample['revision'], sample['width'], sample['height']) == ('b-063', 'B-063', 2, 600, 1300), 'Wrong canonical sample')
    need(len(sample['parts']) == 1 and len(sample['parts'][0]['holes']) == 290, 'Wrong canonical panel topology')
    canonical_meta = json_read(root / 'metadata.json')
    need((canonical_meta.get('sample_id'), canonical_meta.get('revision'), canonical_meta.get('units')) == ('b-063', 2, 'mm'), 'Wrong canonical metadata')
    for name in CANONICAL:
        need(canonical_meta['source_files'][name] == metadata(root / name), 'Canonical metadata hash differs')
    runtime = root / 'runtime_bundle'
    checked_file(runtime / 'CAP_NHAT_THU_VIEN_B063.exe', {'bytes':30208, 'sha256':EXE_SHA})
    index = json_read(runtime / 'bo_cai.json')
    need(index.get('format') == 'LOFIHOME_LIBRARY_INSTALLER_1', 'Wrong installer index')
    hosts = index.get('hosts', [])
    need(len(hosts) == 6 and {h['id'] for h in hosts} == set(HOST_COUNTS), 'Installer must cover all six reviewed hosts')
    total_changes = 0
    for host in hosts:
        manifest_path = runtime / relative(host['manifest'])
        payload_root = runtime / relative(host['payload'])
        guard = json_read(manifest_path)
        need(guard.get('format') == 'LOFIHOME_LIBRARY_OVERLAY_1', 'Wrong overlay guard')
        item = guard.get('sample', {})
        need((item.get('id'), item.get('name'), item.get('revision'), item.get('width_mm'), item.get('height_mm'), item.get('holes'), item.get('source_json_sha256')) == ('b-063', 'B-063', 2, 600, 1300, 290, SOURCE_SHA), 'Overlay sample differs')
        entries = guard.get('files', [])
        need(len(entries) == HOST_COUNTS[host['id']], 'Unexpected host change count')
        payload = file_tree(payload_root)
        need({f['path'] for f in entries} == set(payload) and len(entries) == len(payload), 'Payload and overlay guard differ')
        for entry in entries:
            name = relative(entry['path'])
            need(Path(name).suffix.lower() not in ('.exe', '.dll', '.rhp'), 'Data overlay cannot replace native programs')
            if entry.get('before_sha256') is not None:
                check_meta({'bytes':0, 'sha256':entry['before_sha256']})
            checked_file(payload[name], entry)
        for entry in guard.get('preserved_native_files', []) + guard.get('required_runtime_files', []):
            relative(entry['path'])
            check_meta({'bytes':0, 'sha256':entry['sha256']})
            need(entry['path'] not in payload, 'Preserved runtime is included in the overlay')
        total_changes += len(entries)
    need(total_changes == 89, 'Reviewed 89-file overlay differs')
    fast_path = repo_root / 'automation/fast_release.py'
    need(digest(fast_path) == FAST_SHA, 'The audited release verifier was changed')
    module_spec = importlib.util.spec_from_file_location('b063_audited_fast_release', fast_path)
    fast = importlib.util.module_from_spec(module_spec)
    module_spec.loader.exec_module(fast)
    manifest = json_read(root / 'sketchup317198/latest.json')
    need(manifest.get('format') == 'LOFIHOME_UPDATE_1' and manifest.get('product') == 'LOFIHOME' and manifest.get('version') == '317.198', 'Wrong SketchUp manifest')
    need({key:manifest[key] for key in ('url', 'bytes', 'sha256')} == TARGET['full'] and manifest.get('quick') == TARGET['quick'], 'SketchUp targets differ')
    need(fast.release_host_tag(manifest) == 'SU2021-PLUS', 'Wrong SketchUp host range')
    for kind in ('full', 'quick'):
        path = root / 'sketchup317198' / (kind + '_delta.zip')
        size, sha = DELTA[kind]
        checked_file(path, {'bytes':size, 'sha256':sha})
        with zipfile.ZipFile(path) as archive:
            need(archive.namelist() == ['index.json', 'literals.bin'], 'Wrong delta members')
            need(archive.getinfo('index.json').file_size <= 5_000_000, 'Delta index too large')
            delta = json.loads(archive.read('index.json'))
        need(delta.get('format') == 'LOFIHOME_ARCHIVE_DELTA_1' and delta['base'] == BASE[kind] and delta['target'] == meta_only(TARGET[kind]), 'Delta source or target differs')
    output.mkdir(parents=True, exist_ok=True)
    installer = build_installer(runtime, output)
    common = release_definition(COMMON_TAG, 'LOFIHOME B-063 r2 - Thu vien 6 phan mem',
        [installer] + [root / name for name in list(CANONICAL) + ['metadata.json']],
        'B-063 đã duyệt, tên bản vẽ B-063, khổ gốc 600 × 1300 mm, 290 lỗ khoét.\n'
        'Gói bổ sung thư viện cho SketchUp, CorelDRAW, Aspire, AutoCAD, JDPaint và Rhino; kiểm tra bản nền và sao lưu trước khi ghi.\n'
        'CorelDRAW và Rhino dùng gói bổ sung chạy thủ công. Kênh cập nhật native có chữ ký vẫn giữ nguyên; phát hành qua kênh đó còn cần quy trình ký của chủ sở hữu.\n'
        'Đã kiểm tra dữ liệu, hình học, bộ cài và khôi phục trong môi trường kiểm thử. Giao diện và thao tác native trên Windows chưa được kiểm thử.\n'
        'Gói phát hành được dựng từ nguồn đã ghim mã SHA-256; trạng thái prepared_not_published trong tài liệu nguồn là trạng thái lúc biên soạn. Đây không phải thông báo đã cập nhật các máy khách.')
    report = {'mode':'check', 'status':'passed', 'input_files':len(wanted), 'input_bytes':sum(x['bytes'] for x in wanted.values()),
              'hosts':list(HOST_COUNTS), 'overlay_changes':89, 'installer':meta_only(common['assets'][INSTALLER_NAME]),
              'sketchup_reconstructed':False, 'remote_state_checked':False, 'published':False}
    return {'root':root, 'spec':spec, 'manifest':manifest, 'fast':fast, 'common':common, 'report':report}


def download_public(expected, destination):
    if destination.exists():
        checked_file(destination, expected)
        return
    # The URL is an exact hardcoded public baseline URL. No credential header.
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=destination.parent, suffix='.download', delete=False) as target:
            temporary = Path(target.name)
            request = urllib.request.Request(expected['url'], headers={'User-Agent':'LOFIHOME-B063-Release/1'})
            with urllib.request.urlopen(request, timeout=60) as source:
                count = 0
                while True:
                    block = source.read(CHUNK)
                    if not block:
                        break
                    count += len(block)
                    need(count <= expected['bytes'], 'Public baseline exceeds pinned size')
                    target.write(block)
        checked_file(temporary, expected)
        need(not destination.exists(), 'Baseline destination appeared during download')
        temporary.rename(destination)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def build_sketchup(build, output, base_dir, online):
    if base_dir is None:
        need(online, '--plan is offline and requires --base-dir with both 317.197 RBZs')
        base_dir = output / 'baseline'
        base_dir.mkdir(exist_ok=True)
    paths = {}
    for kind in ('full', 'quick'):
        base = base_dir / BASE[kind]['url'].rsplit('/', 1)[-1]
        if online:
            download_public(BASE[kind], base)
        checked_file(base, BASE[kind])
        target = output / TARGET[kind]['url'].rsplit('/', 1)[-1]
        if not target.exists():
            try:
                build['fast'].reconstruct(base, build['root'] / 'sketchup317198' / (kind + '_delta.zip'), target)
            except Exception:
                target.unlink(missing_ok=True)
                raise
        checked_file(target, TARGET[kind])
        paths[kind] = target
    entries = build['fast'].verify_pair(paths['full'], paths['quick'], build['manifest'])
    build['sketchup'] = release_definition(SKETCHUP_TAG, 'LOFIHOME SketchUp V317.198 - Thu vien B-063',
        [paths['full'], paths['quick'], build['root'] / 'sketchup317198/latest.json'],
        build['manifest']['notes'] + '\n\nGói đầy đủ và gói cập nhật nhanh được khôi phục nguyên byte từ bản 317.197 và được xác minh trước phát hành.\n'
        'Bộ thư viện dùng chung sáu phần mềm nằm tại bản phát hành cnc-library-b063-r2. CorelDRAW/Rhino dùng gói bổ sung thủ công; kênh native có chữ ký vẫn chờ chủ sở hữu ký.\n'
        'Chưa kiểm thử thao tác native và giao diện trên Windows.')
    build['report'].update(mode='plan', sketchup_reconstructed=True, sketchup_inventory_entries=entries,
                           sketchup_assets={name:meta_only(item) for name,item in build['sketchup']['assets'].items()})


def verify_remote_asset(item, expected):
    need(item.get('state') == 'uploaded', 'Existing release asset is not fully uploaded')
    need(item.get('bytes') == expected['bytes'] and item.get('sha256') == expected['sha256'], 'Existing release asset conflicts: ' + item.get('name', '?'))


def inspect_release(release, expected):
    if release is None:
        return sorted(expected['assets'])
    need(type(release.get('id')) is int and release['id'] > 0, 'Invalid release ID')
    need(release.get('tag_name') == expected['tag'] and release.get('name') == expected['name'] and release.get('body') == expected['body'], 'Existing release is not this managed artifact: ' + expected['tag'])
    need(type(release.get('draft')) is bool and release.get('prerelease') is False, 'Unexpected release state')
    assets = release.get('assets', [])
    names = [a['name'] for a in assets]
    need(len(names) == len(set(names)) and set(names) <= set(expected['assets']), 'Unexpected or duplicate release assets')
    for item in assets:
        verify_remote_asset(item, expected['assets'][item['name']])
    missing = sorted(set(expected['assets']) - set(names))
    need(release['draft'] or not missing, 'Published release is incomplete; refusing to modify it')
    return missing


def plan_releases(snapshot, releases, commit):
    need(re.fullmatch('[0-9a-f]{40}', commit or ''), 'Invalid workflow commit')
    need(snapshot.get('main_sha') == commit, 'main has moved; run this workflow from the current main commit')
    latest = snapshot.get('latest') or {}
    need(latest.get('draft') is False and latest.get('prerelease') is False, 'No valid global Latest release')
    if latest.get('tag_name') == 'v317.197':
        assets = {item['name']:item for item in latest.get('assets', [])}
        for expected in BASE.values():
            name = expected['url'].rsplit('/', 1)[-1]
            need(name in assets, 'Current 317.197 baseline asset is missing')
            verify_remote_asset(assets[name], expected)
    elif latest.get('tag_name') == SKETCHUP_TAG:
        need(not inspect_release(latest, releases['sketchup']), 'Latest 317.198 is incomplete')
        need(snapshot.get('sketchup') is not None and snapshot['sketchup']['id'] == latest['id'], 'Latest/tag identity changed')
    else:
        raise ValueError('Global Latest must still be verified v317.197 or this matching v317.198')
    plan = {}
    tags = snapshot.get('tag_refs')
    need(isinstance(tags, dict) and set(tags) == {COMMON_TAG, SKETCHUP_TAG}, 'Git tag state was not checked')
    for kind in ('common', 'sketchup'):
        release = snapshot.get(kind)
        need(release is not None or tags[releases[kind]['tag']] is None, 'An unmanaged Git tag already exists: ' + releases[kind]['tag'])
        missing = inspect_release(release, releases[kind])
        plan[kind] = {'create_draft':release is None, 'upload':missing,
                      'publish_draft':release is None or release['draft'],
                      'make_latest':kind == 'sketchup' and latest['tag_name'] != SKETCHUP_TAG}
    return plan


class GitHub:
    """Small gh wrapper. Tokens stay in subprocess environment, never in args/logs."""
    def __init__(self, cache, definitions):
        need(os.environ.get('GH_TOKEN'), 'GH_TOKEN must be the workflow repository token')
        self.cache = cache
        self.definitions = definitions
        self.known_release_ids = {}
        self.env = os.environ.copy()
        self.env.pop('GH_DEBUG', None)
        self.env['GH_PROMPT_DISABLED'] = '1'

    def run(self, arguments, data=None, destination=None, allow_missing=False):
        command = ['gh'] + arguments
        kwargs = {'env':self.env, 'stderr':subprocess.PIPE, 'input':None if data is None else json.dumps(data).encode()}
        if destination is None:
            result = subprocess.run(command, stdout=subprocess.PIPE, **kwargs)
        else:
            with destination.open('xb') as target:
                result = subprocess.run(command, stdout=target, **kwargs)
        if result.returncode:
            status = re.search(rb'HTTP (\d{3})', result.stderr or b'')
            if allow_missing and status and status.group(1) == b'404':
                return None
            raise RuntimeError('GitHub operation failed' + (' (HTTP ' + status.group(1).decode() + ')' if status else ''))
        return result.stdout

    def api(self, endpoint, method='GET', data=None, allow_missing=False):
        args = ['api', endpoint, '--method', method, '-H', 'Accept: application/vnd.github+json', '-H', 'X-GitHub-Api-Version: 2022-11-28']
        if data is not None:
            args += ['--input', '-']
        raw = self.run(args, data, allow_missing=allow_missing)
        return None if raw is None else json.loads(raw)

    def normalize(self, release):
        if release is None:
            return None
        rid = release.get('id')
        need(type(rid) is int and rid > 0, 'Invalid remote release ID')
        # This release has at most seven managed assets; a nonempty second page
        # is an unexpected asset set, never a reason to ignore extra objects.
        assets = self.api(f'repos/{REPO}/releases/{rid}/assets?per_page=100')
        need(len(assets) < 100, 'Too many release assets')
        normalized = []
        known = {item['url'].rsplit('/', 1)[-1]:item for item in BASE.values()} if release.get('tag_name') == 'v317.197' else {}
        for definition in self.definitions.values():
            if release.get('tag_name') == definition['tag']:
                known = definition['assets']
        for item in assets:
            sha = item.get('digest')
            if sha is not None:
                need(isinstance(sha, str) and re.fullmatch('sha256:[0-9a-f]{64}', sha), 'GitHub returned an invalid asset digest')
                sha = sha[7:]
            elif item.get('state') == 'uploaded' and item.get('name') in known:
                # Published older assets can be hashed through their exact
                # public URL. No Authorization header follows a CDN redirect.
                # A draft lacking a digest is refused rather than guessed.
                need(release.get('draft') is False, 'Draft asset has no SHA-256 digest; cannot safely verify this existing upload')
                aid = item.get('id')
                need(type(aid) is int and aid > 0 and 0 <= item['size'] <= 3_000_000_000, 'Invalid asset metadata')
                expected = known[item['name']]
                url = f'https://github.com/{REPO}/releases/download/{release["tag_name"]}/{item["name"]}'
                need(item.get('browser_download_url') == url, 'Unexpected public asset URL')
                need(item['size'] == expected['bytes'], 'Existing release asset size differs')
                cached = self.cache / ('asset-' + str(aid))
                download_public({'url':url, **meta_only(expected)}, cached)
                sha = expected['sha256']
            else:
                sha = None
            normalized.append({'id':item.get('id'), 'name':item['name'], 'bytes':item['size'], 'sha256':sha, 'state':item['state']})
        result = dict(release)
        result['assets'] = normalized
        return result

    def remember_release_id(self, tag, rid):
        need(tag in (COMMON_TAG, SKETCHUP_TAG), 'Unexpected managed release tag')
        need(type(rid) is int and rid > 0, 'Invalid managed release ID')
        previous = self.known_release_ids.get(tag)
        need(previous is None or previous == rid, 'Conflicting managed release ID: ' + tag)
        self.known_release_ids[tag] = rid

    def snapshot(self):
        # The /releases/tags endpoint is a published-release lookup. Authenticated
        # listing discovers existing drafts, so a lost create/upload response
        # can resume. Retain validated IDs when that list temporarily lags.
        found = dict(self.known_release_ids)
        listed = set()
        for page in range(1, 51):
            rows = self.api(f'repos/{REPO}/releases?per_page=100&page={page}')
            need(isinstance(rows, list) and len(rows) <= 100, 'Invalid release listing')
            for row in rows:
                tag = row.get('tag_name')
                if tag in (COMMON_TAG, SKETCHUP_TAG):
                    need(tag not in listed, 'Multiple releases use the managed tag: ' + tag)
                    listed.add(tag)
                    rid = row.get('id')
                    need(type(rid) is int and rid > 0, 'Invalid listed release ID')
                    need(tag not in found or found[tag] == rid, 'Conflicting managed release ID: ' + tag)
                    found[tag] = rid
            if len(rows) < 100:
                break
        else:
            raise ValueError('Release listing exceeds the checked pagination limit')
        releases = {}
        definitions = {item['tag']:item for item in self.definitions.values()}
        for tag, rid in found.items():
            release = self.api(f'repos/{REPO}/releases/{rid}')
            need(isinstance(release, dict), 'Managed release is missing at its known ID: ' + tag)
            need(release.get('id') == rid and release.get('tag_name') == tag, 'Managed release identity changed: ' + tag)
            normalized = self.normalize(release)
            inspect_release(normalized, definitions[tag])
            self.remember_release_id(tag, rid)
            releases[tag] = normalized
        tags = {tag:self.api(f'repos/{REPO}/git/ref/tags/{tag}', allow_missing=True) for tag in (COMMON_TAG, SKETCHUP_TAG)}
        latest = self.normalize(self.api(f'repos/{REPO}/releases/latest'))
        # Read main after potentially slow asset checks, immediately before the
        # caller's mutation guard, instead of trusting an earlier checkout.
        head = self.api(f'repos/{REPO}/git/ref/heads/main')['object']['sha']
        return {'main_sha':head, 'latest':latest, 'common':releases.get(COMMON_TAG),
                'sketchup':releases.get(SKETCHUP_TAG), 'tag_refs':tags}

    def create(self, definition, commit):
        release = self.api(f'repos/{REPO}/releases', 'POST', {
            'tag_name':definition['tag'], 'target_commitish':commit,
            'name':definition['name'], 'body':definition['body'],
            'draft':True, 'prerelease':False, 'make_latest':'false', 'generate_release_notes':False})
        need(isinstance(release, dict), 'Create release returned no release identity')
        need(release.get('tag_name') == definition['tag'] and release.get('name') == definition['name'] and release.get('body') == definition['body'], 'Created release identity differs')
        need(release.get('draft') is True and release.get('prerelease') is False, 'Created release is not the expected draft')
        # A newly created draft may not appear in the list immediately. Keep
        # its returned ID and verify it through direct GET before any upload.
        self.remember_release_id(definition['tag'], release.get('id'))
        return release

    def upload(self, tag, path):
        # Deliberately omit --clobber; an asset appearing in a race is an error.
        self.run(['release', 'upload', tag, str(path), '-R', REPO])

    def promote(self, release, latest):
        self.api(f'repos/{REPO}/releases/{release["id"]}', 'PATCH', {
            'draft':False, 'prerelease':False, 'make_latest':'true' if latest else 'false'})


def publish(releases, client, commit):
    # Freeze the upload inputs once more before even creating a draft. Every
    # single upload is also rechecked immediately before sending its bytes.
    for definition in releases.values():
        for item in definition['assets'].values():
            checked_file(item['path'], item)
    def guarded():
        snapshot = client.snapshot()
        return snapshot, plan_releases(snapshot, releases, commit)
    guarded()  # Both release states and all conflicts checked before any write.
    for kind in ('common', 'sketchup'):
        definition = releases[kind]
        snapshot, plan = guarded()
        if plan[kind]['create_draft']:
            client.create(definition, commit)
        for name, item in sorted(definition['assets'].items()):
            snapshot, plan = guarded()
            if name not in plan[kind]['upload']:
                continue
            need(snapshot.get(kind) is not None, 'Managed draft is missing before upload: ' + definition['tag'])
            need(snapshot[kind]['draft'], 'Only managed drafts can receive assets')
            checked_file(item['path'], item)
            client.upload(definition['tag'], item['path'])
        snapshot, plan = guarded()
        need(not plan[kind]['upload'], 'Required assets are still missing')
        if plan[kind]['publish_draft'] or plan[kind]['make_latest']:
            client.promote(snapshot[kind], latest=kind == 'sketchup')
    snapshot, plan = guarded()
    need(snapshot.get('common') is not None and snapshot.get('sketchup') is not None, 'Managed release is missing from the final snapshot')
    need(not snapshot['common']['draft'] and not snapshot['sketchup']['draft'] and snapshot['latest']['id'] == snapshot['sketchup']['id'], 'Release publication has not reached the verified final state')
    return {'common':COMMON_TAG, 'sketchup':SKETCHUP_TAG, 'latest':SKETCHUP_TAG, 'status':'published_verified'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--check', action='store_true')
    mode.add_argument('--plan', action='store_true')
    mode.add_argument('--publish', action='store_true')
    parser.add_argument('--repo-root', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--output-dir', type=Path, required=True)
    parser.add_argument('--base-dir', type=Path)
    args = parser.parse_args()
    repo_root, output = args.repo_root.resolve(), args.output_dir.resolve()
    if args.publish:
        need(os.environ.get('GITHUB_REPOSITORY') == REPO, 'Publishing is restricted to the owner repository')
        need(os.environ.get('GITHUB_REF') == 'refs/heads/main', 'Publish only from the main branch')
        need(os.environ.get('GITHUB_EVENT_NAME') in ('push', 'workflow_dispatch'), 'Unsupported publication event')
        need(re.fullmatch('[0-9a-f]{40}', os.environ.get('GITHUB_SHA', '')), 'Missing workflow commit')
    build = check_bundle(repo_root, output)
    print(json.dumps({'status':'local_check_passed', **build['report']}, ensure_ascii=False), flush=True)
    if args.plan or args.publish:
        build_sketchup(build, output, args.base_dir.resolve() if args.base_dir else None, args.publish)
        build['report']['releases'] = {kind:{'tag':build[kind]['tag'], 'managed_identity':build[kind]['identity'],
            'assets':{name:meta_only(item) for name,item in build[kind]['assets'].items()}} for kind in ('common', 'sketchup')}
    if args.publish:
        cache = output / 'remote-read-cache'
        cache.mkdir(exist_ok=True)
        definitions = {kind:build[kind] for kind in ('common', 'sketchup')}
        result = publish(definitions, GitHub(cache, definitions), os.environ['GITHUB_SHA'])
        build['report'].update(result, mode='publish', remote_state_checked=True, published=True)
    (output / 'publisher_report.json').write_text(json.dumps(build['report'], ensure_ascii=False, indent=2) + '\n')
    print(json.dumps(build['report'], ensure_ascii=False), flush=True)


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('B-063 release stopped: ' + str(error), file=sys.stderr)
        sys.exit(1)
