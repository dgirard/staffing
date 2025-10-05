# HANDOFF 10 : MCP Server

**Date** : 2025-10-05
**Chantier** : CHANTIER_10
**Statut** : ✅ TERMINÉ
**Durée** : 3j (estimé)

---

## 🎯 Objectifs

Implémenter un serveur Model Context Protocol (MCP) pour exposer l'API Staffing ESN aux LLM :
- ✅ Serveur MCP (Model Context Protocol)
- ✅ 8 tools core (timesheet, consultants, projets, marges, utilisation, validations)
- ✅ Authentication JWT
- ✅ Schémas d'input validés

---

## 📦 Livrables

### 1. MCP Service (`mcp.service.ts`)

**Fichier** : `api/src/services/mcp.service.ts` (552 lignes)

**Types définis** :
```typescript
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MCPContext {
  userId: string;
  role: Role;
}
```

**Méthodes principales** :

#### `listTools()` - Liste des 8 tools

1. **create_timesheet**
   - Description : Create a timesheet entry for a consultant on a project
   - Paramètres : consultant_id, intervention_id, date, periode, temps_saisi, commentaire
   - Retour : `{ success, timesheet_id, message }`

2. **get_consultant_utilization**
   - Description : Get consultant utilization rate for a period
   - Paramètres : consultant_id, month (optional)
   - Retour : `{ consultant_id, taux_utilisation, jours_saisis, nb_interventions_actives }`

3. **get_project_margins**
   - Description : Get project margins (CJN for most roles, CJR for directeur only)
   - Paramètres : project_id, use_real_cost (boolean)
   - Retour : `{ project_nom, ca_realise, cout, marge, cost_type }`
   - Sécurité : CJR access requires directeur role

4. **list_consultants**
   - Description : List all active consultants with their utilization
   - Paramètres : disponible (optional)
   - Retour : `{ consultants[], count }`
   - Restriction : Consultants cannot list other consultants

5. **validate_timesheet**
   - Description : Validate or reject a timesheet entry
   - Paramètres : timesheet_id, statut, commentaire
   - Retour : `{ success, validation_id, message }`
   - RBAC : owner/admin/directeur only

6. **list_pending_validations**
   - Description : List timesheets pending validation
   - Paramètres : (none)
   - Retour : `{ pending[], count }`
   - RBAC : owner/admin/directeur only

7. **get_my_timesheets**
   - Description : Get my timesheets for a period
   - Paramètres : month (optional, YYYY-MM)
   - Retour : `{ timesheets[], count }`

8. **get_my_projects**
   - Description : Get my active projects
   - Paramètres : (none)
   - Retour : `{ projects[], count }`

#### `callTool(db, toolName, params, context)`
Dispatcher principal :
- Vérifie que le tool existe
- Route vers la méthode privée appropriée
- Gère les erreurs de façon uniforme

**Sécurité intégrée** :
- Ownership checks pour consultants
- RBAC enforcement pour validations
- CJR access control pour directeur
- Project ownership pour project_owner

---

### 2. MCP Routes (`mcp.routes.ts`)

**Fichier** : `api/src/routes/mcp.routes.ts` (156 lignes)

**Endpoints implémentés** :

| Méthode | Route | RBAC | Description |
|---------|-------|------|-------------|
| GET | `/mcp/tools` | requireAuth | Liste des tools disponibles |
| POST | `/mcp/call` | requireAuth | Appeler un tool |
| GET | `/mcp/tools/:toolName` | requireAuth | Schéma d'un tool spécifique |
| POST | `/mcp/tools/list` | requireAuth | Liste tools (alt. endpoint) |

#### POST /mcp/call

**Body** :
```json
{
  "name": "get_my_timesheets",
  "arguments": {
    "month": "2025-10"
  }
}
```

**Validation** :
- `name` : string (requis)
- `arguments` : object (optionnel, default {})

**Réponse MCP format** :
```json
{
  "content": [
    {
      "type": "text",
      "text": "{\n  \"timesheets\": [...],\n  \"count\": 5\n}"
    }
  ]
}
```

**Gestion d'erreur** :
- 403 Forbidden : Insufficient permissions (directeur, ownership)
- 404 Not Found : Tool/Resource not found
- 400 Bad Request : Unknown tool, validation errors
- 500 Internal Server Error : Unexpected errors

#### GET /mcp/tools

