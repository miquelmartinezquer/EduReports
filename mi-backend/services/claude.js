const mockData = require('../data/mockData');


async function sendMessage(systemPrompt, userMessage) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const devMode = process.env.NODE_ENV === 'dev';

  console.log('Claude Service - Mode:', devMode ? 'DEV (mock)' : 'PROD (API real)');

  if (devMode) {
    console.log('Retornant resposta mock...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    return mockData.responseExample;
  }
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY no està configurada');
  }

  console.log('Cridant API d\'Anthropic...');
  
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 20000,
        temperature: 1,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userMessage
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error API Anthropic:', response.status, errorData);
      throw new Error(`Error ${response.status}: ${errorData.error?.message || JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log('Resposta rebuda correctament');
    return result;
  } catch (error) {
    console.error('Error en sendMessage:', error.message);
    throw error;
  }
}

module.exports = {
  sendMessage
};
