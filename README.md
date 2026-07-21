# ALAMO · Sistema de gestión — Bolsas Industriales Álamo

PWA React (Vite) para unir fabricación y administración: pedidos → órdenes de
producción → consumo de materia prima → producto terminado → costeo.
Vistas separadas de **Oficina** y **Planta**. Datos persistidos en el navegador
(localStorage), funciona offline una vez instalada.

## Correr en local
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # genera /dist
npm run preview    # sirve /dist
```

## Deploy en Vercel
1. Subí esta carpeta a un repo de GitHub (ej: `alamo-gestion`).
2. En Vercel: New Project → importás el repo.
3. Framework preset: **Vite** (autodetectado). Build: `npm run build`. Output: `dist`.
4. Deploy. Esperá el estado verde **Ready** antes de abrirla.
5. En iPhone/iPad: Compartir → "Agregar a inicio" para instalarla como app.

> Si actualizás y no ves los cambios: Ajustes → Safari → Avanzado →
> Datos de sitios web, y borrás el sitio. La PWA se autoactualiza igual
> (registerType autoUpdate), pero el caché de Safari a veces se adelanta.

## Datos
- Se guardan en localStorage bajo las claves `alamo.*`.
- Botón **Reiniciar datos** (abajo en el menú) restablece los datos de ejemplo.

## Estructura
- `src/App.jsx` — toda la app (nav, módulos, lógica de producción y consumo).
- Módulos: Inicio, Clientes, Pedidos, Producción, Materia prima, Producto terminado, Costeo.

## Próximos pasos sugeridos
- Remito / orden de despacho con PDF.
- Asignación de operario y turno por máquina.
- Historial de consumos por OP (trazabilidad).
- Migración a multiusuario con Supabase si necesitás sync entre oficina y planta en tiempo real.
