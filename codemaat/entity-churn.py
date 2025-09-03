import pandas as pd
import matplotlib.pyplot as plt

# Read the CSV file
df = pd.read_csv('data/entity-churn.csv')

# Prepare data for stacked bar chart
dates = df['entity']
added = df['added']
deleted = df['deleted']

fig, ax = plt.subplots(figsize=(12, 6))
ax.bar(dates, added, label='Added', color='tab:blue')
ax.bar(dates, deleted, bottom=added, label='Deleted', color='tab:red')

ax.set_xlabel('Date')
ax.set_ylabel('Lines of Code')
ax.set_title('Code Churn: Lines Added and Deleted per Date')
ax.legend()
plt.xticks(rotation=45, ha='right')
plt.tight_layout()
plt.show()
