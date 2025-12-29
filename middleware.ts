import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const path = req.nextUrl.pathname;

        // 1. Admin/Owner Routes Protection
        if (path.startsWith('/admin')) {
            if (token?.role !== 'owner') {
                return NextResponse.redirect(new URL('/', req.url));
            }
        }

        // 2. Instructor Routes Protection
        // Note: Owners can also access instructor routes if needed, or we keep them separate.
        // Based on reqs: "Instructor can create course and have control of only his course"
        // So /instructor is for instructors.
        if (path.startsWith('/instructor')) {
            if (token?.role !== 'instructor' && token?.role !== 'owner') {
                return NextResponse.redirect(new URL('/', req.url));
            }
        }

        // 3. Student Routes Protection (e.g. learning interface)
        // Assuming /learn is the route for watching courses
        if (path.startsWith('/learn')) {
            if (!token) {
                return NextResponse.redirect(new URL('/login', req.url));
            }
            // Any role can technically learn, but primarily students
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token,
        },
        pages: {
            signIn: '/login',
        },
    }
);

export const config = {
    matcher: [
        '/admin/:path*',
        '/instructor/:path*',
        '/learn/:path*',
        '/student/:path*'
    ],
};
