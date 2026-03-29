import * as fs from 'fs/promises';
import { dirname } from 'path';

/**
 * Generic repository interface for file system operations
 */
export interface IRepository<T> {
  /**
   * Save item to file system
   */
  save(item: T): Promise<void>;

  /**
   * Save multiple items to file system
   */
  saveAll(items: T[]): Promise<void>;

  /**
   * Load item from file system
   */
  load(): Promise<T | null>;

  /**
   * Load multiple items from file system
   */
  loadAll(): Promise<T[]>;

  /**
   * Delete item from file system
   */
  delete(): Promise<void>;

  /**
   * Check if item exists
   */
  exists(): Promise<boolean>;
}

/**
 * Base repository class for file system operations
 */
export class FileSystemRepository<T> implements IRepository<T> {
  protected filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  deserialize(data: string): T {
    return JSON.parse(data) as T;
  }

  serialize(item: T): string {
    return JSON.stringify(item, null, 2);
  }

  async save(item: T): Promise<void> {
    const data = this.serialize(item);
    await this.ensureDirectoryExists();
    await fs.writeFile(this.filePath, data, 'utf-8');
  }

  async saveAll(items: T[]): Promise<void> {
    const data = JSON.stringify(items.map(item => this.serialize(item)), null, 2);
    await this.ensureDirectoryExists();
    await fs.writeFile(this.filePath, data, 'utf-8');
  }

  async load(): Promise<T | null> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      return this.deserialize(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async loadAll(): Promise<T[]> {
    try {
      const data = await fs.readFile(this.filePath, 'utf-8');
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) 
        ? parsed.map((item: string) => this.deserialize(item))
        : [this.deserialize(data)];
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async delete(): Promise<void> {
    try {
      await fs.unlink(this.filePath);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async exists(): Promise<boolean> {
    try {
      await fs.access(this.filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async ensureDirectoryExists(): Promise<void> {
    const dir = dirname(this.filePath);
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }
}
