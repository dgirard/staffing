# 📘 Outil de Staffing ESN - Documentation Projet

## 🎯 Vue d'ensemble

Spécification complète d'un **outil de staffing moderne** pour ESN de 50 personnes, alliant simplicité, économie et innovation technologique.

---

## 📄 Document Principal

### [📋 Spécification Complète](./spec-staffing-esn-finale.md)

**Contenu** : Document unique de 48 Ko contenant l'intégralité du projet
- 15 sections couvrant tous les aspects (fonctionnel, technique, budget, roadmap)
- 70+ pages de spécifications détaillées
- Prêt pour démarrage développement immédiat

---

## 🚀 Résumé du Projet

### Objectifs Business
- **Maximiser l'utilisation** des consultants (objectif 70-75%)
- **Optimiser les marges** projets (35-50% selon profil)
- **Simplifier la gestion** du staffing quotidien
- **ROI rapide** : 228% en année 1, payback 5.3 mois

### Innovation Différenciante

#### 1️⃣ Saisie à la Demi-Journée
Au lieu de saisir des heures précises, les consultants saisissent :
- ☀️ **Matin** = 0.5 jour
- 🌙 **Après-midi** = 0.5 jour
- 📅 **Journée** = 1.0 jour

**Avantage** : Saisie en 30 secondes vs 5 minutes, interface mobile optimale

#### 2️⃣ Chat Conversationnel
80% des actions via langage naturel :
```
💬 "Saisi 1 jour projet Alpha aujourd'hui"
💬 "Valider tous les timesheets en attente"
💬 "Quelle est la marge réelle du projet X ?"
```

**Technologie** : Google Gemini API intégrée à Cloudflare Workers (clé stockée dans Cloudflare Secrets)

#### 3️⃣ Double Système de Coûts
- **CJR** (Coût Journalier Réel) : Salaire réel → **Directeurs uniquement**
- **CJN** (Coût Journalier Normé) : Grille standard → Autres utilisateurs

**Avantage** : Confidentialité salaires + pilotage financier précis

#### 4️⃣ Architecture Cloudflare
Serverless ultra-économique :
- **7-12€/mois** d'hébergement (vs 500-2000€ cloud classique)
- Performance : Edge computing global
- Scalabilité : Auto-scaling automatique

#### 5️⃣ MCP (Model Context Protocol)
Intégration avec LLM externes (Claude, ChatGPT, etc.) :
```
User → Claude: "Saisis mon temps pour aujourd'hui"
Claude → MCP Staffing → API → ✅ Temps saisi
```

---

## 💰 Budget & ROI

### Investissement Initial
| Poste | Montant |
|-------|---------|
| Développement (60j × 600€) | 36 000€ |
| Hébergement année 1 | 180€ |
| Formation utilisateurs | 2 000€ |
| **TOTAL** | **38 200€** |

### Gains Année 1
| Source | Montant |
|--------|---------|
| +3% utilisation consultants | +47 250€ |
| -50% temps admin staffing | +25 000€ |
| Meilleure visibilité marges | +15 000€ |
| **TOTAL GAINS** | **87 250€** |

### Résultat
- **ROI Année 1** : 228%
- **Payback** : 5.3 mois
- **Économies hébergement** : 95% vs cloud traditionnel

---

## 👥 Personas (4 types)

### 1. Consultant
**Rôle** : Saisir temps, consulter projets
**Accès** : Ses données uniquement
**Coûts** : Aucune visibilité

### 2. Project Owner
**Rôle** : Valider timesheets, piloter budgets
**Accès** : Ses projets et consultants assignés
**Coûts** : **CJN uniquement** (coûts normés)

### 3. Administrator
**Rôle** : Gérer allocations, capacité globale
**Accès** : Tous projets et consultants
**Coûts** : **CJN uniquement**

### 4. Directeur (NOUVEAU)
**Rôle** : Pilotage financier stratégique
**Accès** : Vision complète + données sensibles
**Coûts** : **CJR + CJN** (coûts réels + normés)

---

## 🛠 Stack Technique

### Frontend
- **Framework** : React 18 + TypeScript
- **Styling** : Tailwind CSS 3.4+ (utility-first)
- **Build** : Vite
- **Hébergement** : Cloudflare Pages
- **Mobile** : PWA (offline-capable)

### Backend
- **API** : Hono (framework ultra-léger)
- **Runtime** : Cloudflare Workers
- **Language** : TypeScript

### Database
- **Primary** : Cloudflare D1 (SQLite distribué)
- **Cache** : Workers KV
- **Storage** : Cloudflare R2

### IA & Automatisation
- **Chat** : Google Gemini API (clé stockée dans Cloudflare Secrets)
- **MCP** : Model Context Protocol
- **Jobs** : Cloudflare Queues

### Coût Infrastructure
**7-12€/mois** tout compris ✅

---

## 📅 Planning (3 mois)

### Sprint 1 : Infrastructure (J1-10)
- Setup Cloudflare
- Auth JWT + RBAC
- DB schema
- React shell

### Sprint 2 : Core Features (J11-25)
- Saisie timesheet (web + mobile)
- Validation workflow
- Dashboards Consultant/Owner

### Sprint 3 : Dashboards & Directeur (J26-40)
- Dashboard Directeur
- CJR/CJN reports
- Détection conflits
- Exports

