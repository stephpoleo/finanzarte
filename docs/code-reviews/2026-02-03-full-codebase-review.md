# Code Review: Finanzarte Full Codebase Clean Code Analysis

**Fecha**: 2026-02-03
**Revisor**: Claude Opus 4.5
**Archivos Revisados**: 14 archivos principales (services y components)

## Resumen Ejecutivo

El codebase de Finanzarte presenta una arquitectura funcional con uso moderno de Angular signals, pero tiene problemas significativos de mantenibilidad relacionados con **duplicación de código sistemática** y **violaciones de SOLID**. Los principales hallazgos son:

1. **Duplicación de patrones CRUD** en todos los servicios (~200 líneas repetidas)
2. **Form state duplicado** en componentes (mismo objeto definido 2 veces)
3. **Lógica de charts duplicada** entre componentes
4. **Magic numbers** sin constantes definidas
5. **Componentes "God Class"** con demasiadas responsabilidades

---

## Issues Encontrados

### Críticos (4)

#### 1. Duplicate Form State Objects - DRY Violation

**Ubicación**: `inversiones-tab.component.ts:47-65`
**Principio violado**: Don't Repeat Yourself (DRY)

**Problema**:
```typescript
// Lines 49-55: newInvestment object
newInvestment: { name: string; type: InvestmentType; initial_amount: number; current_amount: number; expected_return: number } = {
  name: '', type: 'stocks', initial_amount: 0, current_amount: 0, expected_return: 8
};

// Lines 59-65: editInvestment object - IDENTICAL structure
editInvestment: { name: string; type: InvestmentType; initial_amount: number; current_amount: number; expected_return: number } = {
  name: '', type: 'stocks', initial_amount: 0, current_amount: 0, expected_return: 8
};
```

El mismo patrón se repite en:
- `presupuesto-tab.component.ts:65-77` y `73-77` (income forms)
- `presupuesto-tab.component.ts:81-95` y `90-95` (expense forms)
- `emergencia-tab.component.ts:64-74` (cancellable expense forms)

**Impacto**: Alto - Si cambia la estructura del modelo, hay que actualizar 2+ lugares

**Recomendación**:
```typescript
// Crear factory functions o interfaces reutilizables
interface InvestmentFormState {
  name: string;
  type: InvestmentType;
  initial_amount: number;
  current_amount: number;
  expected_return: number;
}

const createEmptyInvestmentForm = (): InvestmentFormState => ({
  name: '', type: 'stocks', initial_amount: 0, current_amount: 0, expected_return: 8
});

// Uso:
newInvestment = createEmptyInvestmentForm();
editInvestment = createEmptyInvestmentForm();
```

**Status**: Pendiente
**Prioridad**: Alta
**Estimación**: 2-3 horas

---

#### 2. CRUD Boilerplate Duplication - SRP/DRY Violation

**Ubicación**: Todos los servicios en `src/app/core/services/`
**Principio violado**: Single Responsibility Principle, DRY

**Problema**:
Cada servicio repite el mismo patrón de acceso (~30 líneas por método CRUD):

```typescript
// Este patrón exacto aparece en:
// - investment.service.ts:73-98, 109-158, 164-189, 191-217
// - expense.service.ts:44-69, 71-114, etc.
// - income-source.service.ts:28-53, 55-89, etc.
// - savings-goal.service.ts (todos los métodos CRUD)
// - cancellable-expense.service.ts (todos los métodos CRUD)

async loadData(): Promise<T[]> {
  const access = this.env.checkAccess();  // REPETIDO

  if (access.mode === 'dev') {            // REPETIDO
    return this.data();
  }

  if (access.mode === 'error') {          // REPETIDO
    console.error('Error:', access.error.message);
    return [];
  }

  const { data, error } = await this.supabase.client
    .from('table_name')
    .select('*')
    .eq('user_id', access.userId);

  // ... resto de lógica
}
```

**Impacto**: Muy Alto - ~200+ líneas duplicadas, errores deben corregirse en 5+ lugares

**Recomendación**:
```typescript
// Crear BaseDataService<T>
abstract class BaseDataService<T extends { id: string }> {
  protected abstract tableName: string;
  protected data = signal<T[]>([]);

  protected async withAccessCheck<R>(
    devCallback: () => R,
    prodCallback: (userId: string) => Promise<R>
  ): Promise<R> {
    const access = this.env.checkAccess();

    if (access.mode === 'dev') return devCallback();
    if (access.mode === 'error') throw access.error;

    return prodCallback(access.userId);
  }

  async load(): Promise<T[]> {
    return this.withAccessCheck(
      () => this.data(),
      async (userId) => {
        const { data, error } = await this.supabase.client
          .from(this.tableName)
          .select('*')
          .eq('user_id', userId);
        // ...
      }
    );
  }
}
```

