type ApiError = {
    detail?: string
    [key: string]: any
}

export async function apiFetch<T>(
    path: string,
    options: RequestInit = {}
): Promise<T> {

    const res = await fetch(`/api/proxy${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
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