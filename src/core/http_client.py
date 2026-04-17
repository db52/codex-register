"""
HTTP 客户端封装
基于 curl_cffi 的 HTTP 请求封装，支持代理和错误处理
"""

import time
import json
import uuid
import random
import base64
from typing import Optional, Dict, Any, Union, Tuple
from dataclasses import dataclass
import logging

from curl_cffi import requests as cffi_requests
from curl_cffi.requests import Session, Response

from ..config.constants import ERROR_MESSAGES
from ..config.settings import get_settings


logger = logging.getLogger(__name__)


# Chrome 指纹配置：impersonate 与 sec-ch-ua 必须匹配真实浏览器
_CHROME_PROFILES = [
    {
        "major": 119, "impersonate": "chrome119",
        "build": 6045, "patch_range": (113, 248),
        "sec_ch_ua": '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
    },
    {
        "major": 120, "impersonate": "chrome120",
        "build": 6099, "patch_range": (109, 234),
        "sec_ch_ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
    },
    {
        "major": 123, "impersonate": "chrome123",
        "build": 6312, "patch_range": (24, 183),
        "sec_ch_ua": '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
    },
    {
        "major": 124, "impersonate": "chrome124",
        "build": 6367, "patch_range": (82, 207),
        "sec_ch_ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    },
    {
        "major": 131, "impersonate": "chrome131",
        "build": 6778, "patch_range": (69, 205),
        "sec_ch_ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
    },
    {
        "major": 133, "impersonate": "chrome133a",
        "build": 6943, "patch_range": (33, 153),
        "sec_ch_ua": '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
    },
    {
        "major": 136, "impersonate": "chrome136",
        "build": 7103, "patch_range": (48, 175),
        "sec_ch_ua": '"Chromium";v="136", "Google Chrome";v="136", "Not.A/Brand";v="99"',
    },
    {
        "major": 142, "impersonate": "chrome142",
        "build": 7204, "patch_range": (51, 160),
        "sec_ch_ua": '"Chromium";v="142", "Google Chrome";v="142", "Not;A=Brand";v="99"',
    },
]

_OS_PROFILES = [
    {
        "platform": "Windows NT 10.0; Win64; x64",
        "sec_ch_ua_platform": '"Windows"',
        "sec_ch_ua_mobile": "?0",
    },
    {
        "platform": "Macintosh; Intel Mac OS X 10_15_7",
        "sec_ch_ua_platform": '"macOS"',
        "sec_ch_ua_mobile": "?0",
    },
    {
        "platform": "X11; Linux x86_64",
        "sec_ch_ua_platform": '"Linux"',
        "sec_ch_ua_mobile": "?0",
    },
]

_ACCEPT_LANGUAGES = [
    "en-US,en;q=0.9",
    "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
    "en-GB,en;q=0.9",
    "en-US,en;q=0.8",
    "en-CA,en;q=0.9,fr-CA;q=0.8",
]


def _random_chrome_profile() -> Dict[str, str]:
    """随机选择 Chrome 版本和 OS 指纹，返回完整指纹 dict"""
    profile = random.choice(_CHROME_PROFILES)
    os_profile = random.choice(_OS_PROFILES)
    major = profile["major"]
    build = profile["build"]
    patch = random.randint(*profile["patch_range"])
    full_ver = f"{major}.0.{build}.{patch}"
    ua = (
        f"Mozilla/5.0 ({os_profile['platform']}) "
        f"AppleWebKit/537.36 (KHTML, like Gecko) "
        f"Chrome/{full_ver} Safari/537.36"
    )
    accept_language = random.choice(_ACCEPT_LANGUAGES)
    return {
        "impersonate": profile["impersonate"],
        "ua": ua,
        "sec_ch_ua": profile["sec_ch_ua"],
        "sec_ch_ua_platform": os_profile["sec_ch_ua_platform"],
        "sec_ch_ua_mobile": os_profile["sec_ch_ua_mobile"],
        "accept_language": accept_language,
    }


class SentinelTokenGenerator:
    """纯 Python 版本 sentinel token 生成器（PoW）"""

    MAX_ATTEMPTS = 500000
    ERROR_PREFIX = "wQ8Lk5FbGpA2NcR9dShT6gYjU7VxZ4D"

    def __init__(self, device_id=None, user_agent=None):
        self.device_id = device_id or str(uuid.uuid4())
        self.user_agent = user_agent or (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/131.0.0.0 Safari/537.36"
        )
        self.requirements_seed = str(random.random())
        self.sid = str(uuid.uuid4())

    @staticmethod
    def _fnv1a_32(text: str):
        h = 2166136261
        for ch in text:
            h ^= ord(ch)
            h = (h * 16777619) & 0xFFFFFFFF
        h ^= (h >> 16)
        h = (h * 2246822507) & 0xFFFFFFFF
        h ^= (h >> 13)
        h = (h * 3266489909) & 0xFFFFFFFF
        h ^= (h >> 16)
        h &= 0xFFFFFFFF
        return format(h, "08x")

    def _get_config(self):
        now_str = time.strftime(
            "%a %b %d %Y %H:%M:%S GMT+0000 (Coordinated Universal Time)",
            time.gmtime(),
        )
        perf_now = random.uniform(1000, 50000)
        time_origin = time.time() * 1000 - perf_now
        nav_prop = random.choice([
            "vendorSub", "productSub", "vendor", "maxTouchPoints",
            "scheduling", "userActivation", "doNotTrack", "geolocation",
            "connection", "plugins", "mimeTypes", "pdfViewerEnabled",
            "webkitTemporaryStorage", "webkitPersistentStorage",
            "hardwareConcurrency", "cookieEnabled", "credentials",
            "mediaDevices", "permissions", "locks", "ink",
        ])
        nav_val = f"{nav_prop}-undefined"
        screen = random.choice(["1920x1080", "2560x1440", "1366x768", "1440x900", "1280x800", "1600x900", "1920x1200"])
        hw_concurrency = random.choice([2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 32])
        return [
            screen,
            now_str,
            4294705152,
            random.random(),
            self.user_agent,
            "https://sentinel.openai.com/sentinel/20260124ceb8/sdk.js",
            None,
            None,
            "en-US",
            "en-US,en",
            random.random(),
            nav_val,
            random.choice(["location", "implementation", "URL", "documentURI", "compatMode"]),
            random.choice(["Object", "Function", "Array", "Number", "parseFloat", "undefined"]),
            perf_now,
            self.sid,
            "",
            hw_concurrency,
            time_origin,
        ]

    @staticmethod
    def _base64_encode(data):
        raw = json.dumps(data, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
        return base64.b64encode(raw).decode("ascii")

    def _run_check(self, start_time, seed, difficulty, config, nonce):
        config[3] = nonce
        config[9] = round((time.time() - start_time) * 1000)
        data = self._base64_encode(config)
        hash_hex = self._fnv1a_32(seed + data)
        diff_len = len(difficulty)
        if hash_hex[:diff_len] <= difficulty:
            return data + "~S"
        return None

    def generate_token(self, seed=None, difficulty=None):
        seed = seed if seed is not None else self.requirements_seed
        difficulty = str(difficulty or "0")
        start_time = time.time()
        config = self._get_config()
        for i in range(self.MAX_ATTEMPTS):
            result = self._run_check(start_time, seed, difficulty, config, i)
            if result:
                return "gAAAAAB" + result
        return "gAAAAAB" + self.ERROR_PREFIX + self._base64_encode(str(None))

    def generate_requirements_token(self):
        config = self._get_config()
        config[3] = 1
        config[9] = round(random.uniform(5, 50))
        data = self._base64_encode(config)
        return "gAAAAAC" + data


@dataclass
class RequestConfig:
    """HTTP 请求配置"""
    timeout: int = 30
    max_retries: int = 3
    retry_delay: float = 1.0
    impersonate: str = "chrome"
    verify_ssl: bool = True
    follow_redirects: bool = True


class HTTPClientError(Exception):
    """HTTP 客户端异常"""
    pass


class HTTPClient:
    """
    HTTP 客户端封装
    支持代理、重试、错误处理和会话管理
    """

    def __init__(
        self,
        proxy_url: Optional[str] = None,
        config: Optional[RequestConfig] = None,
        session: Optional[Session] = None
    ):
        """
        初始化 HTTP 客户端

        Args:
            proxy_url: 代理 URL，如 "http://127.0.0.1:7890"
            config: 请求配置
            session: 可重用的会话对象
        """
        self.proxy_url = proxy_url
        self.config = config or RequestConfig()
        self._session = session

    @property
    def proxies(self) -> Optional[Dict[str, str]]:
        """获取代理配置"""
        if not self.proxy_url:
            return None
        return {
            "http": self.proxy_url,
            "https": self.proxy_url,
        }

    @property
    def session(self) -> Session:
        """获取会话对象（单例）"""
        if self._session is None:
            self._session = Session(
                proxies=self.proxies,
                impersonate=self.config.impersonate,
                verify=self.config.verify_ssl,
                timeout=self.config.timeout
            )
        return self._session

    def request(
        self,
        method: str,
        url: str,
        **kwargs
    ) -> Response:
        """
        发送 HTTP 请求

        Args:
            method: HTTP 方法 (GET, POST, PUT, DELETE, etc.)
            url: 请求 URL
            **kwargs: 其他请求参数

        Returns:
            Response 对象

        Raises:
            HTTPClientError: 请求失败
        """
        # 设置默认参数
        kwargs.setdefault("timeout", self.config.timeout)
        kwargs.setdefault("allow_redirects", self.config.follow_redirects)

        # 添加代理配置
        if self.proxies and "proxies" not in kwargs:
            kwargs["proxies"] = self.proxies

        last_exception = None
        for attempt in range(self.config.max_retries):
            try:
                response = self.session.request(method, url, **kwargs)

                # 检查响应状态码
                if response.status_code >= 400:
                    logger.warning(
                        f"HTTP {response.status_code} for {method} {url}"
                        f" (attempt {attempt + 1}/{self.config.max_retries})"
                    )

                    # 如果是服务器错误，重试
                    if response.status_code >= 500 and attempt < self.config.max_retries - 1:
                        time.sleep(self.config.retry_delay * (attempt + 1))
                        continue

                return response

            except (cffi_requests.RequestsError, ConnectionError, TimeoutError) as e:
                last_exception = e
                logger.warning(
                    f"请求失败: {method} {url} (attempt {attempt + 1}/{self.config.max_retries}): {e}"
                )

                if attempt < self.config.max_retries - 1:
                    time.sleep(self.config.retry_delay * (attempt + 1))
                else:
                    break

        raise HTTPClientError(
            f"请求失败，最大重试次数已达: {method} {url} - {last_exception}"
        )

    def get(self, url: str, **kwargs) -> Response:
        """发送 GET 请求"""
        return self.request("GET", url, **kwargs)

    def post(self, url: str, data: Any = None, json: Any = None, **kwargs) -> Response:
        """发送 POST 请求"""
        return self.request("POST", url, data=data, json=json, **kwargs)

    def put(self, url: str, data: Any = None, json: Any = None, **kwargs) -> Response:
        """发送 PUT 请求"""
        return self.request("PUT", url, data=data, json=json, **kwargs)

    def delete(self, url: str, **kwargs) -> Response:
        """发送 DELETE 请求"""
        return self.request("DELETE", url, **kwargs)

    def head(self, url: str, **kwargs) -> Response:
        """发送 HEAD 请求"""
        return self.request("HEAD", url, **kwargs)

    def options(self, url: str, **kwargs) -> Response:
        """发送 OPTIONS 请求"""
        return self.request("OPTIONS", url, **kwargs)

    def patch(self, url: str, data: Any = None, json: Any = None, **kwargs) -> Response:
        """发送 PATCH 请求"""
        return self.request("PATCH", url, data=data, json=json, **kwargs)

    def download_file(self, url: str, filepath: str, chunk_size: int = 8192) -> None:
        """
        下载文件

        Args:
            url: 文件 URL
            filepath: 保存路径
            chunk_size: 块大小

        Raises:
            HTTPClientError: 下载失败
        """
        try:
            response = self.get(url, stream=True)
            response.raise_for_status()

            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=chunk_size):
                    if chunk:
                        f.write(chunk)

        except Exception as e:
            raise HTTPClientError(f"下载文件失败: {url} - {e}")

    def check_proxy(self, test_url: str = "https://httpbin.org/ip") -> bool:
        """
        检查代理是否可用

        Args:
            test_url: 测试 URL

        Returns:
            bool: 代理是否可用
        """
        if not self.proxy_url:
            return False

        try:
            response = self.get(test_url, timeout=10)
            return response.status_code == 200
        except Exception:
            return False

    def close(self):
        """关闭会话"""
        if self._session:
            self._session.close()
            self._session = None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


class OpenAIHTTPClient(HTTPClient):
    """
    OpenAI 专用 HTTP 客户端
    包含 OpenAI API 特定的请求方法
    """

    def __init__(
        self,
        proxy_url: Optional[str] = None,
        config: Optional[RequestConfig] = None
    ):
        """
        初始化 OpenAI HTTP 客户端

        Args:
            proxy_url: 代理 URL
            config: 请求配置
        """
        # 随机指纹（在 super().__init__ 之前生成，供 config.impersonate 使用）
        self._fp = _random_chrome_profile()

        if config is None:
            config = RequestConfig()
            config.impersonate = self._fp["impersonate"]
        super().__init__(proxy_url, config)

        # OpenAI 特定的默认配置
        self.config.timeout = 30
        self.config.max_retries = 3
        self.config.impersonate = self._fp["impersonate"]

        # 默认请求头（随机指纹）
        self.default_headers = {
            "User-Agent": self._fp["ua"],
            "Accept": "application/json",
            "Accept-Language": self._fp["accept_language"],
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "sec-ch-ua": self._fp["sec_ch_ua"],
            "sec-ch-ua-mobile": self._fp["sec_ch_ua_mobile"],
            "sec-ch-ua-platform": self._fp["sec_ch_ua_platform"],
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-site",
        }

    @property
    def fingerprint(self) -> Dict[str, str]:
        """返回当前会话的浏览器指纹"""
        return self._fp

    def check_ip_location(self) -> Tuple[bool, Optional[str]]:
        """
        检查 IP 地理位置

        Returns:
            Tuple[是否支持, 位置信息]
        """
        try:
            response = self.get("https://cloudflare.com/cdn-cgi/trace", timeout=10)
            trace_text = response.text

            # 解析位置信息
            import re
            loc_match = re.search(r"loc=([A-Z]+)", trace_text)
            loc = loc_match.group(1) if loc_match else None

            # 检查是否支持
            if loc in ["CN", "HK", "MO"]:
                return False, loc
            return True, loc

        except Exception as e:
            logger.error(f"检查 IP 地理位置失败: {e}")
            return False, None

    def send_openai_request(
        self,
        endpoint: str,
        method: str = "POST",
        data: Optional[Dict[str, Any]] = None,
        json_data: Optional[Dict[str, Any]] = None,
        headers: Optional[Dict[str, str]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        发送 OpenAI API 请求

        Args:
            endpoint: API 端点
            method: HTTP 方法
            data: 表单数据
            json_data: JSON 数据
            headers: 请求头
            **kwargs: 其他参数

        Returns:
            响应 JSON 数据

        Raises:
            HTTPClientError: 请求失败
        """
        # 合并请求头
        request_headers = self.default_headers.copy()
        if headers:
            request_headers.update(headers)

        # 设置 Content-Type
        if json_data is not None and "Content-Type" not in request_headers:
            request_headers["Content-Type"] = "application/json"
        elif data is not None and "Content-Type" not in request_headers:
            request_headers["Content-Type"] = "application/x-www-form-urlencoded"

        try:
            response = self.request(
                method,
                endpoint,
                data=data,
                json=json_data,
                headers=request_headers,
                **kwargs
            )

            # 检查响应状态码
            response.raise_for_status()

            # 尝试解析 JSON
            try:
                return response.json()
            except json.JSONDecodeError:
                return {"raw_response": response.text}

        except cffi_requests.RequestsError as e:
            raise HTTPClientError(f"OpenAI 请求失败: {endpoint} - {e}")

    def check_sentinel(self, did: str, proxies: Optional[Dict] = None) -> Optional[str]:
        """
        检查 Sentinel 拦截

        Args:
            did: Device ID
            proxies: 代理配置

        Returns:
            Sentinel token 或 None
        """
        from ..config.constants import OPENAI_API_ENDPOINTS

        try:
            sen_req_body = f'{{"p":"","id":"{did}","flow":"authorize_continue"}}'

            response = self.post(
                OPENAI_API_ENDPOINTS["sentinel"],
                headers={
                    "origin": "https://sentinel.openai.com",
                    "referer": "https://sentinel.openai.com/backend-api/sentinel/frame.html?sv=20260219f9f6",
                    "content-type": "text/plain;charset=UTF-8",
                },
                data=sen_req_body,
            )

            if response.status_code == 200:
                return response.json().get("token")
            else:
                logger.warning(f"Sentinel 检查失败: {response.status_code}")
                return None

        except Exception as e:
            logger.error(f"Sentinel 检查异常: {e}")
            return None


def create_http_client(
    proxy_url: Optional[str] = None,
    config: Optional[RequestConfig] = None
) -> HTTPClient:
    """
    创建 HTTP 客户端工厂函数

    Args:
        proxy_url: 代理 URL
        config: 请求配置

    Returns:
        HTTPClient 实例
    """
    return HTTPClient(proxy_url, config)


def create_openai_client(
    proxy_url: Optional[str] = None,
    config: Optional[RequestConfig] = None
) -> OpenAIHTTPClient:
    """
    创建 OpenAI HTTP 客户端工厂函数

    Args:
        proxy_url: 代理 URL
        config: 请求配置

    Returns:
        OpenAIHTTPClient 实例
    """
    return OpenAIHTTPClient(proxy_url, config)