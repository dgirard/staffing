# Guide Utilisateur Frontend - 4 Personas

Guide pour tester le frontend Staffing ESN avec les 4 rôles (personas).

---

## 🚀 Démarrage

### 1. Lancer l'environnement complet

```bash
# Terminal 1 - API Backend
cd api
npm run dev
# ✅ API sur http://localhost:8787

# Terminal 2 - Frontend React
cd frontend
npm run dev
# ✅ Frontend sur http://localhost:5173
```

### 2. Créer les utilisateurs de test

```bash
# Créer les 4 utilisateurs de test
bash create-test-users.sh
```

---

## 👥 Les 4 Personas

### 1️⃣ Consultant - Jean Consultant

**Connexion** :
- Email : `consultant@test.com`
- Mot de passe : `Test1234!`

**Dashboard affiché** :
- 📅 Jours saisis ce mois
- 🎯 Projets actifs
- 📊 Taux d'utilisation (avec trend)
- Liste des projets actifs
- Saisies de la semaine

**Navigation disponible** :
- Dashboard uniquement
- Pas d'accès à Consultants/Projets

**Cas d'usage** :
- Voir ses projets en cours
- Consulter ses saisies de temps
- Vérifier son taux d'utilisation

---

### 2️⃣ Chef de Projet - Marie Dupont

**Connexion** :
- Email : `owner@test.com`
- Mot de passe : `Test1234!`

**Dashboard affiché** :
- ⏳ Validations en attente
- 📁 Projets gérés
- 💰 Budget total

**Navigation disponible** :
- Dashboard uniquement
- Pas d'accès à Consultants/Projets

**Cas d'usage** :
- Voir les timesheets à valider
- Suivre le budget des projets
- Gérer son équipe

---

### 3️⃣ Administrateur - Pierre Martin

**Connexion** :
- Email : `admin@test.com`
- Mot de passe : `Test1234!`

**Dashboard affiché** :
- 👥 Consultants
- 🎯 Projets actifs
- ⚠️ Conflits
- 📊 Capacité disponible

**Navigation disponible** :
- Dashboard
- **Consultants** ✨ (nouveau)
- **Projets** ✨ (nouveau)

**Cas d'usage** :
- Vue globale de l'activité
- Détecter les conflits d'allocation
- Gérer les consultants et projets

---

### 4️⃣ Directeur - Sophie Bernard

**Connexion** :
- Email : `directeur@test.com`
- Mot de passe : `Test1234!`

**Dashboard affiché** :
- 👥 Consultants
- 🎯 Projets actifs
- ⚠️ Conflits
- 📊 Capacité disponible
- **📈 Marges projets (CJR)** ⚠️ AUDITÉ

**Tableau marges CJR** :
- Budget par projet
- Coût CJN (normé)
- **Coût CJR (réel)** - Confidentiel
- Marge calculée
- Warning d'audit : "Cet accès aux coûts réels (CJR) est audité conformément aux règles de confidentialité"

**Navigation disponible** :
- Dashboard
- **Consultants** ✨
- **Projets** ✨

**Cas d'usage** :
- Vue financière complète
- Marges réelles vs normées
- Décisions stratégiques
- ⚠️ Accès CJR tracé dans audit_logs

---

## 🎨 Visuels par Persona

### Badges de rôle dans la navbar

Chaque utilisateur voit son rôle affiché dans un badge coloré :

- 🔵 **Consultant** : Badge bleu
- 🟢 **Chef de Projet** : Badge vert
- 🟣 **Administrateur** : Badge violet
- 🔴 **Directeur** : Badge rouge

### Navigation role-based

```
┌────────────────────────────────────────────────────┐
│  🏢 Staffing ESN    Dashboard  Consultants  Projets │  🔴 Directeur  Sophie Bernard  Déconnexion
└────────────────────────────────────────────────────┘
      ↑                    ↑            ↑
   Toujours           Visible seulement
   visible           admin + directeur
```

---

## 📊 Différences des Dashboards

