import { Routes } from '@angular/router';
import { authGuard, publicGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    canActivate: [publicGuard],
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard.page').then(m => m.DashboardPage)
  },
  {
    path: 'salary',
    canActivate: [authGuard],
    loadComponent: () => import('./features/salary/salary.page').then(m => m.SalaryPage)
  },
  {
    path: 'expenses',
    canActivate: [authGuard],
    loadChildren: () => import('./features/expenses/expenses.routes').then(m => m.EXPENSES_ROUTES)
  },
  {
    path: 'savings',
    canActivate: [authGuard],
    loadChildren: () => import('./features/savings/savings.routes').then(m => m.SAVINGS_ROUTES)
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () => import('./features/settings/settings.page').then(m => m.SettingsPage)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
