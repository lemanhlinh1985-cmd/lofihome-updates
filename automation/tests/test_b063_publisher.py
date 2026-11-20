"""Offline release-state tests; no network or GitHub mutations are performed."""
from pathlib import Path
from unittest.mock import patch
import copy
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest

HERE = Path(__file__).resolve().parent
SOURCE = next((path for path in (
    HERE.parent / 'publish_b063.py',
    HERE.parent / 'repo_upload/automation/publish_b063.py',
) if path.is_file()), None)
if SOURCE is None:
    raise FileNotFoundError('Cannot locate the B-063 publisher beside the repository tests or publisher_checks')
loader = importlib.util.spec_from_file_location('publisher_under_test', SOURCE)
p = importlib.util.module_from_spec(loader)
loader.loader.exec_module(p)
COMMIT = '1' * 40


def remote_asset(name, meta):
    return {'name':name, 'bytes':meta['bytes'], 'sha256':meta['sha256'], 'state':'uploaded'}


class FakeGitHub:
    def __init__(self, definitions):
        self.definitions = definitions
        self.state = {'main_sha':COMMIT, 'latest':{'id':1, 'tag_name':'v317.197', 'draft':False, 'prerelease':False,
            'assets':[remote_asset(x['url'].rsplit('/', 1)[-1], x) for x in p.BASE.values()]}, 'common':None, 'sketchup':None}
        self.state['tag_refs'] = {p.COMMON_TAG:None, p.SKETCHUP_TAG:None}
        self.writes = []
        self.upload_counts = {}
        self.lose_upload_reply = None
        self.after_upload = None

    def snapshot(self):
        return copy.deepcopy(self.state)

    def kind(self, tag):
        return next(k for k,v in self.definitions.items() if v['tag'] == tag)

    def create(self, definition, commit):
        kind = self.kind(definition['tag'])
        if self.state[kind] is not None:
            raise RuntimeError('create conflict')
        self.writes.append(('create', kind, commit))
        self.state[kind] = {'id':10 if kind == 'common' else 11, 'tag_name':definition['tag'], 'name':definition['name'],
            'body':definition['body'], 'draft':True, 'prerelease':False, 'assets':[]}

    def upload(self, tag, path):
        kind = self.kind(tag)
        asset = remote_asset(path.name, p.metadata(path))
        if any(x['name'] == path.name for x in self.state[kind]['assets']):
            raise RuntimeError('overwrite forbidden')
        self.state[kind]['assets'].append(asset)
        self.upload_counts[(kind,path.name)] = self.upload_counts.get((kind,path.name), 0) + 1
        self.writes.append(('upload', kind, path.name))
        if self.after_upload:
            self.after_upload(self)
        if self.lose_upload_reply == len(self.upload_counts):
            self.lose_upload_reply = None
            raise RuntimeError('lost HTTP response after successful upload')

    def promote(self, release, latest):
        kind = self.kind(release['tag_name'])
        self.writes.append(('promote', kind, latest))
        self.state[kind]['draft'] = False
        if latest:
            self.state['latest'] = copy.deepcopy(self.state[kind])


class PublisherTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        paths = []
        for name in ['installer.zip','B-063.json','full.rbz','quick.rbz','latest.json']:
            path = self.root / name
            path.write_bytes(('verified '+name).encode())
            paths.append(path)
        self.defs = {
            'common':p.release_definition(p.COMMON_TAG, 'Common', paths[:2], 'Reviewed manual overlay.'),
            'sketchup':p.release_definition(p.SKETCHUP_TAG, 'SketchUp', paths[2:], 'Reviewed SketchUp package.')}
        self.client = FakeGitHub(self.defs)

    def tearDown(self):
        self.temp.cleanup()

    def assert_blocked_before_writes(self):
        with self.assertRaises((ValueError, RuntimeError)):
            p.publish(self.defs, self.client, COMMIT)
        self.assertEqual(self.client.writes, [])

    def draft(self, kind, complete=False):
        self.client.create(self.defs[kind], COMMIT)
        if complete:
            for path in [x['path'] for x in self.defs[kind]['assets'].values()]:
                self.client.upload(self.defs[kind]['tag'], path)
        self.client.writes.clear()
        return self.client.state[kind]

    def test_new_publish_orders_common_before_sketchup_and_never_latest_common(self):
        result = p.publish(self.defs, self.client, COMMIT)
        self.assertEqual(result['status'], 'published_verified')
        promotions = [x for x in self.client.writes if x[0] == 'promote']
        self.assertEqual(promotions, [('promote','common',False), ('promote','sketchup',True)])
        self.assertEqual(self.client.state['latest']['tag_name'], p.SKETCHUP_TAG)

    def test_already_published_exact_retry_writes_nothing(self):
        p.publish(self.defs, self.client, COMMIT)
        self.client.writes.clear()
        p.publish(self.defs, self.client, COMMIT)
        self.assertEqual(self.client.writes, [])

    def test_lost_upload_reply_resumes_without_duplicate_or_overwrite(self):
        self.client.lose_upload_reply = 3
        with self.assertRaises(RuntimeError):
            p.publish(self.defs, self.client, COMMIT)
        self.assertTrue(self.client.state['sketchup']['draft'])
        p.publish(self.defs, self.client, COMMIT)
        self.assertTrue(all(count == 1 for count in self.client.upload_counts.values()))
        self.assertEqual(len([x for x in self.client.writes if x[0] == 'create']), 2)

    def test_wrong_latest_rejected_before_common_creation(self):
        self.client.state['latest']['tag_name'] = 'v317.199'
        self.assert_blocked_before_writes()

    def test_stale_commit_rejected_before_any_write(self):
        self.client.state['main_sha'] = '2' * 40
        self.assert_blocked_before_writes()

    def test_bare_preexisting_tag_blocks_creation_without_moving_it(self):
        self.client.state['tag_refs'][p.SKETCHUP_TAG] = {'ref':'refs/tags/'+p.SKETCHUP_TAG, 'object':{'type':'commit','sha':'2'*40}}
        self.assert_blocked_before_writes()

    def test_main_moving_mid_upload_stops_before_promotion(self):
        self.client.after_upload = lambda c:c.state.update(main_sha='2' * 40)
        with self.assertRaises(ValueError):
            p.publish(self.defs, self.client, COMMIT)
        self.assertTrue(self.client.state['common']['draft'])
        self.assertFalse(any(x[0] == 'promote' for x in self.client.writes))

    def test_newer_latest_mid_upload_stops_without_promoting(self):
        self.client.after_upload = lambda c:c.state['latest'].update(tag_name='v317.199')
        with self.assertRaises(ValueError):
            p.publish(self.defs, self.client, COMMIT)
        self.assertFalse(any(x[0] == 'promote' for x in self.client.writes))

    def test_foreign_sketchup_release_prevents_common_mutation(self):
        draft = self.draft('sketchup')
        draft['body'] = 'Another publisher created this'
        self.assert_blocked_before_writes()

    def test_same_named_asset_wrong_hash_is_not_overwritten(self):
        draft = self.draft('common', complete=True)
        draft['assets'][0]['sha256'] = '0' * 64
        self.assert_blocked_before_writes()

    def test_unknown_asset_and_duplicate_asset_are_rejected(self):
        draft = self.draft('common', complete=True)
        draft['assets'].append(dict(draft['assets'][0], name='unknown.txt'))
        self.assert_blocked_before_writes()
        draft['assets'][-1]['name'] = draft['assets'][0]['name']
        self.assert_blocked_before_writes()

    def test_incomplete_uploaded_asset_is_not_deleted_or_retried(self):
        draft = self.draft('common', complete=True)
        draft['assets'][0]['state'] = 'starter'
        self.assert_blocked_before_writes()

    def test_published_incomplete_release_is_not_modified(self):
        draft = self.draft('common')
        draft['draft'] = False
        self.assert_blocked_before_writes()

    def test_changed_baseline_asset_blocks_all_writes(self):
        self.client.state['latest']['assets'][0]['sha256'] = '0' * 64
        self.assert_blocked_before_writes()

    def test_matching_published_sketchup_can_be_promoted_from_verified_baseline(self):
        self.draft('common', complete=True)['draft'] = False
        self.draft('sketchup', complete=True)['draft'] = False
        p.publish(self.defs, self.client, COMMIT)
        self.assertEqual(self.client.writes, [('promote','sketchup',True)])

    def test_changed_local_asset_stops_before_that_upload(self):
        asset = next(iter(self.defs['common']['assets'].values()))
        asset['path'].write_bytes(b'changed after build')
        with self.assertRaises(ValueError):
            p.publish(self.defs, self.client, COMMIT)
        self.assertEqual(self.client.writes, [])

    def test_wrong_repo_or_branch_stops_before_local_build_or_network(self):
        argv = ['publisher','--publish','--repo-root',str(self.root),'--output-dir',str(self.root/'output')]
        valid = {'GITHUB_REPOSITORY':p.REPO,'GITHUB_REF':'refs/heads/main','GITHUB_EVENT_NAME':'workflow_dispatch','GITHUB_SHA':COMMIT}
        for change in [{'GITHUB_REPOSITORY':'someone/else'}, {'GITHUB_REF':'refs/heads/feature'}]:
            with patch.dict(os.environ, {**valid, **change}, clear=True), patch.object(sys,'argv',argv), self.assertRaises(ValueError):
                p.main()
        self.assertFalse((self.root/'output').exists())

    def test_absent_public_digest_uses_exact_public_url_without_token(self):
        with patch.dict(os.environ, {'GH_TOKEN':'do-not-log-this'}, clear=True):
            client = p.GitHub(self.root, self.defs)
        asset_name, expected = next(iter(self.defs['common']['assets'].items()))
        item = {'id':51,'name':asset_name,'size':expected['bytes'],'digest':None,'state':'uploaded',
                'browser_download_url':f'https://github.com/{p.REPO}/releases/download/{p.COMMON_TAG}/{asset_name}'}
        release = {'id':10,'tag_name':p.COMMON_TAG,'draft':False}
        client.api = lambda *a,**kw:[item]
        calls = []
        def download(meta, destination):
            calls.append(meta)
            destination.write_bytes(expected['path'].read_bytes())
        with patch.object(p,'download_public',download):
            result = client.normalize(release)
        self.assertEqual(result['assets'][0]['sha256'], expected['sha256'])
        self.assertEqual(calls[0]['url'], item['browser_download_url'])
        self.assertNotIn('do-not-log-this', json.dumps(calls))

    def test_absent_draft_digest_and_malformed_digest_fail_closed(self):
        with patch.dict(os.environ, {'GH_TOKEN':'private-value'}, clear=True):
            client = p.GitHub(self.root, self.defs)
        name, expected = next(iter(self.defs['common']['assets'].items()))
        item = {'id':51,'name':name,'size':expected['bytes'],'digest':None,'state':'uploaded'}
        client.api = lambda *a,**kw:[item]
        with self.assertRaisesRegex(ValueError,'Draft asset has no SHA-256'):
            client.normalize({'id':10,'tag_name':p.COMMON_TAG,'draft':True})
        item['digest'] = 'md5:unsupported'
        with self.assertRaisesRegex(ValueError,'invalid asset digest'):
            client.normalize({'id':10,'tag_name':p.COMMON_TAG,'draft':False})

    def test_github_failure_never_echoes_token_or_raw_stderr(self):
        token = 'private-value-never-log'
        with patch.dict(os.environ, {'GH_TOKEN':token,'GH_DEBUG':'api'}, clear=True):
            client = p.GitHub(self.root, self.defs)
        failed = subprocess.CompletedProcess([], 1, stdout=b'', stderr=('HTTP 403 '+token).encode())
        with patch.object(p.subprocess,'run',return_value=failed) as call:
            with self.assertRaises(RuntimeError) as error:
                client.api('repos/'+p.REPO+'/releases')
        self.assertNotIn(token, str(error.exception))
        self.assertNotIn(token, str(call.call_args.args))
        self.assertNotIn('GH_DEBUG', client.env)

    def real_client(self, list_releases=None):
        fake = self.client
        with patch.dict(os.environ, {'GH_TOKEN':'not-a-real-token'}, clear=True):
            client = p.GitHub(self.root, self.defs)
        calls = []
        def api(endpoint, method='GET', data=None, allow_missing=False):
            calls.append((method, endpoint))
            prefix = 'repos/'+p.REPO+'/'
            suffix = endpoint[len(prefix):]
            if suffix.startswith('releases/tags/'):
                # This deliberately cannot discover drafts.
                return None
            if suffix == 'releases' and method == 'POST':
                definition = next(x for x in self.defs.values() if x['tag'] == data['tag_name'])
                fake.create(definition, data['target_commitish'])
                return copy.deepcopy(fake.state[fake.kind(definition['tag'])])
            if suffix.startswith('releases?'):
                rows = [copy.deepcopy(fake.state[k]) for k in ('common','sketchup') if fake.state[k] is not None]
                return rows if list_releases is None else list_releases(rows)
            if suffix.startswith('git/ref/tags/'):
                return fake.state['tag_refs'][suffix.split('/')[-1]]
            if suffix == 'git/ref/heads/main':
                return {'object':{'sha':fake.state['main_sha']}}
            if suffix == 'releases/latest':
                return copy.deepcopy(fake.state['latest'])
            if suffix.startswith('releases/'):
                rid = int(suffix.split('/')[1])
                release = next(x for x in [fake.state['latest'],fake.state['common'],fake.state['sketchup']] if x and x['id'] == rid)
                if '/assets?' in suffix:
                    return [{'id':100+i,'name':x['name'],'size':x['bytes'],'digest':'sha256:'+x['sha256'],'state':x['state']} for i,x in enumerate(release['assets'])]
                if method == 'PATCH':
                    fake.promote(release, data['make_latest'] == 'true')
                    return copy.deepcopy(release)
                return copy.deepcopy(release)
            raise AssertionError(endpoint)
        client.api = api
        client.upload = fake.upload
        return client, calls

    def test_real_client_discovers_and_resumes_drafts_when_tag_lookup_is_404(self):
        fake = self.client
        self.draft('common')
        client, calls = self.real_client()
        result = p.publish(self.defs, client, COMMIT)
        self.assertEqual(result['status'], 'published_verified')
        self.assertFalse(any('/releases/tags/' in endpoint for _,endpoint in calls))
        self.assertTrue(any('/releases?' in endpoint for _,endpoint in calls))
        self.assertEqual(len([x for x in fake.writes if x[0] == 'create' and x[1] == 'common']), 0)

    def test_real_client_keeps_created_ids_when_list_omits_new_drafts(self):
        # Reproduces the real failure: POST returns a draft, while subsequent
        # list reads omit it. GET by that ID still returns the correct draft.
        client, calls = self.real_client(list_releases=lambda rows: [])
        result = p.publish(self.defs, client, COMMIT)
        self.assertEqual(result['status'], 'published_verified')
        self.assertEqual(client.known_release_ids, {p.COMMON_TAG:10, p.SKETCHUP_TAG:11})
        for rid in (10, 11):
            self.assertTrue(any(method == 'GET' and endpoint == f'repos/{p.REPO}/releases/{rid}' for method,endpoint in calls))
        self.assertEqual([x[1] for x in self.client.writes if x[0] == 'create'], ['common', 'sketchup'])
        self.assertTrue(all(count == 1 for count in self.client.upload_counts.values()))
        self.assertEqual([x for x in self.client.writes if x[0] == 'promote'], [('promote','common',False), ('promote','sketchup',True)])

    def test_real_client_remembers_discovered_draft_when_list_later_omits_it(self):
        self.draft('common')
        reads = 0
        def list_once(rows):
            nonlocal reads
            reads += 1
            return rows if reads == 1 else []
        client, calls = self.real_client(list_releases=list_once)
        result = p.publish(self.defs, client, COMMIT)
        self.assertEqual(result['status'], 'published_verified')
        self.assertEqual([x[1] for x in self.client.writes if x[0] == 'create'], ['sketchup'])
        self.assertTrue(all(count == 1 for count in self.client.upload_counts.values()))

    def test_known_id_conflicting_with_later_list_is_rejected(self):
        self.draft('common')
        client, calls = self.real_client()
        client.snapshot()
        api = client.api
        def conflicting(endpoint, **kwargs):
            if '/releases?' in endpoint:
                return [{'id':999, 'tag_name':p.COMMON_TAG}]
            return api(endpoint, **kwargs)
        client.api = conflicting
        with self.assertRaisesRegex(ValueError, 'Conflicting managed release ID'):
            client.snapshot()
        self.assertEqual(self.client.writes, [])

    def test_known_id_direct_get_missing_or_changed_identity_fails_closed(self):
        self.draft('common')
        for variant in ('missing', 'wrong_id', 'wrong_tag'):
            with self.subTest(variant=variant):
                client, calls = self.real_client()
                client.snapshot()
                api = client.api
                def changed(endpoint, **kwargs):
                    if '/releases?' in endpoint:
                        return []
                    if endpoint == f'repos/{p.REPO}/releases/10':
                        if variant == 'missing':
                            return None
                        row = copy.deepcopy(self.client.state['common'])
                        row['id' if variant == 'wrong_id' else 'tag_name'] = 999 if variant == 'wrong_id' else 'another-release'
                        return row
                    return api(endpoint, **kwargs)
                client.api = changed
                with self.assertRaisesRegex(ValueError, 'Managed release (is missing|identity changed)'):
                    client.snapshot()
                self.assertEqual(self.client.writes, [])

    def test_release_discovery_paginates_and_rejects_duplicate_managed_tags(self):
        with patch.dict(os.environ, {'GH_TOKEN':'not-a-real-token'}, clear=True):
            client = p.GitHub(self.root, self.defs)
        visited = []
        def api(endpoint, **kwargs):
            visited.append(endpoint)
            if endpoint.endswith('&page=1'):
                return [{'id':10,'tag_name':p.COMMON_TAG}] + [{'id':100+i,'tag_name':'old-'+str(i)} for i in range(99)]
            if endpoint.endswith('&page=2'):
                return [{'id':11,'tag_name':p.COMMON_TAG}]
            raise AssertionError('Unexpected network endpoint '+endpoint)
        client.api = api
        with self.assertRaisesRegex(ValueError,'Multiple releases'):
            client.snapshot()
        self.assertEqual(len(visited), 2)


if __name__ == '__main__':
    suite = unittest.defaultTestLoader.loadTestsFromTestCase(PublisherTests)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    report = {'status':'passed' if result.wasSuccessful() else 'failed', 'tests_run':result.testsRun,
              'failures':len(result.failures), 'errors':len(result.errors),
              'publisher_sha256':p.digest(SOURCE), 'network_used':False, 'github_mutations':False}
    (HERE/'mocked_planner_report.json').write_text(json.dumps(report, indent=2)+'\n')
    sys.exit(0 if result.wasSuccessful() else 1)
