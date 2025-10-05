/**
 * Chat Service
 *
 * AI-powered chat assistant using Gemini API
 * Handles NLU (Natural Language Understanding) for staffing tasks
 */

import type { D1Database } from '@cloudflare/workers-types';
import type { Role } from '../types';

export interface Intent {
  type: IntentType;
  params?: Record<string, any>;
  confidence?: number;
}

export type IntentType =
  | 'TIMESHEET_CREATE'
  | 'TIMESHEET_QUERY'
  | 'TIMESHEET_SUBMIT'
  | 'PROJECT_QUERY'
  | 'CONSULTANT_QUERY'
  | 'VALIDATION_QUERY'
  | 'VALIDATION_ACTION'
  | 'DASHBOARD_QUERY'
  | 'HELP'
  | 'UNKNOWN';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: string;
  created_at?: string;
}

export class ChatService {
  /**
   * Handle incoming chat message
   */
  async handleMessage(
    db: D1Database,
    userId: string,
    userRole: Role,
    message: string,
    conversationId?: string,
    geminiApiKey?: string
  ): Promise<{ response: string; data?: any; conversation_id: string }> {
    // Get or create conversation
    const convId = conversationId || (await this.createConversation(db, userId));

    // Save user message
    await this.saveMessage(db, convId, 'user', message);

    // Detect intent
    const intent = this.detectIntent(message);

    // Execute action based on intent
    let actionResult;
    try {
      actionResult = await this.executeIntent(db, userId, userRole, intent);
    } catch (error) {
      actionResult = {
        error: error instanceof Error ? error.message : 'Erreur lors de l\'exécution',
      };
    }

    // Generate AI response with Gemini
    let aiResponse: string;
    if (geminiApiKey) {
      try {
        aiResponse = await this.callGemini(geminiApiKey, message, intent, actionResult);
      } catch (error) {
        aiResponse = this.generateFallbackResponse(intent, actionResult);
      }
    } else {
      aiResponse = this.generateFallbackResponse(intent, actionResult);
    }

    // Save assistant message
    await this.saveMessage(db, convId, 'assistant', aiResponse, intent.type);

    return {
      response: aiResponse,
      data: actionResult,
      conversation_id: convId,
    };
  }

  /**
   * Detect user intent from message
   */
  detectIntent(message: string): Intent {
    const lower = message.toLowerCase().trim();

    // TIMESHEET_CREATE: "saisis 1 jour", "1j projet alpha"
    if (lower.match(/sais(i|ir).*(\d+\.?\d*)\s*(jour|j)/i)) {
      return {
        type: 'TIMESHEET_CREATE',
        params: this.extractTimeParams(message),
        confidence: 0.9,
      };
    }

    // TIMESHEET_SUBMIT: "soumettre", "submit", "valider mes temps"
    if (lower.match(/(soumet|submit|valid).*temps/)) {
      return { type: 'TIMESHEET_SUBMIT', confidence: 0.85 };
    }

    // TIMESHEET_QUERY: "combien de jours", "mes heures cette semaine"
    if (lower.match(/combien.*(jour|heure|temps)|total.*(semaine|mois)|mes.*(temps|heure)/)) {
      return {
        type: 'TIMESHEET_QUERY',
        params: this.extractPeriodParams(message),
        confidence: 0.9,
      };
    }

    // VALIDATION_QUERY: "timesheets en attente", "à valider"
    if (lower.match(/(timesheet|temps).*attente|à\s*valid/)) {
      return { type: 'VALIDATION_QUERY', confidence: 0.85 };
    }

    // VALIDATION_ACTION: "valider timesheet", "rejeter"
    if (lower.match(/(valid|accept|reject|rejet).*timesheet/)) {
      return {
        type: 'VALIDATION_ACTION',
        params: this.extractValidationParams(message),
        confidence: 0.8,
      };
    }

    // PROJECT_QUERY: "mes projets", "projet alpha"
    if (lower.match(/\b(projet|mission|project)s?\b/)) {
      return {
        type: 'PROJECT_QUERY',
        params: this.extractProjectParams(message),
        confidence: 0.8,
      };
    }

    // CONSULTANT_QUERY: "mes consultants", "disponibilité"
    if (lower.match(/consultant|disponibl|capacit/)) {
      return { type: 'CONSULTANT_QUERY', confidence: 0.75 };
    }

    // DASHBOARD_QUERY: "dashboard", "statistiques", "kpi"
    if (lower.match(/dashboard|statistique|kpi|metric/)) {
      return { type: 'DASHBOARD_QUERY', confidence: 0.8 };
    }

    // HELP
    if (lower.match(/aide|help|\?$/)) {
      return { type: 'HELP', confidence: 1.0 };
    }

    return { type: 'UNKNOWN', confidence: 0.0 };
  }

