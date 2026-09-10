import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Refreshes the Supabase auth session on every request. Called from the
// project's proxy.ts (Next.js 16 renamed `middleware.js` to `proxy.js` —
// see node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md).
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not remove: this call refreshes the auth token and must run before
  // any other logic that reads the session.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Enforce "Block user" on every request, not just at login: a user
  // blocked mid-session still holds a valid, unexpired token, so
  // without this check they'd keep full access until it expired.
  // Skip the extra DB round trip entirely for anonymous visitors.
  if (user && request.nextUrl.pathname !== '/account-blocked') {
    const { data: profile } = await supabase.from('profiles').select('is_blocked').eq('id', user.id).maybeSingle()
    if (profile?.is_blocked) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/account-blocked'
      url.search = ''
      const redirectResponse = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie))
      return redirectResponse
    }
  }

  return supabaseResponse
}
