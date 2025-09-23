from matplotlib.figure import Figure
import matplotlib.pyplot as plt
import networkx as nx

from infrastructure.base_viewer import MatplotViewer
from infrastructure.viewable import Viewable
from providers.codemaat.codemaat_repository import CodemaatRepository


class CouplingViewer(MatplotViewer, Viewable):
    def render(
        self, repo: CodemaatRepository, out_file: str | None = None, top_n: int = 2
    ) -> Figure:
        df = repo.get_coupling()

        # Sort by degree and select top N items
        top_df = df.nlargest(top_n, "degree")

        G = nx.Graph()

        # Add edges weighted by degree
        for _, row in top_df.iterrows():
            if row["degree"] > 0.5:  # filter to highlight stronger couplings
                G.add_edge(row["entity"], row["coupled"], weight=row["degree"])

        fig = plt.figure(figsize=super().get_fig_size())
        pos = nx.spring_layout(G, k=0.5, iterations=50)

        # Get edge weights
        edges = G.edges(data=True)
        weights = [edge[2]["weight"] for edge in edges]

        # Normalize weights for colormap
        norm = plt.Normalize(min(weights), max(weights))
        cmap = plt.cm.viridis
        edge_colors = [cmap(norm(w)) for w in weights]

        nx.draw(
            G,
            pos,
            with_labels=True,
            node_size=500,
            font_size=8,
            edge_color=edge_colors,
            width=2,
        )
        plt.title(f"Top {top_n} Code Coupling Network (Edge Color by Weight)")

        return super().output(plt, fig, out_file=out_file)
