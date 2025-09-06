import pandas as pd
import matplotlib.pyplot as plt

# Option to limit number of entities displayed
MAX_ENTITIES = 30  # Change this value as needed

# Read the CSV file
df = pd.read_csv("data/entity-effort.csv")

# Aggregate total effort per entity (using total-revs)
effort_per_entity = df.groupby("entity")["total-revs"].max().sort_values()

# Limit the number of entities displayed
if len(effort_per_entity) > MAX_ENTITIES:
    effort_per_entity = effort_per_entity[-MAX_ENTITIES:]

entities = effort_per_entity.index
efforts = effort_per_entity.values

fig, ax = plt.subplots(figsize=(10, max(6, len(entities) // 10)))
ax.barh(entities, efforts, color="tab:purple")
ax.set_xlabel("Total Effort (Revisions)")
ax.set_ylabel("Entity")
ax.set_title(f"Entity Effort (Top {MAX_ENTITIES} Entities by Total Revisions)")
plt.tight_layout()
plt.show()
