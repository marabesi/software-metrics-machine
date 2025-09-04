from configuration import Configuration

class BaseRepository:

  def __init__(self, configuration: Configuration):
    self.default_dir = configuration.store_data

  def default_path_for(self, filename: str) -> str:
    return "{}/{}".format(self.default_dir, filename)