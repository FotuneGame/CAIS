import { Injectable } from '@nestjs/common';
import { FilesService } from '../files/files.service';
import { Action, Tools } from '../agent/types/agent.types';
import { Axiom, Context } from './types/ontology.types';

@Injectable()
export class OntologyService {
  private readonly axioms: Axiom[] = [
    ['шаг — объект', (a) => typeof a === 'object' && a !== null],
    [
      'есть либо tool, либо answer',
      (a) => (a.tool === undefined) !== (a.answer === undefined),
    ],
    [
      'tool есть в реестре',
      (a, { tools }) => a.tool === undefined || this.known(tools, a.tool),
    ],
    [
      'у tool заданы все аргументы',
      (a, { tools }) =>
        !this.known(tools, a.tool) ||
        tools[a.tool!].args.every((name) => a.args?.[name] !== undefined),
    ],
    [
      'path внутри песочницы',
      (a, { root }) =>
        a.args?.path === undefined || this.inside(root, a.args.path),
    ],
  ];

  constructor(private readonly filesService: FilesService) {}

  validate(action: Action, context: Context) {
    return this.axioms
      .filter(([, check]) => !check(action ?? {}, context))
      .map(([name]) => name);
  }

  private known(tools: Tools, name?: string) {
    return name !== undefined && Object.hasOwn(tools, name);
  }

  private inside(root: string, path: string) {
    try {
      return Boolean(this.filesService.inside(root, path));
    } catch {
      return false;
    }
  }
}