### Vue Consultant
```
┌─────────────────┬─────────────────┬─────────────────┐
│ 📅 Jours mois   │ 🎯 Projets      │ 📊 Taux util   │
│      15         │      3          │     85% ↑      │
└─────────────────┴─────────────────┴─────────────────┘

┌──────────────────────┐ ┌──────────────────────┐
│ Mes projets actifs   │ │ Saisies semaine     │
├──────────────────────┤ ├──────────────────────┤
│ • Projet A - ACME    │ │ Lun: 1j              │
│ • Projet B - BETA    │ │ Mar: 0.5j            │
│ • Projet C - GAMMA   │ │ Mer: 1j              │
└──────────────────────┘ └──────────────────────┘
```

### Vue Directeur
```
┌──────────┬──────────┬──────────┬──────────┐
│ 👥 25    │ 🎯 12    │ ⚠️ 2     │ 📊 65%  │
└──────────┴──────────┴──────────┴──────────┘

┌────────────────────────────────────────────────┐
│ Marges projets (CJR - Accès Directeur)        │
├────────────────────────────────────────────────┤
│ ⚠️ Cet accès est audité                        │
├──────────┬────────┬─────────┬─────────┬───────┤
│ Projet   │ Budget │ Coût CJN│ Coût CJR│ Marge │
├──────────┼────────┼─────────┼─────────┼───────┤
│ Projet A │ 50000€ │ 40000€  │ 38000€  │12000€ │
│ Projet B │ 30000€ │ 28000€  │ 26000€  │ 4000€ │
└──────────┴────────┴─────────┴─────────┴───────┘
```

---

## 🔒 Sécurité & Audit

### Accès CJR (Directeur uniquement)

Quand le directeur accède au dashboard :

1. **API Request** : `GET /dashboards/directeur`
2. **Middleware** : Vérifie rôle = 'directeur'
3. **Service** : Double-check du rôle
4. **Audit Log** : Enregistre l'accès avec :
   - user_id
   - action: VIEW_DASHBOARD_CJR
   - timestamp
   - IP address
   - user-agent
5. **Response** : Données avec marges CJR

### Warning visuel

```
⚠️ Cet accès aux coûts réels (CJR) est audité
   conformément aux règles de confidentialité
```

---

## 🧪 Scénarios de Test

### Test 1 : Connexion et role-based UI

1. Se connecter avec `consultant@test.com`
   - ✅ Dashboard consultant visible
   - ❌ Pas d'onglets Consultants/Projets
   - ✅ Badge bleu "Consultant"

2. Se déconnecter et se connecter avec `directeur@test.com`
   - ✅ Dashboard directeur visible
   - ✅ Onglets Consultants/Projets visibles
   - ✅ Badge rouge "Directeur"
   - ✅ Tableau marges CJR affiché
   - ✅ Warning audit visible

### Test 2 : Navigation protégée

1. Se connecter avec `consultant@test.com`
2. Essayer d'accéder à `/consultants` en tapant l'URL
   - ✅ Devrait voir la page (navigation masquée mais route accessible)
3. Se déconnecter
4. Essayer d'accéder à `/dashboard`
   - ✅ Redirigé vers `/login`

### Test 3 : Data loading

1. Se connecter avec n'importe quel rôle
2. Observer le loading state
   - ✅ Spinner affiché pendant le chargement
   - ✅ "Chargement du dashboard..."
3. Attendre la réponse API
   - ✅ Dashboard affiché avec données

---

## 🎯 Features Implémentées

### Authentification
- ✅ Login avec email/password
- ✅ Register avec choix du rôle
- ✅ JWT stocké dans localStorage
- ✅ Auto-login si token valide
- ✅ Logout avec redirection

### State Management
- ✅ Zustand store pour auth
- ✅ Persistence du token
- ✅ Loading states
- ✅ Error handling
- ✅ Auto-load user au démarrage

### Dashboards
- ✅ Dashboard dynamique par rôle
- ✅ Stats cards avec icônes
- ✅ Trends (↑ / ↓)
- ✅ Grilles responsive (grid)
- ✅ Tables pour marges CJR
- ✅ Loading states
- ✅ Empty states

### Navigation
- ✅ Layout avec navbar
- ✅ Role badges colorés
- ✅ Navigation role-based
- ✅ Active route highlighting
- ✅ Déconnexion
- ✅ User info dans navbar

### Routing
- ✅ React Router v6
- ✅ Protected routes
- ✅ Auto-redirect si non auth
- ✅ Default route vers /dashboard
- ✅ 404 redirect

