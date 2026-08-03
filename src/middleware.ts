import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { resolveVenueSlug, normalizeTableNumber } from '@/lib/venue-routing'

export async function middleware(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl

    // Les QR posés sur les tables encodent `/?v=<venue>&table=<n>`. La
    // redirection se fait ici, en périphérie, et non dans la page : lire les
    // paramètres depuis le composant serveur forcerait un rendu dynamique de
    // l'accueil à chaque visite, alors que la carte est identique pour tous.
    if (pathname === '/') {
        const venue =
            searchParams.get('v') ?? searchParams.get('venue') ?? searchParams.get('restaurant')
        const slug = resolveVenueSlug(venue)
        if (slug) {
            const target = new URL(`/menu/${slug}`, request.url)
            const table = normalizeTableNumber(searchParams.get('table'))
            if (table) target.searchParams.set('table', table)
            return NextResponse.redirect(target)
        }
    }

    // Seulement vérifier l'auth pour les routes /admin
    // Les autres routes passent directement sans appel Supabase (évite les 503)
    if (!pathname.startsWith('/admin')) {
        return NextResponse.next();
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("MIDDLEWARE ERROR: Supabase environment variables are missing!");
        return response;
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    })
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    response.cookies.set({
                        name,
                        value: '',
                        ...options,
                    })
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    // Si on est déjà sur la page de login
    if (request.nextUrl.pathname === '/admin/login') {
        if (user) {
            return NextResponse.redirect(new URL('/admin', request.url))
        }
        return response
    }

    // Si on n'est pas connecté
    if (!user) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    // Defense en profondeur : verifier que l'utilisateur est bien un admin (pas juste authentifie).
    // is_admin() (SECURITY DEFINER) verifie l'appartenance a admin_users par id OU email.
    // Fail-open sur erreur reseau (isAdmin null/undefined) pour ne pas bloquer un admin legitime.
    const { data: isAdmin } = await supabase.rpc('is_admin')
    if (isAdmin === false) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
