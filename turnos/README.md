# Turnos: plantilla de reservas de turnos

Una sola app de turnos para cualquier negocio con agenda (clínicas dentales, barberías, kinesiólogos…).
Lo único que cambia entre rubros es un archivo de configuración.

## Probarla

```bash
npm install
npm run dev          # clínica dental (Aurora Dental), http://localhost:3000
CLINIC=barberia-norte npm run dev   # la misma app como barbería
```

En PowerShell: `$env:CLINIC="barberia-norte"; npm run dev`.

- `/`: inicio con servicios, equipo, horarios y contacto
- `/reservar`: el paciente elige servicio, profesional, día y hora, y deja sus datos
- `/turno/<código>`: confirmación, agregar al calendario y cancelar
- `/admin`: agenda por día, estados (confirmado, completado, no vino, cancelado) y turno manual

## Crear otro negocio

1. Copiar `clinics/aurora-dental/clinic.ts` a `clinics/<slug>/clinic.ts`.
2. Cambiar nombre, colores, servicios (con duración y precio), profesionales y sus horarios.
3. Registrarlo en `lib/clinic.ts`.

## Cómo funciona la disponibilidad

`lib/slots.ts` genera los horarios libres de cada profesional: ventanas de trabajo del día, cortadas cada
`slotStepMinutes`, sin pisar turnos existentes (un turno cancelado libera el horario) y respetando
`leadMinutes` (aviso mínimo) y `bookingWindowDays` (cuántos días hacia adelante). Al confirmar, `createAppointment`
vuelve a validar todo, porque la pantalla puede estar desactualizada.

## Es una demo

Los turnos se guardan en el `localStorage` del navegador (`lib/appointments.ts`) y no se envía nada. El panel no
tiene login. Para un cliente real hay que cambiar ese módulo por:

- Base de datos (por ejemplo Supabase Postgres) con una restricción que impida dos turnos solapados del mismo profesional.
- Login para `/admin`.
- Mails de confirmación y recordatorio 24 h antes (por ejemplo Resend), con un link firmado para cancelar.
- Actualización del panel en vivo (polling o Supabase Realtime; Socket.io no funciona en Vercel).
