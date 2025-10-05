# Spécification Complète - Outil de Staffing ESN
## Solution Moderne, Économique et Intelligente

---

## 📋 SOMMAIRE EXÉCUTIF

### Vision
Outil de staffing nouvelle génération pour ESN de 50 personnes, combinant **simplicité d'usage**, **coûts maîtrisés** et **intelligence conversationnelle** pour maximiser le taux d'activité (objectif 70-75%) et la rentabilité des projets.

### Approche Différenciante

**🎯 Saisie simplifiée** : Temps saisi à la **demi-journée** (matin/après-midi) au lieu d'heures
- Saisie hebdomadaire en **30 secondes** (vs 5 minutes)
- Interface mobile optimale (PWA)
- Moins d'erreurs, plus d'adoption

**💬 Interface conversationnelle** : Chat alimenté par IA pour **80% des actions courantes**
- "Saisi 1 jour projet X aujourd'hui"
- "Valider tous les timesheets"
- "Quelle est la marge réelle du projet Y ?"

**🔐 Double système de coûts** : CJR (réel) + CJN (normé)
- **CJR** (Coût Journalier Réel) : Salaire réel → Directeurs uniquement
- **CJN** (Coût Journalier Normé) : Grille standard → Tous les autres
- Confidentialité totale des salaires

**☁️ Architecture Cloudflare** : Serverless ultra-économique
- Hébergement : **7-12€/mois** (vs 500-2000€ cloud traditionnel)
- Performance : Edge computing global
- Scalabilité : Auto-scaling sans configuration

**🔌 Intégration MCP** : Model Context Protocol pour connexion externe
- Utilisable depuis Claude, ChatGPT, etc.
- API REST moderne et documentée
- Automatisation poussée

### Chiffres Clés

| Métrique | Valeur |
|----------|--------|
| **Budget développement** | 38 200€ (60 jours-personne) |
| **Coût hébergement/mois** | 7-12€ |
| **Délai de livraison** | 3 mois (5 sprints) |
| **ROI Année 1** | 228% |
| **Payback** | 5.3 mois |
| **Gains annuels** | 87 250€ |

### Personas

1. **Consultant** : Saisit son temps (web + mobile), consulte ses projets
2. **Project Owner** : Valide timesheets, pilote budgets projets (CJN)
3. **Administrator** : Gère allocations, capacité globale (CJN)
4. **Directeur** : Vision financière complète avec accès CJR

### Technologies

- **Frontend** : React 18 PWA (Cloudflare Pages)
- **API** : Hono + Cloudflare Workers
- **Database** : Cloudflare D1 (SQLite distribué)
- **IA** : Google Gemini API (clé stockée dans Cloudflare Secrets)
- **Mobile** : PWA offline-capable

---

## Vue d'ensemble stratégique

**Objectif** : Outil de staffing moderne pour ESN de 50 personnes, maximisant le taux d'activité (70-75%) avec une approche **lean** et **économique**.

**Contraintes critiques** :
- **Budget** : 60 jours-personne (1 développeur full-stack)
- **Coût hébergement** : 7-12€/mois (Cloudflare)
- **Délai** : 3 mois de développement
- **Architecture** : Serverless, API-first, conversationnelle

**Différenciateurs** :
- ✅ Saisie temps à la **demi-journée** (ultra-rapide)
- ✅ Interface conversationnelle (chat) pour 80% des actions
- ✅ MCP (Model Context Protocol) pour intégration externe
- ✅ PWA mobile-first pour saisie terrain
- ✅ Architecture Cloudflare ultra-économique
- ✅ Gestion fine des coûts (CJR/CJN) avec confidentialité

---

## 📚 TABLE DES MATIÈRES

