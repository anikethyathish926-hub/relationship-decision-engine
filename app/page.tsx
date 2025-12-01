import { redirect } from "next/navigation";

/**
 * Root page component for the Relationship Decision Engine
 * 
 * This page automatically redirects visitors from the root URL ("/")
 * to the dashboard page at "/dashboard".
 * 
 * The redirect function from next/navigation is a server-side redirect
 * that works in both development and production environments.
 */
export default function Home() {
  // Redirect the root route ("/") straight to the dashboard
  redirect("/dashboard");
}