  /**
   * Execute action based on intent
   */
  private async executeIntent(
    db: D1Database,
    userId: string,
    userRole: Role,
    intent: Intent
  ): Promise<any> {
    switch (intent.type) {
      case 'TIMESHEET_QUERY':
        return this.queryTimesheets(db, userId, userRole, intent.params);

      case 'PROJECT_QUERY':
        return this.queryProjects(db, userId, userRole);

      case 'CONSULTANT_QUERY':
        return this.queryConsultants(db, userId, userRole);

      case 'VALIDATION_QUERY':
        return this.queryPendingValidations(db, userId, userRole);

      case 'DASHBOARD_QUERY':
        return this.queryDashboard(db, userId, userRole);

      case 'HELP':
        return this.getHelpInfo(userRole);

      default:
        return {
          message: 'Je n\'ai pas compris votre demande. Tapez "aide" pour voir les commandes disponibles.',
        };
    }
  }

  /**
   * Query timesheets
   */
  private async queryTimesheets(
    db: D1Database,
    userId: string,
    userRole: Role,
    params?: Record<string, any>
  ) {
    const period = params?.period || 'week';

    // Get consultant ID
    const consultant = await db
      .prepare('SELECT id FROM consultants WHERE user_id = ?')
      .bind(userId)
      .first<{ id: string }>();

    if (!consultant && userRole === 'consultant') {
      throw new Error('Profil consultant non trouvé');
    }

    let dateFilter = '';
    if (period === 'week') {
      dateFilter = "AND t.date >= date('now', 'weekday 0', '-6 days') AND t.date <= date('now', 'weekday 0')";
    } else if (period === 'month') {
      dateFilter = "AND t.date >= date('now', 'start of month') AND t.date < date('now', 'start of month', '+1 month')";
    }

    const query = `
      SELECT
        t.id,
        t.date,
        t.temps_saisi,
        t.periode,
        t.statut,
        p.nom as project_nom
      FROM timesheets t
      INNER JOIN interventions i ON t.intervention_id = i.id
      INNER JOIN projects p ON i.project_id = p.id
      WHERE t.consultant_id = ?
      ${dateFilter}
      ORDER BY t.date DESC
    `;

    const result = await db.prepare(query).bind(consultant?.id).all();

    const total = (result.results || []).reduce((sum: number, t: any) => sum + (t.temps_saisi || 0), 0);

    return {
      period,
      total_jours: total,
      entries: result.results || [],
    };
  }

  /**
   * Query projects
   */
  private async queryProjects(
    db: D1Database,
    userId: string,
    userRole: Role
  ) {
    let query = `
      SELECT
        p.id,
        p.nom,
        p.client,
        p.type,
        p.statut,
        p.date_debut,
        p.date_fin
      FROM projects p
    `;

    const bindings: any[] = [];

    if (userRole === 'consultant') {
      query += `
        INNER JOIN interventions i ON p.id = i.project_id
        INNER JOIN consultants c ON i.consultant_id = c.id
        WHERE c.user_id = ?
          AND (i.date_fin_reelle IS NULL OR i.date_fin_reelle >= date('now'))
      `;
      bindings.push(userId);
    } else if (userRole === 'project_owner') {
      query += ' WHERE p.owner_id = ?';
      bindings.push(userId);
    } else {
      query += ' WHERE p.statut = ?';
      bindings.push('actif');
    }

    query += ' ORDER BY p.nom';

    const result = await db.prepare(query).bind(...bindings).all();

    return {
      projects: result.results || [],
      count: result.results?.length || 0,
    };
  }

