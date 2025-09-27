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
