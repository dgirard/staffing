# CHANTIER 10 : MCP Server

> **Durée** : 3j | **Dépend de** : 09 | **Suivant** : 11 | **Coverage** : 85%+

## 🎯 Objectifs

✅ Serveur MCP (Model Context Protocol)
✅ 5 tools core (timesheet, consultants, projets, marges, utilisation)
✅ Authentication MCP
✅ 20+ tests

## ✅ MCP Server

```typescript
// api/src/mcp/server.ts
import { MCPServer, Tool } from '@modelcontextprotocol/sdk';

const server = new MCPServer({
  name: 'staffing-esn',
  version: '1.0.0'
});

// Tool 1: Create Timesheet
server.addTool({
  name: 'create_timesheet',
  description: 'Create a timesheet entry',
  inputSchema: {
    type: 'object',
    properties: {
      consultant_id: { type: 'string' },
      project_id: { type: 'string' },
      date: { type: 'string', format: 'date' },
      periode: { type: 'string', enum: ['matin', 'apres_midi', 'journee'] },
      jours: { type: 'number', enum: [0.5, 1.0] }
    },
    required: ['consultant_id', 'project_id', 'date', 'periode', 'jours']
  },
  handler: async (params, context) => {
    const entry = await createTimeEntry(params);
    return { success: true, time_entry_id: entry.id };
  }
});

// Tool 2: Get Consultant Utilization
server.addTool({
  name: 'get_utilization',
  description: 'Get consultant utilization rate',
  inputSchema: {
    type: 'object',
    properties: {
      consultant_id: { type: 'string' },
      period: { type: 'string', enum: ['week', 'month', 'year'] }
    },
    required: ['consultant_id']
  },
  handler: async (params, context) => {
    const util = await getUtilization(params.consultant_id, params.period);
    return { utilization_pct: util.taux, jours: util.jours };
  }
});

// Tool 3: Get Project Margins
server.addTool({
  name: 'get_project_margins',
  description: 'Get project margins (CJN for most roles, CJR for directeur)',
  inputSchema: {
    type: 'object',
    properties: {
      project_id: { type: 'string' },
      use_real_cost: { type: 'boolean', default: false }
    },
    required: ['project_id']
  },
  handler: async (params, context) => {
    // Vérifier auth context
    if (params.use_real_cost && context.user.role !== 'directeur') {
      throw new Error('CJR access requires directeur role');
    }

    const margins = await getProjectMargins(params.project_id, params.use_real_cost);
    return margins;
  }
});

// Tool 4: List Consultants
server.addTool({
  name: 'list_consultants',
  description: 'List all active consultants',
  inputSchema: { type: 'object', properties: {} },
  handler: async (params, context) => {
    const consultants = await listConsultants(context.user.role);
    return { consultants };
  }
});

// Tool 5: Validate Timesheet
server.addTool({
  name: 'validate_timesheet',
  description: 'Validate a timesheet entry',
  inputSchema: {
    type: 'object',
    properties: {
      time_entry_id: { type: 'string' }
    },
    required: ['time_entry_id']
  },
  handler: async (params, context) => {
    await validateTimesheet(params.time_entry_id, context.user.id, context.user.role);
    return { success: true };
  }
});

// Authentication middleware
server.use(async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.context = { user: payload };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});

export default server;
```

## Exemple utilisation (Claude Desktop)

```json
// .claude/mcp_config.json
{
  "mcpServers": {
    "staffing-esn": {
      "url": "https://staffing-api.xxx.workers.dev/mcp",
      "auth": {
        "type": "bearer",
        "token": "${STAFFING_TOKEN}"
      }
    }
  }
}
```

**Conversation Claude** :

```
User: Crée une saisie de temps pour moi aujourd'hui, 1 jour sur projet Alpha

Claude: [Appelle MCP tool create_timesheet]
       ✅ J'ai créé une saisie de 1 jour sur le projet Alpha pour aujourd'hui.
       ID: time-entry-123

User: Quel est mon taux d'utilisation ce mois ?

Claude: [Appelle MCP tool get_utilization]
       Votre taux d'utilisation ce mois est de 78% (16.5 jours sur 21 jours ouvrés).
```

## Tests

```typescript
describe('MCP Server', () => {
  it('should list available tools', async () => {
    const tools = await mcpServer.listTools();
    expect(tools).toHaveLength(5);
    expect(tools.map(t => t.name)).toContain('create_timesheet');
  });

  it('should create timesheet via MCP', async () => {
    const result = await mcpServer.callTool('create_timesheet', {
      consultant_id: 'c1',
      project_id: 'p1',
      date: '2024-01-15',
      periode: 'journee',
      jours: 1.0
    }, { user: { id: 'u1', role: 'consultant' } });

    expect(result.success).toBe(true);
    expect(result.time_entry_id).toBeDefined();
  });

  it('should enforce CJR access control', async () => {
    await expect(
      mcpServer.callTool('get_project_margins', {
        project_id: 'p1',
        use_real_cost: true
      }, { user: { id: 'u1', role: 'administrator' } })
    ).rejects.toThrow('CJR access requires directeur');
  });
});
```

## 📤 Livrables

- MCP Server avec 5 tools
- Authentication JWT
- Documentation MCP
- 20+ tests

---

_Chantier 10 : MCP_
