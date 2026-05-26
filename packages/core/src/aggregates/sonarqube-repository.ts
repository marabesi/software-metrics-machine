import { IRepository } from '../infrastructure';

export class SonarqubeRepository {
  constructor(
    private measurementRepository: IRepository<any>,
    private componentTreeRepository: IRepository<any>
  ) {}

  save(item: any): Promise<void> {
    throw new Error('Method not implemented.');
  }
  saveAll(items: any[]): Promise<void> {
    throw new Error('Method not implemented.');
  }
  load(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  async loadAll(): Promise<any[]> {
    const fromDisk = await this.measurementRepository.load();
    return fromDisk || [];
  }
  delete(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  exists(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async loadComponentTree(options?: any): Promise<any[]> {
    const fromDisk = await this.componentTreeRepository.load();
    return fromDisk || [];
  }
}
