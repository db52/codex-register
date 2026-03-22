"""
5SIM user API client.
"""

import logging
import time
from typing import Any, Dict, List, Optional, Union

from ..core.http_client import HTTPClient, RequestConfig


logger = logging.getLogger(__name__)


class FiveSimError(Exception):
    """Raised when a 5SIM API request fails."""


class FiveSimClient:
    """Thin wrapper around the 5SIM user API."""

    def __init__(
        self,
        api_token: str,
        base_url: str = "https://5sim.net",
        timeout: int = 30,
        max_retries: int = 3,
        proxy_url: Optional[str] = None,
    ) -> None:
        if not str(api_token or "").strip():
            raise ValueError("api_token is required")

        self.api_token = str(api_token).strip()
        self.base_url = str(base_url).rstrip("/")
        self.http_client = HTTPClient(
            proxy_url=proxy_url,
            config=RequestConfig(timeout=timeout, max_retries=max_retries),
        )

    def _headers(self) -> Dict[str, str]:
        return {
            "Accept": "application/json",
            "Authorization": f"Bearer {self.api_token}",
        }

    def _request(
        self,
        method: str,
        path: str,
        *,
        params: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        url = f"{self.base_url}{path}"
        response = self.http_client.request(
            method,
            url,
            headers=self._headers(),
            params=params,
        )

        if response.status_code >= 400:
            raise FiveSimError(self._format_error(response))

        try:
            return response.json()
        except Exception as exc:
            raise FiveSimError(f"Failed to decode 5SIM response from {path}: {exc}") from exc

    def _format_error(self, response: Any) -> str:
        prefix = f"5SIM API request failed with status {response.status_code}"
        try:
            payload = response.json()
        except Exception:
            text = str(getattr(response, "text", "") or "").strip()
            return f"{prefix}: {text or 'unknown error'}"

        if isinstance(payload, dict):
            message = payload.get("message") or payload.get("error") or payload.get("detail")
            if message:
                return f"{prefix}: {message}"

        return f"{prefix}: {payload}"

    def get_countries(self) -> Dict[str, Any]:
        return self._request("GET", "/v1/guest/countries")

    def get_products(self, country: str, operator: str) -> Dict[str, Any]:
        return self._request("GET", f"/v1/guest/products/{country}/{operator}")

    def get_prices(
        self,
        country: Optional[str] = None,
        product: Optional[str] = None,
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {}
        if country:
            params["country"] = country
        if product:
            params["product"] = product
        return self._request("GET", "/v1/guest/prices", params=params or None)

    def buy_activation(
        self,
        country: str,
        operator: str,
        product: str,
        *,
        forwarding: Optional[bool] = None,
        number: Optional[str] = None,
        reuse: bool = False,
        voice: bool = False,
        ref: Optional[str] = None,
        max_price: Optional[float] = None,
    ) -> Dict[str, Any]:
        params: Dict[str, Any] = {}
        if forwarding is not None:
            params["forwarding"] = 1 if forwarding else 0
        if number:
            params["number"] = number
        if reuse:
            params["reuse"] = 1
        if voice:
            params["voice"] = 1
        if ref:
            params["ref"] = ref
        if max_price is not None:
            params["maxPrice"] = max_price

        return self._request(
            "GET",
            f"/v1/user/buy/activation/{country}/{operator}/{product}",
            params=params or None,
        )

    def check_order(self, order_id: Union[int, str]) -> Dict[str, Any]:
        return self._request("GET", f"/v1/user/check/{order_id}")

    def finish_order(self, order_id: Union[int, str]) -> Dict[str, Any]:
        return self._request("GET", f"/v1/user/finish/{order_id}")

    def cancel_order(self, order_id: Union[int, str]) -> Dict[str, Any]:
        return self._request("GET", f"/v1/user/cancel/{order_id}")

    def ban_order(self, order_id: Union[int, str]) -> Dict[str, Any]:
        return self._request("GET", f"/v1/user/ban/{order_id}")

    def extract_codes(self, order: Dict[str, Any]) -> List[str]:
        codes: List[str] = []
        for sms in order.get("sms", []) or []:
            code = sms.get("code")
            if code:
                codes.append(str(code))
        return codes

    def get_latest_code(self, order: Dict[str, Any]) -> Optional[str]:
        codes = self.extract_codes(order)
        if not codes:
            return None
        return codes[-1]

    def wait_for_code(
        self,
        order_id: Union[int, str],
        *,
        timeout: int = 300,
        poll_interval: float = 3.0,
        finish_on_success: bool = False,
    ) -> Optional[str]:
        started_at = time.time()

        while time.time() - started_at < timeout:
            order = self.check_order(order_id)
            code = self.get_latest_code(order)
            if code:
                if finish_on_success:
                    self.finish_order(order_id)
                return code
            time.sleep(poll_interval)

        logger.info("Timed out waiting for 5SIM code for order %s", order_id)
        return None
