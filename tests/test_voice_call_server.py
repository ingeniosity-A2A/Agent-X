import os
import unittest
from unittest.mock import patch

from src import voice_call_server


class VoiceCallControlTests(unittest.TestCase):
    @patch.dict(os.environ, {
        "TELNYX_API_KEY": "test-key",
        "TELNYX_FROM_NUMBER": "+14045550100",
        "TELNYX_CONNECTION_ID": "test-connection",
    }, clear=False)
    @patch("src.voice_call_server._telnyx_request")
    def test_dial_returns_call_control_id(self, request):
        request.return_value = {"data": {"call_control_id": "call-control-12345678"}}
        result = voice_call_server.dial_call("+14045550123")
        self.assertTrue(result["ok"])
        self.assertEqual(result["call_control_id"], "call-control-12345678")
        request.assert_called_once_with("POST", "/calls", {
            "connection_id": "test-connection",
            "to": "+14045550123",
            "from": "+14045550100",
        })

    @patch("src.voice_call_server._telnyx_request")
    def test_dial_rejects_local_number(self, request):
        result = voice_call_server.dial_call("4045550123")
        self.assertFalse(result["ok"])
        self.assertIn("E.164", result["error"])
        request.assert_not_called()

    @patch("src.voice_call_server._telnyx_request")
    def test_hangup_rejects_invalid_id(self, request):
        result = voice_call_server.hangup_call("bad id")
        self.assertFalse(result["ok"])
        request.assert_not_called()

    @patch("src.voice_call_server._telnyx_request")
    def test_hangup_requests_telnyx_action(self, request):
        request.return_value = {"data": {"result": "ok"}}
        result = voice_call_server.hangup_call("call-control-12345678")
        self.assertTrue(result["ok"])
        request.assert_called_once_with(
            "POST", "/calls/call-control-12345678/actions/hangup", {}
        )


if __name__ == "__main__":
    unittest.main()
