import panel as pn
import param


class Settings(param.Parameterized):
    """Central settings object that mirrors user inputs and is synced to the URL.

    Each attribute is stored as a simple serializable type (str/int) so it can
    be persisted in the query string. Complex widget values are converted to
    and from these serializable representations in the watcher callbacks.
    """

    # UI state
    tab = param.Integer(default=0)
    focused = param.Integer(default=0)

    # Date range (ISO strings)
    start = param.String(default="")
    end = param.String(default="")

    # Pipeline selectors
    pipeline = param.String(default="")
    job = param.String(default="")
    conclusion = param.String(default="")

    # PR / author / label filters (comma-separated)
    authors_prs = param.String(default="")
    labels = param.String(default="")

    # Source code filters
    ignore = param.String(default="")
    authors_source_code = param.String(default="")
    pre_selected = param.String(default="")
    top_entries = param.String(default="10")


class FilterState:

    def __init__(self):
        self.settings = self.__read_initial_query_params()

    def __read_initial_query_params(self) -> Settings:
        qp = pn.state.location.query_params or {}
        s = Settings()

        # helper to pick a scalar value if list provided
        def _pick(key):
            v = qp.get(key)
            if isinstance(v, (list, tuple)) and v:
                return v[0]
            return v

        for key in [
            "tab",
            # "focused",
            # "start",
            # "end",
            # "workflow",
            # "job",
            # "conclusion",
            # "authors",
            # "labels",
            # "ignore",
            # "author_src",
            # "pre_selected",
            # "top_entries_setting",
        ]:
            if hasattr(s, key):
                value = _pick(key)
                if value is not None:
                    setattr(s, key, value)
        return s

    def update_settings(self, key: str, value) -> Settings:
        settings = self.settings
        if hasattr(settings, key):
            setattr(settings, key, value)

        self.__sync(settings)

        return settings

    def __sync(self, settings: Settings):
        pn.state.location.sync(settings)

    def get_settings(self) -> Settings:
        return self.settings
