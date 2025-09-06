import pandas as pd

from infrastructure.base_repository import BaseRepository
from infrastructure.configuration import Configuration


class CodemaatRepository(BaseRepository):
    def __init__(self):
        self.configuration = Configuration()
        super().__init__(configuration=self.configuration)

    def get_code_churn(self):
        # Read the CSV file
        df = pd.read_csv(f"{self.configuration.store_data}/abs-churn.csv")
        return df