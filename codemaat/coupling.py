import networkx as nx
import matplotlib.pyplot as plt

G = nx.Graph()

import networkx as nx
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

df = pd.read_csv("data/coupling.csv")

# Get top 50 entities by sum of degree
top_entities = (df.groupby('entity')['degree'].sum().sort_values(ascending=False).head(50).index)
df_top = df[df['entity'].isin(top_entities) & df['coupled'].isin(top_entities)]

G = nx.Graph()

# Add edges weighted by degree
for _, row in df.iterrows():
    if row["degree"] > 0.5:  # filter to highlight stronger couplings
        G.add_edge(row["entity"], row["coupled"], weight=row["degree"])

plt.figure(figsize=(10,8))
pos = nx.spring_layout(G, k=0.5, iterations=50)

# Get edge weights
edges = G.edges(data=True)
weights = [edge[2]['weight'] for edge in edges]

# Normalize weights for colormap
norm = plt.Normalize(min(weights), max(weights))
cmap = plt.cm.viridis
edge_colors = [cmap(norm(w)) for w in weights]

nx.draw(G, pos, with_labels=True, node_size=500, font_size=8, edge_color=edge_colors, width=2)
plt.title("Code Coupling Network (Edge Color by Weight)")
plt.show()
nx.draw(G, pos, with_labels=True, node_size=500, font_size=8, edge_color=edge_colors, width=2)