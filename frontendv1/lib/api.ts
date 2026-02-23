export const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? ""

type ApiError = {
    detail?: string
    [key: string]: any
}

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {
    const token =
        typeof window !== "undefined" ? localStorage.getItem("access_token") : null

    const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers ?? {}),
        },
    })

    if (!res.ok) {
        let data: ApiError | null = null
        try {
            data = await res.json()
        } catch {
            // ignore
        }
        const msg =
            data?.detail ??
            (data ? JSON.stringify(data) : `Error ${res.status} al consumir API`)
        throw new Error(msg)
    }


    if (res.status === 204) return null as T
    return (await res.json()) as T
}