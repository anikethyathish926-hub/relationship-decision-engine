/**
 * API route for ingesting chat messages into the database.
 *
 * This route expects a POST request with JSON describing a batch of messages
 * for a single user / platform / thread, and saves them into the `messages` table
 * in Supabase.
 *
 * In the Next.js App Router, any `route.ts` file inside `app/api/...` defines
 * an API endpoint. This file handles requests to `/api/messages`.
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * Handle POST requests to /api/messages
 *
 * The expected request body JSON looks like this:
 *
 * {
 *   "user_id": "some-user-id",
 *   "platform": "whatsapp",
 *   "thread_id": "thread-123",
 *   "messages": [
 *     {
 *       "from_me": true,
 *       "text": "hey, what's up?",
 *       "timestamp": "2025-11-29T14:35:00Z"
 *     },
 *     {
 *       "from_me": false,
 *       "text": "nothing much, you?",
 *       "timestamp": "2025-11-29T14:36:00Z"
 *     }
 *   ]
 * }
 */
export async function POST(request: Request) {
  try {
    // Parse the JSON body from the incoming request
    const body = await request.json();

    const { user_id, platform, thread_id, messages } = body || {};

    // Basic validation: check required top-level fields
    if (!user_id || typeof user_id !== 'string') {
      return NextResponse.json(
        { error: 'user_id is required and must be a string' },
        { status: 400 }
      );
    }

    if (!platform || typeof platform !== 'string') {
      return NextResponse.json(
        { error: 'platform is required and must be a string' },
        { status: 400 }
      );
    }

    if (!thread_id || typeof thread_id !== 'string') {
      return NextResponse.json(
        { error: 'thread_id is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate messages: it must be a non-empty array
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages is required and must be a non-empty array' },
        { status: 400 }
      );
    }

    // Transform the incoming messages array into rows for the `messages` table.
    // Each message row will include user_id, platform, thread_id, from_me, text, and timestamp.
    const rows = messages.map((msg: any, index: number) => {
      // Very simple per-message validation to avoid inserting clearly invalid rows.
      // We keep this lightweight: if something is missing, we fall back to null / empty values.
      const from_me = Boolean(msg?.from_me);
      const text = typeof msg?.text === 'string' ? msg.text : '';

      // Ensure timestamp is a string; if not provided, we set it to null and let
      // the database default handle it (if configured).
      const timestamp =
        typeof msg?.timestamp === 'string' ? msg.timestamp : null;

      return {
        user_id,
        platform,
        thread_id,
        from_me,
        text,
        // Pass through as an ISO string (Supabase / Postgres will parse it)
        timestamp,
        // Optionally we could also store an index to preserve original order
        // in case timestamps are identical:
        // message_index: index,
      };
    });

    // Insert all messages in a single call to Supabase.
    const { error } = await supabase.from('messages').insert(rows);

    // If Supabase returns an error, log it and return a 500 response.
    if (error) {
      console.error('Error inserting messages:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // On success, return how many rows we attempted to insert.
    return NextResponse.json({
      success: true,
      inserted: rows.length,
    });
  } catch (err) {
    // If anything unexpected goes wrong (e.g., invalid JSON), log it and
    // return a generic 500 error.
    console.error('Unexpected error in /api/messages:', err);
    return NextResponse.json(
      { error: 'Failed to ingest messages' },
      { status: 500 }
    );
  }
}


