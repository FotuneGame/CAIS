export type ExecError = {
  code?: number;
  stdout?: string;
  stderr?: string;
  message: string;
};
