# CHANTIER 09 : Chat Gemini API + NLU

> **Durée** : 4j | **Dépend de** : 06 | **Suivant** : 10 | **Coverage** : 80%+

## 🎯 Objectifs

✅ Intégration Gemini API
✅ Détection intentions (NLU)
✅ 10 actions principales via chat
✅ UI chat + historique

## ✅ Backend - Chat Service

```typescript
async handleChatMessage(userId: string, message: string) {
  // Détection intention
  const intent = await detectIntent(message);

  // Exécuter action selon intention
  let actionResult;
  switch (intent.type) {
    case 'TIMESHEET_CREATE':
      actionResult = await createTimeEntry(userId, intent.params);
      break;
    case 'TIMESHEET_QUERY':
      actionResult = await queryTimeEntries(userId, intent.params);
      break;
    case 'PROJECT_QUERY':
      actionResult = await queryProjects(userId, intent.params);
      break;
  }

  // Générer réponse naturelle avec Gemini
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Contexte: Assistant staffing ESN.
User: ${message}
Data: ${JSON.stringify(actionResult)}
Réponds de manière concise et naturelle.`
          }]
        }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
      })
    }
  );

  const geminiData = await response.json();
  const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

  // Sauvegarder historique
  await saveChatHistory(userId, message, aiResponse);

  return { response: aiResponse, data: actionResult };
}

function detectIntent(message: string): Intent {
  const lower = message.toLowerCase();

  if (lower.match(/sais(i|ir).*(\d+\.?\d*)\s*(jour|j)/)) {
    return { type: 'TIMESHEET_CREATE', params: extractTimeParams(message) };
  }
  if (lower.match(/combien.*semaine|total.*semaine/)) {
    return { type: 'TIMESHEET_QUERY', params: { period: 'week' } };
  }
  if (lower.match(/projet|mission/)) {
    return { type: 'PROJECT_QUERY' };
  }

  return { type: 'HELP' };
}
```

## Frontend - Chat UI

```tsx
function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const sendMessage = async () => {
    const userMsg = { role: 'user', content: input };
    setMessages([...messages, userMsg]);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message: input })
    });

    const { response, data } = await res.json();
    setMessages(prev => [...prev, { role: 'assistant', content: response, data }]);
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block p-3 rounded-lg ${
              msg.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100'
            }`}>
              {msg.content}
            </div>
            {msg.data && (
              <div className="mt-2 text-sm bg-blue-50 p-2 rounded">
                {JSON.stringify(msg.data, null, 2)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Saisis 1 jour projet Alpha..."
            className="input flex-1"
          />
          <button onClick={sendMessage} className="btn-primary">
            Envoyer
          </button>
        </div>

        <div className="mt-2 flex gap-2 flex-wrap">
          <button className="btn-secondary text-xs" onClick={() => setInput('Combien de jours cette semaine ?')}>
            💬 Jours cette semaine
          </button>
          <button className="btn-secondary text-xs" onClick={() => setInput('Saisis 1 jour projet Alpha aujourd\'hui')}>
            💬 Saisir temps
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Tests

```typescript
describe('Chat Intent Detection', () => {
  it('should detect timesheet creation intent', () => {
    const intent = detectIntent('Saisis 1 jour projet Alpha');
    expect(intent.type).toBe('TIMESHEET_CREATE');
    expect(intent.params.jours).toBe(1);
  });

  it('should detect query intent', () => {
    const intent = detectIntent('Combien de jours cette semaine ?');
    expect(intent.type).toBe('TIMESHEET_QUERY');
  });
});

describe('Gemini API', () => {
  it('should call Gemini API', async () => {
    const res = await chatService.handleMessage('user1', 'Saisis 1j Alpha');
    expect(res.response).toContain('saisi');
    expect(res.data.time_entry_id).toBeDefined();
  });
});
```

## 📤 Livrables

- Service chat avec Gemini API
- Détection 10 intentions
- UI chat + historique
- 25+ tests + mocks Gemini

---

_Chantier 09 : Chat_