### Sprint 4 : Chat & MCP (J41-55)
- Gemini API intégration (avec Cloudflare Secrets)
- Chat UI
- Serveur MCP
- Historique conversations

### Sprint 5 : Deploy (J56-60)
- Tests E2E
- Migration données
- Formation
- Go-live

---

## 📊 Métriques de Succès

### Adoption (3 mois)
- ✅ 90% consultants saisissent temps hebdo
- ✅ <24h délai validation moyen
- ✅ >4/5 satisfaction (NPS)
- ✅ 60% actions via chat

### Business (6 mois)
- ✅ +3% taux utilisation
- ✅ Visibilité temps réel budgets
- ✅ 100% marges calculées (CJN + CJR)
- ✅ -50% temps admin

### Technique
- ✅ <15€/mois hébergement
- ✅ <200ms API p95
- ✅ PWA offline 7 jours
- ✅ >99% uptime

---

## 📖 Sections de la Spécification

La [spécification complète](./spec-staffing-esn-finale.md) est organisée en 15 sections :

1. **Personas & Permissions** - 4 types d'utilisateurs avec accès différenciés
2. **Gestion des Coûts** - CJR vs CJN, confidentialité, calculs marges
3. **Architecture Cloudflare** - Stack serverless économique
4. **Interface Conversationnelle** - Chat IA pour 80% actions
5. **MCP** - Protocol intégration LLM externes
6. **Modèle de Données** - 8 tables D1 SQLite
7. **Saisie Demi-Journée** - Interface web/mobile optimale
8. **API REST** - Hono + Workers, documentation OpenAPI
9. **Roadmap** - 5 sprints en 60 jours
10. **Fonctionnalités** - User stories par persona
11. **Critères de Succès** - KPIs adoption/business/technique
12. **Comparaison** - V1 (365K€) vs V2 (38K€)
13. **Risques** - Mitigations identifiées
14. **Prochaines Étapes** - Actions immédiates
15. **Conclusion** - Synthèse et facteurs clés

---

## 🔑 Points Clés à Retenir

### ✅ Simplicité
- Saisie demi-journée = ultra-rapide
- Chat = interface naturelle
- PWA = mobile optimal

### ✅ Économie
- 38K€ budget vs 365K€ version classique
- 12€/mois hébergement vs 2000€/mois
- ROI 228% année 1

### ✅ Innovation
- Google Gemini API intégrée (sécurisée via Cloudflare Secrets)
- MCP pour intégrations
- CJR/CJN double système coûts

### ✅ Pragmatisme
- 60 jours développement réaliste
- Scope P0/P1 strict
- Architecture évolutive

---

## 🚦 Prochaines Actions

### Semaine 1-2 : Validation
- [ ] Review spécification avec stakeholders
- [ ] Validation budget 38 200€
- [ ] Nomination Product Owner
- [ ] Constitution comité pilotage

### Semaine 3-4 : Setup
- [ ] Création compte Cloudflare
- [ ] Setup repos GitHub
- [ ] Recrutement développeur (si besoin)
- [ ] Architecture review

### Mois 2 : Développement Sprint 1-2
- [ ] Infrastructure + Auth
- [ ] Core features (timesheet)
- [ ] Tests early adopters

### Mois 3 : Développement Sprint 3-5
- [ ] Dashboards + Directeur
- [ ] Chat + MCP
- [ ] Tests + Deploy

---

## 📞 Contact & Support

### Questions Spécification
Consulter la [spécification complète](./spec-staffing-esn-finale.md) - toutes les réponses sont dedans !

### Modifications
La spec est un document vivant. Pour proposer des changements :
1. Identifier la section concernée
2. Proposer modification avec justification business/technique
3. Évaluer impact budget/délai

### Démarrage Projet
Pour démarrer :
1. Lire intégralement la spécification
2. Valider budget et délai
3. Constituer équipe (1 dev + 1 PO)
4. Suivre roadmap Sprint 1-5

---

## 📈 Vision Long Terme

### Phase 1 (Mois 1-3) : MVP
Spec actuelle - 60 jours développement

### Phase 2 (Mois 4-6) : Adoption
- Onboarding 50 consultants
- Optimisations performance
- Retours terrain

### Phase 3 (Mois 7-12) : Enrichissement
- Gestion congés
- Prévisions capacité avancées
- Intégrations externes (CRM, ERP)
- Mobile app native

### Phase 4 (Année 2+) : Scale
- Multi-entreprise (SaaS)
- ML prédictif (affectations optimales)
- Marketplace intégrations
- Certification ISO/SOC2

---

## ⚖️ Licence & Propriété

**Propriété intellectuelle** : Ce projet et sa spécification sont propriété de l'ESN cliente.

**Confidentialité** : Document interne - Ne pas diffuser sans autorisation.

**Version** : 2.0 Finale - Janvier 2025

---

## ✨ Conclusion

Cette spécification définit un **outil de staffing nouvelle génération** :
- ✅ **Simple** : Saisie 30 secondes, chat intuitif
- ✅ **Économique** : 38K€ budget, 12€/mois hosting
- ✅ **Intelligent** : IA, MCP, automatisations
- ✅ **Rentable** : ROI 228%, payback 5 mois
- ✅ **Réaliste** : 60 jours développement

**Prêt pour démarrage immédiat** ! 🚀

---

**Document préparé par** : Équipe Projet Staffing ESN
**Date** : Janvier 2025
**Version** : 2.0 Finale
**Statut** : ✅ Validé pour développement
