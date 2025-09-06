import pandas as pd

from infrastructure.base_repository import BaseRepository
from infrastructure.configuration import Configuration


class CodemaatRepository(BaseRepository):
    def __init__(self):
        self.configuration = Configuration()
        super().__init__(configuration=self.configuration)

    def get_code_churn(self):
        df = pd.read_csv(f"{self.configuration.store_data}/abs-churn.csv")
        return df

    def get_coupling(self):
        df = pd.read_csv(f"{self.configuration.store_data}/coupling.csv")
        return df

    def get_entity_churn(self):
        df = pd.read_csv(f"{self.configuration.store_data}/entity-churn.csv")
        return df

    def get_entity_effort(self):
        df = pd.read_csv(f"{self.configuration.store_data}/entity-effort.csv")
        return df

    def get_entity_ownership(self):
        df = pd.read_csv("data/entity-ownership.csv")
        return df
