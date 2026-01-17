'use client'
import 'antd/dist/reset.css'
import { Layout } from 'antd'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Layout style={{ minHeight: '100vh' }}>
          {children}
        </Layout>
      </body>
    </html>
  )
}
