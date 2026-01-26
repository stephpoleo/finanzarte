import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress-ring-container" [style.width.px]="size" [style.height.px]="size">
      <svg [attr.width]="size" [attr.height]="size" class="progress-ring">
        <circle
          class="progress-ring-bg"
          [attr.stroke]="backgroundColor"
          stroke-width="8"
          fill="transparent"
          [attr.r]="radius()"
          [attr.cx]="center()"
          [attr.cy]="center()"
        />
        <circle
          class="progress-ring-progress"
          [attr.stroke]="color"
          stroke-width="8"
          fill="transparent"
          [attr.r]="radius()"
          [attr.cx]="center()"
          [attr.cy]="center()"
          [attr.stroke-dasharray]="circumference() + ' ' + circumference()"
          [attr.stroke-dashoffset]="offset()"
          stroke-linecap="round"
        />
      </svg>
      <div class="progress-ring-content">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [`
    .progress-ring-container {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .progress-ring {
      transform: rotate(-90deg);
    }

    .progress-ring-bg {
      opacity: 0.2;
    }

    .progress-ring-progress {
      transition: stroke-dashoffset 0.5s ease-in-out;
    }

    .progress-ring-content {
      position: absolute;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class ProgressRingComponent {
  @Input() progress = 0;
  @Input() size = 120;
  @Input() color = '#10b981';
  @Input() backgroundColor = '#10b981';

  radius = computed(() => (this.size - 16) / 2);
  center = computed(() => this.size / 2);
  circumference = computed(() => 2 * Math.PI * this.radius());

  offset = computed(() => {
    const clampedProgress = Math.min(100, Math.max(0, this.progress));
    return this.circumference() - (clampedProgress / 100) * this.circumference();
  });
}
