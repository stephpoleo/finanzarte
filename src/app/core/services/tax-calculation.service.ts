import { Injectable } from '@angular/core';
import {
  ISR_MONTHLY_BRACKETS,
  EMPLOYMENT_SUBSIDY_BRACKETS,
  IMSS_RATES,
  UMA_MONTHLY_2024,
  MAX_INCOME_FOR_SUBSIDY,
  TaxBracket,
  SubsidyBracket
} from '../../data/tax-tables';

export interface TaxBreakdown {
  grossSalary: number;
  isr: number;
  imss: number;
  employmentSubsidy: number;
  netSalary: number;
  effectiveTaxRate: number;
}

export interface ISRDetails {
  bracket: TaxBracket;
  excess: number;
  marginalTax: number;
  fixedFee: number;
  totalISR: number;
}

@Injectable({
  providedIn: 'root'
})
export class TaxCalculationService {

  calculateTaxBreakdown(grossSalary: number): TaxBreakdown {
    if (grossSalary <= 0) {
      return {
        grossSalary: 0,
        isr: 0,
        imss: 0,
        employmentSubsidy: 0,
        netSalary: 0,
        effectiveTaxRate: 0
      };
    }

    const isrDetails = this.calculateISR(grossSalary);
    const imss = this.calculateIMSS(grossSalary);
    const subsidy = this.calculateEmploymentSubsidy(grossSalary);

    // ISR after subsidy (cannot be negative)
    const isrAfterSubsidy = Math.max(0, isrDetails.totalISR - subsidy);

    const netSalary = grossSalary - isrAfterSubsidy - imss;
    const totalDeductions = isrAfterSubsidy + imss;
    const effectiveTaxRate = (totalDeductions / grossSalary) * 100;

    return {
      grossSalary,
      isr: isrDetails.totalISR,
      imss,
      employmentSubsidy: subsidy,
      netSalary,
      effectiveTaxRate
    };
  }

  calculateISR(grossSalary: number): ISRDetails {
    const bracket = this.findTaxBracket(grossSalary);
    const excess = grossSalary - bracket.lowerLimit;
    const marginalTax = excess * bracket.rate;
    const totalISR = bracket.fixedFee + marginalTax;

    return {
      bracket,
      excess,
      marginalTax,
      fixedFee: bracket.fixedFee,
      totalISR
    };
  }

  private findTaxBracket(salary: number): TaxBracket {
    for (const bracket of ISR_MONTHLY_BRACKETS) {
      if (salary >= bracket.lowerLimit && salary <= bracket.upperLimit) {
        return bracket;
      }
    }
    // Return highest bracket if salary exceeds all brackets
    return ISR_MONTHLY_BRACKETS[ISR_MONTHLY_BRACKETS.length - 1];
  }

  calculateIMSS(grossSalary: number): number {
    // Calculate base for IMSS (salary above 3 UMAs for sickness/maternity surplus)
    const threeUMAs = UMA_MONTHLY_2024 * 3;
    const baseForSurplus = Math.max(0, grossSalary - threeUMAs);

    // Sickness and Maternity surplus (over 3 UMAs)
    const sicknessMaternitySurplus = baseForSurplus * IMSS_RATES.sicknessMaternitySurplus;

    // Disability and Life (on total salary)
    const disabilityLife = grossSalary * IMSS_RATES.disabilityLife;

    // Retirement and Unemployment (on total salary)
    const retirementUnemployment = grossSalary * IMSS_RATES.retirementUnemployment;

    return sicknessMaternitySurplus + disabilityLife + retirementUnemployment;
  }

  calculateEmploymentSubsidy(grossSalary: number): number {
    // No subsidy for income above threshold
    if (grossSalary > MAX_INCOME_FOR_SUBSIDY) {
      return 0;
    }

    for (const bracket of EMPLOYMENT_SUBSIDY_BRACKETS) {
      if (grossSalary >= bracket.lowerLimit && grossSalary <= bracket.upperLimit) {
        return bracket.subsidy;
      }
    }

    return 0;
  }

  getISRBrackets(): TaxBracket[] {
    return [...ISR_MONTHLY_BRACKETS];
  }

  getSubsidyBrackets(): SubsidyBracket[] {
    return [...EMPLOYMENT_SUBSIDY_BRACKETS];
  }
}
