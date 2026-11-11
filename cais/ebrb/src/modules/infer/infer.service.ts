import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EbrbConfig } from '../../config/ebrb.config';
import { KafkaService } from '../../shared/kafka/kafka.service';
import { ActionsService } from '../actions/actions.service';
import { AttributesService } from '../attributes/attributes.service';
import { EvidenceService } from '../evidence/evidence.service';
import { ExplainService } from '../explain/explain.service';
import { ExtractionService } from '../extraction/extraction.service';
import { PlanService } from '../plan/plan.service';
import { PolicyService } from '../policy/policy.service';
import { RulesService } from '../rules/rules.service';
import { ValidationService } from '../validation/validation.service';
import { InferDto } from './dto/infer.dto';

@Injectable()
export class InferService {
  private readonly thresholds: EbrbConfig;

  constructor(
    private readonly attributesService: AttributesService,
    private readonly rulesService: RulesService,
    private readonly actionsService: ActionsService,
    private readonly extractionService: ExtractionService,
    private readonly validationService: ValidationService,
    private readonly planService: PlanService,
    private readonly evidenceService: EvidenceService,
    private readonly policyService: PolicyService,
    private readonly explainService: ExplainService,
    private readonly kafkaService: KafkaService,
    configService: ConfigService,
  ) {
    this.thresholds = configService.getOrThrow<EbrbConfig>('ebrb');
  }

  async infer({ input, attributes, action, thresholds = {} }: InferDto) {
    if (!input && !attributes)
      throw new BadRequestException('нужен input или attributes');
    const schema = this.attributesService.current();
    const raw =
      attributes ?? (await this.extractionService.extract(input!, schema));
    const { extracted, problems } = this.validationService.validate(
      raw,
      schema,
    );
    if (problems.length) {
      return this.publish({
        decision: 'REFINE',
        reason: 'атрибуты не прошли проверку схемы',
        problems,
        attributes: extracted,
      });
    }
    const candidate = await this.planService.plan(input, extracted, action);
    const result = this.evidenceService.evaluate(
      this.rulesService.current(),
      extracted,
      schema,
      this.rulesService.hypotheses(),
    );
    const safe = this.actionsService.safe(candidate);
    const policy = this.policyService.decide(
      { ...result, action: candidate, safe },
      {
        confidence: thresholds.confidence ?? this.thresholds.confidence,
        ignorance: thresholds.ignorance ?? this.thresholds.ignorance,
        conflict: thresholds.conflict ?? this.thresholds.conflict,
      },
    );
    const trace = {
      action: candidate,
      hypothesis: policy.hypothesis,
      ...result,
      rules: result.activated,
    };
    const explanation =
      policy.decision === 'APPROVE'
        ? await this.explainService.explain(trace)
        : null;
    return this.publish({
      ...policy,
      action: candidate,
      attributes: extracted,
      ...result,
      explanation,
    });
  }

  private publish<T extends { decision: string }>(result: T) {
    this.kafkaService.publish({ type: 'decision', decision: result.decision });
    return result;
  }
}
