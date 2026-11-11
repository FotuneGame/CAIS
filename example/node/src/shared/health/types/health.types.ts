export interface Connection {
  name: string;
  enabled: boolean;
  ping(): Promise<unknown>;
}
