# API Documentation - Staffing ESN

## 🌐 Base URL

- **Local** : `http://localhost:8787`
- **Production** : `https://api.staffing-esn.workers.dev`

## 🔐 Authentication

Toutes les routes (sauf `/auth/*`) nécessitent un JWT token dans le header :

```http
Authorization: Bearer <your-jwt-token>
```

---

## 📋 Table des matières

- [Authentication](#authentication)
- [Users](#users)
- [Projects](#projects)
- [Consultants](#consultants)
- [Interventions](#interventions)
- [Timesheets](#timesheets)
- [Validations](#validations)
- [Chat](#chat)
- [MCP Tools](#mcp-tools)
- [Dashboards](#dashboards)

---

## 🔑 Authentication

### POST `/auth/login`

Authentifie un utilisateur et retourne un JWT.

**Request**
```json
{
  "email": "admin@esn.com",
  "password": "admin123"
}
```

**Response 200**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "usr_123",
    "email": "admin@esn.com",
    "nom": "Dupont",
    "prenom": "Jean",
    "role": "administrator"
  }
}
```

**Errors**
- `401` : Invalid credentials
- `400` : Validation error

---

### POST `/auth/register`

Crée un nouveau compte utilisateur.

**Request**
```json
{
  "email": "consultant@esn.com",
  "password": "password123",
  "nom": "Martin",
  "prenom": "Sophie",
  "role": "consultant"
}
```

**Response 201**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "usr_124",
    "email": "consultant@esn.com",
    "nom": "Martin",
    "prenom": "Sophie",
    "role": "consultant"
  }
}
```

**Errors**
- `409` : Email already exists
- `403` : Only admin can create admin/directeur users

---

## 👥 Users

### GET `/users`

Liste tous les utilisateurs.

**RBAC** : `administrator`, `directeur`

**Query params**
- `role` : Filtrer par rôle (`consultant`, `project_owner`, `administrator`, `directeur`)
- `limit` : Nombre max de résultats (default: 50)
- `offset` : Pagination

**Response 200**
```json
{
  "users": [
    {
      "id": "usr_123",
      "email": "admin@esn.com",
      "nom": "Dupont",
      "prenom": "Jean",
      "role": "administrator",
      "created_at": "2024-01-01T10:00:00Z"
    }
  ],
  "total": 1
}
```

---

### GET `/users/:id`

Récupère un utilisateur par ID.

**RBAC** : Tous (uniquement son propre profil si consultant/project_owner)

**Response 200**
```json
{
  "id": "usr_123",
  "email": "admin@esn.com",
  "nom": "Dupont",
  "prenom": "Jean",
  "role": "administrator",
  "created_at": "2024-01-01T10:00:00Z"
}
```

---

### PUT `/users/:id`

Met à jour un utilisateur.

**RBAC** : `administrator` (ou soi-même pour email/password)

**Request**
```json
{
  "nom": "Nouveau Nom",
  "email": "newemail@esn.com"
}
```

**Response 200**
```json
{
  "id": "usr_123",
  "email": "newemail@esn.com",
  "nom": "Nouveau Nom",
  "prenom": "Jean",
  "role": "administrator"
}
```

---

### DELETE `/users/:id`

Supprime un utilisateur (soft delete).

**RBAC** : `administrator`, `directeur`

**Response 204**

---

## 📊 Projects

### GET `/projects`

Liste tous les projets.

**RBAC** :
- `consultant` : Projets où il a des interventions
- `project_owner` : Projets dont il est owner
- `administrator`/`directeur` : Tous les projets

**Query params**
- `client` : Filtrer par client
- `type` : `regie`, `forfait`, `centre_de_service`
- `actif` : `true`/`false`

**Response 200**
```json
{
  "projects": [
    {
      "id": "prj_456",
      "nom": "Refonte SI Client X",
      "client": "Client X",
      "type": "forfait",
      "date_debut": "2024-01-01",
      "date_fin": "2024-06-30",
      "cjn": 450.0,
      "owner_id": "usr_123",
      "created_at": "2024-01-01T10:00:00Z"
    }
  ],
  "total": 1
}
```

**Note** : Le champ `cjr` est uniquement visible pour le rôle `directeur`.

---

### GET `/projects/:id`

Récupère un projet par ID.

**Response 200**
```json
{
  "id": "prj_456",
  "nom": "Refonte SI Client X",
  "client": "Client X",
  "type": "forfait",
  "date_debut": "2024-01-01",
  "date_fin": "2024-06-30",
  "cjn": 450.0,
  "cjr": 380.0,  // uniquement si role = directeur
  "owner_id": "usr_123",
  "owner": {
    "nom": "Dupont",
    "prenom": "Jean"
  }
}
```

---

### POST `/projects`

Crée un nouveau projet.

**RBAC** : `administrator`, `directeur`

**Request**
```json
{
  "nom": "Nouveau Projet",
  "client": "Client Y",
  "type": "regie",
  "date_debut": "2024-07-01",
  "date_fin": "2024-12-31",
  "cjn": 500.0,
  "cjr": 420.0,  // optionnel, admin only
  "owner_id": "usr_123"
}
```

**Response 201**
```json
{
  "id": "prj_789",
  "nom": "Nouveau Projet",
  "client": "Client Y",
  "type": "regie",
  "date_debut": "2024-07-01",
  "date_fin": "2024-12-31",
  "cjn": 500.0,
  "owner_id": "usr_123"
}
```

---

### PUT `/projects/:id`

Met à jour un projet.

**RBAC** : `administrator`, `directeur`, ou `project_owner` (owner du projet)

---

### DELETE `/projects/:id`

Supprime un projet (soft delete).

**RBAC** : `administrator`, `directeur`

---

## 👨‍💼 Consultants

### GET `/consultants`

Liste tous les consultants.

**Query params**
- `disponible` : `true`/`false`
- `competences` : Filtrer par compétence (ex: `?competences=React,TypeScript`)

**Response 200**
```json
{
  "consultants": [
    {
      "id": "cst_001",
      "user_id": "usr_124",
      "nom": "Martin",
      "prenom": "Sophie",
      "tjm_defaut": 600.0,
      "competences": ["React", "TypeScript", "Node.js"],
      "disponible": true
    }
  ]
}
```

---

### GET `/consultants/:id`

Récupère un consultant par ID.

---

### POST `/consultants`

Crée un consultant.

**RBAC** : `administrator`

**Request**
```json
{
  "user_id": "usr_124",
  "tjm_defaut": 600.0,
  "competences": ["React", "TypeScript"],
  "disponible": true
}
```

---

### PUT `/consultants/:id`

Met à jour un consultant.

**RBAC** : `administrator`

---

## 🔄 Interventions

### GET `/interventions`

Liste les allocations consultants → projets.

**Query params**
- `consultant_id`
- `project_id`
- `actif` : `true` (interventions en cours)

**Response 200**
```json
{
  "interventions": [
    {
      "id": "int_001",
      "consultant_id": "cst_001",
      "consultant": {
        "nom": "Martin",
        "prenom": "Sophie"
      },
      "project_id": "prj_456",
      "project": {
        "nom": "Refonte SI Client X",
        "client": "Client X"
      },
      "date_debut": "2024-01-15",
      "date_fin": "2024-03-31",
      "tj_facture": 600.0,
      "pourcentage_allocation": 100
    }
  ]
}
```

---

### POST `/interventions`

Crée une intervention (allocation).

**RBAC** : `administrator`, `project_owner`

**Request**
```json
{
  "consultant_id": "cst_001",
  "project_id": "prj_456",
  "date_debut": "2024-01-15",
  "date_fin": "2024-03-31",
  "tj_facture": 600.0,
  "pourcentage_allocation": 100
}
```

**Validations**
- Pas de chevauchement de dates pour le consultant
- `pourcentage_allocation` total ≤ 100% pour une période donnée
- `date_debut` < `date_fin`

**Response 201**
```json
{
  "id": "int_001",
  "consultant_id": "cst_001",
  "project_id": "prj_456",
  "date_debut": "2024-01-15",
  "date_fin": "2024-03-31",
  "tj_facture": 600.0,
  "pourcentage_allocation": 100
}
```

**Errors**
- `409` : Conflit de dates ou allocation >100%

---

## ⏰ Timesheets

### GET `/timesheets`

Liste les saisies de temps.

**RBAC** :
- `consultant` : Ses propres timesheets
- `project_owner` : Timesheets de ses projets
- `administrator`/`directeur` : Tous

**Query params**
- `consultant_id`
- `intervention_id`
- `date_debut`, `date_fin` : Période
- `statut` : `draft`, `submitted`, `validated`, `rejected`

**Response 200**
```json
{
  "timesheets": [
    {
      "id": "ts_001",
      "consultant_id": "cst_001",
      "intervention_id": "int_001",
      "date": "2024-01-15",
      "temps_saisi": 1.0,
      "periode": "journee",
      "statut": "submitted",
      "project": {
        "nom": "Refonte SI Client X",
        "client": "Client X"
      }
    }
  ]
}
```

---

### POST `/timesheets`

Crée une saisie de temps.

**RBAC** : `consultant` (pour soi-même), `administrator`

**Request**
```json
{
  "intervention_id": "int_001",
  "date": "2024-01-15",
  "temps_saisi": 0.5,
  "periode": "matin"
}
```

**Validations**
- `temps_saisi` : **0.5** ou **1.0** uniquement
- `periode` : `"matin"` | `"apres-midi"` | `"journee"`
- Max 1 jour par date (0.5 matin + 0.5 après-midi = 1 jour max)
- Date dans la période de l'intervention

**Response 201**
```json
{
  "id": "ts_001",
  "consultant_id": "cst_001",
  "intervention_id": "int_001",
  "date": "2024-01-15",
  "temps_saisi": 0.5,
  "periode": "matin",
  "statut": "draft"
}
```

**Errors**
- `400` : Validation error (temps_saisi invalide, date hors période)
- `409` : Déjà 1 jour saisi pour cette date

---

### PUT `/timesheets/:id`

Met à jour un timesheet (uniquement si statut = `draft`).

---

### POST `/timesheets/:id/submit`

Soumet un timesheet pour validation.

**Request**
```json
{
  "statut": "submitted"
}
```

**Response 200**
```json
{
  "id": "ts_001",
  "statut": "submitted"
}
```

---

## ✅ Validations

### POST `/timesheets/:id/validate`

Valide ou rejette un timesheet.

**RBAC** : `project_owner` (ses projets), `administrator`, `directeur`

**Request**
```json
{
  "statut": "validated",  // ou "rejected"
  "commentaire": "Approuvé"  // optionnel
}
```

**Response 200**
```json
{
  "id": "val_001",
  "timesheet_id": "ts_001",
  "validator_id": "usr_123",
  "statut": "validated",
  "commentaire": "Approuvé",
  "created_at": "2024-01-20T14:30:00Z"
}
```

---

### POST `/timesheets/bulk-validate`

Validation en masse.

**Request**
```json
{
  "timesheet_ids": ["ts_001", "ts_002", "ts_003"],
  "statut": "validated"
}
```

**Response 200**
```json
{
  "validated": 3,
  "errors": []
}
```

---

## 💬 Chat

### POST `/chat/conversations`

Crée une nouvelle conversation.

**Request**
```json
{
  "titre": "Utilisation janvier 2024"
}
```

**Response 201**
```json
{
  "id": "conv_001",
  "user_id": "usr_124",
  "titre": "Utilisation janvier 2024",
  "created_at": "2024-01-20T10:00:00Z"
}
```

---

### POST `/chat/conversations/:id/messages`

Envoie un message et reçoit réponse IA.

**Request**
```json
{
  "content": "Quel est mon taux d'utilisation ce mois ?"
}
```

**Response 200**
```json
{
  "message": {
    "id": "msg_001",
    "conversation_id": "conv_001",
    "role": "user",
    "content": "Quel est mon taux d'utilisation ce mois ?",
    "created_at": "2024-01-20T10:01:00Z"
  },
  "response": {
    "id": "msg_002",
    "conversation_id": "conv_001",
    "role": "assistant",
    "content": "Votre taux d'utilisation pour janvier 2024 est de 85%. Vous avez saisi 17 jours sur 20 jours ouvrés. Excellent travail ! 🎉",
    "intent": "consulter_utilisation",
    "data": {
      "taux": 85,
      "jours_saisis": 17,
      "jours_ouvres": 20
    },
    "created_at": "2024-01-20T10:01:03Z"
  }
}
```

---

### GET `/chat/conversations/:id/messages`

Liste les messages d'une conversation.

**Response 200**
```json
{
  "messages": [
    {
      "id": "msg_001",
      "role": "user",
      "content": "Quel est mon taux d'utilisation ce mois ?",
      "created_at": "2024-01-20T10:01:00Z"
    },
    {
      "id": "msg_002",
      "role": "assistant",
      "content": "Votre taux d'utilisation...",
      "intent": "consulter_utilization",
      "created_at": "2024-01-20T10:01:03Z"
    }
  ]
}
```

---

## 🔧 MCP Tools

### POST `/mcp/tools/create_timesheet`

**Auth** : Header `X-MCP-API-Key: <JWT>`

**Request**
```json
{
  "consultant_id": "cst_001",
  "intervention_id": "int_001",
  "date": "2024-01-15",
  "temps": 1.0,
  "periode": "journee"
}
```

**Response 200**
```json
{
  "success": true,
  "timesheet": {
    "id": "ts_001",
    "statut": "draft"
  }
}
```

---

### POST `/mcp/tools/get_utilization`

**Request**
```json
{
  "consultant_id": "cst_001",
  "mois": "2024-01"
}
```

**Response 200**
```json
{
  "consultant_id": "cst_001",
  "mois": "2024-01",
  "jours_saisis": 17,
  "jours_ouvres": 20,
  "taux_utilisation": 85,
  "ca_genere": 10200
}
```

---

### POST `/mcp/tools/get_project_margins`

**RBAC** : `directeur` uniquement

**Request**
```json
{
  "project_id": "prj_456"
}
```

**Response 200**
```json
{
  "project_id": "prj_456",
  "ca_reel": 15000,
  "ca_norme": 18000,
  "marge_reelle": 3000,
  "marge_normee": 6000,
  "ecart": -3000
}
```

---

### POST `/mcp/tools/list_consultants`

**Request**
```json
{
  "disponible": true,
  "competences": ["React", "TypeScript"]
}
```

**Response 200**
```json
{
  "consultants": [
    {
      "id": "cst_001",
      "nom": "Martin",
      "prenom": "Sophie",
      "tjm_defaut": 600,
      "competences": ["React", "TypeScript", "Node.js"],
      "disponible": true
    }
  ]
}
```

---

### POST `/mcp/tools/validate_timesheet`

**RBAC** : `project_owner`, `administrator`, `directeur`

**Request**
```json
{
  "timesheet_id": "ts_001",
  "statut": "validated",
  "commentaire": "Approuvé"
}
```

**Response 200**
```json
{
  "success": true,
  "validation": {
    "id": "val_001",
    "statut": "validated"
  }
}
```

---

## 📊 Dashboards

### GET `/dashboard/consultant`

Dashboard pour consultants.

**RBAC** : `consultant`

**Response 200**
```json
{
  "consultant_id": "cst_001",
  "mois_actuel": {
    "taux_utilisation": 85,
    "jours_saisis": 17,
    "jours_restants": 3,
    "ca_genere": 10200
  },
  "interventions_actives": [
    {
      "project": "Refonte SI Client X",
      "client": "Client X",
      "allocation": 100,
      "date_fin": "2024-03-31"
    }
  ],
  "timesheets_en_attente": 2
}
```

---

### GET `/dashboard/project-owner`

Dashboard pour project owners.

**RBAC** : `project_owner`

**Response 200**
```json
{
  "projets_geres": 3,
  "consultants_actifs": 8,
  "timesheets_a_valider": 12,
  "projets": [
    {
      "id": "prj_456",
      "nom": "Refonte SI Client X",
      "consultants": 3,
      "taux_utilisation_moyen": 82,
      "budget_consomme_pct": 45
    }
  ]
}
```

---

### GET `/dashboard/admin`

Dashboard pour administrateurs.

**RBAC** : `administrator`, `directeur`

**Response 200**
```json
{
  "consultants_totaux": 45,
  "consultants_disponibles": 12,
  "projets_actifs": 18,
  "taux_utilisation_global": 78,
  "ca_mensuel": 850000,
  "timesheets_a_valider": 34
}
```

---

### GET `/dashboard/directeur`

Dashboard avec données financières (CJR).

**RBAC** : `directeur` uniquement

**Response 200**
```json
{
  "ca_reel": 850000,
  "ca_norme": 1050000,
  "marge_globale": 180000,
  "marge_pct": 21.2,
  "top_projets_rentables": [
    {
      "project": "Projet A",
      "marge": 45000,
      "marge_pct": 35
    }
  ],
  "projets_en_perte": [
    {
      "project": "Projet B",
      "marge": -15000,
      "marge_pct": -12
    }
  ]
}
```

---

## ⚠️ Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Token invalide/expiré |
| 403 | Forbidden - Permissions insuffisantes |
| 404 | Not Found - Ressource introuvable |
| 409 | Conflict - Duplication ou conflit |
| 429 | Too Many Requests - Rate limit |
| 500 | Internal Server Error |

**Format d'erreur**
```json
{
  "error": "Validation failed",
  "details": {
    "field": "temps_saisi",
    "message": "Doit être 0.5 ou 1.0"
  }
}
```

---

## 🚀 Rate Limits

- **Public** : 100 req/min par IP
- **Authenticated** : 500 req/min par user
- **MCP** : 1000 req/min par API key

---

## 📝 Changelog

**v2.0** (2025-10-05)
- Ajout MCP Tools
- Amélioration chat (10 intents)
- Dashboard directeur avec CJR/CJN

**v1.0** (2024-01-01)
- Version initiale

---

*API Documentation - Dernière mise à jour : 2025-10-05*
