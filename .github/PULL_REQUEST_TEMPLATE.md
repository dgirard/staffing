# Pull Request - Chantier XX

## 📋 Informations

- **Chantier** : CHANTIER_XX_nom
- **Type** : 🚀 Feature / 🐛 Bugfix / 📚 Documentation / ⚙️ Configuration
- **Lien vers spec** : `chantiers/CHANTIER_XX_nom.md`

## 📝 Description

<!-- Décrire brièvement les changements apportés -->

## ✅ Checklist de completion

### Code
- [ ] Code écrit selon les specs du chantier
- [ ] Tous les fichiers listés dans le chantier sont créés
- [ ] RBAC correctement implémenté (si applicable)
- [ ] Validation des données avec Zod
- [ ] Gestion d'erreurs appropriée

### Tests
- [ ] Tests unitaires écrits (coverage ≥85% API, ≥80% Frontend)
- [ ] Tests d'intégration écrits
- [ ] Tests E2E écrits (si applicable)
- [ ] Tous les tests passent localement
- [ ] Pas de régression détectée

### Documentation
- [ ] Code commenté (fonctions complexes)
- [ ] Handoff créé : `chantiers/handoffs/HANDOFF_XX.md`
- [ ] `_ETAT_GLOBAL.json` mis à jour
- [ ] README mis à jour (si applicable)

### Qualité
- [ ] `npm run typecheck` passe (0 erreurs)
- [ ] `npm run lint` passe (0 erreurs)
- [ ] Pas de secrets/clés en dur dans le code
- [ ] Variables d'environnement dans `.dev.vars.example`

### CI/CD
- [ ] Pipeline GitHub Actions passe ✅
- [ ] Coverage minimum atteint
- [ ] Security checks passent
- [ ] Build réussit

## 🧪 Tests

### Commandes exécutées
```bash
# Tests unitaires
npm run test

# Coverage
npm run test:coverage

# Tests E2E (si applicable)
npm run test:e2e

# TypeCheck
npm run typecheck
```

### Résultats
<!-- Coller les résultats des tests -->

```
# Exemple
✓ src/auth/auth.service.test.ts (15 tests) 482ms
✓ src/auth/middleware.test.ts (8 tests) 234ms

Coverage: 92% statements, 88% branches, 95% functions, 91% lines
```

## 📦 Fichiers créés/modifiés

### Nouveaux fichiers
- `api/src/...`
- `frontend/src/...`

### Fichiers modifiés
- `api/wrangler.toml` (configuration)
- `chantiers/_ETAT_GLOBAL.json` (état projet)

## 🔗 Dépendances

### Bloqué par
- [ ] CHANTIER_XX (si applicable)

### Débloque
- [ ] CHANTIER_YY (prochain chantier)

## 🚨 Points d'attention

<!-- Lister les problèmes rencontrés, décisions techniques importantes, ou points nécessitant review -->

- Aucun / À compléter

## 📸 Screenshots (optionnel)

<!-- Si UI changes, ajouter des captures d'écran -->

## 🔍 Review checklist (pour reviewer)

- [ ] Code suit les conventions du projet
- [ ] Tests sont pertinents et suffisants
- [ ] Documentation est claire
- [ ] Pas de faille de sécurité évidente
- [ ] Performance acceptable
- [ ] Compatible avec les specs du chantier

---

**Handoff créé** : `chantiers/handoffs/HANDOFF_XX.md` ✅
