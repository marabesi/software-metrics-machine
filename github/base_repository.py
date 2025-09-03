
class BaseRepository:

  def __init__(self):
    self.default_dir = "data"

  def default_path_for(self, filename: str) -> str:
    return "{}/{}".format(self.default_dir, filename)