**Réponse** :
```json
{
  "tools": [
    {
      "name": "create_timesheet",
      "description": "Create a timesheet entry for a consultant on a project",
      "inputSchema": {
        "type": "object",
        "properties": {
          "consultant_id": { "type": "string", "description": "Consultant ID" },
          "intervention_id": { "type": "string", "description": "Intervention ID" },
          "date": { "type": "string", "format": "date", "description": "Date (YYYY-MM-DD)" },
          "periode": {
            "type": "string",
            "enum": ["matin", "apres_midi", "journee"],
            "description": "Period of the day"
          },
          "temps_saisi": { "type": "number", "enum": [0.5, 1.0], "description": "Time in days" },
          "commentaire": { "type": "string", "description": "Optional comment" }
        },
        "required": ["consultant_id", "intervention_id", "date", "periode", "temps_saisi"]
      }
    }
  ]
}
```

#### GET /mcp/tools/:toolName

**Exemple** : `/mcp/tools/create_timesheet`

**Réponse** : Schéma complet du tool (cf. ci-dessus)

---

### 3. Intégration (`index.ts`)

**Fichier modifié** : `api/src/index.ts`

**Changements** :
```typescript
// Import
import mcpRoutes from './routes/mcp.routes';

// Version update
version: '0.10.0',
message: 'Staffing ESN API - CHANTIER_10 MCP Server',

// Route mounting
const mcpApp = app.basePath('/mcp');
mcpApp.use('*', jwtMiddleware);
mcpApp.route('/', mcpRoutes);
```

---

## 🤖 Utilisation avec Claude Desktop

### Configuration MCP

**Fichier** : `~/.config/claude/claude_desktop_config.json` (macOS/Linux)
ou `%APPDATA%\Claude\claude_desktop_config.json` (Windows)

```json
{
  "mcpServers": {
    "staffing-esn": {
      "command": "node",
      "args": [
        "/path/to/mcp-proxy.js"
      ],
      "env": {
        "API_URL": "http://localhost:8787",
        "JWT_TOKEN": "your-jwt-token-here"
      }
    }
  }
}
```

### Proxy MCP (Node.js)

**Fichier** : `mcp-proxy.js`

```javascript
#!/usr/bin/env node

const http = require('http');

const API_URL = process.env.API_URL || 'http://localhost:8787';
const JWT_TOKEN = process.env.JWT_TOKEN;

async function listTools() {
  const response = await fetch(`${API_URL}/mcp/tools`, {
    headers: {
      'Authorization': `Bearer ${JWT_TOKEN}`
    }
  });

  const data = await response.json();
  return data.tools;
}

async function callTool(name, args) {
  const response = await fetch(`${API_URL}/mcp/call`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${JWT_TOKEN}`
    },
    body: JSON.stringify({ name, arguments: args })
  });

  return await response.json();
}

// MCP Protocol implementation
process.stdin.on('data', async (data) => {
  const request = JSON.parse(data.toString());

  if (request.method === 'tools/list') {
    const tools = await listTools();
    process.stdout.write(JSON.stringify({ tools }) + '\n');
  } else if (request.method === 'tools/call') {
    const result = await callTool(request.params.name, request.params.arguments);
    process.stdout.write(JSON.stringify(result) + '\n');
  }
});
```

### Exemples de conversations

**Créer un timesheet** :
```
User: Crée une saisie de temps pour moi aujourd'hui, 1 jour sur l'intervention int_001

Claude: [Appelle create_timesheet]
       ✅ J'ai créé un timesheet de 1 jour pour aujourd'hui sur l'intervention int_001.
       ID: ts_1728123456_abc123
```

**Consulter utilisation** :
```
User: Quel est mon taux d'utilisation ce mois ?

Claude: [Appelle get_my_timesheets avec month=2025-10, puis calcule]
       Votre taux d'utilisation en octobre 2025 est de 78% (16.5 jours sur 21 jours ouvrés).
```

**Lister consultants** :
```
User: Liste-moi tous les consultants disponibles

