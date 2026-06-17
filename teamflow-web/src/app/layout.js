import { cookies } from 'next/headers';
import Providers from './Providers';
import './globals.css';

export const metadata = {
  title: 'TeamFlow — Todo Management',
  description: 'TeamFlow Todo Management System',
};

function decodeJwtPayload(token) {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(Buffer.from(b64, 'base64').toString());
  } catch { return null; }
}

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('tf_access')?.value;

  let initialUser = null;
  if (accessToken) {
    const payload = decodeJwtPayload(accessToken);
    if (payload) {
      initialUser = {
        id: payload.sub,
        email: payload.email,
        role: payload.role === 'CEO' ? 'CEO' : 'Member',
        name: payload.email,
        first: payload.email?.split('@')[0] || '?',
      };
    }
  }

  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <Providers initialUser={initialUser}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
