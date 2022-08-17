export interface Join {
  target: string;
  alias?: string;
  on?: string;
  type?: string = 'leftJoin';
}

export interface ExecutableJoin {
  type?: string = 'leftJoin';
  alias: string;
  referencedTable: string;
  referencedColumn: string;
  rootColumn: string;
  rootTable: string;
  on?: Record<string, string>;
  orderBy?: Record<string, Direction>;
}

type Direction = 'asc' | 'ASC' | 'desc' | 'DESC';
