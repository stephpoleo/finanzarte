# Finanzarte

App de finanzas personales para usuarios mexicanos.

## Tech Stack

- **Frontend:** Ionic 8 + Angular 20
- **Mobile:** Capacitor 8
- **Backend:** Supabase (Auth + PostgreSQL)

## Instalación

```bash
npm install
npm start
```

## Comandos

```bash
npm start              # Servidor de desarrollo
npm run build          # Build de producción
npx ionic cap sync     # Sincronizar con proyectos nativos
npx ionic cap open android  # Abrir Android Studio
npx ionic cap open ios      # Abrir Xcode
```

## Probar en Móvil (Red Local)

Puedes ver la app en tu teléfono sin instalar nada, usando la misma red WiFi:

### 1. Obtener tu IP local

```bash
# Windows
ipconfig | findstr "IPv4"

# Mac/Linux
ifconfig | grep "inet "
```

### 2. Iniciar servidor accesible en red

```bash
npx ng serve --host 0.0.0.0 --port 4200 --disable-host-check
```

**Explicación de los flags:**
| Flag | Descripción |
|------|-------------|
| `--host 0.0.0.0` | Acepta conexiones desde cualquier IP (no solo localhost) |
| `--port 4200` | Puerto del servidor (cambiable si está ocupado) |
| `--disable-host-check` | Permite acceso desde otros dispositivos sin verificación de host |

### 3. Acceder desde el teléfono

1. Conecta tu teléfono a la **misma red WiFi** que tu computadora
2. Abre el navegador (Chrome, Safari)
3. Ve a: `http://TU_IP:4200` (ej: `http://192.168.1.74:4200`)

> **Tip:** Guarda la URL como acceso directo en tu pantalla de inicio para acceso rápido.

## Configuración de Entorno

1. Copia `src/environments/environment.example.ts` a `environment.ts`
2. Configura las credenciales de Supabase:

```typescript
export const environment = {
  production: false,
  devMode: false, // true para usar datos mock
  supabase: {
    url: 'TU_SUPABASE_URL',
    anonKey: 'TU_SUPABASE_ANON_KEY'
  }
};
```

## Modo Desarrollo

Con `devMode: true` en `environment.ts`:
- Auto-login con usuario mock
- Datos de ejemplo precargados
- No requiere conexión a Supabase

## Base de Datos

El schema de Supabase está en `supabase/schema.sql`. Incluye:
- Tablas con Row Level Security (RLS)
- Triggers para creación automática de perfil
- Vistas y funciones auxiliares

## Licencia

MIT