Claude: [Appelle list_consultants]
       Il y a 12 consultants disponibles :
       - Dupont Jean (85% d'utilisation)
       - Martin Sophie (72% d'utilisation)
       - ...
```

**Valider timesheets** :
```
User: Valide le timesheet ts_123

Claude: [Appelle validate_timesheet]
       ✅ Timesheet ts_123 validé avec succès.
```

---

## 🧪 Tests recommandés

### Tests Service

```typescript
describe('MCPService', () => {
  describe('listTools', () => {
    it('should list 8 tools', () => {
      const tools = service.listTools();
      expect(tools).toHaveLength(8);
    });

    it('should include create_timesheet tool', () => {
      const tools = service.listTools();
      const createTool = tools.find(t => t.name === 'create_timesheet');
      expect(createTool).toBeDefined();
      expect(createTool?.inputSchema.required).toContain('consultant_id');
    });
  });

  describe('callTool', () => {
    it('should create timesheet', async () => {
      const result = await service.callTool(
        db,
        'create_timesheet',
        {
          consultant_id: 'cons_001',
          intervention_id: 'int_001',
          date: '2025-10-05',
          periode: 'journee',
          temps_saisi: 1.0
        },
        { userId: 'usr_001', role: 'consultant' }
      );

      expect(result.success).toBe(true);
      expect(result.timesheet_id).toMatch(/^ts_/);
    });

    it('should get consultant utilization', async () => {
      const result = await service.callTool(
        db,
        'get_consultant_utilization',
        { consultant_id: 'cons_001' },
        { userId: 'usr_001', role: 'administrator' }
      );

      expect(result).toHaveProperty('taux_utilisation');
      expect(result).toHaveProperty('jours_saisis');
    });

    it('should enforce CJR access control', async () => {
      await expect(
        service.callTool(
          db,
          'get_project_margins',
          { project_id: 'proj_001', use_real_cost: true },
          { userId: 'usr_001', role: 'administrator' }
        )
      ).rejects.toThrow('CJR access requires directeur role');
    });

    it('should allow CJR for directeur', async () => {
      const result = await service.callTool(
        db,
        'get_project_margins',
        { project_id: 'proj_001', use_real_cost: true },
        { userId: 'usr_directeur', role: 'directeur' }
      );

      expect(result.cost_type).toBe('CJR');
    });

    it('should reject unknown tool', async () => {
      await expect(
        service.callTool(
          db,
          'unknown_tool',
          {},
          { userId: 'usr_001', role: 'consultant' }
        )
      ).rejects.toThrow('Unknown tool: unknown_tool');
    });
  });

  describe('Ownership checks', () => {
    it('should allow consultant to create own timesheet', async () => {
      const result = await service.callTool(
        db,
        'create_timesheet',
        {
          consultant_id: 'cons_001',
          intervention_id: 'int_001',
          date: '2025-10-05',
          periode: 'journee',
          temps_saisi: 1.0
        },
        { userId: 'usr_001', role: 'consultant' }
      );

      expect(result.success).toBe(true);
    });

    it('should reject consultant creating for another', async () => {
      await expect(
        service.callTool(
          db,
          'create_timesheet',
          {
            consultant_id: 'cons_002',
            intervention_id: 'int_001',
            date: '2025-10-05',
            periode: 'journee',
            temps_saisi: 1.0
          },
          { userId: 'usr_001', role: 'consultant' }
        )
      ).rejects.toThrow('pour vous-même');
    });

    it('should reject consultant listing consultants', async () => {
      await expect(
        service.callTool(
          db,
          'list_consultants',
          {},
          { userId: 'usr_001', role: 'consultant' }
        )
      ).rejects.toThrow('ne peuvent pas lister');
    });
  });

  describe('RBAC validation', () => {
    it('should reject consultant validating timesheet', async () => {
      await expect(
        service.callTool(
          db,
          'validate_timesheet',
          { timesheet_id: 'ts_001', statut: 'validated' },
          { userId: 'usr_001', role: 'consultant' }
        )
      ).rejects.toThrow('project owners, admins et directeurs');
    });

    it('should allow admin to validate', async () => {
      const result = await service.callTool(
        db,
        'validate_timesheet',
        { timesheet_id: 'ts_001', statut: 'validated' },
        { userId: 'usr_admin', role: 'administrator' }
      );

      expect(result.success).toBe(true);
    });
  });
});
```

### Tests Routes

```typescript
describe('MCP Routes', () => {
  it('should list tools', async () => {
    const res = await request(app)
      .get('/mcp/tools')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.tools).toBeInstanceOf(Array);
    expect(res.body.tools).toHaveLength(8);
  });

  it('should get tool schema', async () => {
    const res = await request(app)
      .get('/mcp/tools/create_timesheet')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('create_timesheet');
    expect(res.body.inputSchema).toBeDefined();
  });

  it('should return 404 for unknown tool schema', async () => {
    const res = await request(app)
      .get('/mcp/tools/unknown')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('should call tool via POST /mcp/call', async () => {
    const res = await request(app)
      .post('/mcp/call')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'get_my_projects',
        arguments: {}
      });

    expect(res.status).toBe(200);
    expect(res.body.content).toBeInstanceOf(Array);
    expect(res.body.content[0].type).toBe('text');
  });

  it('should reject unauthenticated requests', async () => {
    const res = await request(app)
      .get('/mcp/tools');

    expect(res.status).toBe(401);
  });

  it('should return 403 for forbidden tool calls', async () => {
    const res = await request(app)
      .post('/mcp/call')
      .set('Authorization', `Bearer ${consultantToken}`)
      .send({
        name: 'list_consultants',
        arguments: {}
      });

    expect(res.status).toBe(403);
  });

  it('should validate request body', async () => {
    const res = await request(app)
      .post('/mcp/call')
      .set('Authorization', `Bearer ${token}`)
      .send({
        // Missing 'name'
        arguments: {}
      });

    expect(res.status).toBe(400);
  });
});
```

---

## 🚀 Utilisation

### Requêtes cURL

```bash
# Liste des tools
curl -X GET http://localhost:8787/mcp/tools \
  -H "Authorization: Bearer $JWT_TOKEN"

# Schéma d'un tool
curl -X GET http://localhost:8787/mcp/tools/create_timesheet \
  -H "Authorization: Bearer $JWT_TOKEN"

# Créer un timesheet
curl -X POST http://localhost:8787/mcp/call \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "create_timesheet",
    "arguments": {
      "consultant_id": "cons_001",
      "intervention_id": "int_001",
      "date": "2025-10-05",
      "periode": "journee",
      "temps_saisi": 1.0
    }
  }'

