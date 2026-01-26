import { Routes } from '@angular/router';

export const EXPENSES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./expenses.page').then(m => m.ExpensesPage)
  },
  {
    path: 'add',
    loadComponent: () => import('./expense-form/expense-form.page').then(m => m.ExpenseFormPage)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./expense-form/expense-form.page').then(m => m.ExpenseFormPage)
  }
];
