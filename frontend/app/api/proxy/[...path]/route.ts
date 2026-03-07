import { NextRequest, NextResponse } from "next/server"

// Forzamos que no se use caché para las variables de entorno en el edge runtime
export const dynamic = 'force-dynamic'

const API_URL = process.env.API_URL
const BASIC_USER = process.env.BASIC_USER
const BASIC_PASS = process.env.BASIC_PASS

function basicAuth() {
    return `Basic ${Buffer.from(`${BASIC_USER || 'admin'}:${BASIC_PASS || 'admin'}`).toString("base64")}`
}

async function handler(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
    try {
        const { path } = await ctx.params
        // Si por alguna razón la env var no carga, usamos localhost por defecto
        const base = (process.env.API_URL || "http://127.0.0.1:8000/api").replace(/\/+$/, "")
        const finalPath = path.join("/")
        const queryString = req.nextUrl.search || ""

        const url = `${base}/${finalPath}/${queryString}`.replace(/([^:]\/)\/+/g, "$1")

        console.log(`[proxy] ${req.method} -> ${url}`)

        const method = req.method
        const hasBody = !["GET", "HEAD"].includes(method)
        const body = hasBody ? await req.text() : undefined

        const authHeader = req.headers.get("Authorization") || basicAuth()

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15s

        const upstream = await fetch(url, {
            method,
            headers: {
                "Authorization": authHeader,
                ...(hasBody ? { "Content-Type": req.headers.get("content-type") || "application/json" } : {}),
            },
            body,
            signal: controller.signal,
            cache: 'no-store'
        })
        clearTimeout(timeoutId)

        const contentType = upstream.headers.get("content-type") || ""
        const raw = await upstream.text()

        if (upstream.status === 204) return new NextResponse(null, { status: 204 })

        const responseHeaders = new Headers()
        if (contentType) responseHeaders.set("Content-Type", contentType)

        return new NextResponse(raw, {
            status: upstream.status,
            headers: responseHeaders
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
