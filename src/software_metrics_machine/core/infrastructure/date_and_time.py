from datetime import datetime


def datetime_to_local(date: str, locale: str = "en_US.UTF-8") -> str:
    # try:
    #     pylocale.setlocale(pylocale.LC_TIME, locale)
    # except Exception as e:
    #     print(
    #         f"Warning: Could not set locale to '{locale}': {e}. Using default locale."
    #     )

    dt_utc = datetime.strptime(date, "%Y-%m-%dT%H:%M:%SZ")

    as_time = dt_utc.astimezone()

    return as_time.strftime("%d %b %Y, %H:%M")
