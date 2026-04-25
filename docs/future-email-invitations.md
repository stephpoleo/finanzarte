# Invitaciones por correo electrónico (Plan futuro)

## Objetivo
Enviar un email profesional de invitación cuando un usuario invita a su pareja y esta no tiene cuenta en Finanzarte.

## Requisitos

### 1. Dominio propio
- Registrar un dominio (ej: `finanzarte.com`, `finanzarte.app`)
- Costo aprox: ~$10-15 USD/año

### 2. Resend (servicio de email)
- Cuenta en [resend.com](https://resend.com) (plan gratuito: 3,000 emails/mes)
- Verificar el dominio en Resend (agregar registros DNS: MX, SPF, DKIM)
- Obtener API key

### 3. Configuración en Vercel
- Variable de entorno: `RESEND_API_KEY`

## Implementación

### API Route (ya existe)
El archivo `api/send-invitation.js` ya tiene la implementación completa:
- Recibe `invited_email`, `invited_by_name`, `household_name`
- Genera HTML con branding de Finanzarte (gradiente morado/azul)
- Envía via Resend API

### Cambios necesarios

1. **`api/send-invitation.js`** - Cambiar el `from`:
   ```js
   // Cambiar de:
   from: `Finanzarte <onboarding@resend.dev>`
   // A:
   from: `Finanzarte <noreply@tudominio.com>`
   ```

2. **`household.service.ts`** - Agregar llamada al API después de crear la invitación:
   ```typescript
   // Después de crear la invitación, si el usuario no está registrado:
   if (!isRegistered) {
     try {
       await fetch('/api/send-invitation', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           invited_email: email,
           invited_by_name: inviterName,
           household_name: household.name
         })
       });
     } catch (e) {
       console.warn('Email failed, share was already offered');
     }
   }
   ```

3. Considerar enviar el email **además** del Share nativo (no en reemplazo), para que el usuario reciba tanto el mensaje de WhatsApp como el email profesional.

## Diseño del email
El template HTML ya está en `api/send-invitation.js` con:
- Header con logo "Finanzarte"
- Card con gradiente morado/azul mostrando quién invita
- Descripción de beneficios
- Instrucciones para registrarse
- Footer con disclaimer

## Pasos para activar
1. Comprar dominio
2. Crear cuenta en Resend y verificar dominio (~15 min)
3. Agregar `RESEND_API_KEY` en Vercel
4. Actualizar `from` en `api/send-invitation.js`
5. Agregar llamada al API en `household.service.ts`
6. Deploy
