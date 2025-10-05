# 🏗️ Guide des Chantiers - Développement IA Séquentiel

## 📘 Introduction

Bienvenue ! Ce guide explique comment travailler sur le projet **Staffing ESN** en mode chantier. Le projet est découpé en **12 chantiers séquentiels** qui peuvent être développés par différentes IA.

Chaque chantier est **autonome**, **documenté** et **validable**. Vous pouvez reprendre le projet à n'importe quel chantier grâce au système de handoff.

---

## 🎯 Objectifs du système de chantiers

✅ **Continuité** - Permettre à différentes IA de travailler successivement
✅ **Traçabilité** - Historique complet de chaque étape
✅ **Validation** - Tests automatiques à chaque transition
✅ **Autonomie** - Documentation auto-suffisante
✅ **Flexibilité** - Possibilité de changer d'IA entre chantiers

---

## 📂 Structure des fichiers

```
/chantiers/
├── _GUIDE_CHANTIERS.md          ← Vous êtes ici !
├── _TEMPLATE_HANDOFF.md         ← Template de rapport de transition
├── _ETAT_GLOBAL.json            ← État machine du projet
├── CHANTIER_00_setup.md         ← Infrastructure Cloudflare
├── CHANTIER_01_auth.md          ← Auth JWT + RBAC
├── CHANTIER_02_database.md      ← Base de données D1
├── CHANTIER_03_crud_base.md     ← CRUD Consultants + Projets
├── CHANTIER_04_interventions.md ← Allocations consultants
├── CHANTIER_05_timesheet.md     ← Saisie temps demi-journée
├── CHANTIER_06_validation.md    ← Workflow validation
├── CHANTIER_07_dashboards.md    ← Dashboards standard
├── CHANTIER_08_directeur.md     ← Dashboard Directeur (CJR/CJN)
├── CHANTIER_09_chat.md          ← Chat Gemini API
├── CHANTIER_10_mcp.md           ← MCP Server
├── CHANTIER_11_deploy.md        ← Tests + déploiement
└── handoffs/                     ← Rapports de handoff
    ├── HANDOFF_00_to_01.md
    ├── HANDOFF_01_to_02.md
    └── ...
```

---

## 🚀 Comment démarrer un chantier

### Étape 1 : Identifier le chantier actuel

```bash
# Lire l'état global du projet
cat chantiers/_ETAT_GLOBAL.json
```

Le fichier `_ETAT_GLOBAL.json` indique :
- Quel chantier est en cours
- Quels chantiers sont complétés
- L'état de l'infrastructure
- Les fichiers clés créés
- L'état des tests

### Étape 2 : Lire le handoff du chantier précédent

```bash
# Si vous démarrez le chantier 03, lisez le handoff 02→03
cat chantiers/handoffs/HANDOFF_02_to_03.md
```

Ce fichier contient :
- ✅ Ce qui a été fait au chantier précédent
- 📁 Fichiers créés/modifiés
- ⚙️ Configuration Cloudflare
- ⚠️ Problèmes rencontrés
- 📝 Instructions spécifiques pour vous

### Étape 3 : Lire votre chantier

```bash
# Lire le fichier du chantier en cours
cat chantiers/CHANTIER_03_crud_base.md
```

Chaque chantier contient 8 sections :

1. **📋 Contexte et objectifs** - Ce que vous devez accomplir
2. **🔗 Dépendances** - Ce qui doit être complété avant
3. **📦 État initial attendu** - Fichiers et config à vérifier
4. **✅ Tâches détaillées** - Liste précise des actions
5. **🛠️ Technologies et patterns** - Comment implémenter
6. **📤 Livrables** - Fichiers à créer/modifier
7. **🧪 Tests de validation** - Comment vérifier le succès
8. **🔄 Handoff** - Informations à transmettre au chantier suivant

### Étape 4 : Vérifier l'état initial

Avant de coder, **vérifiez les dépendances** :

```bash
# Vérifier que les fichiers attendus existent
ls -la api/src/
ls -la frontend/src/

# Vérifier les dépendances npm
cd api && npm list
cd frontend && npm list

# Tester que l'infra fonctionne
cd api && npx wrangler dev --local

# Lancer les tests existants
npm test
```

✅ Si tout est OK → Vous pouvez démarrer
❌ Si quelque chose manque → Lire le handoff précédent ou revenir au chantier précédent

---

## 💻 Développement du chantier

### Bonnes pratiques

#### 1. Suivre l'ordre des tâches