1. [PERSONAS & PERMISSIONS](#1-personas--permissions-4-types)
2. [GESTION DES COÛTS : CJR vs CJN](#2-gestion-des-coûts--cjr-vs-cjn)
3. [ARCHITECTURE CLOUDFLARE](#3-architecture-cloudflare-ultra-économique)
4. [INTERFACE CONVERSATIONNELLE (CHAT)](#4-interface-conversationnelle-chat)
5. [MCP (MODEL CONTEXT PROTOCOL)](#5-mcp-model-context-protocol)
6. [MODÈLE DE DONNÉES](#6-modèle-de-données-simplifié)
7. [SAISIE TEMPS À LA DEMI-JOURNÉE](#7-saisie-temps-à-la-demi-journée)
8. [API REST](#8-api-rest-hono--workers)
9. [ROADMAP 60 JOURS](#9-roadmap-60-jours)
10. [FONCTIONNALITÉS PAR PERSONA](#10-fonctionnalités-par-persona-priorisées)
11. [CRITÈRES DE SUCCÈS](#11-critères-de-succès)
12. [COMPARAISON VERSIONS](#12-différences-vs-spec-v1)
13. [RISQUES & MITIGATIONS](#13-risques--mitigation)
14. [PROCHAINES ÉTAPES](#14-prochaines-étapes)
15. [CONCLUSION](#15-conclusion)

---

## 1. PERSONAS & PERMISSIONS (4 types)

### 1.1 Consultant
**Accès** : Ses données uniquement
- ✅ Saisir temps (web + mobile PWA)
- ✅ Voir ses projets et allocations
- ✅ Consulter son utilisation (basée sur CJN masqué)
- ✅ Demander congés
- ✅ **Chat** : "Combien d'heures j'ai fait cette semaine ?", "Sur quels projets je suis ?"

**Visibilité coûts** : AUCUNE (ni CJR ni CJN)

### 1.2 Project Owner
**Accès** : Ses projets et consultants assignés
- ✅ Valider timesheets
- ✅ Suivre budget projet (basé sur **CJN**)
- ✅ Voir marges projet (TJ - CJN)
- ✅ **Chat** : "Valider les timesheets en attente", "Budget restant projet X ?"

**Visibilité coûts** : **CJN uniquement** (anonymisé)

### 1.3 Administrator
**Accès** : Tous les projets et consultants
- ✅ Créer projets, affecter consultants
- ✅ Gérer allocations et conflits
- ✅ Dashboard capacité et utilisation (basé sur **CJN**)
- ✅ Exports et rapports (avec CJN)
- ✅ **Chat** : "Qui est disponible en React ?", "Créer projet X avec consultant Y"

**Visibilité coûts** : **CJN uniquement**

### 1.4 **Directeur** (NOUVEAU)
**Accès** : Tous les projets, consultants + données financières réelles
- ✅ Toutes les fonctions Administrator
- ✅ Accès **CJR** (coût salarial réel) de tous les consultants
- ✅ Marges réelles (TJ - CJR) par projet/consultant
- ✅ Analyse P&L avec coûts réels
- ✅ Dashboard financier direction
- ✅ **Chat** : "Quelle est la marge réelle du projet X ?", "Top 5 consultants par rentabilité réelle"

**Visibilité coûts** : **CJR + CJN** (accès total)

**Sécurité renforcée** :
- MFA obligatoire pour Directeur
- Audit log toutes consultations CJR
- Session timeout 15min (vs 1h autres rôles)

---

## 2. GESTION DES COÛTS : CJR vs CJN

### 2.1 Définitions

#### CJR - Coût Journalier Réel
**Définition** : Coût réel entreprise par jour travaillé, basé sur le **salaire individuel**

```
CJR = (Salaire brut annuel + Charges 45% + Avantages + Équipement) / 210 jours

Exemple Consultant Junior :
- Salaire brut : 35 000 €
- Charges (45%) : 15 750 €
- Avantages : 2 000 €
- Équipement : 1 500 €
- Total annuel : 54 250 €
- CJR = 54 250 / 210 = 258 €/jour
```

**Confidentialité** : CRITIQUE - Accessible **uniquement aux Directeurs**

#### CJN - Coût Journalier Normé
**Définition** : Coût standard par profil/seniority, **déconnecté du salaire réel**

```
Grille standard CJN :
- Junior (0-2 ans)     : 300 €/j
- Consultant (2-5 ans) : 400 €/j
- Senior (5-10 ans)    : 550 €/j
- Manager (10+ ans)    : 700 €/j
- Directeur            : 900 €/j
```

**Usage** : Calculs marges pour Project Owners et Administrators

### 2.2 Cas d'usage

| Calcul | Project Owner | Administrator | Directeur |
|--------|---------------|---------------|-----------|
| Marge projet | TJ - CJN | TJ - CJN | **TJ - CJR** (réel) |
| Rentabilité consultant | ❌ Aucune | TJ - CJN (normé) | **TJ - CJR** (réel) |
| P&L consolidé | ❌ | Estimé (CJN) | **Réel (CJR)** |
| Forecast rentabilité | TJ - CJN | TJ - CJN | **TJ - CJR** |

### 2.3 Avantages du double système

**Pour l'entreprise** :
- ✅ Confidentialité salaires préservée
- ✅ Project Owners peuvent gérer sans voir salaires
- ✅ Direction a vision financière réelle
- ✅ Détection écarts CJR vs CJN (consultants sur/sous-payés)

**Pour les calculs** :
- ✅ CJN = outil de gestion quotidien (80% usages)
- ✅ CJR = pilotage financier stratégique (20% usages)

### 2.4 Implémentation technique

```typescript
// Modèle de données
interface Consultant {
  consultant_id: string;
  // ... autres champs
  cjn: number;              // Visible Admins + Directeurs
  cjr: number;              // Visible Directeurs UNIQUEMENT
  profil_seniority: 'junior' | 'consultant' | 'senior' | 'manager' | 'directeur';
}

// Middleware de sécurité
function getConsultantCost(consultant: Consultant, userRole: Role): number {
  if (userRole === 'directeur') {
    return consultant.cjr; // Coût réel
  }
  if (userRole === 'administrator' || userRole === 'project_owner') {
    return consultant.cjn; // Coût normé
  }
  throw new Error('Unauthorized'); // Consultants n'ont pas accès
}

// Audit automatique
async function auditCJRAccess(userId: string, consultantId: string) {
  await db.audit.create({
    user_id: userId,
    action: 'VIEW_CJR',
    entity_id: consultantId,
    timestamp: new Date(),
    ip_address: getClientIP()
  });
}
```

---

## 3. ARCHITECTURE CLOUDFLARE (ULTRA-ÉCONOMIQUE)

### 3.1 Stack Cloudflare

**Frontend** : Cloudflare Pages
- React 18 + TypeScript + Vite
- PWA avec Service Worker
- CDN global automatique
- **Coût** : 0€ (free tier : illimité)

**API** : Cloudflare Workers
- Hono (framework ultra-léger, 12kb)
- TypeScript natif
- Auto-scaling automatique
- **Coût** : 5€/mois (plan Workers Paid : 10M requêtes)

**Base de données** : Cloudflare D1
- SQLite distribué (serverless)
- Backups automatiques
- 10GB gratuit puis 0.75$/GB
- **Coût** : 0-3€/mois (50 users = ~2GB)

**Stockage fichiers** : Cloudflare R2
- S3-compatible
- 10GB gratuit
- **Coût** : 0€ (exports, docs < 10GB)

**Background Jobs** : Cloudflare Queues
- Agrégations nuit, emails
- **Coût** : 0€ (free tier : 1M/mois)

**Cache** : Workers KV
- Sessions, config
- **Coût** : 0€ (free tier)

**AI/Chat** : Google Gemini API
- LLM via API externe (Gemini Pro)
- Clé stockée dans Cloudflare Secrets (sécurisé et chiffré)
- Interface conversationnelle
- **Coût** : Free tier Gemini (60 req/min) puis ~0.0005$/1000 chars (~1-2€/mois)

**TOTAL MENSUEL** : **7-12€/mois** (vs 500-2000€ AWS/Azure)

### 3.2 Architecture globale

```
┌─────────────────────────────────────────────────────────────┐
│                    Cloudflare Pages (Frontend)               │
│   - PWA React (mobile + web)                                │
│   - Chat UI conversationnel                                 │
│   - Service Worker (offline)                                │
└─────────────────────────────────────────────────────────────┘
                              ↓ HTTPS
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare Workers (API Gateway)                │
│   - Hono Router                                             │
│   - JWT Auth                                                │
│   - RBAC middleware                                         │
│   - Rate limiting                                           │
└─────────────────────────────────────────────────────────────┘
        ↓               ↓              ↓              ↓
┌──────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────┐
│  Gemini API  │ │  D1 SQLite │ │ Workers KV │ │ Queues       │
│  (Chat LLM)  │ │  (Core DB) │ │ (Sessions) │ │ (Jobs async) │
│  + Secrets   │ │            │ │            │ │              │
└──────────────┘ └────────────┘ └────────────┘ └──────────────┘
```

### 3.3 Avantages Cloudflare

✅ **Coût** : 95% moins cher que cloud traditionnel
✅ **Performance** : Edge computing (< 50ms latence)
✅ **Scalabilité** : Auto-scale sans config
✅ **Simplicité** : Pas de DevOps complexe
✅ **Sécurité** : DDoS protection incluse
✅ **Global** : 300+ datacenters

---

## 4. INTERFACE CONVERSATIONNELLE (CHAT)

### 4.1 Principe

**80% des actions courantes** via chat en langage naturel :

**Exemples Consultant** :
- "Combien de jours j'ai fait cette semaine ?"
- "Saisi 1 jour sur projet X aujourd'hui"
- "Matin projet Alpha, après-midi projet Beta"
- "Quelle est mon utilisation ce mois ?"
- "Quand finit ma mission sur projet Y ?"

**Exemples Project Owner** :
- "Valider tous les timesheets en attente"
- "Quel est le budget restant sur projet X ?"
- "Qui travaille sur mes projets cette semaine ?"
- "Rejeter timesheet de Jean avec message : incohérent"

**Exemples Administrator** :
- "Qui est disponible la semaine prochaine en React ?"
- "Créer projet ABC avec consultant Marie à 50%"
- "Afficher les conflits d'allocation"
- "Quel est le taux d'utilisation global ?"

**Exemples Directeur** :
- "Quelle est la marge réelle du projet X ?"
- "Top 5 consultants par rentabilité réelle"
- "Écart moyen entre CJN et CJR par profil"
- "P&L réel du mois dernier"

### 4.2 Architecture Chat

```typescript
// Chat Worker avec Google Gemini API
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

async function handleChat(request: Request, env: Env) {
  const { message, userId } = await request.json();

  // Context utilisateur
  const user = await getUser(userId);
  const systemPrompt = buildSystemPrompt(user.role);

  // Détection d'intention
  const intent = await detectIntent(message);

  // Exécution action
  const result = await executeAction(intent, user);

  // Génération réponse naturelle avec Gemini
  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nUser: ${message}\n\nData: ${JSON.stringify(result)}\n\nRéponds de manière naturelle et concise.`
          }]
        }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
      })
    }
  );

  const geminiData = await geminiResponse.json();
  const response = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || 'Erreur';

  return new Response(JSON.stringify({ response, data: result }));
}

// Intentions supportées
type Intent = 
  | 'TIMESHEET_QUERY'
  | 'TIMESHEET_CREATE'
  | 'TIMESHEET_VALIDATE'
  | 'PROJECT_QUERY'
  | 'ALLOCATION_QUERY'
  | 'BUDGET_QUERY'
  | 'MARGE_QUERY'      // Directeur uniquement
  | 'CJR_QUERY'        // Directeur uniquement
  | 'HELP';

// Exemples prompts système par rôle
const SYSTEM_PROMPTS = {
  consultant: `Tu es un assistant pour consultant en ESN. 
    Tu peux aider à : saisir le temps, consulter allocations, voir utilisation.
    Réponds de manière concise et actionnable.`,
  
  directeur: `Tu es un assistant pour Directeur d'ESN.
    Tu as accès aux données financières sensibles (CJR, marges réelles).
    Sois précis avec les chiffres et maintiens la confidentialité.`
};
```

### 4.3 UI Chat

**Interface** :
- Chat persistant (coin bas-droit)
- Historique conversations (D1)
- Suggestions rapides (quick actions)
- Résultats riches (tables, graphiques)
- Fallback vers formulaires classiques

**Exemples UI** :

```
┌─────────────────────────────────────┐
│ 💬 Assistant Staffing               │
├─────────────────────────────────────┤
│ Consultant: "Combien d'heures cette │
│             semaine ?"              │
│                                     │
│ Assistant: Vous avez saisi 32h     │
│            cette semaine :          │
│            • Projet Alpha: 24h      │
│            • Projet Beta: 8h        │
│            Il vous reste 8h à saisir│
│                                     │
│ [Saisir temps] [Voir détails]      │
└─────────────────────────────────────┘
```

### 4.4 Actions rapides pré-définies

**Consultant** :
- ⚡ Copier semaine dernière
- ⚡ Saisir 8h aujourd'hui
- ⚡ Soumettre timesheet
- ⚡ Voir mes projets

**Project Owner** :
- ⚡ Valider tout en attente
- ⚡ Budget mes projets
- ⚡ Timesheets non soumis

**Directeur** :
- ⚡ Marges réelles top 5 projets
- ⚡ CJR vs CJN écarts
- ⚡ P&L mois en cours

---

## 5. MCP (MODEL CONTEXT PROTOCOL)

### 5.1 Qu'est-ce que MCP ?

**MCP** = Protocol pour connecter des LLM (Claude, GPT, etc.) à des sources de données externes.

**Cas d'usage** :
- Utiliser Claude Desktop/API pour interagir avec l'outil staffing
- "Claude, saisis 8h sur projet X pour moi aujourd'hui"
- "Claude, génère un rapport de marge pour tous mes projets"

### 5.2 Serveur MCP Cloudflare

```typescript
// mcp-server.ts - Cloudflare Worker
import { Server } from '@modelcontextprotocol/sdk/server';

const server = new Server({
  name: 'staffing-tool',
  version: '1.0.0'
});

// Outils exposés via MCP
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'get_timesheet',
      description: 'Récupère le timesheet d\'un consultant',
      inputSchema: {
        type: 'object',
        properties: {
          consultant_id: { type: 'string' },
          week: { type: 'string', format: 'date' }
        }
      }
    },
    {
      name: 'create_time_entry',
      description: 'Crée une saisie de temps',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: { type: 'string' },
          hours: { type: 'number' },
          date: { type: 'string', format: 'date' }
        }
      }
    },
    {
      name: 'get_project_margin',
      description: 'Calcule la marge d\'un projet (Directeur uniquement)',
      inputSchema: {
        type: 'object',
        properties: {
          project_id: { type: 'string' },
          use_real_cost: { type: 'boolean' } // CJR si true
        }
      }
    }
  ]
}));