  /**
   * Query consultants
   */
  private async queryConsultants(db: D1Database, _userId: string, userRole: Role) {
    if (userRole === 'consultant') {
      throw new Error('Les consultants ne peuvent pas consulter la liste des consultants');
    }

    const result = await db
      .prepare(
        `SELECT
           c.id,
           u.nom,
           u.prenom,
           c.tjm_defaut,
           c.disponible,
           COALESCE(v.taux_utilisation, 0) as taux_utilisation
         FROM consultants c
         INNER JOIN users u ON c.user_id = u.id
         LEFT JOIN v_consultant_utilization v ON c.id = v.consultant_id
         WHERE c.disponible = 1
         ORDER BY u.nom, u.prenom`
      )
      .all();

    return {
      consultants: result.results || [],
      count: result.results?.length || 0,
    };
  }

  /**
   * Query pending validations
   */
  private async queryPendingValidations(db: D1Database, userId: string, userRole: Role) {
    if (userRole === 'consultant') {
      throw new Error('Les consultants ne peuvent pas voir les validations en attente');
    }

    let query = `
      SELECT
        t.id,
        t.date,
        t.temps_saisi,
        c.id as consultant_id,
        u.nom as consultant_nom,
        u.prenom as consultant_prenom,
        p.nom as project_nom
      FROM timesheets t
      INNER JOIN consultants c ON t.consultant_id = c.id
      INNER JOIN users u ON c.user_id = u.id
      INNER JOIN interventions i ON t.intervention_id = i.id
      INNER JOIN projects p ON i.project_id = p.id
      WHERE t.statut = 'submitted'
    `;

    const bindings: any[] = [];

    if (userRole === 'project_owner') {
      query += ' AND p.owner_id = ?';
      bindings.push(userId);
    }

    query += ' ORDER BY t.date DESC';

    const result = await db.prepare(query).bind(...bindings).all();

    return {
      pending: result.results || [],
      count: result.results?.length || 0,
    };
  }

  /**
   * Query dashboard
   */
  private async queryDashboard(_db: D1Database, _userId: string, userRole: Role) {
    // Simplified dashboard query - reuse actual dashboard service in production
    return {
      message: 'Utilisez /dashboards/me pour voir votre dashboard complet',
      role: userRole,
    };
  }

  /**
   * Get help information
   */
  private getHelpInfo(userRole: Role) {
    const commands = [
      'Combien de jours cette semaine ?',
      'Mes projets',
      'Mes statistiques',
    ];

    if (userRole !== 'consultant') {
      commands.push('Timesheets en attente', 'Mes consultants');
    }

    return {
      message: 'Voici ce que je peux faire pour vous :',
      commands,
      examples: [
        'Combien de jours ce mois ?',
        'Mes projets actifs',
        'Mes consultants disponibles',
      ],
    };
  }

