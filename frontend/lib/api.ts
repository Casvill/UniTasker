type ApiError = {
    detail?: string
    [key: string]: any
}

export function setTokens(access: string, refresh: string, email?: string, remember: boolean = false) {
    if (typeof window !== "undefined") {
        const storage = remember ? localStorage : sessionStorage
        storage.setItem("access_token", access)
        storage.setItem("refresh_token", refresh)
        if (email) storage.setItem("user_email", email)

        const otherStorage = remember ? sessionStorage : localStorage
        otherStorage.removeItem("access_token")
        otherStorage.removeItem("refresh_token")
        otherStorage.removeItem("user_email")
    }
}

export function getAccessToken() {
    if (typeof window !== "undefined") {
        return localStorage.getItem("access_token") || sessionStorage.getItem("access_token")
    }
    return null
}

export function getRefreshToken() {
    if (typeof window !== "undefined") {
        return localStorage.getItem("refresh_token") || sessionStorage.getItem("refresh_token")
    }
    return null
}

export function getUserEmail() {
    if (typeof window !== "undefined") {
        return localStorage.getItem("user_email") || sessionStorage.getItem("user_email")
    }
    return null
}

function updateAccessToken(newAccessToken: string) {
    if (typeof window !== "undefined") {
        if (localStorage.getItem("refresh_token")) {
            localStorage.setItem("access_token", newAccessToken)
        } else if (sessionStorage.getItem("refresh_token")) {
            sessionStorage.setItem("access_token", newAccessToken)
        }
    }
}

export function logout() {
    if (typeof window !== "undefined") {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("user_email")
        sessionStorage.removeItem("access_token")
        sessionStorage.removeItem("refresh_token")
        sessionStorage.removeItem("user_email")
        window.location.href = "/login"
    }
}

async function refreshAccessToken(): Promise<string | null> {
    const refresh = getRefreshToken()
    if (!refresh) return null

    try {
        const res = await fetch("/api/proxy/token/refresh/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ refresh }),
        })

        if (!res.ok) return null

        const data = await res.json()
        if (!data?.access) return null

        updateAccessToken(data.access)
        return data.access
    } catch {
        return null
    }
}

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    let token = getAccessToken()

    let res = await fetch(`/api/proxy${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers ?? {}),
        },
    })

    if (res.status === 401 && token) {
        const newAccessToken = await refreshAccessToken()

        if (newAccessToken) {
            res = await fetch(`/api/proxy${path}`, {
                ...options,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${newAccessToken}`,
                    ...(options.headers ?? {}),
                },
            })
        } else {
            logout()
            throw new Error("Sesión expirada. Por favor, inicia sesión de nuevo.")
        }
    }

    if (!res.ok) {
        let data: ApiError | null = null
        try {
            data = await res.json()
        } catch { }

        const msg =
            data?.detail ??
            (data ? JSON.stringify(data) : `Error ${res.status} al consumir API`)
        throw new Error(msg)
    }

    if (res.status === 204) return null as T
    return (await res.json()) as T
}