// Exécution outils
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;
  
  // Vérification auth (JWT token)
  const user = await authenticateFromMCP(request);
  
  switch (name) {
    case 'get_timesheet':
      return await getTimesheet(args.consultant_id, args.week, user);
    
    case 'create_time_entry':
      return await createTimeEntry(args, user);
    
    case 'get_project_margin':
      // Check role Directeur pour CJR
      if (args.use_real_cost && user.role !== 'directeur') {
        throw new Error('Unauthorized: CJR access requires Directeur role');
      }
      return await getProjectMargin(args.project_id, args.use_real_cost, user);
  }
});
```

### 5.3 Configuration Claude Desktop

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "staffing": {
      "url": "https://staffing-mcp.votre-domain.workers.dev",
      "apiKey": "YOUR_API_KEY",
      "headers": {
        "Authorization": "Bearer YOUR_JWT_TOKEN"
      }
    }
  }
}
```

### 5.4 Exemples d'usage

**Consultant avec Claude** :
```
User: Claude, peux-tu saisir 8h sur le projet "Refonte Site" pour aujourd'hui ?

Claude: [Appelle create_time_entry via MCP]
       J'ai saisi 8 heures sur le projet "Refonte Site" pour aujourd'hui.
       Total semaine : 32h. Il reste 8h à saisir.
```

**Directeur avec Claude** :
```
User: Claude, quelle est la marge réelle du projet Alpha ?

Claude: [Appelle get_project_margin avec use_real_cost=true via MCP]
        Projet Alpha - Marge réelle :
        • CA facturé : 125 000 €
        • Coûts réels (CJR) : 78 500 €
        • Marge brute : 46 500 € (37.2%)
        • Coûts normés (CJN) : 85 000 €
        • Écart CJR vs CJN : -6 500 € (consultants sous-payés vs grille)
```

---

## 6. MODÈLE DE DONNÉES SIMPLIFIÉ

### 6.1 Schéma D1 SQLite (8 tables core)

```sql
-- USERS (authentification + rôles)
CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK(role IN ('consultant', 'project_owner', 'administrator', 'directeur')),
  created_at INTEGER NOT NULL
);

-- CONSULTANTS (profils + coûts)
CREATE TABLE consultants (
  consultant_id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE REFERENCES users(user_id),
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  profil_seniority TEXT CHECK(profil_seniority IN ('junior', 'consultant', 'senior', 'manager', 'directeur')),
  cjn REAL NOT NULL,              -- Coût Journalier Normé (visible Admins)
  cjr REAL NOT NULL,              -- Coût Journalier Réel (visible Directeurs SEULEMENT)
  date_embauche TEXT,
  statut TEXT DEFAULT 'actif'
);
CREATE INDEX idx_consultants_statut ON consultants(statut);

-- PROJECTS
CREATE TABLE projects (
  project_id TEXT PRIMARY KEY,
  code_projet TEXT UNIQUE NOT NULL,
  nom_projet TEXT NOT NULL,
  client TEXT,
  type_projet TEXT CHECK(type_projet IN ('regie', 'forfait')), -- Simplifié
  montant_vendu REAL,
  jours_vendus INTEGER,
  date_debut TEXT,
  date_fin TEXT,
  statut TEXT DEFAULT 'actif',
  owner_id TEXT REFERENCES users(user_id)  -- Project Owner
);
CREATE INDEX idx_projects_owner ON projects(owner_id);
CREATE INDEX idx_projects_statut ON projects(statut);

-- PERSONAS (rôles facturables)
CREATE TABLE personas (
  persona_id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  libelle TEXT NOT NULL,
  tj_reference REAL NOT NULL  -- TJ moyen pour ce rôle
);

-- INTERVENTIONS (allocations)
CREATE TABLE interventions (
  intervention_id TEXT PRIMARY KEY,
  consultant_id TEXT REFERENCES consultants(consultant_id),
  project_id TEXT REFERENCES projects(project_id),
  persona_id TEXT REFERENCES personas(persona_id),
  tj_verrouille REAL NOT NULL,  -- TJ fixé à l'allocation
  allocation_pct INTEGER CHECK(allocation_pct >= 0 AND allocation_pct <= 100),
  date_debut TEXT NOT NULL,
  date_fin TEXT,
  statut TEXT DEFAULT 'active'
);
CREATE INDEX idx_interventions_consultant ON interventions(consultant_id, statut);
CREATE INDEX idx_interventions_project ON interventions(project_id);

-- TIME_ENTRIES (saisie temps à la demi-journée)
CREATE TABLE time_entries (
  time_entry_id TEXT PRIMARY KEY,
  consultant_id TEXT REFERENCES consultants(consultant_id),
  intervention_id TEXT REFERENCES interventions(intervention_id),
  project_id TEXT REFERENCES projects(project_id),
  entry_date TEXT NOT NULL,
  periode TEXT CHECK(periode IN ('matin', 'apres_midi', 'journee')) NOT NULL,  -- NOUVEAU : granularité demi-journée
  jours REAL CHECK(jours IN (0.5, 1.0)) NOT NULL,  -- NOUVEAU : 0.5 ou 1.0 jour seulement
  statut TEXT CHECK(statut IN ('draft', 'submitted', 'validated', 'rejected')) DEFAULT 'draft',
  validated_by TEXT REFERENCES users(user_id),
  validated_at INTEGER,
  commentaire TEXT,
  created_at INTEGER NOT NULL
);
-- Contrainte : pas de double saisie même période même jour
CREATE UNIQUE INDEX idx_time_entries_unique ON time_entries(consultant_id, intervention_id, entry_date, periode);
CREATE INDEX idx_time_entries_consultant_date ON time_entries(consultant_id, entry_date DESC);
CREATE INDEX idx_time_entries_project_date ON time_entries(project_id, entry_date DESC);
CREATE INDEX idx_time_entries_statut ON time_entries(statut);

-- AUDIT_LOGS (traçabilité accès CJR)
CREATE TABLE audit_logs (
  audit_id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(user_id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  details TEXT,  -- JSON
  ip_address TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX idx_audit_user_date ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- CHAT_HISTORY (historique conversations)
CREATE TABLE chat_history (
  chat_id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(user_id),
  messages TEXT NOT NULL,  -- JSON array
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX idx_chat_user_date ON chat_history(user_id, created_at DESC);
```

