from abc import ABC, abstractmethod


class Viewable(ABC):

    @abstractmethod
    def render(self):
        pass
