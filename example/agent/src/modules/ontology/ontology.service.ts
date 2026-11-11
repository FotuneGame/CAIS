import { Injectable } from '@nestjs/common';
import { ToolsService } from '../tools/tools.service';
import { Action } from '../agent/types/agent.types';
import { Axiom } from './types/ontology.types';

@Injectable()
export class OntologyService {
  private readonly axioms: Axiom[] = [
    ['действие — объект', (a) => typeof a === 'object' && a !== null],
    [
      'есть либо tool, либо answer',
      (a) => (a.tool === undefined) !== (a.answer === undefined),
    ],
    [
      'tool есть в реестре',
      (a) => a.tool === undefined || this.toolsService.has(a.tool),
    ],
  ];

  constructor(private readonly toolsService: ToolsService) {}

  validate(action: Action) {
    return this.axioms
      .filter(([, check]) => !check(action ?? {}))
      .map(([name]) => name);
  }
}