### 6.2 Vues calculées (performances)

```sql
-- Vue utilisation consultants (avec CJN pour Admins, sans coût pour Consultants)
CREATE VIEW v_consultant_utilization AS
SELECT 
  c.consultant_id,
  c.nom,
  c.prenom,
  c.profil_seniority,
  c.cjn,  -- Visible seulement si user.role IN ('administrator', 'directeur')
  COUNT(DISTINCT i.intervention_id) as nb_projets_actifs,
  SUM(CASE WHEN te.statut = 'validated' THEN te.jours ELSE 0 END) as jours_valides,
  -- Taux utilisation basé sur jours travaillés (21 jours ouvrés/mois en moyenne)
  ROUND(SUM(CASE WHEN te.statut = 'validated' THEN te.jours ELSE 0 END) * 100.0 / 21, 1) as taux_utilisation_30j
FROM consultants c
LEFT JOIN interventions i ON c.consultant_id = i.consultant_id AND i.statut = 'active'
LEFT JOIN time_entries te ON i.intervention_id = te.intervention_id 
  AND te.entry_date >= date('now', '-30 days')
GROUP BY c.consultant_id;

-- Vue marges projets (CJN pour Owners/Admins, CJR pour Directeurs)
CREATE VIEW v_project_margins AS
SELECT 
  p.project_id,
  p.code_projet,
  p.nom_projet,
  p.montant_vendu,
  p.jours_vendus,
  SUM(te.jours * i.tj_verrouille) as ca_realise,
  SUM(te.jours * c.cjn) as cout_cjn,  -- Coût normé
  SUM(te.jours * c.cjr) as cout_cjr,  -- Coût réel (Directeur only)
  SUM(te.jours * i.tj_verrouille) - SUM(te.jours * c.cjn) as marge_cjn,
  SUM(te.jours * i.tj_verrouille) - SUM(te.jours * c.cjr) as marge_cjr,
  ROUND((SUM(te.jours * i.tj_verrouille) - SUM(te.jours * c.cjn)) * 100.0 / 
    NULLIF(SUM(te.jours * i.tj_verrouille), 0), 1) as marge_pct_cjn,
  ROUND((SUM(te.jours * i.tj_verrouille) - SUM(te.jours * c.cjr)) * 100.0 / 
    NULLIF(SUM(te.jours * i.tj_verrouille), 0), 1) as marge_pct_cjr
FROM projects p
LEFT JOIN interventions i ON p.project_id = i.project_id
LEFT JOIN time_entries te ON i.intervention_id = te.intervention_id AND te.statut = 'validated'
LEFT JOIN consultants c ON i.consultant_id = c.consultant_id
GROUP BY p.project_id;
```

---

## 7. SAISIE TEMPS À LA DEMI-JOURNÉE

### 7.1 Principe

**Granularité** : Les consultants saisissent leur temps par **demi-journée** (matin / après-midi)

**Valeurs possibles** :
- ☀️ **Matin uniquement** = 0.5 jour
- 🌙 **Après-midi uniquement** = 0.5 jour  
- 📅 **Journée complète** = 1.0 jour

**Avantages** :
- ✅ Saisie ultra-rapide (2 clics max)
- ✅ Moins de débats sur heures exactes
- ✅ Interface mobile optimale
- ✅ Aligné avec pratiques ESN françaises
- ✅ Calculs simplifiés
- ✅ Validation plus rapide

### 7.2 Règles métier

**Contraintes par jour** :
- Maximum **2 saisies par jour** (1 matin + 1 après-midi)
- Maximum **1 jour total** par date
- Multi-projets autorisé : 0.5j Projet A matin + 0.5j Projet B après-midi

**Exemples valides** :
```
Lundi 6 janvier :
- Matin : Projet Alpha (0.5j)
- Après-midi : Projet Alpha (0.5j)
→ Total : 1 jour sur Projet Alpha ✅

Mardi 7 janvier :
- Matin : Projet Alpha (0.5j)
- Après-midi : Projet Beta (0.5j)
→ Total : 0.5j Alpha + 0.5j Beta ✅

Mercredi 8 janvier :
- Journée : Projet Alpha (1j)
→ Total : 1 jour sur Projet Alpha ✅
```

**Exemples invalides** :
```
Jeudi 9 janvier :
- Journée : Projet Alpha (1j)
- Après-midi : Projet Beta (0.5j)
→ ERREUR : dépassement 1.5j > 1j max ❌

Vendredi 10 janvier :
- Matin : Projet Alpha (0.5j)
- Matin : Projet Beta (0.5j)
→ ERREUR : 2 saisies sur même période ❌
```

### 7.3 Interface Web (Desktop)

**Vue Calendrier Hebdomadaire** :

```
┌─────────────────────────────────────────────────────────────────┐
│  Semaine du 6 au 10 janvier 2025                [Soumettre]     │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│          │   Lun    │   Mar    │   Mer    │   Jeu    │   Ven    │
│          │    6     │    7     │    8     │    9     │   10     │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 🌅 Matin │          │          │          │          │          │
│          │ [Projet▼]│ [Projet▼]│ [Projet▼]│ [Projet▼]│ [Projet▼]│
│ Projet   │  Alpha   │  Alpha   │  Alpha   │  Beta    │  Alpha   │
│ Alpha    │   0.5j   │   0.5j   │          │   0.5j   │   0.5j   │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ 🌇 A-M   │          │          │          │          │          │
│          │ [Projet▼]│ [Projet▼]│ [Projet▼]│ [Projet▼]│ [Projet▼]│
│ Projet   │  Alpha   │  Beta    │  Alpha   │  Beta    │  Alpha   │
│ Beta     │   0.5j   │   0.5j   │          │   0.5j   │   0.5j   │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│📅 Journée│          │          │          │          │          │
│ entière  │          │          │  Alpha   │          │          │
│          │          │          │   1.0j   │          │          │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤
│ TOTAL    │   1.0j   │   1.0j   │   1.0j   │   1.0j   │   1.0j   │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘

💡 Actions rapides :
[📋 Copier semaine dernière] [🗑️ Effacer tout] [💾 Sauvegarder brouillon]
```

