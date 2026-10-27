// OpenAI Ads Conversions API (server-side events)
// Skipped when OPENAI_CONVERSIONS_API_KEY is not set.

const OPENAI_PIXEL_ID = 'K3KNgiuVwKuphrC2tXfk9n';
const ENDPOINT = `https://bzr.openai.com/v1/events?pid=${OPENAI_PIXEL_ID}`;

export async function sendQuizFinished({
  eventId,
  sourceUrl,
}: {
  eventId: string;
  sourceUrl: string;
}): Promise<void> {
  const apiKey = process.env.OPENAI_CONVERSIONS_API_KEY;
  if (!apiKey) return;

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        validate_only: false,
        events: [
          {
            id: eventId,
            type: 'custom',
            custom_event_name: 'quiz_finished',
            timestamp_ms: Date.now(),
            source_url: sourceUrl,
            action_source: 'web',
            data: { type: 'custom' },
          },
        ],
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
      console.error('OpenAI Conversions API error', response.status, await response.text());
    }
  } catch (error) {
    console.error('OpenAI Conversions API request failed', error);
  }
}