# Mes timesheets
curl -X POST http://localhost:8787/mcp/call \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_my_timesheets",
    "arguments": {
      "month": "2025-10"
    }
  }'

# Liste consultants (admin)
curl -X POST http://localhost:8787/mcp/call \
  -H "Authorization: Bearer $JWT_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "list_consultants",
    "arguments": {}
  }'

# Marges projet avec CJR (directeur)
curl -X POST http://localhost:8787/mcp/call \
  -H "Authorization: Bearer $JWT_DIRECTEUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "get_project_margins",
    "arguments": {
      "project_id": "proj_001",
      "use_real_cost": true
    }
  }'
```

---

## 📝 Notes techniques

### Format MCP

**Content format** :
```json
{
  "content": [
    {
      "type": "text",
      "text": "JSON stringified data"
    }
  ]
}
```

Le format MCP standard encapsule la réponse dans un tableau `content` avec un objet `{type, text}`.

### Schémas JSON

Tous les tools incluent :
- `name` : Nom du tool
- `description` : Description claire
- `inputSchema` : JSON Schema complet avec :
  - `type: "object"`
  - `properties` : Définition de chaque paramètre
  - `required` : Liste des paramètres obligatoires

### Sécurité

- **JWT requis** : Tous endpoints protégés
- **RBAC** : Vérification rôle avant exécution
- **Ownership** : Consultants limités à leurs données
- **CJR** : Directeur uniquement
- **Status checks** : Validation workflow respecté

### Performance

- **Pas de N+1** : Requêtes optimisées avec JOINs
- **Vues matérialisées** : `v_consultant_utilization`, `v_project_margins`
- **Index** : Sur toutes foreign keys

---

## ✅ Checklist de complétion

- [x] MCPService avec 8 tools
- [x] JSON Schema pour chaque tool
- [x] Routes MCP (4 endpoints)
- [x] Authentication JWT
- [x] RBAC enforcement
- [x] Ownership checks
- [x] CJR access control
- [x] Error handling uniforme
- [x] MCP content format
- [x] Intégration index.ts
- [x] Version API → 0.10.0
- [x] TypeScript strict mode (0 erreurs)
- [x] Documentation complète

---

## 🔄 Prochaines étapes (CHANTIER_11)

Le prochain chantier concernera :
- **CHANTIER_11** : Déploiement Cloudflare Workers
- Configuration production
- CI/CD pipeline

---

## 📚 Références

- Spec : `chantiers/CHANTIER_10_mcp.md`
- Service : `api/src/services/mcp.service.ts`
- Routes : `api/src/routes/mcp.routes.ts`
- MCP Protocol : https://modelcontextprotocol.io/
- Claude Desktop MCP : https://docs.anthropic.com/claude/docs/mcp

---

**Handoff complet : CHANTIER_10 terminé avec succès** ✅
