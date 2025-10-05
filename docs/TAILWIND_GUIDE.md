# Guide Tailwind CSS - Projet Staffing ESN

## 🎨 Vue d'ensemble

L'interface utilisateur du projet est construite avec **Tailwind CSS 3.4+**, un framework CSS utility-first qui permet :
- ✅ Développement **ultra-rapide** sans écrire de CSS personnalisé
- ✅ **Cohérence** du design via système de design tokens
- ✅ **Responsive** par défaut avec préfixes breakpoints
- ✅ **Bundle optimisé** : ~10-20 KB en production (purge automatique)
- ✅ **Customisation** facile via tailwind.config.js

---

## 📦 Installation & Configuration

### 1. Installation

```bash
cd frontend
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2. Configuration tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs principales
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Couleurs statuts
        status: {
          draft: '#94a3b8',      // Brouillon - Gris
          submitted: '#f59e0b',  // Soumis - Orange
          validated: '#10b981',  // Validé - Vert
          rejected: '#ef4444',   // Rejeté - Rouge
        }
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
```

### 3. Fichier CSS principal (src/index.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Classes personnalisées avec @layer */
@layer components {
  /* Boutons */
  .btn-primary {
    @apply bg-primary-600 text-white px-4 py-2 rounded-lg font-medium 
           hover:bg-primary-700 active:bg-primary-800 
           transition-colors duration-200
           disabled:opacity-50 disabled:cursor-not-allowed;
  }
  
  .btn-secondary {
    @apply bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium 
           hover:bg-gray-200 active:bg-gray-300 
           transition-colors duration-200;
  }

  .btn-danger {
    @apply bg-red-600 text-white px-4 py-2 rounded-lg font-medium 
           hover:bg-red-700 active:bg-red-800 
           transition-colors duration-200;
  }

  /* Cards */
  .card {
    @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6 
           hover:shadow-md transition-shadow duration-200;
  }

  .card-compact {
    @apply bg-white rounded-lg shadow-sm border border-gray-200 p-4;
  }

  /* Inputs */
  .input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-lg text-sm 
           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
           disabled:bg-gray-100 disabled:cursor-not-allowed
           placeholder:text-gray-400;
  }

  .input-error {
    @apply border-red-500 focus:ring-red-500;
  }

  /* Select */
  .select {
    @apply w-full px-3 py-2 border border-gray-300 rounded-lg text-sm 
           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
           bg-white cursor-pointer;
  }

  /* Badges */
  .badge {
    @apply inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium;
  }

  .badge-success {
    @apply badge bg-green-100 text-green-700 border border-green-300;
  }

  .badge-warning {
    @apply badge bg-yellow-100 text-yellow-700 border border-yellow-300;
  }

  .badge-error {
    @apply badge bg-red-100 text-red-700 border border-red-300;
  }

  /* Loading */
  .spinner {
    @apply animate-spin rounded-full border-2 border-gray-300 border-t-primary-600;
  }
}

