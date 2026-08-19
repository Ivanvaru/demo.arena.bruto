# Arena de Brutos — Demo

Demo web de un combate automático entre dos luchadores, inspirada en los juegos de navegador clásicos.

## Funciones

- Combate automático con turnos alternos
- Daño y ganador aleatorios
- Barras de vida animadas
- Botón para repetir el combate
- Diseño adaptable a ordenador y móvil

## Desarrollo local

Requiere Node.js 22 o posterior.

```bash
npm ci
npm run dev
```

## Compilar

```bash
npm run build
```

## Publicar en Cloudflare Workers

Después de iniciar sesión con Wrangler:

```bash
npm run deploy
```

La compilación genera un Worker de Cloudflare y sus recursos estáticos dentro de `dist/`.

## Estado

Es un prototipo sin registro, base de datos ni información persistente.
