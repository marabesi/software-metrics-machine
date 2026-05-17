export interface EntityChurnData {
  entity: string;
  added: number;
  deleted: number;
  commits: number;
}

export interface CouplingData {
  entity: string;
  coupled: string;
  degree: number;
}

export interface EntityEffortData {
  entity: string;
  'total-revs': number;
}

export interface CodeChurnData {
  date: string;
  type: string;
  value: number;
}

export interface EntityOwnershipData {
  entity: string;
  author: string;
  added: number;
  deleted: number;
}
