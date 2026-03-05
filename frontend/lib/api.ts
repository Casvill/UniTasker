type ApiError = {
    detail?: string
    [key: string]: any
}

export function setTokens(access: string, refresh: string, email?: string) {
    if (typeof window !== "undefined") {
        localStorage.setItem("access_token", access)
        localStorage.setItem("refresh_token", refresh)
        if (email) localStorage.setItem("user_email", email)
    }
}

export function getAccessToken() {
    if (typeof window !== "undefined") {
        return localStorage.getItem("access_token")
    }
    return null
}

export function getUserEmail() {
    if (typeof window !== "undefined") {
        return localStorage.getItem("user_email")
    }
    return null
}

export function logout() {
    if (typeof window !== "undefined") {
        localStorage.removeItem("access_token")
        localStorage.removeItem("refresh_token")
        localStorage.removeItem("user_email")
        window.location.href = "/login"
    }
}

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getAccessToken()

    const res = await fetch(`/api/proxy${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            ...(options.headers ?? {}),
        },
    })

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

export interface UserProfile {
    id: number
    username: string
    email: string
}

export async function fetchProfile(): Promise<UserProfile | null> {
    try {
        const email = getUserEmail()
        const users = await apiFetch<UserProfile[]>("/usuarios/")
        
        if (Array.isArray(users)) {
            if (email) {
                // Buscamos el usuario que coincida con el email guardado
                const found = users.find(u => u.email.toLowerCase() === email.toLowerCase())
                if (found) return found
            }
            return users[0] || null
        }
        return users as unknown as UserProfile
    } catch (e) {
        console.error("Error fetching profile:", e)
        return null
    }
}
