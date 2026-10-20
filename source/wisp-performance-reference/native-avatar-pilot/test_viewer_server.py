"""Loopback HTTP and synthetic-token grants only; no provider/account calls."""
import importlib.util
import json
import unittest
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import viewer_server


class LocalViewer(unittest.TestCase):
    def request(self, viewer, path, method='GET', origin=None, host=None):
        headers = {'Origin': origin or viewer.origin}
        if host:
            headers['Host'] = host
        req = Request(viewer.origin+path, data=b'{}' if method == 'POST' else None,
                      headers=headers, method=method)
        try:
            with urlopen(req, timeout=2) as response:
                return response.status, dict(response.headers), response.read()
        except HTTPError as error:
            return error.code, dict(error.headers), error.read()

    def test_static_is_local_no_store_and_blocks_devices(self):
        with viewer_server.ViewerServer(lambda: {}) as viewer:
            code, headers, body = self.request(viewer, '/')
            self.assertEqual(code, 200)
            self.assertEqual(headers['Cache-Control'], 'no-store')
            self.assertIn('microphone=()', headers['Permissions-Policy'])
            self.assertIn('camera=()', headers['Permissions-Policy'])
            self.assertNotIn(b'api_secret', body)
            self.assertEqual(self.request(viewer, '/connect')[0], 404)

    def test_foreign_origin_and_host_reject_before_token(self):
        def forbidden():
            self.fail('Must not generate a token')
        with viewer_server.ViewerServer(forbidden) as viewer:
            self.assertEqual(self.request(viewer, '/connect', 'POST', origin='https://foreign.example')[0], 403)
            self.assertEqual(self.request(viewer, '/connect', 'POST', host='foreign.example')[0], 403)
            self.assertEqual(self.request(viewer, '/connect?token=bad', 'POST')[0], 403)

    def test_single_connection_ready_and_no_private_paths(self):
        calls = []
        def info():
            calls.append(1)
            return {'url': 'wss://synthetic.example', 'token': 'synthetic-subscribe-token'}
        with viewer_server.ViewerServer(info) as viewer:
            self.assertEqual(self.request(viewer, '/ready', 'POST')[0], 404)
            code, headers, body = self.request(viewer, '/connect', 'POST')
            self.assertEqual(code, 200)
            self.assertEqual(json.loads(body)['token'], 'synthetic-subscribe-token')
            self.assertEqual(self.request(viewer, '/connect', 'POST')[0], 409)
            self.assertEqual(calls, [1])
            self.assertEqual(self.request(viewer, '/ready', 'POST')[0], 204)
            self.assertTrue(viewer.ready.is_set())
            self.assertEqual(self.request(viewer, '/private_setup.py')[0], 404)

    def test_stop_prevents_worker_start_before_ready(self):
        with viewer_server.ViewerServer(lambda: {}) as viewer:
            self.assertEqual(self.request(viewer, '/stop', 'POST')[0], 204)
            self.assertTrue(viewer.stop_requested.is_set())
            self.assertFalse(viewer.wait_ready(timeout=.1))
            self.assertEqual(self.request(viewer, '/connect', 'POST')[0], 410)

    @unittest.skipUnless(importlib.util.find_spec('livekit'), 'Isolated SDK environment required')
    def test_synthetic_token_cannot_publish_and_is_short_lived(self):
        import jwt
        values = {'WISP_PILOT_ROOM_NAME':'wisp-pilot-synthetic', 'LIVEKIT_API_KEY':'synthetic-api-key',
                  'LIVEKIT_API_SECRET':'synthetic-test-secret-not-a-real-credential'}
        payload = jwt.decode(viewer_server.viewer_token(values), options={'verify_signature':False})
        self.assertFalse(payload['video']['canPublish'])
        self.assertFalse(payload['video']['canPublishData'])
        self.assertFalse(payload['video']['canUpdateOwnMetadata'])
        self.assertTrue(payload['video']['canSubscribe'])
        self.assertEqual(payload['video']['room'], 'wisp-pilot-synthetic')
        self.assertEqual(payload['exp']-payload['nbf'], 45)


if __name__ == '__main__':
    unittest.main()
