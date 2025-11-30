/**
 * API route for managing relationships
 * 
 * This file handles HTTP requests related to relationships:
 * - GET: Retrieve all relationships from the database
 * - POST: Create a new relationship
 * 
 * In Next.js App Router, route handlers are defined in route.ts files.
 * The file name "route.ts" tells Next.js this is an API endpoint.
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * Handle GET requests to /api/relationships
 * 
 * Retrieves all relationships from the database,
 * ordered by creation date (newest first).
 */
export async function GET() {
  // Query all relationships from Supabase, ordered by created_at descending
  const { data, error } = await supabase
    .from('relationships')
    .select('*')
    .order('created_at', { ascending: false });

  // If there's an error, return a 500 status with the error message
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // Return the list of relationships as JSON
  return NextResponse.json(data);
}

/**
 * Handle POST requests to /api/relationships
 * 
 * Creates a new relationship in the database with the provided
 * person_name, type, and notes.
 */
export async function POST(request: Request) {
  // Parse the JSON request body
  const body = await request.json();
  const { person_name, type, notes } = body;

  // Validate that person_name is provided
  if (!person_name) {
    return NextResponse.json(
      { error: 'person_name is required' },
      { status: 400 }
    );
  }

  // Insert the new relationship into Supabase (without user_id)
  const { data, error } = await supabase
    .from('relationships')
    .insert({
      person_name,
      type,
      notes: notes || null,
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

  // Return the newly created relationship as JSON
  return NextResponse.json(data);
}