  /**
   * Call Gemini API
   */
  private async callGemini(
    apiKey: string,
    userMessage: string,
    intent: Intent,
    actionResult: any
  ): Promise<string> {
    const systemPrompt = `Tu es un assistant virtuel pour une application de staffing ESN.
Ton rôle est d'aider les utilisateurs avec leurs timesheets, projets, et consultants.
Réponds de manière concise, naturelle et professionnelle en français.
Ne dépasse pas 2-3 phrases.`;

    const contextPrompt = `Message utilisateur: ${userMessage}
Intent détecté: ${intent.type}
Données: ${JSON.stringify(actionResult)}

Réponds de manière naturelle et concise.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${systemPrompt}\n\n${contextPrompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
            topP: 0.95,
            topK: 40,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = (await response.json()) as any;
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error('No response from Gemini');
    }

    return aiResponse;
  }

  /**
   * Generate fallback response (when Gemini is unavailable)
   */
  private generateFallbackResponse(intent: Intent, actionResult: any): string {
    if (actionResult.error) {
      return `Erreur : ${actionResult.error}`;
    }

    switch (intent.type) {
      case 'TIMESHEET_QUERY':
        return `Vous avez saisi ${actionResult.total_jours || 0} jours sur la période demandée.`;

      case 'PROJECT_QUERY':
        return `Vous avez ${actionResult.count || 0} projet(s).`;

      case 'CONSULTANT_QUERY':
        return `Il y a ${actionResult.count || 0} consultant(s) disponible(s).`;

      case 'VALIDATION_QUERY':
        return `Il y a ${actionResult.count || 0} timesheet(s) en attente de validation.`;

      case 'HELP':
        return actionResult.message || 'Comment puis-je vous aider ?';

      default:
        return actionResult.message || 'Demande traitée.';
    }
  }

  /**
   * Extract time parameters from message
   */
  private extractTimeParams(message: string): Record<string, any> {
    const match = message.match(/(\d+\.?\d*)\s*(jour|j)/i);
    const jours = match ? parseFloat(match[1]) : 1;

    // Extract project name (simplified)
    const projectMatch = message.match(/projet\s+(\w+)/i);
    const projectName = projectMatch ? projectMatch[1] : undefined;

    return { jours, project: projectName };
  }

  /**
   * Extract period parameters
   */
  private extractPeriodParams(message: string): Record<string, any> {
    if (message.match(/semaine|week/i)) {
      return { period: 'week' };
    }
    if (message.match(/mois|month/i)) {
      return { period: 'month' };
    }
    return { period: 'week' };
  }

  /**
   * Extract project parameters
   */
  private extractProjectParams(message: string): Record<string, any> {
    const projectMatch = message.match(/projet\s+(\w+)/i);
    return projectMatch ? { name: projectMatch[1] } : {};
  }

  /**
   * Extract validation parameters
   */
  private extractValidationParams(message: string): Record<string, any> {
    const action = message.match(/reject|rejet/i) ? 'rejected' : 'validated';
    return { action };
  }

  /**
   * Create conversation
   */
  private async createConversation(db: D1Database, userId: string): Promise<string> {
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db
      .prepare(
        `INSERT INTO chat_conversations (id, user_id, titre, created_at)
         VALUES (?, ?, ?, datetime('now'))`
      )
      .bind(conversationId, userId, 'Chat Assistant')
      .run();

    return conversationId;
  }

  /**
   * Save message to database
   */
  private async saveMessage(
    db: D1Database,
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    intent?: string
  ): Promise<void> {
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await db
      .prepare(
        `INSERT INTO chat_messages (id, conversation_id, role, content, intent, created_at)
         VALUES (?, ?, ?, ?, ?, datetime('now'))`
      )
      .bind(messageId, conversationId, role, content, intent || null)
      .run();
  }

  /**
   * Get conversation history
   */
  async getHistory(db: D1Database, conversationId: string): Promise<ChatMessage[]> {
    const result = await db
      .prepare(
        `SELECT id, conversation_id, role, content, intent, created_at
         FROM chat_messages
         WHERE conversation_id = ?
         ORDER BY created_at ASC`
      )
      .bind(conversationId)
      .all();

    return (result.results || []) as unknown as ChatMessage[];
  }

  /**
   * Get user conversations
   */
  async getUserConversations(db: D1Database, userId: string) {
    const result = await db
      .prepare(
        `SELECT
           c.id,
           c.titre,
           c.created_at,
           (SELECT content FROM chat_messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message
         FROM chat_conversations c
         WHERE c.user_id = ?
         ORDER BY c.created_at DESC`
      )
      .bind(userId)
      .all();

    return result.results || [];
  }
}
