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

El build genera y valida:

- `dist/server/index.js` — Worker de Cloudflare
- `dist/server/wrangler.json` — configuración de despliegue generada
- `dist/.openai/hosting.json` — manifiesto del proyecto

## Publicar en Cloudflare Workers

Después de autenticar Wrangler:

```bash
npm run build
npm run deploy
```

El script `deploy` ejecuta:

```bash
wrangler deploy --config dist/server/wrangler.json
```

### Cloudflare Workers Builds

Si el repositorio está conectado directamente desde Cloudflare, usar:

- Rama de producción: `main`
- Build command: `npm run build`
- Deploy command: `npm run deploy`
- Node.js: 22 o posterior

No usar un directorio de salida estático como `out/` o `public/`: esta aplicación se publica como Cloudflare Worker mediante el artefacto generado por vinext.

## Estado

Es un prototipo sin registro, base de datos ni información persistente.
