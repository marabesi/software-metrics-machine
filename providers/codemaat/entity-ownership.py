import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv("data/entity-ownership.csv")

ownership = df.groupby(["entity", "author"])[["added", "deleted"]].sum().reset_index()

MAX_ENTITIES = 10
ownership["total"] = ownership["added"] + ownership["deleted"]
top_entities = (
    ownership.groupby("entity")["total"]
    .sum()
    .sort_values(ascending=False)
    .head(MAX_ENTITIES)
    .index
)
ownership = ownership[ownership["entity"].isin(top_entities)]

pivot = ownership.pivot(index="entity", columns="author", values="added").fillna(0)
pivot_deleted = ownership.pivot(
    index="entity", columns="author", values="deleted"
).fillna(0)

fig, ax = plt.subplots(figsize=(12, 6))
bottom = None
for author in pivot.columns:
    ax.bar(pivot.index, pivot[author], label=f"{author} added", bottom=bottom)
    if bottom is None:
        bottom = pivot[author]
    else:
        bottom += pivot[author]

bottom_deleted = None
for author in pivot_deleted.columns:
    ax.bar(
        pivot_deleted.index,
        pivot_deleted[author],
        label=f"{author} deleted",
        bottom=bottom_deleted,
        alpha=0.5,
    )
    if bottom_deleted is None:
        bottom_deleted = pivot_deleted[author]
    else:
        bottom_deleted += pivot_deleted[author]

ax.set_xlabel("Entity")
ax.set_ylabel("Lines Changed")
ax.set_title("Entity Ownership: Lines Added and Deleted per Author")
plt.xticks(rotation=45, ha="right")
ax.legend(loc="upper right", bbox_to_anchor=(1.2, 1))
plt.tight_layout()
plt.show()
