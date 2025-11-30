/**
 * API route for managing events
 * 
 * This file handles HTTP requests related to relationship events:
 * - GET: Retrieve events for a specific relationship
 * - POST: Create a new event for a relationship
 * 
 * In Next.js App Router, route handlers are defined in route.ts files.
 * The file name "route.ts" tells Next.js this is an API endpoint.
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * Handle GET requests to /api/events
 * 
 * Retrieves all events for a specific relationship from the database,
 * ordered by creation date (newest first).
 * Requires a relationship_id query parameter.
 */
export async function GET(request: Request) {
  // Get the relationship_id from the query string
  const { searchParams } = new URL(request.url);
  const relationshipId = searchParams.get('relationship_id');

  // Validate that relationship_id is provided
  if (!relationshipId) {
    return NextResponse.json(
      { error: 'relationship_id is required' },
      { status: 400 }
    );
  }

  // Query events from Supabase filtered by relationship_id
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('relationship_id', relationshipId)
    .order('created_at', { ascending: false });

  // If there's an error, return a 500 status with the error message
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Return the list of events as JSON
  return NextResponse.json(data);
}

/**
 * Handle POST requests to /api/events
 * 
 * Creates a new event in the database for a relationship
 * with the provided relationship_id, event_type, and description.
 */
export async function POST(request: Request) {
  // Parse the JSON request body
  const body = await request.json();
  const { relationship_id, event_type, description } = body;

  // Validate that required fields are provided
  if (!relationship_id) {
    return NextResponse.json(
      { error: 'relationship_id is required' },
      { status: 400 }
    );
  }

  if (!event_type) {
    return NextResponse.json(
      { error: 'event_type is required' },
      { status: 400 }
    );
  }

  // Insert the new event into Supabase
  const { data, error } = await supabase
    .from('events')
    .insert({
      relationship_id,
      event_type,
      description: description || null,
    })
    .select()
    .single();

  // If there's an error, return a 500 status with the error message
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Return the newly created event as JSON
  return NextResponse.json(data);
}