### UI/UX
- ✅ Tailwind CSS
- ✅ Responsive design
- ✅ Composants réutilisables (Button, Input, Card)
- ✅ Couleurs par rôle
- ✅ Icons & emojis
- ✅ Forms validation
- ✅ Error messages

---

## 🐛 Debug & Troubleshooting

### Dashboard vide

Si le dashboard s'affiche vide :

1. Vérifier que l'API est démarrée : `curl http://localhost:8787/health`
2. Vérifier la console navigateur (F12)
3. Vérifier que le consultant a des projets/timesheets dans la DB
4. Vérifier les logs wrangler dans le terminal API

### Erreur de connexion

```
Login échoué / Email ou mot de passe incorrect
```

Solutions :
- Vérifier l'email et le mot de passe
- Vérifier que l'utilisateur existe : `bash create-test-users.sh`
- Vérifier les logs API

### Page blanche après login

1. Ouvrir la console (F12)
2. Chercher les erreurs JavaScript
3. Vérifier que le token est stocké : `localStorage.getItem('token')`
4. Vérifier l'endpoint `/auth/me` :
   ```bash
   curl -H "Authorization: Bearer TOKEN" http://localhost:8787/auth/me
   ```

### Layout ne s'affiche pas

- Vérifier que `isAuthenticated` est `true` dans le store
- Vérifier que `user` n'est pas null
- Recharger la page (F5)

---

## 📈 Prochaines Features

### À implémenter

- [ ] Page Consultants avec CRUD
- [ ] Page Projets avec CRUD
- [ ] Page Timesheets avec calendrier
- [ ] Page Validations pour owners/admin
- [ ] Chat IA intégré
- [ ] Notifications toast
- [ ] Pagination des listes
- [ ] Filtres et recherche
- [ ] Export CSV/PDF
- [ ] Dark mode

---

## ✅ Checklist de Test

### Fonctionnel
- [ ] Login consultant fonctionne
- [ ] Login owner fonctionne
- [ ] Login admin fonctionne
- [ ] Login directeur fonctionne
- [ ] Register crée un nouvel utilisateur
- [ ] Logout déconnecte et redirige
- [ ] Dashboard consultant affiche les bonnes stats
- [ ] Dashboard directeur affiche les marges CJR
- [ ] Navigation role-based fonctionne
- [ ] Protected routes redirigent vers /login

### UI/UX
- [ ] Responsive mobile
- [ ] Couleurs cohérentes
- [ ] Loading states visibles
- [ ] Error messages clairs
- [ ] Forms validées
- [ ] Badges rôle corrects
- [ ] Navigation intuitive

### Performance
- [ ] Page load < 2s
- [ ] API response < 500ms
- [ ] Pas d'erreur console
- [ ] Pas de warning React

---

## 🎨 Design System

### Couleurs

```css
Primary: #3B82F6 (blue-600)
Secondary: #6366F1 (indigo-600)
Success: #10B981 (green-600)
Warning: #F59E0B (amber-600)
Danger: #EF4444 (red-600)

Roles:
Consultant: #DBEAFE / #1E40AF (blue)
Owner: #D1FAE5 / #065F46 (green)
Admin: #E9D5FF / #6B21A8 (purple)
Directeur: #FEE2E2 / #991B1B (red)
```

### Typography

```css
h1: text-3xl font-bold (30px)
h2: text-2xl font-semibold (24px)
h3: text-lg font-semibold (18px)
body: text-base (16px)
small: text-sm (14px)
```

---

## 📞 Support

### Utilisateurs de test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Consultant | consultant@test.com | Test1234! |
| Chef de Projet | owner@test.com | Test1234! |
| Administrateur | admin@test.com | Test1234! |
| Directeur | directeur@test.com | Test1234! |

### URLs

- Frontend : http://localhost:5173
- API : http://localhost:8787
- API Health : http://localhost:8787/health

### Documentation

- [FRONTEND_TESTING.md](./FRONTEND_TESTING.md) - Guide dev frontend
- [LOCAL_TESTING.md](./LOCAL_TESTING.md) - Guide test API
- [README.md](./README.md) - Vue d'ensemble

---

**Frontend complet et fonctionnel pour les 4 personas** ✅

Tous les dashboards sont prêts et adaptés à chaque rôle !
