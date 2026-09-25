import { QuantityType } from './units';

export type CategoryId =
  | 'circuit'
  | 'electrical'
  | 'power'
  | 'components'
  | 'batteries'
  | 'pcb'
  | 'rf'
  | 'digital'
  | 'embedded'
  | 'thermal'
  | 'signals'
  | 'math'
  | 'reference'
  | 'formulas'
  | 'design';

export interface Category {
  id: CategoryId;
  letter: string; // 'A' through 'N'
  name: string;
  description: string;
  iconName: string;
  toolCount: number;
}

export type WarningSeverity = 'info' | 'warning' | 'danger';

export type EngineeringClassification =
  | 'THEORETICAL'
  | 'ENGINEERING ESTIMATE'
  | 'STANDARDS-DEPENDENT'
  | 'COMPONENT-DATA DEPENDENT'
  | 'TOPOLOGY / DESIGN DEPENDENT'
  | 'PROTOCOL/TIMING MODEL'
  | 'HARDWARE-DEPENDENT';

export interface EngineeringWarning {
  severity: WarningSeverity;
  title: string;
  message: string;
  code?: string;
}

export interface CalculationStep {
  stepNumber: number;
  title: string;
  formula: string;
  substitution: string;
  result: string;
  annotation?: string;
}

export interface StandardValueMatch {
  series: 'E12' | 'E24' | 'E96';
  nominalValue: number;
  formattedNominal: string;
  lowerStandard: number;
  formattedLower: string;
  upperStandard: number;
  formattedUpper: string;
  deviationPercent: number;
  recommendedValue: number;
  formattedRecommended: string;
}

export interface CalculationResult {
  primaryValue: number;
  formattedValue?: string;
  unit?: string;
  label?: string;
  primaryUnit?: string;
  formattedResult?: string;
  equationUsed?: string;
  engineeringModel?: string;
  classification?: EngineeringClassification;
  standardsContext?: string;
  standardValue?: StandardValueMatch;
  powerDissipation?: {
    watts: number;
    formatted: string;
    suggestedRating: string;
    warning?: string;
  };
  warnings: EngineeringWarning[];
  steps: CalculationStep[];
  additionalOutputs?: Record<string, any>;
  visualData?: Record<string, any>;
}

export interface ToolInputSchema {
  id: string;
  label: string;
  symbol: string;
  quantity: QuantityType;
  defaultValue: number;
  defaultUnit: string;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
  options?: { label: string; value: string | number }[];
}

export interface ToolMetadata {
  id: string;
  slug: string;
  name: string;
  category: CategoryId;
  description: string;
  formulaSnippet: string;
  keywords: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  relatedToolIds: string[];
  status: 'implemented' | 'planned';
  classification?: EngineeringClassification;
  safetyLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'MAINS_HAZARD';
  seo: {
    title: string;
    metaDescription: string;
    schemaType?: string;
    keywords: string[];
  };
}

export interface FormulaDefinition {
  id: string;
  name: string;
  category: CategoryId;
  equationText: string;
  variables: {
    symbol: string;
    name: string;
    unit: string;
    description: string;
  }[];
  explanation: string;
  example: string;
  relatedToolId?: string;
}
