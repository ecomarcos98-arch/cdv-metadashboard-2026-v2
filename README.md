# CDV — Meta Ads Dashboard

Dashboard web para visualizar métricas de campañas de Meta Ads.

## Setup local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Deploy en Vercel

1. Subir este repo a GitHub
2. Conectar en [vercel.com](https://vercel.com)
3. Agregar variable de entorno:
   ```
   NEXT_PUBLIC_SHEET_CSV_URL_cdv=https://docs.google.com/spreadsheets/d/XXXXX/pub?gid=YYYYY&single=true&output=csv
   ```
4. Deploy automático en cada push a `main`

## Cómo publicar el Google Sheet como CSV

1. Abrir el Google Sheet
2. Archivo → Compartir → Publicar en la web
3. Seleccionar la hoja correcta → CSV
4. Copiar la URL generada
5. Pegarla en la variable de entorno de Vercel

## Stack

- Next.js 14 (App Router)
- React 18 + Tailwind CSS
- Recharts (gráficos)
- @dnd-kit (drag & drop)
- PapaParse (CSV parsing)
- date-fns (fechas)
