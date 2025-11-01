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

    def test_long_file_names_should_short_to_12_chars_entity_churn(self):
        with patch("pathlib.Path.exists", return_value=True):
            mock_df = pd.DataFrame(
                {
                    "entity": ["src/components/my-file.tsx", "file2.txt", "file3.txt"],
                    "commits": [1, 2, 3],
                    "added": [10, 11, 12],
                    "deleted": [2, 3, 4],
                }
            )

            with patch("pandas.read_csv", return_value=mock_df):
                repository = CodemaatRepository(
                    configuration=InMemoryConfiguration(store_data=".")
                )
                df = repository.get_entity_churn()

                assert "/my-file.tsx" == df.iloc[0]["short_entity"]
                assert "file2.txt" == df.iloc[1]["short_entity"]
                assert "file3.txt" == df.iloc[2]["short_entity"]

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

    def test_return_empty_list_when_no_authors_are_found(self):
        with patch("pathlib.Path.exists", return_value=True):
            mock_df = pd.DataFrame()

            with patch("pandas.read_csv", return_value=mock_df):
                repository = CodemaatRepository(
                    configuration=InMemoryConfiguration(store_data=".")
                )

                df = repository.get_entity_ownership_unique_authors()

                assert [] == df

    def test_return_unique_authors(self):
        with patch("pathlib.Path.exists", return_value=True):
            mock_df = pd.DataFrame(
                {
                    "entity": ["file.txt", "file2.txt", "file3.txt"],
                    "author": ["Author1", "Author1", "Author2"],
                }
            )

            with patch("pandas.read_csv", return_value=mock_df):
                repository = CodemaatRepository(
                    configuration=InMemoryConfiguration(store_data=".")
                )

                df = repository.get_entity_ownership_unique_authors()

                assert ["Author1", "Author2"] == df

    def test_should_filter_entity_effort_by_author(self):
        with patch("pathlib.Path.exists", return_value=True):
            mock_df = pd.DataFrame(
                {
                    "entity": ["file.txt", "file2.txt", "file3.txt"],
                    "author": ["Author1", "Author1", "Author2"],
                }
            )

            with patch("pandas.read_csv", return_value=mock_df):
                repository = CodemaatRepository(
                    configuration=InMemoryConfiguration(store_data=".")
                )

                df = repository.get_entity_ownership(["Author2"])

                assert 1 == len(df)

    def test_long_file_names_should_short_to_12_chars_entity_ownership(self):
        with patch("pathlib.Path.exists", return_value=True):
            mock_df = pd.DataFrame(
                {
                    "entity": ["src/components/my-file.tsx", "file2.txt", "file3.txt"],
                    "author": ["Author1", "Author1", "Author2"],
                    "added": [10, 11, 12],
                    "deleted": [2, 3, 4],
                }
            )

            with patch("pandas.read_csv", return_value=mock_df):
                repository = CodemaatRepository(
                    configuration=InMemoryConfiguration(store_data=".")
                )
                df = repository.get_entity_ownership()

                assert "/my-file.tsx" == df.iloc[0]["short_entity"]
                assert "file2.txt" == df.iloc[1]["short_entity"]
                assert "file3.txt" == df.iloc[2]["short_entity"]

    def test_should_return_all_items_when_empty_authors_is_given(self):
        with patch("pathlib.Path.exists", return_value=True):
            mock_df = pd.DataFrame(
                {
                    "entity": ["file.txt", "file2.txt", "file3.txt"],
                    "author": ["Author1", "Author1", "Author2"],
                }
            )

            with patch("pandas.read_csv", return_value=mock_df):
                repository = CodemaatRepository(
                    configuration=InMemoryConfiguration(store_data=".")
                )

                df = repository.get_entity_ownership([])

                assert 3 == len(df)

    def test_should_filter_by_include_only_in_code_coupling(self):
        with patch("pathlib.Path.exists", return_value=True):
            mock_df = pd.DataFrame(
                {
                    "entity": [
                        "src/components/my-file.tsx",
                        "application/components/my-file.tsx",
                    ],
                    "coupled": ["file2.txt", "file3.txt"],
                    "degree": [10, 2],
                    "average-revs": [2, 2],
                }
            )

            with patch("pandas.read_csv", return_value=mock_df):
                repository = CodemaatRepository(
                    configuration=InMemoryConfiguration(store_data=".")
                )
                df = repository.get_coupling(filters={"include_only": "src/**/*"})

                assert 1 == len(df)
