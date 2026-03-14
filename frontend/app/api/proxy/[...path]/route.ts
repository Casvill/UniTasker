import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

async function handler(
    req: NextRequest,
    ctx: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await ctx.params

        const base = (process.env.API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "")
        const finalPath = path.join("/")
        const queryString = req.nextUrl.search || ""

        const url = `${base}/${finalPath}/${queryString}`.replace(/([^:]\/)\/+/g, "$1")

        console.log(`[proxy] ${req.method} -> ${url}`)

        const method = req.method
        const hasBody = !["GET", "HEAD"].includes(method)
        const body = hasBody ? await req.text() : undefined

        const incomingAuth = req.headers.get("Authorization")
        const incomingContentType = req.headers.get("content-type")

        const headers: Record<string, string> = {
            ...(incomingAuth ? { Authorization: incomingAuth } : {}),
            ...(hasBody
                ? { "Content-Type": incomingContentType || "application/json" }
                : {}),
        }

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)

        const upstream = await fetch(url, {
            method,
            headers,
            body,
            signal: controller.signal,
            cache: "no-store",
        })

        clearTimeout(timeoutId)

        const contentType = upstream.headers.get("content-type") || ""
        const raw = await upstream.text()

        if (upstream.status === 204) {
            return new NextResponse(null, { status: 204 })
        }

        const responseHeaders = new Headers()
        if (contentType) responseHeaders.set("Content-Type", contentType)

        return new NextResponse(raw, {
            status: upstream.status,
            headers: responseHeaders,
        })
    } catch (error: any) {
        console.error("[proxy] FATAL ERROR:", error.message)

        return NextResponse.json(
            { detail: "No se pudo conectar con el sistema. Intenta nuevamente." },
            { status: 502 }
        )
    }
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler