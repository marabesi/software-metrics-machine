from unittest.mock import patch
import pandas as pd
from providers.codemaat.codemaat_repository import CodemaatRepository
from tests.in_memory_configuration import InMemoryConfiguration


class TestCodemaatRepository:

    def test_get_code_churn_empty(self):
        repository = CodemaatRepository(
            configuration=InMemoryConfiguration(store_data=".")
        )
        result = repository.get_code_churn()
        assert result.empty

    def test_get_coupling_empty(self):
        repository = CodemaatRepository(
            configuration=InMemoryConfiguration(store_data=".")
        )
        result = repository.get_coupling()
        assert result.empty

    def test_get_entity_churn_empty(self):
        repository = CodemaatRepository(
            configuration=InMemoryConfiguration(store_data=".")
        )
        result = repository.get_entity_churn()
        assert result.empty

    def test_get_entity_effort_empty(self):
        repository = CodemaatRepository(
            configuration=InMemoryConfiguration(store_data=".")
        )
        result = repository.get_entity_effort()
        assert result.empty

    def test_get_entity_ownership_empty(self):
        repository = CodemaatRepository(
            configuration=InMemoryConfiguration(store_data=".")
        )
        result = repository.get_entity_ownership()
        assert result.empty

    def test_filter_code_churn_by_date(self):
        with patch("pathlib.Path.exists", return_value=True):
            mock_df = pd.DataFrame(
                {"date": ["2023-05-15"], "added": [10], "deleted": [2]}
            )

            with patch("pandas.read_csv", return_value=mock_df):
                repository = CodemaatRepository(
                    configuration=InMemoryConfiguration(store_data=".")
                )
                df = repository.get_code_churn(
                    {"start_date": "2023-01-01", "end_date": "2023-01-10"}
                )

                assert 0 == len(df["date"])

    def test_filter_code_churn_between_dates(self):
        with patch("pathlib.Path.exists", return_value=True):
            mock_df = pd.DataFrame(
                {
                    "date": ["2023-05-15", "2023-05-16", "2023-05-17", "2023-05-18"],
                    "added": [10, 11, 12, 13],
                    "deleted": [2, 3, 4, 5],
                }
            )

            with patch("pandas.read_csv", return_value=mock_df):
                repository = CodemaatRepository(
                    configuration=InMemoryConfiguration(store_data=".")
                )
                df = repository.get_code_churn(
                    {"start_date": "2023-05-16", "end_date": "2023-05-17"}
                )

                assert 2 == len(df["date"])

    def test_filter_code_churn_exact_dates(self):
        with patch("pathlib.Path.exists", return_value=True):
            mock_df = pd.DataFrame(
                {"date": ["2023-05-22"], "added": [10], "deleted": [2]}
            )

            with patch("pandas.read_csv", return_value=mock_df):
                repository = CodemaatRepository(
                    configuration=InMemoryConfiguration(store_data=".")
                )
                df = repository.get_code_churn(
                    {"start_date": "2023-05-22", "end_date": "2023-05-22"}
                )

                assert 1 == len(df["date"])