**Status**: Pendiente
**Prioridad**: Muy Alta
**Estimación**: 6-8 horas

---

#### 3. Chart Logic Duplication - DRY Violation

**Ubicación**:
- `inversiones-tab.component.ts:262-367`
- `presupuesto-tab.component.ts:346-448`

**Principio violado**: DRY

**Problema**:
Ambos componentes implementan la misma lógica de donut chart:

```typescript
// inversiones-tab.component.ts:262-310
getInvestmentChartSegments(): ChartSegment[] {
  const circumference = 2 * Math.PI * 70;  // Magic number
  const segments: ChartSegment[] = [];
  // ... ~50 líneas de lógica de segmentos
}

// presupuesto-tab.component.ts:346-391
getChartSegments(): ChartSegment[] {
  const circumference = 2 * Math.PI * 70;  // Mismo magic number
  const segments: ChartSegment[] = [];
  // ... ~45 líneas de lógica MUY similar
}
```

También duplican:
- `getChartSeparators()` / `getInvestmentChartSeparators()`
- `getChartLegend()` / `getInvestmentChartLegend()`
- `ChartSegment` interface (definida en ambos archivos)

**Impacto**: Alto - Cambios de UI requieren modificar 2 componentes

**Recomendación**:
```typescript
// Crear DonutChartService en shared/services/
@Injectable({ providedIn: 'root' })
export class DonutChartService {
  private readonly DEFAULT_RADIUS = 70;
  private readonly INNER_RADIUS = 56;
  private readonly OUTER_RADIUS = 84;
  private readonly CENTER = 100;

  calculateSegments(data: ChartDataItem[], animating: boolean): ChartSegment[] {
    const circumference = 2 * Math.PI * this.DEFAULT_RADIUS;
    // ... lógica centralizada
  }

  calculateSeparators(data: ChartDataItem[], animating: boolean): SeparatorLine[] {
    // ... lógica centralizada
  }
}
```

**Status**: Pendiente
**Prioridad**: Alta
**Estimación**: 3-4 horas

---

#### 4. God Component Pattern - SRP Violation

**Ubicación**:
- `presupuesto-tab.component.ts` (492 líneas)
- `emergencia-tab.component.ts` (274 líneas)
- `inversiones-tab.component.ts` (373 líneas)

**Principio violado**: Single Responsibility Principle

**Problema**:
`PresupuestoTabComponent` maneja demasiadas responsabilidades:
- Income CRUD (lines 180-231) - forms, validation, API calls
- Expense CRUD (lines 243-298) - forms, validation, API calls
- Chart rendering (lines 328-452) - segments, legends, separators
- Settings sync (lines 472-481)
- Navigation (lines 484-491)

```typescript
// Un componente de 492 líneas con:
// - 4 form state objects
// - 2 edit state objects
// - 2 expanded state flags
// - 2 chart carousel variables
// - 20+ methods
```

**Impacto**: Alto - Dificulta testing, mantenimiento y reutilización

**Recomendación**:
Separar en componentes más pequeños:
```
presupuesto-tab/
├── presupuesto-tab.component.ts (orquestador, ~100 líneas)
├── components/
│   ├── income-section/
│   │   ├── income-section.component.ts
│   │   └── income-form.component.ts
│   ├── expense-section/
│   │   ├── expense-section.component.ts
│   │   └── expense-form.component.ts
│   └── budget-chart/
│       └── budget-chart.component.ts
```

**Status**: Pendiente
**Prioridad**: Media-Alta
**Estimación**: 8-10 horas

---

### Importantes (5)

#### 5. Magic Numbers Throughout Codebase

**Ubicaciones**:
- `inversiones-tab.component.ts:263` - `70` (chart radius)
- `inversiones-tab.component.ts:356-357` - `56`, `84` (inner/outer radius)
- `inversiones-tab.component.ts:361-364` - `100` (chart center)
- `presupuesto-tab.component.ts:347, 437-438` - mismos valores
- `investment.service.ts:121, 143` - `8` (default expected return)
- `user-settings.service.ts:75, 119` - `0.04` (4% withdrawal rate)
- `user-settings.service.ts:115` - `25` (25x multiplier)
- `user-settings.service.ts:130` - `110` (Rule of 110)

**Principio violado**: Magic Numbers code smell

**Problema**:
```typescript
// Sin contexto de qué significa
const circumference = 2 * Math.PI * 70;
const innerRadius = 56;
const outerRadius = 84;
return {
  x1: 100 + innerRadius * Math.cos(radians),
  // ...
};
```

