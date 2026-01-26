import { Routes } from '@angular/router';

export const SAVINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./savings.page').then(m => m.SavingsPage)
  },
  {
    path: 'add',
    loadComponent: () => import('./goal-form/goal-form.page').then(m => m.GoalFormPage)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./goal-form/goal-form.page').then(m => m.GoalFormPage)
  },
  {
    path: ':id',
    loadComponent: () => import('./goal-detail/goal-detail.page').then(m => m.GoalDetailPage)
  }
];
