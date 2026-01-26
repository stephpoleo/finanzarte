// Mexican ISR Monthly Tax Brackets 2024
export interface TaxBracket {
  lowerLimit: number;
  upperLimit: number;
  fixedFee: number;
  rate: number; // Percentage as decimal
}

export const ISR_MONTHLY_BRACKETS: TaxBracket[] = [
  { lowerLimit: 0.01, upperLimit: 746.04, fixedFee: 0, rate: 0.0192 },
  { lowerLimit: 746.05, upperLimit: 6332.05, fixedFee: 14.32, rate: 0.064 },
  { lowerLimit: 6332.06, upperLimit: 11128.01, fixedFee: 371.83, rate: 0.1088 },
  { lowerLimit: 11128.02, upperLimit: 12935.82, fixedFee: 893.63, rate: 0.16 },
  { lowerLimit: 12935.83, upperLimit: 15487.71, fixedFee: 1182.88, rate: 0.1792 },
  { lowerLimit: 15487.72, upperLimit: 31236.49, fixedFee: 1640.18, rate: 0.2136 },
  { lowerLimit: 31236.50, upperLimit: 49233.00, fixedFee: 5004.12, rate: 0.2352 },
  { lowerLimit: 49233.01, upperLimit: 93993.90, fixedFee: 9236.89, rate: 0.30 },
  { lowerLimit: 93993.91, upperLimit: 125325.20, fixedFee: 22665.17, rate: 0.32 },
  { lowerLimit: 125325.21, upperLimit: 375975.61, fixedFee: 32691.18, rate: 0.34 },
  { lowerLimit: 375975.62, upperLimit: Infinity, fixedFee: 117912.32, rate: 0.35 }
];

// Employment Subsidy (Subsidio al Empleo) Monthly Table 2024
export interface SubsidyBracket {
  lowerLimit: number;
  upperLimit: number;
  subsidy: number;
}

export const EMPLOYMENT_SUBSIDY_BRACKETS: SubsidyBracket[] = [
  { lowerLimit: 0.01, upperLimit: 1768.96, subsidy: 407.02 },
  { lowerLimit: 1768.97, upperLimit: 2653.38, subsidy: 406.83 },
  { lowerLimit: 2653.39, upperLimit: 3472.84, subsidy: 406.62 },
  { lowerLimit: 3472.85, upperLimit: 3537.87, subsidy: 392.77 },
  { lowerLimit: 3537.88, upperLimit: 4446.15, subsidy: 382.46 },
  { lowerLimit: 4446.16, upperLimit: 4717.18, subsidy: 354.23 },
  { lowerLimit: 4717.19, upperLimit: 5335.42, subsidy: 324.87 },
  { lowerLimit: 5335.43, upperLimit: 6224.67, subsidy: 294.63 },
  { lowerLimit: 6224.68, upperLimit: 7113.90, subsidy: 253.54 },
  { lowerLimit: 7113.91, upperLimit: 7382.33, subsidy: 217.61 },
  { lowerLimit: 7382.34, upperLimit: 9081.00, subsidy: 0 } // Max income for subsidy eligibility
];

// IMSS Employee Contribution Rates
export const IMSS_RATES = {
  // Enfermedad y Maternidad (over 3 UMAs)
  sicknessMaternitySurplus: 0.00625,
  // Invalidez y Vida
  disabilityLife: 0.00625,
  // Cesantía en Edad Avanzada y Vejez
  retirementUnemployment: 0.01125,
  // Total employee contribution rate
  get total() {
    return this.sicknessMaternitySurplus + this.disabilityLife + this.retirementUnemployment;
  }
};

// UMA (Unidad de Medida y Actualización) 2024
export const UMA_DAILY_2024 = 108.57;
export const UMA_MONTHLY_2024 = UMA_DAILY_2024 * 30.4;

// Maximum income for employment subsidy
export const MAX_INCOME_FOR_SUBSIDY = 9081.00;