**Recomendación**:
```typescript
// constants/chart.constants.ts
export const DONUT_CHART = {
  RADIUS: 70,
  INNER_RADIUS: 56,
  OUTER_RADIUS: 84,
  CENTER: 100,
  get CIRCUMFERENCE() { return 2 * Math.PI * this.RADIUS; }
} as const;

// constants/financial.constants.ts
export const FINANCIAL_RULES = {
  WITHDRAWAL_RATE: 0.04,          // 4% safe withdrawal rate
  RETIREMENT_MULTIPLIER: 25,      // 25x annual expenses
  RULE_OF_110: 110,               // Risk allocation: 110 - age
  DEFAULT_EXPECTED_RETURN: 8      // 8% default annual return
} as const;
```

**Status**: Pendiente
**Prioridad**: Media
**Estimación**: 1-2 horas

---

#### 6. Hardcoded Color Maps

**Ubicación**: `presupuesto-tab.component.ts:304-317`

**Problema**:
```typescript
getCategoryColor(category: ExpenseCategory): string {
  const colors: Record<ExpenseCategory, string> = {
    rent: '#ef4444',
    utilities: '#f59e0b',
    subscriptions: '#8b5cf6',
    // ... 10 colores hardcoded
  };
  return colors[category] || '#64748b';
}
```

También en `inversiones-tab.component.ts:277, 288, 315-316` con colores de riesgo.

**Recomendación**:
```typescript
// constants/colors.constants.ts
export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  rent: '#ef4444',
  // ...
} as const;

export const RISK_COLORS = {
  HIGH: '#ef4444',
  LOW: '#10b981',
} as const;
```

**Status**: Pendiente
**Prioridad**: Baja
**Estimación**: 30 minutos

---

#### 7. Missing Financial Formula Documentation

**Ubicación**: `user-settings.service.ts:99-112, 275-291`

**Problema**:
```typescript
// No hay comentarios explicando las fórmulas financieras
retirementTotalFund = computed(() => {
  const monthlyRate = (this.retirementExpectedReturn() / 100) / 12;
  // ... fórmulas complejas sin explicación
  const fvContributions = contribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  const fvCurrent = currentSavings * Math.pow(1 + expectedReturn / 100, years);
  return fvContributions + fvCurrent;
});

getYearsToLevel(levelIndex: number): number {
  // ... logaritmos sin explicación
  const months = Math.log(1 + (remaining * monthlyRate) / monthlySavings) / Math.log(1 + monthlyRate);
}
```

**Recomendación**:
```typescript
/**
 * Calculates future value using compound interest formula:
 * FV = PV * (1 + r)^n + PMT * [(1 + r)^n - 1] / r
 *
 * Where:
 * - PV = Present Value (current savings)
 * - PMT = Monthly Payment (contribution)
 * - r = Monthly interest rate
 * - n = Number of periods (months)
 *
 * Reference: https://www.investopedia.com/terms/f/futurevalue.asp
 */
retirementTotalFund = computed(() => {
  // ...
});
```

**Status**: Pendiente
**Prioridad**: Media
**Estimación**: 1 hora

---

#### 8. Inconsistent Return Patterns

**Ubicación**: `investment.service.ts`

**Problema**:
```typescript
// addInvestment returns { data, error }
async addInvestment(...): Promise<{ data: Investment | null; error: Error | null }>

// updateInvestment returns { error } only
async updateInvestment(...): Promise<{ error: Error | null }>

// deleteInvestment returns { error } only
async deleteInvestment(...): Promise<{ error: Error | null }>
```

**Recomendación**:
Estandarizar a un tipo de resultado consistente:
```typescript
type ServiceResult<T> = { data: T; error: null } | { data: null; error: Error };

// O usar Result pattern
type Result<T, E = Error> = Success<T> | Failure<E>;
```

**Status**: Pendiente
**Prioridad**: Baja
**Estimación**: 2 horas

---

#### 9. ID Generation with Date.now()

**Ubicación**: Todos los servicios en dev mode

**Problema**:
```typescript
// investment.service.ts:115
const newInvestment: Investment = {
  id: Date.now().toString(),  // No es único si se llama 2 veces en el mismo ms
  // ...
};
```

**Recomendación**:
```typescript
// utils/id.utils.ts
export const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// O usar crypto
export const generateSecureId = (): string =>
  crypto.randomUUID();
```

**Status**: Pendiente
**Prioridad**: Baja
**Estimación**: 30 minutos

---

### Menores (3)

#### 10. ChartSegment Interface Duplication

**Ubicación**:
- `inversiones-tab.component.ts:33-37`
- `presupuesto-tab.component.ts:46-50`

**Problema**: Misma interface definida en 2 lugares

**Recomendación**: Mover a `models/chart.model.ts`

**Status**: Pendiente
**Prioridad**: Muy Baja

---

#### 11. Computed Signal Chain Complexity

