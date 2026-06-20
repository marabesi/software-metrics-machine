export class RawFiltersParser {
  parse(rawFilters?: string): Record<string, string> {
    if (!rawFilters) {
      return {};
    }

    return this.splitEntries(rawFilters).reduce<Record<string, string>>((filters, entry) => {
      const trimmedEntry = entry.trim();
      if (!trimmedEntry) {
        return filters;
      }

      const separatorIndex = trimmedEntry.indexOf('=');
      if (separatorIndex <= 0) {
        return filters;
      }

      const key = trimmedEntry.slice(0, separatorIndex).trim();
      const value = trimmedEntry.slice(separatorIndex + 1).trim();
      if (!key || !value) {
        return filters;
      }

      filters[key] = value;
      return filters;
    }, {});
  }

  private splitEntries(rawFilters: string): string[] {
    if (rawFilters.includes('|')) {
      return rawFilters.split('|');
    }

    return rawFilters.split(/,(?=[^,|=]+=)/);
  }
}