/* Animations personnalisées */
@layer utilities {
  .animate-slide-in {
    animation: slideIn 0.3s ease-out;
  }

  .animate-fade-in {
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
}
```

---

## 🎯 Composants UI Réutilisables

### Button Component

```typescript
// components/ui/Button.tsx
import { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  isLoading?: boolean;
}

const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
  secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
  ghost: 'text-gray-700 hover:bg-gray-100',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({ 
  variant = 'primary', 
  size = 'md',
  children, 
  className = '', 
  isLoading,
  disabled,
  ...props 
}: ButtonProps) {
  return (
    <button
      className={`
        rounded-lg font-medium transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <span className="spinner w-4 h-4"></span>
          Chargement...
        </span>
      ) : (
        children
      )}
    </button>
  );
}

// Utilisation
<Button variant="primary" size="lg" onClick={handleSubmit}>
  Soumettre
</Button>
<Button variant="secondary" size="sm" isLoading={loading}>
  Annuler
</Button>
```

### Card Component

```typescript
// components/ui/Card.tsx
import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  actions?: ReactNode;
}

export function Card({ title, subtitle, children, className = '', actions }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {(title || actions) && (
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
          </div>
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

// Utilisation
<Card 
  title="Mes Projets" 
  subtitle="3 projets actifs"
  actions={<Button variant="ghost" size="sm">Voir tout</Button>}
>
  <ProjectList />
</Card>
```

### Input Component

```typescript
// components/ui/Input.tsx
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2 border rounded-lg text-sm
            focus:outline-none focus:ring-2 focus:border-transparent
            disabled:bg-gray-100 disabled:cursor-not-allowed
            placeholder:text-gray-400
            ${error 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:ring-primary-500'
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

// Utilisation
<Input
  label="Email"
  type="email"
  placeholder="vous@exemple.com"
  error={errors.email}
  helperText="Entrez votre email professionnel"
/>
```

### Select Component

```typescript
// components/ui/Select.tsx
import { SelectHTMLAttributes, forwardRef, ReactNode } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, children, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full px-3 py-2 border rounded-lg text-sm
            focus:outline-none focus:ring-2 focus:border-transparent
            bg-white cursor-pointer
            ${error 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-gray-300 focus:ring-primary-500'
            }
            ${className}
          `}
          {...props}
        >
          {children}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

// Utilisation
<Select label="Projet" error={errors.project}>
  <option value="">Sélectionner un projet...</option>
  <option value="alpha">Projet Alpha</option>
  <option value="beta">Projet Beta</option>
</Select>
```

### Badge Component

```typescript
// components/ui/Badge.tsx
import { ReactNode } from 'react';

type Variant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  icon?: string;
}

const variants = {
  success: 'bg-green-100 text-green-700 border-green-300',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  error: 'bg-red-100 text-red-700 border-red-300',
  info: 'bg-blue-100 text-blue-700 border-blue-300',
  neutral: 'bg-gray-100 text-gray-700 border-gray-300',
};

export function Badge({ variant = 'neutral', children, icon }: BadgeProps) {
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-0.5 
      rounded-full text-xs font-medium border
      ${variants[variant]}
    `}>
      {icon && <span>{icon}</span>}
      {children}
    </span>
  );
}

// Utilisation
<Badge variant="success" icon="✅">Validé</Badge>
<Badge variant="warning" icon="⏳">En attente</Badge>
<Badge variant="error" icon="❌">Rejeté</Badge>
```

---

## 📐 Layout Patterns

### Main Layout

```typescript
// layouts/MainLayout.tsx
import { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-xl font-bold text-gray-900">📊 Staffing ESN</h1>
              <nav className="hidden md:flex gap-6">
                <a href="/dashboard" className="text-gray-600 hover:text-gray-900 font-medium">
                  Dashboard
                </a>
                <a href="/timesheet" className="text-gray-600 hover:text-gray-900 font-medium">
                  Timesheet
                </a>
                <a href="/projets" className="text-gray-600 hover:text-gray-900 font-medium">
                  Projets
                </a>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <button className="text-gray-600 hover:text-gray-900">
                🔔
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-medium">
                  JD
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
```

### Grid Responsive

```typescript
// Grille dashboard
<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
  <DashboardCard />
  <DashboardCard />
  <DashboardCard />
  <DashboardCard />
</div>

// Grille 2 colonnes avec sidebar
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* Contenu principal */}
  </div>
  <div className="lg:col-span-1">
    {/* Sidebar */}
  </div>
</div>
```

---

## 🎨 Palette Couleurs

```javascript
// Couleurs système (dans tailwind.config.js)
colors: {
  // Primary (bleu)
  primary: {
    500: '#3b82f6',  // Base
    600: '#2563eb',  // Hover
    700: '#1d4ed8',  // Active
  },
  
  // Statuts
  status: {
    draft: '#94a3b8',      // Brouillon
    submitted: '#f59e0b',  // Soumis
    validated: '#10b981',  // Validé
    rejected: '#ef4444',   // Rejeté
  },
  
  // Gris (par défaut Tailwind)
  gray: { 50, 100, ..., 900 },
  
  // Sémantiques
  success: '#10b981',  // Vert
  warning: '#f59e0b',  // Orange
  error: '#ef4444',    // Rouge
  info: '#3b82f6',     // Bleu
}
```

---

## 📱 Responsive Breakpoints

```typescript
// Breakpoints Tailwind (mobile-first)
// sm: 640px   → Petites tablettes
// md: 768px   → Tablettes
// lg: 1024px  → Desktop
// xl: 1280px  → Large desktop
// 2xl: 1536px → Très large desktop

// Exemples
<div className="
  w-full          // Mobile: pleine largeur
  md:w-1/2        // Tablette: 50%
  lg:w-1/3        // Desktop: 33%
">
  Responsive box
</div>

<div className="
  text-sm         // Mobile: petit
  md:text-base    // Tablette: normal
  lg:text-lg      // Desktop: grand
">
  Responsive text
</div>

// Grid responsive
<div className="
  grid
  grid-cols-1     // Mobile: 1 colonne
  md:grid-cols-2  // Tablette: 2 colonnes
  lg:grid-cols-4  // Desktop: 4 colonnes
  gap-4
">
  ...
</div>
```

---

## ✨ Best Practices

### 1. Extraction de Composants
❌ **Mauvais** : Répétition de classes
```typescript
<button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
  Bouton 1
</button>
<button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
  Bouton 2
</button>
```

✅ **Bon** : Composant réutilisable
```typescript
<Button>Bouton 1</Button>
<Button>Bouton 2</Button>
```

### 2. Classes Conditionnelles
```typescript
// Utiliser clsx ou cn helper
import clsx from 'clsx';

<div className={clsx(
  'px-4 py-2 rounded',
  isActive && 'bg-primary-600 text-white',
  !isActive && 'bg-gray-100 text-gray-700',
  isDisabled && 'opacity-50 cursor-not-allowed'
)}>
  Contenu
</div>
```

### 3. @apply pour Patterns Répétés
```css
/* Utiliser @apply pour créer des classes custom */
@layer components {
  .btn-base {
    @apply px-4 py-2 rounded-lg font-medium transition-colors duration-200;
  }
  
  .btn-primary {
    @apply btn-base bg-primary-600 text-white hover:bg-primary-700;
  }
}
```

---

## 🚀 Optimisation Production

### PurgeCSS Automatique
Tailwind + Vite purgent automatiquement les classes non utilisées :
- **Développement** : ~3 MB (toutes les classes)
- **Production** : ~10-20 KB (uniquement classes utilisées)

### Configuration Vite
```javascript
// vite.config.ts
export default defineConfig({
  css: {
    postcss: './postcss.config.js',
  },
  build: {
    cssMinify: 'lightningcss', // Minification CSS ultra-rapide
  },
});
```

---

## 📚 Ressources

- **Documentation officielle** : https://tailwindcss.com/docs
- **Tailwind UI** (composants payants) : https://tailwindui.com
- **Headless UI** (composants accessibles) : https://headlessui.com
- **Tailwind Play** (playground en ligne) : https://play.tailwindcss.com
- **Tailwind Cheat Sheet** : https://nerdcave.com/tailwind-cheat-sheet

---

## 🎯 Checklist Développement

- [ ] Configuration Tailwind installée et testée
- [ ] Design tokens définis (couleurs, espacements)
- [ ] Composants UI de base créés (Button, Card, Input, etc.)
- [ ] Layout principal implémenté
- [ ] Responsive testé sur mobile/tablette/desktop
- [ ] Classes custom (@apply) pour patterns répétés
- [ ] Build production vérifié (taille CSS ~10-20 KB)
- [ ] Documentation composants maintenue

---

**Guide créé pour** : Projet Staffing ESN
**Stack** : React 18 + TypeScript + Tailwind CSS 3.4+ + Vite
**Date** : Janvier 2025