**Ubicación**: `user-settings.service.ts:16-135`

**Problema**: 30+ computed signals con cadenas de dependencias difíciles de rastrear

**Recomendación**: Agrupar en sub-servicios por dominio (EmergencyFundService, RetirementService, etc.)

**Status**: Pendiente
**Prioridad**: Baja

---

#### 12. Reset Form Methods Nearly Identical

**Ubicación**:
- `presupuesto-tab.component.ts:187-189` (resetIncomeForm)
- `presupuesto-tab.component.ts:251-253` (resetExpenseForm)
- `inversiones-tab.component.ts:172-174` (resetInvestmentForm)

**Problema**: Lógica idéntica repetida

**Status**: Pendiente
**Prioridad**: Muy Baja

---

## Code Smells Detectados

- [x] **DRY Violation** - Form state duplicado en componentes
- [x] **DRY Violation** - CRUD boilerplate en servicios (~200 líneas)
- [x] **DRY Violation** - Chart logic duplicado entre componentes
- [x] **Magic Numbers** - 15+ instancias sin constantes
- [x] **God Class** - PresupuestoTabComponent (492 líneas, 20+ métodos)
- [x] **Long Method** - getInvestmentChartSegments (48 líneas)
- [x] **Hardcoded Values** - Colores, multiplicadores, tasas
- [x] **Missing Documentation** - Fórmulas financieras sin explicación
- [ ] **Feature Envy** - Componentes acceden mucho a service internals

---

## Metricas de Calidad

| Metrica | Actual | Objetivo | Status |
|---------|--------|----------|--------|
| Lineas duplicadas (estimado) | ~300 | < 50 | Warning |
| Lineas por componente max | 492 | < 200 | Warning |
| Magic numbers | 15+ | 0 | Warning |
| Interfaces duplicadas | 2 | 0 | Warning |
| Cobertura de comentarios (formulas) | 0% | 100% | Warning |
| Servicios con base class | 0/6 | 6/6 | Warning |

---

## Recomendaciones Prioritarias

### Quick Wins (Implementar primero)

1. **Extraer constantes** (30 min)
   - Crear `constants/chart.constants.ts`
   - Crear `constants/financial.constants.ts`
   - Crear `constants/colors.constants.ts`

2. **Mover ChartSegment interface** (15 min)
   - Crear `models/chart.model.ts`
   - Importar en ambos componentes

3. **Crear factory functions para forms** (1 hora)
   - Eliminar duplicacion de form state objects

### Medium Effort (Sprint siguiente)

4. **Crear DonutChartService** (3-4 horas)
   - Centralizar logica de charts
   - Eliminar duplicacion entre componentes

5. **Documentar formulas financieras** (1 hora)
   - Agregar JSDoc con referencias
   - Explicar 4% rule, FV formula, etc.

### High Effort (Planificar)

6. **Crear BaseDataService<T>** (6-8 horas)
   - Eliminar boilerplate CRUD
   - Mejorar consistencia de errores

7. **Separar PresupuestoTabComponent** (8-10 horas)
   - Crear sub-componentes
   - Mejorar testabilidad

---

## Plan de Accion

- [ ] **Semana 1**: Quick Wins (constantes, interfaces, factories)
- [ ] **Semana 2**: DonutChartService + documentacion
- [ ] **Semana 3-4**: BaseDataService refactor
- [ ] **Futuro**: Component decomposition

---

## Archivos a Crear

### Nuevos archivos sugeridos
- `src/app/constants/chart.constants.ts`
- `src/app/constants/financial.constants.ts`
- `src/app/constants/colors.constants.ts`
- `src/app/models/chart.model.ts`
- `src/app/shared/services/donut-chart.service.ts`
- `src/app/core/services/base-data.service.ts`
- `src/app/shared/utils/id.utils.ts`

### Archivos a modificar
- `src/app/features/dashboard/components/inversiones-tab/inversiones-tab.component.ts`
- `src/app/features/dashboard/components/presupuesto-tab/presupuesto-tab.component.ts`
- `src/app/core/services/investment.service.ts`
- `src/app/core/services/user-settings.service.ts`
- Todos los servicios CRUD

---

## Notas Adicionales

- El uso de Angular signals es moderno y apropiado
- La estructura de carpetas (features/core/shared) es correcta
- Los modelos estan bien definidos
- La integracion con Supabase funciona correctamente
- El dev mode con mock data es util para desarrollo

La prioridad debe ser **reducir duplicacion** antes de agregar funcionalidad nueva.

---

## Proxima Revision

**Fecha sugerida**: 2026-02-17 (despues de implementar Quick Wins)
**Enfoque**: Validar eliminacion de magic numbers y duplicacion de forms

---

**Generado por**: `/clean-code-review` skill
**Version**: 1.0.0
