import pytest

from src.services.fivesim import FiveSimClient, FiveSimError


class FakeResponse:
    def __init__(self, status_code=200, payload=None, text=""):
        self.status_code = status_code
        self._payload = payload
        self.text = text

    def json(self):
        if self._payload is None:
            raise ValueError("no json payload")
        return self._payload


class FakeHTTPClient:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = []

    def request(self, method, url, **kwargs):
        self.calls.append({
            "method": method,
            "url": url,
            "kwargs": kwargs,
        })
        if not self.responses:
            raise AssertionError(f"unexpected request: {method} {url}")
        return self.responses.pop(0)


def test_buy_activation_builds_expected_request_and_returns_order():
    client = FiveSimClient(
        api_token="token-123",
        base_url="https://5sim.test",
    )
    fake_http = FakeHTTPClient([
        FakeResponse(
            payload={
                "id": 1001,
                "phone": "+1234567890",
                "status": "PENDING",
            }
        )
    ])
    client.http_client = fake_http

    order = client.buy_activation(
        "usa",
        "any",
        "openai",
        reuse=True,
        voice=True,
        ref="ref-1",
        max_price=0.5,
    )

    assert order["id"] == 1001
    call = fake_http.calls[0]
    assert call["method"] == "GET"
    assert call["url"] == "https://5sim.test/v1/user/buy/activation/usa/any/openai"
    assert call["kwargs"]["headers"]["Authorization"] == "Bearer token-123"
    assert call["kwargs"]["headers"]["Accept"] == "application/json"
    assert call["kwargs"]["params"] == {
        "reuse": 1,
        "voice": 1,
        "ref": "ref-1",
        "maxPrice": 0.5,
    }


def test_get_latest_code_returns_last_sms_code():
    client = FiveSimClient(api_token="token-123")

    code = client.get_latest_code(
        {
            "sms": [
                {"code": "111111"},
                {"code": "222222"},
            ]
        }
    )

    assert code == "222222"


def test_wait_for_code_polls_until_code_and_finishes_order():
    client = FiveSimClient(
        api_token="token-123",
        base_url="https://5sim.test",
    )
    fake_http = FakeHTTPClient([
        FakeResponse(payload={"id": 1001, "status": "PENDING", "sms": []}),
        FakeResponse(payload={"id": 1001, "status": "RECEIVED", "sms": [{"code": "654321"}]}),
        FakeResponse(payload={"id": 1001, "status": "FINISHED"}),
    ])
    client.http_client = fake_http

    code = client.wait_for_code(
        1001,
        timeout=5,
        poll_interval=0,
        finish_on_success=True,
    )

    assert code == "654321"
    assert [call["url"] for call in fake_http.calls] == [
        "https://5sim.test/v1/user/check/1001",
        "https://5sim.test/v1/user/check/1001",
        "https://5sim.test/v1/user/finish/1001",
    ]


def test_buy_activation_raises_error_with_response_details():
    client = FiveSimClient(
        api_token="token-123",
        base_url="https://5sim.test",
    )
    fake_http = FakeHTTPClient([
        FakeResponse(
            status_code=400,
            payload={"message": "not enough user balance"},
        )
    ])
    client.http_client = fake_http

    with pytest.raises(FiveSimError, match="not enough user balance"):
        client.buy_activation("usa", "any", "openai")
