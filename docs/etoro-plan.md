# Plan: Integración eToro con Finanzarte

## Resumen
Sincronizar automáticamente el portafolio de eToro con Finanzarte, permitiendo al usuario conectar su cuenta y ver sus inversiones actualizadas sin ingreso manual.

---

## Arquitectura

```
┌─────────────┐     ┌──────────────────────┐     ┌─────────────┐
│  Frontend   │────▶│  Supabase Edge Func  │────▶│  eToro API  │
│  (Angular)  │◀────│  (Deno/TypeScript)   │◀────│             │
└─────────────┘     └──────────────────────┘     └─────────────┘
       │                      │
       │                      ▼
       │              ┌──────────────┐
       └─────────────▶│   Supabase   │
                      │   Database   │
                      └──────────────┘
```

**Por qué Edge Functions:**
- Las credenciales de eToro NO pueden estar en el frontend
- Supabase Edge Functions permiten código server-side seguro
- Se integran nativamente con Supabase Auth y secrets

---

## Archivos a Crear

### 1. Edge Functions (`supabase/functions/`)

```
supabase/functions/
├── etoro-connect/index.ts      # Guardar API key del usuario
├── etoro-portfolio/index.ts    # Obtener posiciones de eToro
└── _shared/
    └── etoro-client.ts         # Cliente compartido para eToro API
```

#### `etoro-connect/index.ts`
- Recibe la subscription key del usuario
- Valida que funcione llamando a eToro
- Guarda encriptada en `etoro_connections` table
- Retorna success/error

#### `etoro-portfolio/index.ts`
- Lee la key del usuario de la DB
- Llama a eToro API `/positions`
- Transforma datos al formato de Finanzarte
- Retorna lista de inversiones

### 2. Modelos (`src/app/models/`)

```typescript
// etoro.model.ts
export interface EtoroConnection {
  id: string;
  user_id: string;
  is_connected: boolean;
  last_sync: string | null;
  created_at: string;
}

export interface EtoroPosition {
  positionId: string;
  instrumentId: number;
  symbol: string;
  name: string;
  amount: number;        // Monto invertido
  currentValue: number;  // Valor actual
  openRate: number;      // Precio de entrada
  leverage: number;
  isBuy: boolean;
  openDateTime: string;
  profitLoss: number;
  profitLossPercent: number;
}
```

### 3. Servicio (`src/app/core/services/`)

```typescript
// etoro.service.ts
@Injectable({ providedIn: 'root' })
export class EtoroService {
  // Signals
  isConnected = signal<boolean>(false);
  positions = signal<EtoroPosition[]>([]);
  lastSync = signal<Date | null>(null);
  isSyncing = signal<boolean>(false);

  // Methods
  async connect(subscriptionKey: string): Promise<{success: boolean, error?: string}>
  async disconnect(): Promise<void>
  async syncPortfolio(): Promise<void>
  async importToInvestments(): Promise<void>  // Importa posiciones como Investment
}
```

### 4. UI Components

**En `inversiones-tab.component.html`:**
```
┌─────────────────────────────────────────────────┐
│  eToro                              [Conectar]  │
│  ─────────────────────────────────────────────  │
│  Estado: No conectado                           │
│                                                 │
│  Conecta tu cuenta de eToro para sincronizar    │
│  automáticamente tu portafolio                  │
└─────────────────────────────────────────────────┘

// Después de conectar:
┌─────────────────────────────────────────────────┐
│  eToro                    [Sincronizar] [⚙️]   │
│  ─────────────────────────────────────────────  │
│  ✓ Conectado · Última sync: hace 2 horas        │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ 🔥 AAPL (Apple Inc.)                    │   │
│  │ $5,000 → $5,450 (+9.0%)                 │   │
│  └─────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────┐   │
│  │ 🔥 TSLA (Tesla Inc.)                    │   │
│  │ $3,000 → $2,850 (-5.0%)                 │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [Importar a Mis Inversiones]                   │
└─────────────────────────────────────────────────┘
```

---

## Esquema de Base de Datos