Chaque chantier liste les tâches dans un **ordre optimal**. Respectez cet ordre pour éviter les blocages.

#### 2. Tester en continu

Ne pas attendre la fin du chantier pour tester :

```bash
# Tests unitaires
npm test

# Tests d'intégration
npm run test:integration

# Test local
npx wrangler dev --local
```

#### 3. Commiter régulièrement

```bash
# Faire des commits atomiques
git add api/src/routes/consultants.ts
git commit -m "chantier-03: Add GET /api/consultants endpoint"

git add api/src/routes/consultants.ts
git commit -m "chantier-03: Add POST /api/consultants endpoint"
```

Convention de commit : `chantier-XX: Description`

#### 4. Documenter le code

```typescript
/**
 * Crée un nouveau consultant avec validation CJN/CJR
 *
 * RBAC: administrator, directeur only
 * Audit: Log création + accès CJR si directeur
 *
 * @chantier 03
 */
export async function createConsultant(data: ConsultantInput) {
  // ...
}
```

#### 5. Respecter l'architecture

- **API** : Hono + Cloudflare Workers
- **Frontend** : React 18 + Tailwind CSS
- **DB** : D1 SQLite
- **Auth** : JWT + middleware RBAC
- **AI** : Gemini API (via Cloudflare Secrets)

---

## 🧪 Validation du chantier

Chaque chantier définit ses **critères de validation**. Vous devez **tous** les valider avant de passer au suivant.

### Tests automatiques

```bash
# Lancer les tests du chantier
npm run test:chantier-03

# Vérifier le coverage
npm run test:coverage
```

### Tests manuels

Suivre la section "🧪 Tests de validation" du chantier.

Exemple pour le chantier 03 (CRUD Consultants) :

```bash
# 1. Créer un consultant via API
curl -X POST http://localhost:8787/api/consultants \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Dupont",
    "prenom": "Jean",
    "profil_seniority": "senior",
    "cjn": 450,
    "cjr": 380
  }'

# 2. Lister les consultants
curl http://localhost:8787/api/consultants \
  -H "Authorization: Bearer $TOKEN"

# 3. Vérifier que CJR n'est PAS visible pour role=administrator
# 4. Vérifier que CJR EST visible pour role=directeur
```

### Checklist de validation

Avant de créer le handoff, vérifier :

- [ ] Toutes les tâches du chantier sont complétées
- [ ] Tous les tests automatiques passent (✅ green)
- [ ] Tous les tests manuels sont validés
- [ ] Le code est commité avec des messages clairs
- [ ] La documentation inline est présente
- [ ] Aucun secret n'est exposé dans le code
- [ ] Le code respecte les patterns de l'architecture
- [ ] Les livrables sont tous créés

---

## 🔄 Créer le handoff

Une fois le chantier validé, **créez le rapport de handoff** pour l'IA suivante.

### 1. Copier le template

```bash
cp chantiers/_TEMPLATE_HANDOFF.md \
   chantiers/handoffs/HANDOFF_03_to_04.md
```

### 2. Remplir le template

Suivez les instructions dans `_TEMPLATE_HANDOFF.md`. Sections obligatoires :

- ✅ **Tâches accomplies** avec preuves (commits, tests)
- 📊 **Fichiers créés/modifiés** avec chemins exacts
- 🔗 **Dépendances installées** (npm packages)
- ⚙️ **Configuration Cloudflare** (secrets, bindings, variables)
- 🧪 **Résultats des tests** (captures, logs)
- ⚠️ **Problèmes rencontrés** et solutions appliquées
- 📝 **Instructions pour l'IA suivante**
- 🎯 **État attendu pour le chantier suivant**

### 3. Mettre à jour l'état global

```bash
# Éditer _ETAT_GLOBAL.json
nano chantiers/_ETAT_GLOBAL.json
```

Marquer le chantier comme complété :

```json
{
  "chantier_actuel": "CHANTIER_04_interventions",
  "chantiers_completes": ["00", "01", "02", "03"],
  "dernier_handoff": "handoffs/HANDOFF_03_to_04.md",
  ...
}
```

### 4. Commiter le handoff

```bash
git add chantiers/handoffs/HANDOFF_03_to_04.md
git add chantiers/_ETAT_GLOBAL.json
git commit -m "chantier-03: Handoff vers chantier 04 (interventions)"
git push origin main
```

---

## 📚 Ressources et documentation

### Documentation projet

- **Spec complète** : `/docs/spec-staffing-esn-finale.md`
- **Quickstart dev** : `/docs/QUICKSTART.md`
- **Guide Tailwind** : `/docs/TAILWIND_GUIDE.md`
- **README** : `/docs/README.md`

