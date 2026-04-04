/**
 * API Authentication Middleware for User API Keys
 * 
 * This module provides helpers to authenticate API requests using user API keys.
 * Supports both Authorization: Bearer <key> and x-api-key: <key> headers.
 */

import { NextRequest } from "next/server"
import { getConvexHttpClient } from "@/lib/changelog-api"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

export type ApiAuthResult =
  | {
      authenticated: true
      userId: Id<"users">
      scopes: string[]
    }
  | {
      authenticated: false
      error: string
    }

/**
 * Extract API key from request headers
 * Supports:
 * - Authorization: Bearer uk_xxxxx
 * - x-api-key: uk_xxxxx
 */
export function extractApiKey(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get("authorization")
  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i)
    if (match && match[1]) {
      return match[1]
    }
  }

  // Check x-api-key header
  const apiKeyHeader = request.headers.get("x-api-key")
  if (apiKeyHeader) {
    return apiKeyHeader
  }

  return null
}

/**
 * Authenticate an API key and return user info and scopes
 */
export async function authenticateApiKey(
  apiKey: string
): Promise<ApiAuthResult> {
  const convex = getConvexHttpClient()

  try {
    const result = await convex.action(api.userApiKeys.authenticateUserApiKey, {
      apiKey,
    })

    if (!result.authenticated) {
      return {
        authenticated: false,
        error: result.error || "Invalid API key",
      }
    }

    return {
      authenticated: true,
      userId: result.userId!,
      scopes: result.scopes!,
    }
  } catch (error) {
    return {
      authenticated: false,
      error: error instanceof Error ? error.message : "Authentication failed",
    }
  }
}

/**
 * Check if the authenticated user has the required scope
 */
export function hasScope(userScopes: string[], requiredScope: string): boolean {
  return userScopes.includes(requiredScope)
}

/**
 * Check if the authenticated user has any of the required scopes
 */
export function hasAnyScope(
  userScopes: string[],
  requiredScopes: string[]
): boolean {
  return requiredScopes.some((scope) => userScopes.includes(scope))
}

/**
 * Check if the authenticated user has all of the required scopes
 */
export function hasAllScopes(
  userScopes: string[],
  requiredScopes: string[]
): boolean {
  return requiredScopes.every((scope) => userScopes.includes(scope))
}

/**
 * Full middleware function to authenticate and validate scopes
 * 
 * Usage:
 * ```ts
 * const auth = await authenticateRequest(request, ["changelog:read"])
 * if (!auth.authenticated) {
 *   return Response.json({ error: auth.error }, { status: 401 })
 * }
 * // Use auth.userId to fetch data
 * ```
 */
export async function authenticateRequest(
  request: NextRequest,
  requiredScopes?: string[]
): Promise<ApiAuthResult> {
  // Extract API key
  const apiKey = extractApiKey(request)
  if (!apiKey) {
    return {
      authenticated: false,
      error: "Missing API key. Provide via Authorization header or x-api-key header.",
    }
  }

  // Authenticate
  const authResult = await authenticateApiKey(apiKey)
  if (!authResult.authenticated) {
    return authResult
  }

  // Check scopes if required
  if (requiredScopes && requiredScopes.length > 0) {
    const hasRequiredScopes = hasAllScopes(authResult.scopes, requiredScopes)
    if (!hasRequiredScopes) {
      return {
        authenticated: false,
        error: `Insufficient permissions. Required scopes: ${requiredScopes.join(", ")}`,
      }
    }
  }

  return authResult
}

/**
 * Helper to create error responses
 */
export function createErrorResponse(
  message: string,
  status: number = 401
): Response {
  return Response.json(
    {
      error: message,
      status,
    },
    { status }
  )
}

/**
 * Helper to create unauthorized response
 */
export function createUnauthorizedResponse(message?: string): Response {
  return createErrorResponse(
    message || "Unauthorized. Valid API key required.",
    401
  )
}

/**
 * Helper to create forbidden response
 */
export function createForbiddenResponse(message?: string): Response {
  return createErrorResponse(
    message || "Forbidden. Insufficient permissions.",
    403
  )
}
