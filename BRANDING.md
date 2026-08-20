# Raquetas Canarias — Branding Guide

## Paleta de Colores

### Volcanic (Grises — inspirados en lava volcánica)
| Token | Hex |
|-------|-----|
| volcanic-50 | `#f7f7f7` |
| volcanic-100 | `#e3e3e3` |
| volcanic-200 | `#c8c8c8` |
| volcanic-300 | `#a4a4a4` |
| volcanic-400 | `#818181` |
| volcanic-500 | `#666666` |
| volcanic-600 | `#515151` |
| volcanic-700 | `#434343` |
| volcanic-800 | `#383838` |
| volcanic-900 | `#1a1a1a` |
| volcanic-950 | `#0d0d0d` |

### Lava (Naranja volcánico — color primario)
| Token | Hex |
|-------|-----|
| lava-50 | `#fef3ed` |
| lava-100 | `#fde3d2` |
| lava-200 | `#fac5a4` |
| lava-300 | `#f59e6b` |
| lava-400 | `#ef7632` |
| lava-500 | `#e85d2c` |
| lava-600 | `#d94420` |
| lava-700 | `#b4331b` |
| lava-800 | `#902b1e` |
| lava-900 | `#74271c` |

### Sand (Beige arena — fondos)
| Token | Hex |
|-------|-----|
| sand-50 | `#fdfcfa` |
| sand-100 | `#faf6f0` |
| sand-200 | `#f5ece0` |
| sand-300 | `#ecdbc8` |
| sand-400 | `#dfc4a7` |
| sand-500 | `#d4ad8a` |
| sand-600 | `#c4956e` |
| sand-700 | `#a97a58` |
| sand-800 | `#8a644a` |
| sand-900 | `#72533f` |

### Atlantic (Azul océano — acentos)
| Token | Hex |
|-------|-----|
| atlantic-50 | `#edf6fa` |
| atlantic-100 | `#d2eaf3` |
| atlantic-200 | `#a9d8ea` |
| atlantic-300 | `#72bedb` |
| atlantic-400 | `#3d9fc8` |
| atlantic-500 | `#1b6b93` |
| atlantic-600 | `#175980` |
| atlantic-700 | `#164969` |
| atlantic-800 | `#173e58` |
| atlantic-900 | `#18354a` |

---

## Tokens Semánticos (Light Theme)

| Token | Valor |
|-------|-------|
| background | `sand-50` (#fdfcfa) |
| foreground | `volcanic-900` (#1a1a1a) |
| primary | `lava-500` (#e85d2c) |
| primary-foreground | `white` |
| secondary | `sand-100` (#faf6f0) |
| secondary-foreground | `volcanic-800` (#383838) |
| accent | `atlantic-500` (#1b6b93) |
| accent-foreground | `white` |
| muted | `sand-100` (#faf6f0) |
| muted-foreground | `volcanic-400` (#818181) |
| border | `sand-300` (#ecdbc8) |
| ring | `lava-400` (#ef7632) |
| destructive | `#dc2626` |
| destructive-foreground | `white` |

---

## Admin Dark Theme

| Token | Hex |
|-------|-----|
| admin-bg | `#0d0d0d` |
| admin-surface | `#1a1a1a` |
| admin-border | `#2d2d2d` |
| admin-text | `#f0f0f0` |
| admin-muted | `#666666` |
| admin-success | `#22c55e` |
| admin-warning | `#f59e0b` |
| admin-danger | `#dc2626` |
| admin-info | `atlantic-400` (#3d9fc8) |

---

## Tipografía

### Fuentes

| Rol | Font Family | Variable | Pesos |
|-----|-------------|----------|-------|
| Sans (cuerpo) | DM Sans | `--font-dm-sans` | 300, 400, 500, 600, 700 |
| Display (títulos) | Space Grotesk | `--font-space-grotesk` | 400, 500, 600, 700 |
| Mono (código) | JetBrains Mono | `--font-jetbrains-mono` | 400, 500, 600 |

### Uso CSS

```css
font-family: var(--font-sans), ui-sans-serif, system-ui, sans-serif;
font-family: var(--font-display);
font-family: var(--font-mono);
```

---

## Utilidades CSS

### Container

```css
.container-main {
  width: 100%;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 1.25rem;
  padding-right: 1.25rem;
}

@media (min-width: 640px) {
  .container-main {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

@media (min-width: 1024px) {
  .container-main {
    padding-left: 3rem;
    padding-right: 3rem;
  }
}
```

### Scrollbar Oculto

```css
.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
```

### Focus Visible

```css
*:focus-visible {
  outline: 2px solid var(--color-lava-400);
  outline-offset: 2px;
}
```

### Clip Diagonal (Hero)

```css
.clip-diagonal {
  clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%);
}

@media (min-width: 1024px) {
  .clip-diagonal {
    clip-path: polygon(0 0, 100% 0, 100% 80%, 0 100%);
  }
}
```

---

## Animaciones

### Marquee

```css
@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.animate-marquee {
  animation: marquee 30s linear infinite;
}
```

### Scroll Snap

```css
.scroll-snap-x {
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.scroll-snap-x > * {
  scroll-snap-align: start;
}
```

---

## Configuración Base

- **Framework:** Next.js 16.3.0
- **CSS:** Tailwind CSS v4
- **Color Scheme:** Light
- **Smooth Scroll:** `html { scroll-behavior: smooth; }`
- **Antialiasing:** `-webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`