### Documentation technique

- **Cloudflare Workers** : https://developers.cloudflare.com/workers/
- **D1 Database** : https://developers.cloudflare.com/d1/
- **Hono Framework** : https://hono.dev/
- **React 18** : https://react.dev/
- **Tailwind CSS** : https://tailwindcss.com/
- **Gemini API** : https://ai.google.dev/docs

### Commandes utiles

```bash
# Développement local
cd api && npx wrangler dev --local        # API local
cd frontend && npm run dev                # Frontend local

# Base de données
npx wrangler d1 list                      # Lister DBs
npx wrangler d1 execute staffing-db \
  --command="SELECT * FROM users"         # Query DB

# Secrets
npx wrangler secret list                  # Lister secrets
npx wrangler secret put GEMINI_API_KEY    # Créer secret

# Déploiement
npx wrangler deploy                       # Deploy API
npx wrangler pages deploy dist            # Deploy Frontend

# Tests
npm test                                  # Tests unitaires
npm run test:e2e                          # Tests E2E
npm run test:coverage                     # Coverage
```

---

## 🆘 Résolution de problèmes

### Erreur : "Database not found"

```bash
# Vérifier que la DB D1 existe
npx wrangler d1 list

# Créer la DB si besoin
npx wrangler d1 create staffing-db

# Vérifier le binding dans wrangler.toml
cat api/wrangler.toml
```

### Erreur : "JWT secret not configured"

```bash
# Créer le secret
npx wrangler secret put JWT_SECRET
# Entrer une string aléatoire de 32+ caractères
```

### Erreur : "CORS error"

Vérifier que le middleware CORS est configuré dans `api/src/index.ts` :

```typescript
app.use('*', cors({
  origin: ['http://localhost:5173', 'https://votre-domaine.com'],
  credentials: true
}));
```

### Tests qui échouent

```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install

# Vérifier les versions
node --version  # devrait être v20+
npm --version   # devrait être 10+

# Relancer les tests en verbose
npm test -- --verbose
```

### Problème de handoff

Si le handoff précédent est incomplet :

1. Lire le fichier `_ETAT_GLOBAL.json`
2. Vérifier quels chantiers sont marqués comme complétés
3. Lire le dernier handoff disponible
4. Si nécessaire, revenir au chantier précédent et le re-valider

---

## 🎯 Règles d'or

### 1. **Lire avant de coder**

📖 Toujours lire :
- Le handoff précédent
- Le chantier en cours
- L'état global du projet

### 2. **Valider avant de passer au suivant**

🧪 Ne **jamais** passer au chantier suivant sans avoir :
- ✅ Tous les tests verts
- ✅ Tous les livrables créés
- ✅ Le handoff complété

### 3. **Documenter pour l'IA suivante**

📝 Rédiger le handoff comme si vous expliquiez à un humain :
- Soyez précis sur ce qui a été fait
- Mentionnez les problèmes et solutions
- Indiquez clairement ce qui reste à faire

### 4. **Respecter l'architecture**

🏗️ Ne pas dévier de l'architecture définie :
- Utiliser Hono pour l'API
- Utiliser D1 pour la DB
- Utiliser Tailwind pour le CSS
- Utiliser Gemini API pour le chat
- Respecter le pattern RBAC pour les permissions

### 5. **Tester en continu**

🔧 Ne pas attendre la fin pour tester :
- Tests unitaires après chaque fonction
- Tests d'intégration après chaque endpoint
- Tests manuels après chaque feature

---

## 📞 Support

Si vous êtes bloqué :

1. Relire le chantier en cours
2. Vérifier l'état global
3. Relire le handoff précédent
4. Consulter la documentation projet dans `/docs/`
5. Consulter la documentation technique officielle

---

## 🎉 Conclusion

Vous êtes maintenant prêt à travailler sur votre chantier !

**Prochaines étapes** :

1. ✅ Lire `_ETAT_GLOBAL.json`
2. ✅ Lire le handoff du chantier précédent
3. ✅ Lire votre chantier (`CHANTIER_XX_nom.md`)
4. ✅ Vérifier l'état initial
5. ✅ Développer les tâches
6. ✅ Valider avec les tests
7. ✅ Créer le handoff
8. ✅ Mettre à jour l'état global

**Bon développement ! 🚀**

---

_Guide créé le : Janvier 2025_
_Version : 1.0_
_Projet : Staffing ESN_