```sql
-- Tabla para conexiones de eToro
CREATE TABLE etoro_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  subscription_key_encrypted TEXT NOT NULL,  -- Encriptado con pgcrypto
  is_demo BOOLEAN DEFAULT false,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Solo el usuario puede ver/modificar su conexión
ALTER TABLE etoro_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own etoro connection"
  ON etoro_connections FOR ALL
  USING (auth.uid() = user_id);

-- Cache de posiciones (opcional, para reducir llamadas a eToro)
CREATE TABLE etoro_positions_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  position_id TEXT NOT NULL,
  instrument_id INTEGER,
  symbol TEXT,
  name TEXT,
  amount DECIMAL(12,2),
  current_value DECIMAL(12,2),
  open_rate DECIMAL(12,4),
  leverage INTEGER DEFAULT 1,
  is_buy BOOLEAN DEFAULT true,
  open_date TIMESTAMPTZ,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, position_id)
);

ALTER TABLE etoro_positions_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own etoro cache"
  ON etoro_positions_cache FOR SELECT
  USING (auth.uid() = user_id);
```

---

## Flujo de Usuario

### Conectar eToro
1. Usuario hace clic en "Conectar eToro"
2. Modal pide la Subscription Key (con link a dónde obtenerla)
3. Frontend llama a Edge Function `etoro-connect`
4. Edge Function valida la key contra eToro API
5. Si válida, guarda encriptada en DB
6. UI muestra "Conectado"

### Sincronizar Portafolio
1. Usuario hace clic en "Sincronizar" o automático al cargar
2. Frontend llama a Edge Function `etoro-portfolio`
3. Edge Function obtiene posiciones de eToro
4. Transforma al formato de Finanzarte
5. UI muestra lista de posiciones

### Importar a Inversiones
1. Usuario hace clic en "Importar a Mis Inversiones"
2. Por cada posición de eToro:
   - Crea/actualiza registro en tabla `investments`
   - Marca origen como 'etoro' para tracking
3. Las inversiones aparecen en el portafolio principal

---

## Configuración de Supabase

### 1. Instalar Supabase CLI
```bash
npm install -g supabase
supabase login
supabase init  # Si no existe supabase/config.toml
```

### 2. Crear Edge Functions
```bash
supabase functions new etoro-connect
supabase functions new etoro-portfolio
```

### 3. Secrets (NO en código)
```bash
# La encryption key para las API keys de usuarios
supabase secrets set ETORO_ENCRYPTION_KEY="random-32-char-key"
```

### 4. Deploy
```bash
supabase functions deploy etoro-connect
supabase functions deploy etoro-portfolio
```

---

## Seguridad

1. **API Keys encriptadas**: Usar pgcrypto para encriptar las subscription keys
2. **Edge Functions**: Credenciales nunca expuestas al frontend
3. **RLS**: Cada usuario solo accede a sus datos
4. **Rate Limiting**: Limitar syncs a 1 por minuto por usuario
5. **Validación**: Verificar key antes de guardar

---

## Orden de Implementación

### Fase 1: Infraestructura
1. Configurar Supabase CLI en el proyecto
2. Crear tablas `etoro_connections` y `etoro_positions_cache`
3. Crear Edge Function `etoro-connect` básica
4. Crear Edge Function `etoro-portfolio` básica

### Fase 2: Backend (Edge Functions)
5. Implementar cliente eToro compartido
6. Implementar conexión con validación
7. Implementar obtención de portafolio
8. Testear con cuenta demo de eToro

### Fase 3: Frontend
9. Crear `etoro.model.ts` con interfaces
10. Crear `etoro.service.ts` con signals
11. Agregar sección eToro en `inversiones-tab`
12. Crear modal de conexión
13. Implementar lista de posiciones

### Fase 4: Integración
14. Implementar "Importar a Inversiones"
15. Agregar campo `source` a tabla `investments`
16. Sync automático opcional

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/schema.sql` | Agregar tablas etoro_* |
| `src/app/models/index.ts` | Exportar etoro.model |
| `src/app/core/services/index.ts` | Exportar EtoroService |
| `inversiones-tab.component.ts` | Inyectar EtoroService, agregar UI |
| `inversiones-tab.component.html` | Sección eToro |
| `inversiones-tab.component.scss` | Estilos para eToro |

---

## Verificación

1. **Conexión**: Conectar con subscription key válida
2. **Sync**: Ver posiciones de eToro en la UI
3. **Importar**: Posiciones aparecen en portafolio principal
4. **Seguridad**: Verificar que keys están encriptadas en DB
5. **Error handling**: Probar con key inválida, sin conexión, etc.

---

## Notas

- eToro usa **Subscription Key** (header `Ocp-Apim-Subscription-Key`)
- El usuario debe obtener su key desde [eToro API Portal](https://api-portal.etoro.com/)
- Cuenta debe estar verificada para obtener la key
- Hay modo Demo disponible para testing

---

## Referencias

- [eToro API Portal](https://api-portal.etoro.com/)
- [eToro Developer Tools](https://go.etoro.com/en/unlocked/developers)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
