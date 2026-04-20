import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  flagOutline,
  calendarOutline,
  trendingUpOutline
} from 'ionicons/icons';

import { UserSettingsService } from '../../../../core/services/user-settings.service';
import { ProfileService } from '../../../../core/services/profile.service';
import { CurrencyMxnPipe } from '../../../../shared/pipes/currency-mxn.pipe';

@Component({
  selector: 'app-retiro-tab',
  standalone: true,
  imports: [CommonModule, FormsModule, IonIcon, CurrencyMxnPipe],
  templateUrl: './retiro-tab.component.html',
  styleUrls: ['./retiro-tab.component.scss']
})
export class RetiroTabComponent {
  constructor(
    public userSettings: UserSettingsService,
    public profile: ProfileService
  ) {
    addIcons({
      flagOutline,
      calendarOutline,
      trendingUpOutline
    });
  }

  // Retirement state - synced with UserSettingsService
  get retCurrentAge(): number { return this.userSettings.retirementCurrentAge(); }
  set retCurrentAge(value: number) { this.userSettings.updateRetirementSettings({ retirement_current_age: value }); }

  get retRetirementAge(): number { return this.userSettings.retirementTargetAge(); }
  set retRetirementAge(value: number) { this.userSettings.updateRetirementSettings({ retirement_target_age: value }); }

  get retMonthlyContribution(): number { return this.userSettings.retirementMonthlyContribution(); }
  set retMonthlyContribution(value: number) { this.userSettings.updateRetirementSettings({ retirement_monthly_contribution: value }); }

  get retCurrentSavings(): number { return this.userSettings.retirementCurrentSavings(); }
  set retCurrentSavings(value: number) { this.userSettings.updateRetirementSettings({ retirement_current_savings: value }); }

  get retExpectedReturn(): number { return this.userSettings.retirementExpectedReturn(); }
  set retExpectedReturn(value: number) { this.userSettings.updateRetirementSettings({ retirement_expected_return: value }); }

  // Computed values
  get retYearsToRetirement(): number {
    return Math.max(0, this.retRetirementAge - this.retCurrentAge);
  }

  get retMonthsToRetirement(): number {
    return this.retYearsToRetirement * 12;
  }

  get retTotalFund(): number {
    const monthlyRate = (this.retExpectedReturn / 100) / 12;
    const fvContributions = this.retMonthlyContribution * ((Math.pow(1 + monthlyRate, this.retMonthsToRetirement) - 1) / monthlyRate);
    const fvCurrent = this.retCurrentSavings * Math.pow(1 + this.retExpectedReturn / 100, this.retYearsToRetirement);
    return fvContributions + fvCurrent;
  }

  get retRecommendedFund(): number {
    return this.retMonthlyContribution * 12 * 25;
  }

  get retMonthlyIncome(): number {
    return (this.retTotalFund * 0.04) / 12;
  }

  get retFundProgress(): number {
    return this.retRecommendedFund > 0 ? Math.min(100, (this.retTotalFund / this.retRecommendedFund) * 100) : 0;
  }
}
