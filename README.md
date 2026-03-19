# LicenseHub — Comparador de Mayoristas Microsoft

App web minimalista para comparar precios de licencias Microsoft entre **LOL**, **INTCOMEX** e **INGRAM**.

---

## 🚀 Stack

- **Frontend:** HTML + CSS + Vanilla JS (sin frameworks, 0 dependencias)
- **Base de datos:** `products.json` estático (10,916 productos)
- **Hosting sugerido:** GitHub Pages, Netlify, Vercel o servidor local

---

## 📁 Estructura del proyecto

```
licensehub/
├── index.html          ← App principal (responsive, mobile-first)
├── products.json       ← Base de datos de productos (generado del script)
├── extract_data.py     ← Script para regenerar products.json desde Excel
├── README.md
└── .gitignore
```

---

## ⚙️ Funcionalidades

- 🔍 Búsqueda en tiempo real por nombre de producto
- 🏷️ Filtros por tipo (NCE, Suscripción, Perpetuo), segmento y periodo
- 📊 **Tabla por mayorista** (LOL / INTCOMEX / INGRAM) con comparación side-by-side
- 💡 Indicador de **mejor precio** entre mayoristas
- 💰 Configuración de **rentabilidad %** y **cantidad**
- 💱 Conversión USD ↔ COP con TRM ajustable
- 📱 Totalmente responsive (móvil y desktop)

---

## 🛠️ Setup local

```bash
# 1. Clona el repo
git clone https://github.com/TU_USUARIO/licensehub.git
cd licensehub

# 2. Serve localmente (necesitas un servidor HTTP, no abrir index.html directo por CORS)
# Opción A — Python
python3 -m http.server 8080

# Opción B — Node.js
npx serve .

# Opción C — VS Code
# Instala la extensión "Live Server" y haz clic en "Go Live"

# 3. Abre http://localhost:8080
```

---

## 🔄 Actualizar los datos de precios

Cuando recibas nuevas listas de precios en Excel:

```bash
# 1. Reemplaza los archivos Excel en la carpeta data/
cp nuevas_listas/*.xlsx data/

# 2. Regenera el JSON
python3 extract_data.py

# 3. Commit y push
git add products.json
git commit -m "Update: listas de precios Abril 2026"
git push
```

---

## 🌐 Deploy en GitHub Pages

```bash
# 1. Crea el repositorio en GitHub

# 2. Inicializa Git
git init
git add .
git commit -m "Initial commit: LicenseHub"

# 3. Conecta y sube
git remote add origin https://github.com/TU_USUARIO/licensehub.git
git branch -M main
git push -u origin main

# 4. En GitHub → Settings → Pages → Source: main / (root)
# Tu app estará en: https://TU_USUARIO.github.io/licensehub
```

---

## 🌐 Deploy en Netlify (alternativa, más fácil)

```bash
# Opción A — Drop & Deploy
# Ve a https://app.netlify.com/drop
# Arrastra la carpeta del proyecto → listo

# Opción B — Netlify CLI
npm install -g netlify-cli
netlify deploy --prod --dir .
```

---

## 🔧 Personalización

### Cambiar el porcentaje de rentabilidad por defecto
En `index.html`, busca:
```html
<input type="number" id="profitPct" ... value="20" ...>
```
Cambia `value="20"` al porcentaje que prefieras.

### Cambiar la TRM por defecto
```html
<input type="number" id="trmInput" ... value="4200" ...>
```

### Agregar un nuevo mayorista
1. En `extract_data.py`, agrega la lógica de lectura del nuevo Excel
2. Asegúrate de que cada producto tenga `distributor: "NUEVO_MAYORISTA"`
3. En `index.html`, agrega el chip de filtro y el color en `DIST_COLORS`

---

## 📝 .gitignore

```
*.xlsx
__pycache__/
.DS_Store
node_modules/
```

---

## 📊 Estructura de `products.json`

```json
[
  {
    "distributor": "LOL",           // LOL | INTCOMEX | INGRAM
    "type": "NCE",                  // NCE | SUSCRIPCION | PERPETUO
    "partNumber": "CFQ7TTC...",
    "name": "Microsoft 365 Business Basic",
    "term": "P1Y",                  // P1M | P1Y | P3Y | OneTime | Anual | Mensual
    "billing": "Annual",            // Annual | Monthly | Triennial | OneTime
    "price": 6.00,                  // Precio mayorista en USD
    "erp": 8.00,                    // Precio sugerido de reventa (cuando aplica)
    "segment": "Commercial"         // Commercial | Education | Charity
  }
]
```
