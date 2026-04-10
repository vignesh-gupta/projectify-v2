import { AuthError, CLIError, NetworkError } from "./errors.js"

type QueryValue = string | number | boolean | null | undefined
type QueryParams = Record<string, QueryValue>

export class ApiClient {
  private baseUrl = "http://localhost:3000"
  private apiKey?: string

  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/+$/, "")
  }

  setApiKey(key: string): void {
    this.apiKey = key
  }

  async validateApiKey(key: string): Promise<void> {
    const result = await this.post<{ valid: boolean; error?: string }>(
      "/api/auth/validate",
      { apiKey: key }
    )

    if (!result.valid) {
      throw new AuthError(result.error || "Invalid API key")
    }
  }

  async get<T>(endpoint: string, query?: QueryParams): Promise<T> {
    return this.request<T>("GET", endpoint, undefined, query)
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>("POST", endpoint, data)
  }

  async patch<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>("PATCH", endpoint, data)
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>("DELETE", endpoint)
  }

  private async request<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    endpoint: string,
    data?: unknown,
    query?: QueryParams
  ): Promise<T> {
    const params = new URLSearchParams()
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined && value !== null) {
          params.set(key, String(value))
        }
      }
    }

    const queryString = params.toString()
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`
    const url = `${this.baseUrl}${path}${queryString ? `?${queryString}` : ""}`

    const headers: Record<string, string> = {
      Accept: "application/json",
    }
    if (data !== undefined) {
      headers["Content-Type"] = "application/json"
    }
    if (this.apiKey) {
      headers.Authorization = `Bearer ${this.apiKey}`
    }

    let response: Response
    try {
      response = await fetch(url, {
        method,
        headers,
        body: data !== undefined ? JSON.stringify(data) : undefined,
      })
    } catch (error) {
      if (error instanceof Error) {
        throw new NetworkError(error.message)
      }
      throw new NetworkError("Unable to reach API server")
    }

    const text = await response.text()
    const payload: unknown = text ? safeParseJSON(text) : {}

    if (!response.ok) {
      const message = extractErrorMessage(payload) || `Request failed (${response.status})`

      if (response.status === 401 || response.status === 403) {
        throw new AuthError(message)
      }

      throw new CLIError(message)
    }

    return payload as T
  }
}

function safeParseJSON(input: string): unknown {
  try {
    return JSON.parse(input) as unknown
  } catch {
    return { message: input }
  }
}

function extractErrorMessage(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") {
    return undefined
  }

  const obj = payload as Record<string, unknown>
  const message = obj.message
  if (typeof message === "string" && message.length > 0) {
    return message
  }

  const error = obj.error
  if (typeof error === "string" && error.length > 0) {
    return error
  }

  return undefined
}

export const apiClient = new ApiClient()
