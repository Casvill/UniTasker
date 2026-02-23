import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.API_URL
const BASIC_USER = process.env.BASIC_USER
const BASIC_PASS = process.env.BASIC_PASS

function must(v: string | undefined, name: string) {
    if (!v) throw new Error(`Missing env var: ${name}`)
    return v
}

function basicAuth() {
    const user = must(BASIC_USER, "BASIC_USER")
    const pass = must(BASIC_PASS, "BASIC_PASS")
    return `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`
}

async function handler(
    req: NextRequest,
    ctx: { params: Promise<{ path: string[] }> }
) {
    const { path } = await ctx.params
    const base = must(API_URL, "API_URL").replace(/\/$/, "")

    const url = `${base}/${path.join("/")}${req.nextUrl.search}`

    const method = req.method
    const hasBody = !["GET", "HEAD"].includes(method)
    const body = hasBody ? await req.text() : undefined

    const upstream = await fetch(url, {
        method,
        headers: {
            Authorization: basicAuth(),
            ...(hasBody ? { "Content-Type": "application/json" } : {}),
        },
        body,
    })

    if (upstream.status === 204) return new NextResponse(null, { status: 204 })

    const contentType = upstream.headers.get("content-type") || ""
    const raw = await upstream.text()

    if (!raw) return new NextResponse(null, { status: upstream.status })

    if (contentType.includes("application/json")) {
        try {
            return NextResponse.json(JSON.parse(raw), { status: upstream.status })
        } catch {

            return new NextResponse(raw, { status: upstream.status })
        }
    }

    return new NextResponse(raw, { status: upstream.status })
}

export const GET = handler
export const POST = handler
export const PUT = handler
export const PATCH = handler
export const DELETE = handler