import pytest
from subprocess import CompletedProcess, CalledProcessError
from unittest.mock import patch
from software_metrics_machine.providers.codemaat.fetch import FetchCodemaat
from tests.in_memory_configuration import InMemoryConfiguration


class TestFetchCodemaat:

    @pytest.fixture(scope="class", autouse=True)
    def reset_mock_run(self):
        with patch("software_metrics_machine.core.infrastructure.run") as mock_run:
            mock_run.reset_mock()
            yield mock_run

    def __mock_run_command_return_success(self):
        return CompletedProcess(
            args="", returncode=0, stdout="total 0 .\nexample\n", stderr=""
        )

    def test_invoke_codemaat(self, tmp_path):
        path_string = str(tmp_path)
        configuration = InMemoryConfiguration(store_data=path_string)

        with patch(
            "software_metrics_machine.core.infrastructure.run.Run.run_command"
        ) as mock_run:
            mock_run.return_value = self.__mock_run_command_return_success()

            start_date = "2023-01-01"
            end_date = "2023-12-31"
            FetchCodemaat(configuration=configuration).execute_codemaat(
                start_date=start_date, end_date=end_date, subfolder="", force=False
            )

            mock_run.assert_called_once()

    def test_invoke_codemaat_force(self, tmp_path, cli):
        path_string = str(tmp_path)
        configuration = InMemoryConfiguration(store_data=path_string)

        with patch(
            "software_metrics_machine.core.infrastructure.run.Run.run_command"
        ) as mock_run:
            mock_run.return_value = self.__mock_run_command_return_success()

            start_date = "2023-01-01"
            end_date = "2023-12-31"
            subfolder = ""

            FetchCodemaat(configuration=configuration).execute_codemaat(
                start_date=start_date,
                end_date=end_date,
                subfolder=subfolder,
                force=False,
            )

            run_command = mock_run.call_args[0][0]
            assert run_command == [
                "sh",
                "src/software_metrics_machine/providers/codemaat/fetch-codemaat.sh",
                configuration.git_repository_location,
                f"{cli.data_stored_at}_github_fake_repo",
                start_date,
                subfolder,
                "false",
            ]

    def test_invoke_codemaat_with_force(self, tmp_path, cli):
        path_string = str(tmp_path)
        configuration = InMemoryConfiguration(store_data=path_string)
        with patch(
            "software_metrics_machine.core.infrastructure.run.Run.run_command"
        ) as mock_run:
            mock_run.return_value = self.__mock_run_command_return_success()

            start_date = "2023-01-01"
            end_date = "2023-12-31"
            subfolder = ""

            FetchCodemaat(configuration=configuration).execute_codemaat(
                start_date=start_date,
                end_date=end_date,
                subfolder=subfolder,
                force=True,
            )

            run_command = mock_run.call_args[0][0]
            assert run_command == [
                "sh",
                "src/software_metrics_machine/providers/codemaat/fetch-codemaat.sh",
                configuration.git_repository_location,
                f"{cli.data_stored_at}_github_fake_repo",
                start_date,
                subfolder,
                "true",
            ]

    def test_invoke_codemaat_with_subfolder(self, tmp_path, cli):
        path_string = str(tmp_path)
        configuration = InMemoryConfiguration(store_data=path_string)

        with patch(
            "software_metrics_machine.core.infrastructure.run.Run.run_command"
        ) as mock_run:
            mock_run.return_value = self.__mock_run_command_return_success()

            start_date = "2023-01-01"
            end_date = "2023-12-31"
            subfolder = "src/apps"

            FetchCodemaat(configuration=configuration).execute_codemaat(
                start_date=start_date,
                end_date=end_date,
                subfolder=subfolder,
                force=True,
            )

            run_command = mock_run.call_args[0][0]
            assert run_command == [
                "sh",
                "src/software_metrics_machine/providers/codemaat/fetch-codemaat.sh",
                configuration.git_repository_location,
                f"{cli.data_stored_at}_github_fake_repo",
                start_date,
                subfolder,
                "true",
            ]

    def test_handles_stout_when_invoked_successfully(self, tmp_path):
        path_string = str(tmp_path)
        configuration = InMemoryConfiguration(store_data=path_string)

        with patch(
            "software_metrics_machine.core.infrastructure.run.Run.run_command"
        ) as mock_run:
            mock_run.return_value = self.__mock_run_command_return_success()

            start_date = "2023-01-01"
            end_date = "2023-12-31"
            subfolder = "src/apps"

            output = FetchCodemaat(configuration=configuration).execute_codemaat(
                start_date=start_date,
                end_date=end_date,
                subfolder=subfolder,
                force=True,
            )

            assert "total 0" in output.stdout

    def test_handles_error_when_command_fails(self, tmp_path):
        path_string = str(tmp_path)
        configuration = InMemoryConfiguration(store_data=path_string)

        with patch(
            "software_metrics_machine.core.infrastructure.run.Run.run_command"
        ) as mock_run:
            mock_run.side_effect = CalledProcessError(
                returncode=1,
                cmd="mocked command",
                output="",
                stderr="an error happened",
            )

            start_date = "2023-01-01"
            end_date = "2023-12-31"
            subfolder = "src/apps"

            with pytest.raises(CalledProcessError) as exc_info:
                result = FetchCodemaat(configuration=configuration).execute_codemaat(
                    start_date=start_date,
                    end_date=end_date,
                    subfolder=subfolder,
                    force=True,
                )
                assert exc_info.value.returncode == 1
                assert "an error happened" in result.stderr
