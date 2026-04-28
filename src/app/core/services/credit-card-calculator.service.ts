import { Injectable } from '@angular/core';
import { Debt } from '../../models/debt.model';

export interface MinPaymentResult {
  minimumPayment: number;
  interestPortion: number;
  principalPortion: number;
  ivaPortion: number;
}

export interface PaymentBreakdown {
  month: number;
  payment: number;
  interestPortion: number;
  principalPortion: number;
  remainingBalance: number;
  cumulativeInterest: number;
}

export interface PayoffSimulation {
  monthsToPayoff: number;
  yearsToPayoff: number;
  totalPaid: number;
  totalInterest: number;
  totalIVA: number;
  interestToDebtRatio: number;
  monthlyBreakdown: PaymentBreakdown[];
  feasible: boolean;
}

export interface StrategyComparison {
  name: string;
  monthlyPayment: number;
  simulation: PayoffSimulation;
  savingsVsMinimum: number;
  timeSavedMonths: number;
}

@Injectable({
  providedIn: 'root'
})
export class CreditCardCalculatorService {
  private readonly IVA_RATE = 0.16;
  private readonly DEFAULT_CAPITAL_PERCENT = 0.015;
  private readonly DEFAULT_MIN_FLOOR = 200;
  private readonly MAX_MONTHS = 600;

  /**
   * Calculates the typical minimum payment for credit cards in Mexico.
   * Formula: max(capitalPercent * balance + interest + IVA, minFloor)
   */
  calculateMinimumPayment(
    balance: number,
    annualRate: number,
    capitalPercent = this.DEFAULT_CAPITAL_PERCENT,
    minFloor = this.DEFAULT_MIN_FLOOR
  ): MinPaymentResult {
    const monthlyRate = annualRate / 100 / 12;
    const monthlyInterest = balance * monthlyRate;
    const ivaOnInterest = monthlyInterest * this.IVA_RATE;
    const capitalPortion = balance * capitalPercent;

    const calculated = capitalPortion + monthlyInterest + ivaOnInterest;
    const minimumPayment = Math.min(
      Math.max(calculated, minFloor),
      balance + monthlyInterest + ivaOnInterest
    );

    return {
      minimumPayment: Math.round(minimumPayment * 100) / 100,
      interestPortion: Math.round(monthlyInterest * 100) / 100,
      principalPortion: Math.round(capitalPortion * 100) / 100,
      ivaPortion: Math.round(ivaOnInterest * 100) / 100
    };
  }

  /**
   * Calculates how much of a payment goes to interest vs principal.
   */
  calculatePaymentBreakdown(
    balance: number,
    payment: number,
    annualRate: number
  ): { interestPortion: number; principalPortion: number; ivaPortion: number } {
    const monthlyRate = annualRate / 100 / 12;
    const monthlyInterest = balance * monthlyRate;
    const ivaOnInterest = monthlyInterest * this.IVA_RATE;
    const totalInterestWithIVA = monthlyInterest + ivaOnInterest;

    const interestPortion = Math.min(monthlyInterest, payment);
    const ivaPortion = Math.min(ivaOnInterest, Math.max(0, payment - monthlyInterest));
    const principalPortion = Math.max(0, payment - totalInterestWithIVA);

    return {
      interestPortion: Math.round(interestPortion * 100) / 100,
      principalPortion: Math.round(principalPortion * 100) / 100,
      ivaPortion: Math.round(ivaPortion * 100) / 100
    };
  }

