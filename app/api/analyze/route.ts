import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
    // 1. Ensure API key is present
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.error('Missing GROQ_API_KEY environment variable');
      return NextResponse.json(
        { error: 'Missing GROQ_API_KEY' },
        { status: 500 }
      );
    }

    // 2. Read and validate body
    const body = await request.json().catch((err) => {
      console.error('Request body parse error:', err);
      return null;
    });
    const relationship_id = body?.relationship_id;

    if (!relationship_id) {
      console.error('Missing relationship_id in request body');
      return NextResponse.json(
        { error: 'relationship_id is required' },
        { status: 400 }
      );
    }

    console.log('Analyzing relationship:', relationship_id);

    // 3. Fetch relationship from Supabase
    const { data: relationship, error: relError } = await supabase
      .from('relationships')
      .select('*')
      .eq('id', relationship_id)
      .single();

    if (relError) {
      console.error('Relationship fetch error:', relError);
      return NextResponse.json(
        { error: relError.message },
        { status: 500 }
      );
    }

    if (!relationship) {
      console.error('Relationship not found:', relationship_id);
      return NextResponse.json(
        { error: 'Relationship not found' },
        { status: 404 }
      );
    }

    console.log('Fetched relationship:', relationship.person_name);

    // 4. Fetch recent events for that relationship
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('relationship_id', relationship_id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (eventsError) {
      console.error('Events fetch error:', eventsError);
      return NextResponse.json(
        { error: eventsError.message },
        { status: 500 }
      );
    }

    const eventsText =
      events && events.length > 0
        ? events
            .map(
              (e) =>
                `- [${e.created_at}] (${e.event_type}) ${e.description ?? ''}`
            )
            .join('\n')
        : 'No events logged.';

    console.log('Fetched events count:', events?.length ?? 0);

    // 5. Build prompt for Groq
    const promptText = `
You are a relationship analysis engine. Analyze the following relationship and events.
Respond ONLY with valid JSON, no extra text. Match this exact shape:
{
  "summary": string,
  "pattern": string,
  "risk_score": number,
  "growth_score": number,
  "recommended_action": string,
  "suggested_message": string
}

Relationship:
Name: ${relationship.person_name ?? 'Unknown'}
Type: ${relationship.type ?? 'Not specified'}
Notes: ${relationship.notes ?? 'None'}

Events:
${eventsText}
    `;

    console.log('Calling Groq API...');

    // 6. Call Groq API using fetch
    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content:
                'You are a precise relationship analysis engine. Respond ONLY with valid JSON.',
            },
            { role: 'user', content: promptText },
          ],
        }),
      }
    );

    if (!groqResponse.ok) {
      const errorBody = await groqResponse.json().catch(() => null);
      console.error('Groq error response:', errorBody);
      
      const message =
        errorBody?.error?.message ||
        errorBody?.message ||
        `Groq HTTP ${groqResponse.status}`;
      
      return NextResponse.json(
        { error: message },
        { status: groqResponse.status }
      );
    }

    const groqJson = await groqResponse.json().catch((err) => {
      console.error('Groq response JSON parse error:', err);
      return null;
    });

    if (!groqJson) {
      return NextResponse.json(
        { error: 'Failed to parse Groq response' },
        { status: 500 }
      );
    }

    const aiText = groqJson.choices?.[0]?.message?.content || '';
    console.log('Groq raw response:', aiText);

    if (!aiText) {
      console.error('Empty response from Groq:', groqJson);
      return NextResponse.json(
        { error: 'Empty response from Groq', raw: groqJson },
        { status: 500 }
      );
    }

    // 7. Parse Groq JSON safely
    let parsed: any;
    try {
      parsed = JSON.parse(aiText);
    } catch (err) {
      console.error('Groq JSON parse error:', err);
      console.error('Raw AI text that failed to parse:', aiText);
      return NextResponse.json(
        { error: 'Groq JSON parse error', raw: aiText },
        { status: 500 }
      );
    }

    console.log('Parsed insight:', parsed);

    // 8. Insert insight into Supabase
    const { error: insertError } = await supabase.from('insights').insert({
      relationship_id,
      summary: parsed.summary,
      pattern: parsed.pattern,
      risk_score: parsed.risk_score,
      growth_score: parsed.growth_score,
      recommended_action: parsed.recommended_action,
      suggested_message: parsed.suggested_message,
    });

    if (insertError) {
      console.error('Error inserting insight:', insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    console.log('Successfully inserted insight for relationship:', relationship_id);

    // 9. Return parsed insight to the client
    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error('Unexpected error in /api/analyze:', err);
    console.error('Error stack:', err?.stack);
    return NextResponse.json(
      { error: err?.message ?? 'Unknown server error' },
      { status: 500 }
    );
  }
}
