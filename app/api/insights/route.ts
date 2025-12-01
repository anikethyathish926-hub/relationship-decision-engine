/**
 * API route for retrieving insights
 * 
 * This file handles HTTP requests related to relationship insights:
 * - GET: Retrieve all insights for a specific relationship
 * 
 * In Next.js App Router, route handlers are defined in route.ts files.
 * The file name "route.ts" tells Next.js this is an API endpoint.
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

/**
 * Handle GET requests to /api/insights
 * 
 * Retrieves all insights for a specific relationship from the database,
 * ordered by creation date (newest first).
 * Requires a relationship_id query parameter.
 * 
 * Example usage: /api/insights?relationship_id=123
 */
export async function GET(request: Request) {
  // Extract the query string from the request URL
  // The URL object helps us parse query parameters easily
  const { searchParams } = new URL(request.url);
  
  // Get the relationship_id from the query string
  // For example, if the URL is /api/insights?relationship_id=abc123,
  // this will get "abc123"
  const relationshipId = searchParams.get('relationship_id');

  // Validate that relationship_id is provided
  // If it's missing, return an error response with status 400 (Bad Request)
  if (!relationshipId) {
    return NextResponse.json(
      { error: 'relationship_id is required' },
      { status: 400 }
    );
  }

  // Query insights from Supabase database
  // - .from('insights') selects the insights table
  // - .select('*') gets all columns for matching rows
  // - .eq('relationship_id', relationshipId) filters to only rows where
  //   the relationship_id column matches the provided value
  // - .order('created_at', { ascending: false }) sorts results by
  //   created_at in descending order (newest first)
  const { data, error } = await supabase
    .from('insights')
    .select('*')
    .eq('relationship_id', relationshipId)
    .order('created_at', { ascending: false });

  // If there's an error from Supabase (like database connection issues),
  // return a 500 status (Internal Server Error) with the error message
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  // If everything worked, return the list of insights as JSON
  // The data will be an array of insight objects, or an empty array if none found
  return NextResponse.json(data);
}

