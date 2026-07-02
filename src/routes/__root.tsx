import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
// import NotFoundComponent from '@/components/NotFoundComponent'
import Header from '../components/layout/Header'
import { getSession } from '@/lib/auth/auth.functions'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'PXL8',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
  beforeLoad: async () => {
    const session = await getSession()
    console.log('root - beforeLoad: session.user.id', session?.user.id)
    if (!session) console.log('no session')
    return { session }
  },
  // notFoundComponent: ({ data }) => {
  //   return <NotFoundComponent data={new Error('error', data!)} />
  // },
})

// I want to reconsider this
const themeScript = `(function(){try{if(document.documentElement.dataset.themeInit)return;var d=localStorage.getItem('pxl8-theme')==='dark'||(!localStorage.getItem('pxl8-theme')&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={isDarkMode ? 'dark' : undefined}
      data-theme-init={session?.user ? 'true' : undefined}
    >
      <head>
        <meta name="color-scheme" content={isDarkMode ? 'dark' : 'light'} />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <HeadContent />
      </head>
      <body>
        <Header />
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
