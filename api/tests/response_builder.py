from requests import Response
from typing import Any
from tests.builders import as_json_string


def build_http_successfull_response(body: Any) -> Response:
    response = Response()
    response._content = bytes(as_json_string(body), "utf-8")
    response.status_code = 200
    return response
