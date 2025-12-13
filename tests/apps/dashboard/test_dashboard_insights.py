class TestDashboardInsights:

    def test_plot_insights(self, page):
        url = "http://localhost:5006"
        page.goto(url)
        page.get_by_text("Insight section").wait_for()
