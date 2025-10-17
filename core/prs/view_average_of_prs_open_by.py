import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime, date, timedelta

from core.infrastructure.base_viewer import MatplotViewer
from core.prs.prs_repository import LoadPrs


class ViewAverageOfPrsOpenBy(MatplotViewer):
    def __init__(self, repository: LoadPrs):
        self.repository = repository

    def main(
        self,
        out_file: str | None = None,
        author: str | None = None,
        authors: str | None = None,
        labels: str | None = None,
        aggregate_by: str = "week",
        start_date: str | None = None,
        end_date: str | None = None,
    ):
        prs = self.repository.all_prs

        prs = self.repository.prs_with_filters(
            {"start_date": start_date, "end_date": end_date, "authors": authors}
        )
        print(f"Filtered PRs count: {len(prs)}")

        if aggregate_by == "week":
            x_vals, y_vals = self.repository.average_by_week(
                author=author, labels=labels, prs=prs
            )
            # x_vals are ISO week strings like 'YYYY-Www' — convert to a datetime for the week's Monday
            week_dates = []
            for wk in x_vals:
                try:
                    # expect format YYYY-Www
                    parts = wk.split("-W")
                    year = int(parts[0])
                    week = int(parts[1])
                    # fromisocalendar(year, week, 1) -> Monday of that ISO week
                    wd = datetime.fromisocalendar(year, week, 1)
                    week_dates.append(wd)
                except Exception:
                    # fallback: try parsing as ISO date
                    try:
                        wd = datetime.fromisoformat(wk)
                        week_dates.append(wd)
                    except Exception:
                        # if unparsable, skip
                        continue

            title = "Average PR Open Days by Week"
            xlabel = "Week"
        else:
            x_vals, y_vals = self.repository.average_by_month(
                author=author, labels=labels, prs=prs
            )
            title = "Average PR Open Days by Month"
            xlabel = "Month"

        fig, ax = plt.subplots(figsize=super().get_fig_size())
        if aggregate_by == "week":
            # plot using datetime x values
            ax.plot(week_dates, y_vals, marker="o", color="tab:blue")
            for i, avg in enumerate(y_vals):
                if i < len(week_dates):
                    ax.annotate(
                        f"{avg:.1f}",
                        (week_dates[i], avg),
                        textcoords="offset points",
                        xytext=(0, 5),
                        ha="center",
                    )

            # draw month boundary lines and label months
            if week_dates:
                start = week_dates[0].date().replace(day=1)
                end_dt = week_dates[-1].date()

                # build list of month starts from start to end
                month_starts = []
                cur = start
                while cur <= end_dt:
                    month_starts.append(cur)
                    # advance one month
                    if cur.month == 12:
                        cur = date(cur.year + 1, 1, 1)
                    else:
                        cur = date(cur.year, cur.month + 1, 1)

                # plot vertical lines at each month start
                ylim = ax.get_ylim()
                for ms in month_starts:
                    ax.axvline(
                        datetime(ms.year, ms.month, ms.day),
                        color="#CCCCCC",
                        linestyle="--",
                        linewidth=0.7,
                    )

                # place month labels centered between month starts
                for i in range(len(month_starts)):
                    ms = month_starts[i]
                    if i + 1 < len(month_starts):
                        nxt = month_starts[i + 1]
                    else:
                        nxt = end_dt + timedelta(days=1)
                    mid = (
                        datetime.combine(ms, datetime.min.time())
                        + (
                            datetime.combine(nxt, datetime.min.time())
                            - datetime.combine(ms, datetime.min.time())
                        )
                        / 2
                    )
                    ax.text(
                        mid,
                        ylim[1] * 0.98,
                        ms.strftime("%b %Y"),
                        ha="center",
                        va="top",
                        fontsize=8,
                        bbox=dict(facecolor="white", alpha=0.7, edgecolor="none"),
                    )

            # use a date formatter for x axis
            ax.xaxis.set_major_locator(mdates.WeekdayLocator(byweekday=mdates.MO))
            ax.xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m-%d"))
            fig.autofmt_xdate()

        else:
            ax.plot(x_vals, y_vals, marker="o", color="tab:blue")
            for i, avg in enumerate(y_vals):
                ax.annotate(
                    f"{avg:.1f}",
                    (x_vals[i], avg),
                    textcoords="offset points",
                    xytext=(0, 5),
                    ha="center",
                )
        ax.set_title(title)
        ax.set_xlabel(xlabel)
        ax.set_ylabel("Average Days Open")
        plt.xticks(rotation=45)
        fig.tight_layout()

        return super().output(plt, fig, out_file, repository=self.repository)
