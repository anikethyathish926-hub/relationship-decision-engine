/**
 * Dashboard page for the Relationship Decision Engine
 * 
 * This is the main page where users will interact with their relationships.
 * It's located at /dashboard in the application.
 * 
 * This is a client-side component (marked with "use client") because it needs
 * to use React hooks like useState and useEffect, and handle user interactions.
 */

'use client';

import { useState, useEffect } from 'react';
import { Relationship, Event, Insight } from '@/lib/types';

export default function DashboardPage() {
  // State to store the list of relationships
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  
  // State to track if we're currently loading data
  const [loading, setLoading] = useState(true);
  
  // State to store any error messages
  const [error, setError] = useState<string | null>(null);
  
  // State for the form inputs
  const [personName, setPersonName] = useState('');
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  
  // State to track if we're submitting the form
  const [submitting, setSubmitting] = useState(false);

  // State to track the currently selected relationship
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  
  // State to store events for the selected relationship
  const [events, setEvents] = useState<Event[]>([]);
  
  // State to track if we're loading events
  const [loadingEvents, setLoadingEvents] = useState(false);
  
  // State for the event form inputs
  const [eventType, setEventType] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  
  // State to track if we're submitting the event form
  const [submittingEvent, setSubmittingEvent] = useState(false);

  // State to store the current insight for the selected relationship
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  
  // State to track if we're currently analyzing a relationship
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // State to show a simple status message when we send a sample conversation
  // This is just for testing the /api/messages endpoint.
  const [sampleConversationStatus, setSampleConversationStatus] = useState<string | null>(null);
  
  // State to store analysis-specific error messages
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // State to store the history of all insights for the selected relationship
  // This is an array of Insight objects, ordered from newest to oldest
  const [insightHistory, setInsightHistory] = useState<Insight[]>([]);
  
  // State to track if we're currently loading insights from the API
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);

  /**
   * Fetch relationships from the API when the component loads
   * useEffect runs after the component first renders
   */
  useEffect(() => {
    fetchRelationships();
  }, []);

  /**
   * Fetch events and insights whenever a relationship is selected
   * This useEffect runs whenever selectedRelationship changes
   * 
   * When a relationship is selected, it fetches both events and insights.
   * When no relationship is selected, it clears all related state.
   */
  useEffect(() => {
    // If no relationship is selected, clear insight history and return early
    if (!selectedRelationship?.id) {
      setEvents([]);
      setInsightHistory([]);
      setSelectedInsight(null);
      setAnalysisError(null);
      return;
    }

    // If a relationship is selected, fetch its events and insights
    fetchEvents(selectedRelationship.id);
    fetchInsights(selectedRelationship.id);
    // Clear the insight and analysis error when switching relationships
    setSelectedInsight(null);
    setAnalysisError(null);
  }, [selectedRelationship]);

  /**
   * Function to fetch all relationships from the API
   */
  async function fetchRelationships() {
    try {
      setLoading(true);
      setError(null);
      
      // Make a GET request to our API endpoint
      const response = await fetch('/api/relationships');
      
      // Check if the request was successful
      if (!response.ok) {
        throw new Error('Failed to load relationships');
      }
      
      // Parse the JSON response
      const data = await response.json();
      
      // Update the relationships state with the fetched data
      setRelationships(data);
    } catch (err) {
      // If something went wrong, store the error message
      setError(err instanceof Error ? err.message : 'Failed to load relationships');
    } finally {
      // Always set loading to false when we're done
      setLoading(false);
    }
  }

  /**
   * Function to fetch events for a specific relationship
   */
  async function fetchEvents(relationshipId: string) {
    try {
      setLoadingEvents(true);
      setError(null);
      
      // Make a GET request to fetch events for this relationship
      const response = await fetch(`/api/events?relationship_id=${relationshipId}`);
      
      // Check if the request was successful
      if (!response.ok) {
        throw new Error('Failed to load events');
      }
      
      // Parse the JSON response
      const data = await response.json();
      
      // Update the events state with the fetched data
      setEvents(data);
    } catch (err) {
      // If something went wrong, store the error message
      setError(err instanceof Error ? err.message : 'Failed to load events');
    } finally {
      // Always set loading to false when we're done
      setLoadingEvents(false);
    }
  }

  /**
   * Function to fetch insights for a specific relationship
   * 
   * This function retrieves all past insights for a relationship from the API.
   * The insights are already ordered by created_at DESC (newest first) from the API.
   */
  async function fetchInsights(relationshipId: string) {
    try {
      // Set loading state to true so we can show a loading message
      setIsLoadingInsights(true);
      
      // Make a GET request to fetch insights for this relationship
      const response = await fetch(`/api/insights?relationship_id=${relationshipId}`);
      
      // Check if the request was successful
      if (!response.ok) {
        throw new Error('Failed to load insights');
      }
      
      // Parse the JSON response (this will be an array of insight objects)
      const data = await response.json();
      
      // Update the insightHistory state with the fetched data
      setInsightHistory(data);
    } catch (err) {
      // If something went wrong, log the error and set history to empty array
      console.error('Error loading insights:', err);
      // Set history to empty array so the UI shows "No past insights yet"
      setInsightHistory([]);
    } finally {
      // Always set loading to false when we're done (whether success or error)
      setIsLoadingInsights(false);
    }
  }

  /**
   * Handle form submission to create a new relationship
   */
  async function handleSubmit(e: React.FormEvent) {
    // Prevent the default form submission behavior (page refresh)
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Make a POST request to create a new relationship
      const response = await fetch('/api/relationships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          person_name: personName,
          type: type,
          notes: notes,
        }),
      });
      
      // Check if the request was successful
      if (!response.ok) {
        throw new Error('Failed to create relationship');
      }
      
      // Clear the form inputs
      setPersonName('');
      setType('');
      setNotes('');
      
      // Refresh the list of relationships
      await fetchRelationships();
    } catch (err) {
      // If something went wrong, store the error message
      setError(err instanceof Error ? err.message : 'Failed to create relationship');
    } finally {
      // Always set submitting to false when we're done
      setSubmitting(false);
    }
  }

  /**
   * Handle clicking the Analyze Relationship button
   * 
   * This function sends a POST request to /api/analyze to get AI insights
   * about the selected relationship and its events.
   * 
   * Updated to show actual error messages from the API instead of generic errors.
   */
  async function handleAnalyze() {
    // Make sure we have a selected relationship
    if (!selectedRelationship?.id) {
      alert('Please select a relationship first');
      return;
    }

    try {
      setIsAnalyzing(true);
      // Clear any previous analysis errors before making a new request
      setAnalysisError(null);
      setError(null);

      // Make a POST request to analyze the relationship
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          relationship_id: selectedRelationship.id,
        }),
      });

      // Check if the request was successful
      if (!response.ok) {
        // Try to read the error message from the API response
        // The API returns JSON with an 'error' field, or sometimes a 'raw' field
        const errorData = await response.json().catch(() => null);
        
        // Set the analysis error based on what the API returned
        // Priority: errorData?.error > errorData?.raw > default message
        if (errorData?.error) {
          setAnalysisError(errorData.error);
        } else if (errorData?.raw) {
          setAnalysisError(errorData.raw);
        } else {
          setAnalysisError('Unknown analysis error');
        }
        
        // Return early so we don't try to parse a success response
        return;
      }

      // If the response was successful, parse the JSON (this contains the insight)
      const insight = await response.json();

      // Store the insight in state so we can display it
      setSelectedInsight(insight);
      
      // Add the new insight to the top of the insight history
      // This updates the UI immediately without needing to reload from the API
      // We use the spread operator to create a new array with the new insight first
      setInsightHistory((prevHistory) => [insight, ...prevHistory]);
      
      // Clear any previous errors since we succeeded
      setAnalysisError(null);
    } catch (err) {
      // Log the error to the console for debugging
      console.error('Error analyzing relationship:', err);
      // Show a generic error message for unexpected errors (network issues, etc.)
      setAnalysisError('Analysis failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      // Always set analyzing to false when we're done
      setIsAnalyzing(false);
    }
  }

  /**
   * Handle clicking the "Send Sample Conversation" test button
   *
   * This function sends a hard-coded sample conversation to the /api/messages
   * endpoint to test the new messages ingestion API.
   */
  async function handleSendSampleConversation() {
    // Make sure we have a selected relationship before sending
    if (!selectedRelationship?.id) {
      alert('Please select a relationship first');
      return;
    }

    try {
      // Clear any previous status message
      setSampleConversationStatus(null);

      // Build a simple thread ID based on the selected relationship,
      // so messages can be grouped per relationship.
      const threadId = `relationship-${selectedRelationship.id}`;

      // Prepare the request body to match the /api/messages schema
      const body = {
        user_id: 'test-user-1',
        platform: 'whatsapp',
        thread_id: threadId,
        messages: [
          {
            from_me: true,
            text: "Hey, how are you?",
            timestamp: "2025-11-29T14:35:00Z",
          },
          {
            from_me: false,
            text: "I’m okay, just a bit stressed.",
            timestamp: "2025-11-29T14:36:00Z",
          },
          {
            from_me: true,
            text: "Want to talk about it later?",
            timestamp: "2025-11-29T14:37:00Z",
          },
        ],
      };

      // Send the POST request to our messages API route
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        // If the response is not OK, log the error details and show a basic status
        const errorData = await response.json().catch(() => null);
        console.error('Failed to send sample conversation:', errorData || response.statusText);
        setSampleConversationStatus('Failed to send sample conversation.');
        return;
      }

      // On success, set a simple success message and log to the console
      console.log('Sample conversation sent successfully');
      setSampleConversationStatus('Sample conversation sent.');
    } catch (err) {
      // Catch any unexpected errors (network issues, etc.)
      console.error('Error sending sample conversation:', err);
      setSampleConversationStatus('Failed to send sample conversation.');
    }
  }

  /**
   * Handle form submission to create a new event
   */
  async function handleEventSubmit(e: React.FormEvent) {
    // Prevent the default form submission behavior (page refresh)
    e.preventDefault();
    
    // Make sure we have a selected relationship
    if (!selectedRelationship?.id) {
      return;
    }
    
    try {
      setSubmittingEvent(true);
      setError(null);
      
      // Make a POST request to create a new event
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          relationship_id: selectedRelationship.id,
          event_type: eventType,
          description: eventDescription,
        }),
      });
      
      // Check if the request was successful
      if (!response.ok) {
        throw new Error('Failed to create event');
      }
      
      // Clear the event form inputs
      setEventType('');
      setEventDescription('');
      
      // Refresh the events list for the selected relationship
      await fetchEvents(selectedRelationship.id);
    } catch (err) {
      // If something went wrong, store the error message
      setError(err instanceof Error ? err.message : 'Failed to create event');
    } finally {
      // Always set submitting to false when we're done
      setSubmittingEvent(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Page heading */}
      <h1 className="text-3xl font-bold mb-8">Relationship Decision Engine</h1>

      {/* Form to create a new relationship */}
      <div className="mb-8 p-6 border border-gray-300 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Create New Relationship</h2>
        
        <form onSubmit={handleSubmit}>
          {/* Name input field */}
          <div className="mb-4">
            <label htmlFor="person_name" className="block mb-2 font-medium">
              Name
            </label>
            <input
              type="text"
              id="person_name"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="Enter person's name"
            />
          </div>

          {/* Type input field */}
          <div className="mb-4">
            <label htmlFor="type" className="block mb-2 font-medium">
              Type
            </label>
            <input
              type="text"
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="e.g. friend, crush, ex"
            />
          </div>

          {/* Notes textarea field */}
          <div className="mb-4">
            <label htmlFor="notes" className="block mb-2 font-medium">
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              placeholder="Optional notes about this relationship"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
          >
            {submitting ? 'Creating...' : 'Create Relationship'}
          </button>
        </form>
      </div>

      {/* Error message display */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Relationships list section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Relationships</h2>
        
        {/* Loading state */}
        {loading && <p className="text-gray-600">Loading...</p>}
        
        {/* Error state (if not already shown above) */}
        {!loading && error && <p className="text-red-600">Failed to load</p>}
        
        {/* Relationships list */}
        {!loading && !error && relationships.length === 0 && (
          <p className="text-gray-600">No relationships yet. Create one above!</p>
        )}
        
        {!loading && !error && relationships.length > 0 && (
          <div className="space-y-4">
            {relationships.map((relationship) => (
              <div
                key={relationship.id}
                onClick={() => setSelectedRelationship(relationship)}
                className={`p-4 border rounded-lg bg-white shadow-sm cursor-pointer transition-colors ${
                  selectedRelationship?.id === relationship.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <h3 className="text-lg font-semibold">{relationship.person_name}</h3>
                <p className="text-gray-600">Type: {relationship.type}</p>
                {relationship.notes && (
                  <p className="text-gray-700 mt-2">{relationship.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail panel for selected relationship */}
      {selectedRelationship ? (
        <div className="mt-8 p-6 border border-gray-300 rounded-lg bg-gray-50">
          <h2 className="text-2xl font-semibold mb-4">
            {selectedRelationship.person_name} - {selectedRelationship.type}
          </h2>

          {/* Events list section */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-3">Events</h3>
            
            {/* Loading state for events */}
            {loadingEvents && <p className="text-gray-600">Loading events...</p>}
            
            {/* Empty state for events */}
            {!loadingEvents && events.length === 0 && (
              <p className="text-gray-600">No events yet. Add one below!</p>
            )}
            
            {/* Events list */}
            {!loadingEvents && events.length > 0 && (
              <div className="space-y-3">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="p-3 border border-gray-200 rounded-md bg-white"
                  >
                    <p className="font-semibold text-gray-800">{event.event_type}</p>
                    <p className="text-gray-700 mt-1">{event.description}</p>
                    {event.created_at && (
                      <p className="text-sm text-gray-500 mt-2">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Analyze button section */}
          <div className="mb-6 border-t border-gray-300 pt-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Analyze Relationship button (existing behavior) */}
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Relationship'}
              </button>

              {/* Temporary test button to send a sample conversation */}
              <button
                type="button"
                onClick={handleSendSampleConversation}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Send Sample Conversation
              </button>
            </div>

            {/* Simple status text for the sample conversation request */}
            {sampleConversationStatus && (
              <p className="mt-2 text-sm text-gray-600">
                {sampleConversationStatus}
              </p>
            )}
            
            {/* Display analysis error if one occurred */}
            {analysisError && (
              <div className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <p className="font-semibold">Analysis error:</p>
                <p>{analysisError}</p>
              </div>
            )}
          </div>

          {/* Insight display section */}
          {selectedInsight && (
            <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-white">
              <h3 className="text-xl font-semibold mb-3">AI Insight</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-gray-800">Summary:</p>
                  <p className="text-gray-700">{selectedInsight.summary}</p>
                </div>
                
                <div>
                  <p className="font-semibold text-gray-800">Pattern:</p>
                  <p className="text-gray-700">{selectedInsight.pattern}</p>
                </div>
                
                <div>
                  <p className="font-semibold text-gray-800">Risk score:</p>
                  <p className="text-gray-700">{(selectedInsight.risk_score * 100).toFixed(1)}%</p>
                </div>
                
                <div>
                  <p className="font-semibold text-gray-800">Growth score:</p>
                  <p className="text-gray-700">{(selectedInsight.growth_score * 100).toFixed(1)}%</p>
                </div>
                
                <div>
                  <p className="font-semibold text-gray-800">Recommended action:</p>
                  <p className="text-gray-700">{selectedInsight.recommended_action}</p>
                </div>
                
                <div>
                  <p className="font-semibold text-gray-800">Suggested message:</p>
                  <p className="text-gray-700">{selectedInsight.suggested_message}</p>
                </div>
              </div>
            </div>
          )}

          {/* Insight History section */}
          <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-white">
            <h3 className="text-xl font-semibold mb-3">Insight History</h3>
            
            {/* Loading state: show a message while fetching insights */}
            {isLoadingInsights && (
              <p className="text-gray-600">Loading insights...</p>
            )}
            
            {/* Empty state: show when there are no insights yet */}
            {!isLoadingInsights && insightHistory.length === 0 && (
              <p className="text-gray-600">No past insights yet.</p>
            )}
            
            {/* Insight history list: display all insights from newest to oldest */}
            {!isLoadingInsights && insightHistory.length > 0 && (
              <div className="space-y-4">
                {insightHistory.map((insight) => (
                  <div
                    key={insight.id}
                    className="p-3 border border-gray-200 rounded-md bg-gray-50"
                  >
                    {/* Display the date and time when this insight was created */}
                    {insight.created_at && (
                      <p className="text-sm font-semibold text-gray-600 mb-2">
                        {new Date(insight.created_at).toLocaleString()}
                      </p>
                    )}
                    
                    {/* Display the summary of this insight */}
                    <p className="text-gray-800 mb-2">{insight.summary}</p>
                    
                    {/* Display risk and growth scores in a small line */}
                    {/* Scores are stored as decimals (0-1), so we display them as decimals */}
                    <p className="text-xs text-gray-600">
                      Risk: {insight.risk_score.toFixed(1)}, Growth: {insight.growth_score.toFixed(1)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form to add a new event */}
          <div className="border-t border-gray-300 pt-4">
            <h3 className="text-xl font-semibold mb-3">Add Event</h3>
            
            <form onSubmit={handleEventSubmit}>
              {/* Event Type input field */}
              <div className="mb-4">
                <label htmlFor="event_type" className="block mb-2 font-medium">
                  Event Type
                </label>
                <input
                  type="text"
                  id="event_type"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g. meeting, call, message"
                />
              </div>

              {/* Description textarea field */}
              <div className="mb-4">
                <label htmlFor="event_description" className="block mb-2 font-medium">
                  Description
                </label>
                <textarea
                  id="event_description"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  rows={3}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="Describe what happened..."
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={submittingEvent}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {submittingEvent ? 'Adding...' : 'Add Event'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="mt-8 p-6 border border-gray-300 rounded-lg bg-gray-50 text-center text-gray-600">
          <p>No relationship selected. Click on a relationship above to view and add events.</p>
        </div>
      )}
    </div>
  );
}