  /**
   * Simulates paying off a credit card with a fixed monthly payment.
   * Uses Mexican rates (includes IVA on interest).
   */
  simulatePayoff(
    initialBalance: number,
    monthlyPayment: number,
    annualRate: number
  ): PayoffSimulation {
    const monthlyRate = annualRate / 100 / 12;
    const breakdown: PaymentBreakdown[] = [];

    let balance = initialBalance;
    let month = 0;
    let cumulativeInterest = 0;
    let cumulativeIVA = 0;
    let cumulativePayments = 0;

    while (balance > 0.01 && month < this.MAX_MONTHS) {
      month++;

      const interest = balance * monthlyRate;
      const iva = interest * this.IVA_RATE;
      const totalInterestWithIVA = interest + iva;

      if (monthlyPayment <= totalInterestWithIVA && balance > 0) {
        return {
          monthsToPayoff: this.MAX_MONTHS,
          yearsToPayoff: Math.round((this.MAX_MONTHS / 12) * 10) / 10,
          totalPaid: 0,
          totalInterest: 0,
          totalIVA: 0,
          interestToDebtRatio: 0,
          monthlyBreakdown: [],
          feasible: false
        };
      }

      const payment = Math.min(monthlyPayment, balance + totalInterestWithIVA);
      const principal = payment - totalInterestWithIVA;
      balance = Math.max(0, balance - principal);

      cumulativeInterest += interest;
      cumulativeIVA += iva;
      cumulativePayments += payment;

      breakdown.push({
        month,
        payment: Math.round(payment * 100) / 100,
        interestPortion: Math.round(interest * 100) / 100,
        principalPortion: Math.round(principal * 100) / 100,
        remainingBalance: Math.round(balance * 100) / 100,
        cumulativeInterest: Math.round(cumulativeInterest * 100) / 100
      });
    }

    return {
      monthsToPayoff: month,
      yearsToPayoff: Math.round((month / 12) * 10) / 10,
      totalPaid: Math.round(cumulativePayments * 100) / 100,
      totalInterest: Math.round(cumulativeInterest * 100) / 100,
      totalIVA: Math.round(cumulativeIVA * 100) / 100,
      interestToDebtRatio: Math.round((cumulativeInterest / initialBalance) * 100) / 100,
      monthlyBreakdown: breakdown,
      feasible: month < this.MAX_MONTHS
    };
  }

  /**
   * Compares multiple payment strategies against the minimum payment baseline.
   */
  compareStrategies(
    debt: Debt,
    extraPayments: number[] = [0, 200, 500, 1000]
  ): StrategyComparison[] {
    const balance = debt.current_balance;
    const rate = debt.cat ?? debt.interest_rate;
    const minPayment = debt.minimum_payment;

    const baselineSimulation = this.simulatePayoff(balance, minPayment, rate);

    return extraPayments.map((extra, index) => {
      const payment = minPayment + extra;
      const simulation = this.simulatePayoff(balance, payment, rate);

      let name: string;
      if (extra === 0) {
        name = 'Solo pago mínimo';
      } else if (payment >= balance) {
        name = 'Pago total';
      } else {
        name = `Mínimo + $${extra.toLocaleString('es-MX')}`;
      }

      return {
        name,
        monthlyPayment: payment,
        simulation,
        savingsVsMinimum: Math.round(
          (baselineSimulation.totalInterest - simulation.totalInterest) * 100
        ) / 100,
        timeSavedMonths: baselineSimulation.monthsToPayoff - simulation.monthsToPayoff
      };
    });
  }

  /**
   * Generates a quick comparison table for display.
   */
  generateComparisonTable(debt: Debt): {
    minimum: PayoffSimulation;
    suggested: PayoffSimulation;
    total: PayoffSimulation;
    savingsIfPayTotal: number;
  } {
    const balance = debt.current_balance;
    const rate = debt.cat ?? debt.interest_rate;
    const minPayment = debt.minimum_payment;

    const minimum = this.simulatePayoff(balance, minPayment, rate);
    const suggested = this.simulatePayoff(balance, minPayment * 3, rate);
    const total = this.simulatePayoff(balance, balance, rate);

    return {
      minimum,
      suggested,
      total,
      savingsIfPayTotal: Math.round((minimum.totalInterest - total.totalInterest) * 100) / 100
    };
  }

  /**
   * Gets the effective rate to use for calculations (CAT for credit cards, interest rate otherwise).
   */
  getEffectiveRate(debt: Debt): number {
    if (debt.debt_type === 'credit_card' && debt.cat) {
      return debt.cat;
    }
    return debt.interest_rate;
  }

  /**
   * Formats months as "X años Y meses" string.
   */
  formatDuration(months: number): string {
    if (months >= this.MAX_MONTHS) {
      return 'Más de 50 años';
    }
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0) {
      return `${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`;
    }
    if (remainingMonths === 0) {
      return `${years} ${years === 1 ? 'año' : 'años'}`;
    }
    return `${years} ${years === 1 ? 'año' : 'años'} ${remainingMonths} ${remainingMonths === 1 ? 'mes' : 'meses'}`;
  }
}