**Interactions** :
- Dropdown projet par cellule (filtré sur projets actifs du consultant)
- Auto-save toutes les 30s
- Validation temps réel (max 1j/jour)
- Badge couleur : 🟢 Validé | 🟡 Soumis | ⚪ Brouillon

### 7.4 Interface Mobile (PWA)

**Vue Quotidienne simplifiée** :

```
┌─────────────────────────────────┐
│  📅 Lundi 6 janvier 2025        │
│                                 │
│  ☀️ MATIN                       │
│  ┌───────────────────────────┐ │
│  │ Projet Alpha          0.5j │ │
│  └───────────────────────────┘ │
│  [+ Ajouter projet matin]      │
│                                 │
│  🌙 APRÈS-MIDI                  │
│  ┌───────────────────────────┐ │
│  │ Projet Beta           0.5j │ │
│  └───────────────────────────┘ │
│  [+ Ajouter projet après-midi] │
│                                 │
│  ──────────────────────────    │
│  Total jour : 1.0j / 1.0j ✅   │
│                                 │
│  [< Hier]  [Soumettre]  [Demain >]
└─────────────────────────────────┘
```

**Ajout projet (bottom sheet)** :

```
┌─────────────────────────────────┐
│  🌅 Saisir temps - MATIN        │
│                                 │
│  Projet :                       │
│  ┌───────────────────────────┐ │
│  │ 🔍 Rechercher projet...   │ │
│  └───────────────────────────┘ │
│                                 │
│  Projets actifs :               │
│  ☐ Projet Alpha                 │
│  ☐ Projet Beta                  │
│  ☐ Projet Gamma                 │
│                                 │
│  [Annuler]         [Valider]    │
└─────────────────────────────────┘
```

**Gestes rapides** :
- Swipe gauche/droite : navigation jours
- Tap carte projet : éditer/supprimer
- Long press : copier vers autre période
- Pull refresh : sync données

### 7.4.1 Implémentation React + Tailwind CSS

**Design System Tailwind** :

```javascript
// tailwind.config.js - Configuration couleurs projet
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        status: {
          draft: '#94a3b8',      // Gris
          submitted: '#f59e0b',  // Orange
          validated: '#10b981',  // Vert
          rejected: '#ef4444',   // Rouge
        }
      },
    },
  },
}
```

**Composant TimeEntry (Saisie Demi-Journée)** :

```typescript
// components/TimeEntry.tsx
import { useState } from 'react';

interface TimeEntryProps {
  date: Date;
  periode: 'matin' | 'apres_midi' | 'journee';
  projects: Project[];
  onSave: (entry: TimeEntryData) => void;
}

export function TimeEntry({ date, periode, projects, onSave }: TimeEntryProps) {
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [jours, setJours] = useState<number>(0.5);

  const periodeLabels = {
    matin: '☀️ Matin',
    apres_midi: '🌙 Après-midi',
    journee: '📅 Journée'
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">
          {periodeLabels[periode]}
        </span>
        <span className="text-xs text-gray-500">
          {jours}j
        </span>
      </div>

      {/* Sélecteur projet */}
      <select
        value={selectedProject}
        onChange={(e) => setSelectedProject(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
      >
        <option value="">Sélectionner un projet...</option>
        {projects.map(p => (
          <option key={p.id} value={p.id}>{p.nom}</option>
        ))}
      </select>

      {/* Boutons jours (si période != journee) */}
      {periode !== 'journee' && (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setJours(0.5)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              jours === 0.5
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            0.5j
          </button>
          <button
            onClick={() => setJours(1)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              jours === 1
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            1j
          </button>
        </div>
      )}
    </div>
  );
}
```

**Composant WeeklyTimesheet (Vue Hebdomadaire)** :

```typescript
// components/WeeklyTimesheet.tsx
import { useState } from 'react';

export function WeeklyTimesheet() {
  const [weekDays, setWeekDays] = useState(generateWeekDays());

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Semaine du {weekDays[0].format('DD')} au {weekDays[4].format('DD MMM YYYY')}
            </h2>
            <p className="text-primary-100 text-sm mt-1">
              Saisie temps par demi-journée
            </p>
          </div>
          <button className="bg-white text-primary-700 px-4 py-2 rounded-lg font-medium hover:bg-primary-50 transition-colors">
            Soumettre
          </button>
        </div>
      </div>

      {/* Grid calendrier */}
      <div className="p-6">
        <div className="grid grid-cols-6 gap-4">
          {/* Header colonnes jours */}
          <div className="col-span-1"></div>
          {weekDays.map((day, i) => (
            <div key={i} className="text-center">
              <div className="text-xs text-gray-500 uppercase">
                {day.format('ddd')}
              </div>
              <div className="text-lg font-semibold text-gray-900 mt-1">
                {day.format('DD')}
              </div>
            </div>
          ))}

          {/* Ligne Matin */}
          <div className="flex items-center text-sm font-medium text-gray-700">
            ☀️ Matin
          </div>
          {weekDays.map((day, i) => (
            <TimeEntryCell key={`matin-${i}`} date={day} periode="matin" />
          ))}

          {/* Ligne Après-midi */}
          <div className="flex items-center text-sm font-medium text-gray-700">
            🌙 AM
          </div>
          {weekDays.map((day, i) => (
            <TimeEntryCell key={`am-${i}`} date={day} periode="apres_midi" />
          ))}

          {/* Ligne Journée */}
          <div className="flex items-center text-sm font-medium text-gray-700">
            📅 Jour
          </div>
          {weekDays.map((day, i) => (
            <TimeEntryCell key={`jour-${i}`} date={day} periode="journee" />
          ))}

          {/* Total */}
          <div className="col-span-1 flex items-center text-sm font-semibold text-gray-900">
            TOTAL
          </div>
          {weekDays.map((day, i) => (
            <div key={`total-${i}`} className="text-center">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-700 font-semibold">
                1.0j
              </span>
            </div>
          ))}
        </div>

        {/* Actions rapides */}
        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            📋 Copier semaine dernière
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            🗑️ Effacer tout
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            💾 Sauvegarder brouillon
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Composant Badge Statut** :

```typescript
// components/StatusBadge.tsx
type Status = 'draft' | 'submitted' | 'validated' | 'rejected';

interface StatusBadgeProps {
  status: Status;
}

const statusConfig = {
  draft: {
    label: 'Brouillon',
    icon: '⚪',
    classes: 'bg-gray-100 text-gray-700 border-gray-300'
  },
  submitted: {
    label: 'Soumis',
    icon: '🟡',
    classes: 'bg-yellow-100 text-yellow-700 border-yellow-300'
  },
  validated: {
    label: 'Validé',
    icon: '🟢',
    classes: 'bg-green-100 text-green-700 border-green-300'
  },
  rejected: {
    label: 'Rejeté',
    icon: '🔴',
    classes: 'bg-red-100 text-red-700 border-red-300'
  }
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${config.classes}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}
```

**Composant Dashboard Cards (Project Owner)** :

```typescript
// components/DashboardCard.tsx
interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: string;
}

