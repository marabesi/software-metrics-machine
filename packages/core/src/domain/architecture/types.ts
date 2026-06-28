export type ArchitectureNodeKind = 'person' | 'system' | 'container' | 'component' | 'code';

export type ArchitectureNode = {
  id: string;
  kind: ArchitectureNodeKind;
  name: string;
  technology?: string;
  description?: string;
  tags?: string[];
};

export type ArchitectureRelationship = {
  id: string;
  source: string;
  target: string;
  kind: 'uses';
  description?: string;
  confidence: number;
  evidence?: {
    files?: string[];
    symbols?: string[];
  };
};

export type ArchitectureViewLevel = 'context' | 'container' | 'component' | 'code';

export type ArchitectureView = {
  id: string;
  level: ArchitectureViewLevel;
  title: string;
  nodes: ArchitectureNode[];
  edges: ArchitectureRelationship[];
};

export type ArchitectureSnapshot = {
  snapshotId: string;
  generatedAt: string;
  project: string;
  branch?: string;
  commitCount: number;
  views: ArchitectureView[];
};

export type ArchitectureSnapshotHeader = {
  snapshotId: string;
  generatedAt: string;
  project: string;
  branch?: string;
  commitCount: number;
  availableViews: ArchitectureViewLevel[];
};

export type GenerateArchitectureOptions = {
  startDate?: string;
  endDate?: string;
  refreshGit?: boolean;
  maxBuffer?: number;
};