export function DashboardCard({ title, value, subtitle, trend, icon }: DashboardCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className={`text-sm mt-2 ${trend ? trendColors[trend] : 'text-gray-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-4xl opacity-20">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// Utilisation
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <DashboardCard
    title="Timesheets en attente"
    value="12"
    subtitle="À valider cette semaine"
    icon="⏳"
  />
  <DashboardCard
    title="Budget consommé"
    value="68%"
    subtitle="+5% vs mois dernier"
    trend="up"
    icon="💰"
  />
  <DashboardCard
    title="Jours produits"
    value="142j"
    subtitle="Sur 210j vendus"
    icon="📊"
  />
  <DashboardCard
    title="Marge projet"
    value="42.3%"
    subtitle="Objectif: 40%"
    trend="up"
    icon="📈"
  />
</div>
```

**Composant Chat Conversationnel** :

```typescript
// components/Chat.tsx
import { useState, useRef, useEffect } from 'react';

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickActions = [
    { label: '⚡ Saisir 1 jour aujourd\'hui', action: 'quick_add_day' },
    { label: '✅ Valider tous', action: 'validate_all' },
    { label: '📊 Mon utilisation', action: 'my_utilization' },
  ];

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <h3 className="text-white font-semibold">💬 Assistant Staffing</h3>
        </div>
        <button className="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors">
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
              msg.role === 'user'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-900'
            }`}>
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {quickActions.map((action, i) => (
            <button
              key={i}
              className="flex-shrink-0 px-3 py-1.5 bg-white border border-gray-300 rounded-full text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          />
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors">
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Composant Mobile PWA (Vue Quotidienne)** :

```typescript
// components/mobile/DailyView.tsx
export function DailyView() {
  const [date, setDate] = useState(new Date());
  const [entries, setEntries] = useState<TimeEntry[]>([]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button className="text-gray-600">
              ← Hier
            </button>
            <h2 className="font-semibold text-gray-900">
              📅 {date.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </h2>
            <button className="text-gray-600">
              Demain →
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Matin */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            ☀️ MATIN
          </h3>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-900">Projet Alpha</span>
              <span className="text-xs font-medium text-gray-500">0.5j</span>
            </div>
          </div>
          <button className="w-full mt-2 py-2 text-sm text-primary-600 font-medium">
            + Ajouter projet matin
          </button>
        </div>

        {/* Après-midi */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            🌙 APRÈS-MIDI
          </h3>
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-900">Projet Beta</span>
              <span className="text-xs font-medium text-gray-500">0.5j</span>
            </div>
          </div>
          <button className="w-full mt-2 py-2 text-sm text-primary-600 font-medium">
            + Ajouter projet après-midi
          </button>
        </div>

        {/* Total */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border-2 border-green-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-green-900">Total jour</span>
            <span className="text-lg font-bold text-green-700">1.0j / 1.0j ✅</span>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <button className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors">
            Annuler
          </button>
          <button className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors">
            Soumettre
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Utilitaires Tailwind Personnalisés** :

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  /* Boutons */
  .btn-primary {
    @apply bg-primary-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-primary-700 active:bg-primary-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
  }
  
  .btn-secondary {
    @apply bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 active:bg-gray-300 transition-colors;
  }

  .btn-danger {
    @apply bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 active:bg-red-800 transition-colors;
  }

  /* Cards */
  .card {
    @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow;
  }

  .card-compact {
    @apply bg-white rounded-lg shadow-sm border border-gray-200 p-4;
  }

  /* Inputs */
  .input {
    @apply w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed;
  }

  .input-error {
    @apply border-red-500 focus:ring-red-500;
  }

  /* Select */
  .select {
    @apply w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white cursor-pointer;
  }

  /* Badges */
  .badge {
    @apply inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium;
  }

  /* Loading spinner */
  .spinner {
    @apply animate-spin rounded-full border-2 border-gray-300 border-t-primary-600;
  }
}

/* Animations custom */
@layer utilities {
  .animate-slide-in {
    animation: slideIn 0.3s ease-out;
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
}
```

### 7.5 Interface Conversationnelle (Chat)

**Exemples de commandes** :

```
💬 User: "Saisi 1 jour projet Alpha aujourd'hui"
🤖 Bot: J'ai saisi 1 jour complet sur Projet Alpha pour aujourd'hui (6 janvier).
       Total semaine : 3 jours.

💬 User: "Matin projet Beta, après-midi projet Gamma"
🤖 Bot: Saisie effectuée :
       • Matin : Projet Beta (0.5j)
       • Après-midi : Projet Gamma (0.5j)
       Total : 1 jour

💬 User: "Combien j'ai fait cette semaine ?"
🤖 Bot: Semaine du 6 au 10 janvier :
       • Projet Alpha : 3.5 jours
       • Projet Beta : 1 jour
       • Projet Gamma : 0.5 jour
       ────────────────────────
       Total : 5 jours / 5 jours ✅

💬 User: "Copie la semaine dernière"
🤖 Bot: J'ai copié les 5 jours de la semaine du 30 déc au 3 jan.
       Voulez-vous ajuster quelque chose ?

💬 User: "Journée complète projet Alpha mercredi"
🤖 Bot: Saisie 1 jour sur Projet Alpha pour mercredi 8 janvier.
```

**Variations naturelles supportées** :
- "1j Alpha", "1 jour Alpha", "journée Alpha"
- "matin Beta", "matinée Beta", "AM Beta"
- "aprem Gamma", "après-midi Gamma", "PM Gamma"
- "demie journée Alpha", "demi-journée Alpha", "0.5j Alpha"

### 7.6 Validation automatique

**Règles implémentées** :

```typescript
// Validation saisie
function validateTimeEntry(date: string, entries: TimeEntry[]): ValidationResult {
  // Règle 1 : Max 2 saisies par jour
  if (entries.length > 2) {
    return { valid: false, error: 'Maximum 2 saisies par jour (matin + après-midi)' };
  }
  
  // Règle 2 : Pas de doublon période
  const periodes = entries.map(e => e.periode);
  if (new Set(periodes).size !== periodes.length) {
    return { valid: false, error: 'Période déjà saisie pour ce jour' };
  }
  
  // Règle 3 : Max 1 jour total
  const totalJours = entries.reduce((sum, e) => sum + e.jours, 0);
  if (totalJours > 1.0) {
    return { valid: false, error: `Total ${totalJours}j dépasse 1 jour maximum` };
  }
  
  // Règle 4 : Si "journee", pas d'autre saisie
  const hasJourneeComplete = entries.some(e => e.periode === 'journee');
  if (hasJourneeComplete && entries.length > 1) {
    return { valid: false, error: 'Journée complète incompatible avec matin/après-midi' };
  }
  
  return { valid: true };
}
```

### 7.7 Rapports et agrégations

**Tous les calculs en jours** :

```typescript
// Exemple rapport mensuel
interface MonthlyReport {
  consultant_id: string;
  mois: string;
  jours_travailles: number;      // Ex: 19.5 jours
  jours_ouvrables: number;        // Ex: 21 jours
  taux_utilisation: number;       // Ex: 92.9%
  
  par_projet: {
    project_id: string;
    nom_projet: string;
    jours: number;                // Ex: 12.5 jours
    ca_genere: number;            // jours × TJ
  }[];
}

// Calcul marge projet
const marge = (jours_produits × TJ) - (jours_produits × CJN);
const marge_pct = marge / (jours_produits × TJ) × 100;
```

### 7.8 Avantages vs saisie horaire

| Aspect | Saisie Horaire | Saisie Demi-Journée |
|--------|----------------|---------------------|
| **Rapidité** | 3-5 min/semaine | **30 sec/semaine** ✅ |
| **Mobile** | Fastidieux | **Optimal** ✅ |
| **Précision** | Fausse précision | **Réaliste** ✅ |
| **Débats** | "Vraiment 7h52 ?" | Aucun ✅ |
| **Calculs** | Conversion h→j | **Direct** ✅ |
| **Validation** | Règles complexes | **2 règles simples** ✅ |

---

## 8. API REST (Hono + Workers)

### 8.1 Architecture API

```typescript
// api/index.ts
import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { cors } from 'hono/cors';

const app = new Hono();

// Middlewares globaux
app.use('*', cors());
app.use('/api/*', jwt({ secret: env.JWT_SECRET }));
app.use('/api/*', rbacMiddleware);  // Contrôle accès par rôle

// Routes principales
app.route('/api/auth', authRoutes);
app.route('/api/consultants', consultantRoutes);
app.route('/api/projects', projectRoutes);
app.route('/api/interventions', interventionRoutes);
app.route('/api/timesheets', timesheetRoutes);
app.route('/api/reports', reportRoutes);
app.route('/api/chat', chatRoutes);        // Interface conversationnelle
app.route('/mcp', mcpRoutes);              // Serveur MCP

export default app;
```

### 8.2 Exemples endpoints avec contrôle CJR/CJN

```typescript
// GET /api/consultants/:id
app.get('/api/consultants/:id', async (c) => {
  const consultantId = c.req.param('id');
  const user = c.get('jwtPayload');
  
  const consultant = await db.prepare(`
    SELECT 
      consultant_id, nom, prenom, profil_seniority,
      ${user.role === 'directeur' ? 'cjn, cjr' : 'cjn'} as cout
    FROM consultants 
    WHERE consultant_id = ?
  `).bind(consultantId).first();
  
  // Audit si accès CJR
  if (user.role === 'directeur') {
    await auditLog(user.user_id, 'VIEW_CJR', consultantId);
  }
  
  return c.json(consultant);
});

// GET /api/projects/:id/margin
app.get('/api/projects/:id/margin', async (c) => {
  const projectId = c.req.param('id');
  const user = c.get('jwtPayload');
  const useRealCost = c.req.query('real') === 'true';
  
  // Vérification accès CJR
  if (useRealCost && user.role !== 'directeur') {
    return c.json({ error: 'Unauthorized: CJR access requires Directeur role' }, 403);
  }
  
  const margin = await db.prepare(`
    SELECT 
      project_id, code_projet, nom_projet,
      ca_realise,
      ${useRealCost ? 'cout_cjr as cout, marge_cjr as marge, marge_pct_cjr as marge_pct' 
                    : 'cout_cjn as cout, marge_cjn as marge, marge_pct_cjn as marge_pct'}
    FROM v_project_margins
    WHERE project_id = ?
  `).bind(projectId).first();
  
  if (useRealCost) {
    await auditLog(user.user_id, 'VIEW_PROJECT_MARGIN_CJR', projectId);
  }
  
  return c.json(margin);
});

// POST /api/timesheets/validate-bulk
app.post('/api/timesheets/validate-bulk', async (c) => {
  const { time_entry_ids } = await c.req.json();
  const user = c.get('jwtPayload');
  
  // Vérification rôle
  if (!['project_owner', 'administrator', 'directeur'].includes(user.role)) {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  
  // Validation en masse
  const results = await Promise.all(
    time_entry_ids.map(id => validateTimeEntry(id, user.user_id))
  );
  
  return c.json({ validated: results.length });
});
```

### 8.3 Documentation API (OpenAPI)

Auto-générée via Hono + Zod :

```typescript
import { OpenAPIHono } from '@hono/zod-openapi';
import { z } from 'zod';

const app = new OpenAPIHono();

// Schéma validation
const TimesheetSchema = z.object({
  project_id: z.string().uuid(),
  periode: z.enum(['matin', 'apres_midi', 'journee']),
  jours: z.number().refine(val => val === 0.5 || val === 1.0, {
    message: 'Jours doit être 0.5 ou 1.0'
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Route avec validation automatique
app.openapi(
  {
    method: 'post',
    path: '/api/timesheets',
    request: {
      body: {
        content: {
          'application/json': {
            schema: TimesheetSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'Timesheet created',
      },
    },
  },
  async (c) => {
    const data = c.req.valid('json');
    // ... création
  }
);

// Génération doc auto
app.doc('/openapi.json', {
  openapi: '3.1.0',
  info: { title: 'Staffing API', version: '1.0.0' },
});
```

Accessible sur : `https://your-domain.workers.dev/openapi.json`

---

## 9. ROADMAP 60 JOURS

### Sprint 1 : Infrastructure & Auth (Jours 1-10)

**Objectif** : Base technique fonctionnelle

- [ ] Setup Cloudflare (Workers, D1, Pages, R2)
- [ ] Schéma DB D1 (8 tables + vues)
- [ ] API Hono avec JWT auth
- [ ] RBAC middleware (4 rôles)
- [ ] Frontend React PWA (shell)
- [ ] CI/CD GitHub Actions → Cloudflare

**Livrable** : Login fonctionnel + DB initialisée

### Sprint 2 : Core Features (Jours 11-25)

**Objectif** : Saisie temps + validation

- [ ] CRUD Consultants (avec CJN/CJR + audit)
- [ ] CRUD Projets
- [ ] Gestion Interventions (allocations)
- [ ] Saisie timesheet web + mobile (PWA)
- [ ] Workflow validation simple (1 niveau)
- [ ] Dashboard consultant (mes projets, mon temps)
- [ ] Dashboard Project Owner (validation, budget)

**Livrable** : Cycle complet saisie → validation

### Sprint 3 : Dashboards & Reports (Jours 26-40)

**Objectif** : Visibilité et pilotage

- [ ] Dashboard Administrator (capacité, conflits)
- [ ] **Dashboard Directeur** (marges CJR, P&L réel)
- [ ] Rapports utilisation (CJN)
- [ ] Rapports marges projets (CJN pour Owners, CJR pour Directeur)
- [ ] Détection conflits allocation
- [ ] Exports Excel/PDF
- [ ] Notifications email (Queues)

**Livrable** : Pilotage complet disponible

### Sprint 4 : Chat & MCP (Jours 41-55)

**Objectif** : Interface conversationnelle

- [ ] Google Gemini API intégration (configuration Cloudflare Secrets)
- [ ] Chat UI (composant React)
- [ ] Détection intentions (NLU simple)
- [ ] Actions chat (10 principales)
- [ ] Serveur MCP (5 outils core)
- [ ] Historique conversations (D1)
- [ ] Quick actions par rôle

**Livrable** : Chat opérationnel pour 80% actions courantes

### Sprint 5 : Polish & Deploy (Jours 56-60)

**Objectif** : Production-ready

- [ ] Tests E2E (Playwright)
- [ ] Optimisations performance
- [ ] Documentation utilisateur
- [ ] Formation équipe pilote
- [ ] Monitoring (Cloudflare Analytics)
- [ ] Migration données legacy
- [ ] Go-live

**Livrable** : Application en production

---

## 10. FONCTIONNALITÉS PAR PERSONA (PRIORISÉES)

### 10.1 Consultant (Essentiel seulement)

✅ **P0 (Sprint 2)** :
- Saisir temps par **demi-journée** (matin/après-midi/journée) web + mobile PWA
- Voir ses projets actifs
- Soumettre timesheet
- Voir statut validation

✅ **P1 (Sprint 4)** :
- Chat : "Saisi 1 jour projet X", "Matin Alpha après-midi Beta", "Combien de jours cette semaine ?"
- Copier semaine dernière
- Notifications validation

❌ **P2 (Post-MVP)** :
- Demande congés
- Export PDF

### 9.2 Project Owner

✅ **P0 (Sprint 2)** :
- Valider/rejeter timesheets
- Voir budget projet (basé CJN)
- Liste consultants assignés

✅ **P1 (Sprint 3)** :
- Dashboard validation (file attente)
- Validation en masse (bulk)
- Alertes budget >90%
- Marges projet (CJN)

✅ **P2 (Sprint 4)** :
- Chat : "Valider tout", "Budget projet X ?"
- Export Excel heures validées

### 9.3 Administrator

✅ **P0 (Sprint 2)** :
- Créer projets
- Affecter consultants
- Gérer allocations

✅ **P1 (Sprint 3)** :
- Dashboard capacité (heatmap)
- Détection conflits allocation
- Vue utilisation globale (CJN)
- Rapports exports

✅ **P2 (Sprint 4)** :
- Chat : "Qui disponible en React ?", "Créer projet X"
- Forecast capacité 3 mois

### 9.4 Directeur (NOUVEAU)

✅ **P0 (Sprint 3)** :
- Toutes fonctions Administrator
- Dashboard financier (CJR + CJN)
- Marges réelles par projet (TJ - CJR)
- Accès audit log CJR

✅ **P1 (Sprint 3)** :
- Analyse écarts CJR vs CJN
- P&L consolidé réel
- Top consultants rentabilité réelle
- Exports financiers

✅ **P2 (Sprint 4)** :
- Chat : "Marge réelle projet X ?", "CJR vs CJN écarts"
- Alertes marges <20% (CJR)

---

## 11. CRITÈRES DE SUCCÈS

### 10.1 Technique

✅ Hébergement Cloudflare : **< 15€/mois**
✅ Performance API : **< 200ms p95**
✅ PWA offline : **cache 7 jours**
✅ Uptime : **> 99%** (Cloudflare SLA)
✅ Sécurité : **Audit CJR 100% tracé**

### 10.2 Adoption (3 mois)

✅ **90%** consultants saisissent temps hebdo
✅ **< 24h** délai validation moyen
✅ **> 4/5** satisfaction utilisateurs (NPS)
✅ **60%** actions via chat (vs formulaires)

### 10.3 Business (6 mois)

✅ **+3%** taux utilisation (70% → 73%)
✅ **Visibilité temps réel** sur budgets projets
✅ **100%** marges projets calculées (CJN + CJR)
✅ **-50%** temps admin staffing

### 10.4 ROI

**Investissement** :
- Développement : 60j × 600€/j = **36 000€**
- Hébergement 1 an : 12 × 15€ = **180€**
- Formation : **2 000€**
- **TOTAL** : **38 200€**

**Gains Année 1** (ESN 50 consultants) :
- +3% utilisation × 50 consultants × 210j × 150€ marge/j = **+47 250€**
- -50% temps admin staffing (0.5 ETP) = **+25 000€**
- Meilleure visibilité marges (réduction pertes 2%) = **+15 000€**
- **TOTAL GAINS** : **87 250€**

**ROI Année 1** : (87 250 - 180) / 38 200 = **228%** 🎯
**Payback** : **5.3 mois**

---

## 12. DIFFÉRENCES vs SPEC V1

| Aspect | Spec V1 (365K€) | Spec V2 Optimisée (38K€) |
|--------|-----------------|---------------------------|
| **Budget dev** | 310K€ (équipe) | 36K€ (1 dev × 60j) |
| **Hébergement/an** | 6-24K€ (AWS/Azure) | 180€ (Cloudflare) |
| **Délai** | 12 mois | 3 mois |
| **Architecture** | Monolithe → Microservices | Serverless Cloudflare |
| **DB** | PostgreSQL RDS | D1 SQLite |
| **Frontend** | React + Ant Design | React PWA (léger) |
| **Personas** | 3 | **4 (+ Directeur)** |
| **Coûts** | CJM unique | **CJR + CJN** (double) |
| **Interface** | Formulaires | **Chat conversationnel 80%** |
| **Intégrations** | REST API | **REST + MCP** |
| **Scope** | 30 user stories | 15 user stories (core) |
| **Rapports** | 12 | 6 essentiels |
| **ML/AI** | Phase 4 (M10-12) | **Google Gemini API (Sprint 4)** |
| **ROI** | 57% | **228%** |

---

## 13. RISQUES & MITIGATIONS

| Risque | Mitigation |
|--------|------------|
| **Limitations D1** (SQLite) | Optimisation requêtes, index stratégiques, cache KV |
| **Gemini API qualité** | Fallback formulaires, fine-tuning prompts, hybrid UI, validation côté serveur |
| **Gemini API quotas** | Free tier 60 req/min suffisant, monitoring usage, fallback gracieux |
| **Sécurité clé API** | Stockage dans Cloudflare Secrets (chiffré), rotation régulière, monitoring |
| **60j trop court** | Scope strict P0/P1, réutilisation composants, pas de sur-engineering |
| **Adoption chat** | Interface dual (chat + classique), formation, quick actions |
| **Confidentialité CJR** | RBAC strict, audit 100%, MFA Directeur, session timeout court |
| **Migration données** | Scripts validation, import progressif, double-run 2 semaines |

---

## 14. PROCHAINES ÉTAPES

### Semaine 1 : Setup
- [ ] Créer compte Cloudflare
- [ ] Setup repos GitHub
- [ ] Initialiser Workers + D1 + Pages
- [ ] Configurer domaine + SSL

### Semaine 2 : Sprint 1
- [ ] Schéma DB complet
- [ ] Auth JWT + RBAC
- [ ] API shell Hono
- [ ] React PWA shell

### Semaine 3-6 : Sprint 2 (Core)
- [ ] Configurer Cloudflare Secrets (GEMINI_API_KEY, JWT_SECRET)
- [ ] Features timesheets
- [ ] Validation workflow
- [ ] Dashboards Consultant/Owner

### Semaine 7-9 : Sprint 3 (Directeur)
- [ ] Dashboard Directeur
- [ ] CJR/CJN reports
- [ ] Conflits allocations

### Semaine 10-11 : Sprint 4 (Chat)
- [ ] Gemini API intégration (utilisation de GEMINI_API_KEY depuis Secrets)
- [ ] Chat UI
- [ ] MCP server

### Semaine 12 : Sprint 5 (Deploy)
- [ ] Tests E2E
- [ ] Migration données
- [ ] Formation
- [ ] Go-live

---

## 15. CONCLUSION

Cette version optimisée offre :

✅ **Budget 10× inférieur** (38K€ vs 365K€)
✅ **Hébergement 100× moins cher** (15€ vs 2000€/mois)
✅ **Délai 4× plus court** (3 mois vs 12 mois)
✅ **ROI 4× supérieur** (228% vs 57%)
✅ **Technologies modernes** (Serverless, Gemini API via Cloudflare Secrets, MCP)
✅ **Fonctionnalités clés** : CJR/CJN, Directeur, Chat, MCP

**Compromis assumés** :
- Moins de rapports (6 vs 12)
- Features post-MVP différées (congés, multi-validation)
- Pas de microservices (mais architecture évolutive)

**Facteurs de succès** :
1. Scope P0/P1 strictement respecté
2. Cloudflare = 95% économie + simplicité
3. Chat = adoption facilitée
4. MCP = intégration moderne
5. CJR/CJN = confidentialité + pilotage

---

**Document préparé pour** : Projet ESN 50 consultants
**Budget** : 38 200€ (vs 365 000€ v1)
**Délai** : 60 jours-personne
**Hébergement** : 15€/mois (vs 2000€/mois)
**ROI Année 1** : 228%
**Version** : 2.0 - Optimisée Cloudflare + Chat + MCP
**Date** : Janvier 2025
