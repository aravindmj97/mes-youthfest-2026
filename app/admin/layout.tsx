'use client'

import { Layout, Menu, Typography } from 'antd'
import {
    BankOutlined,
    CalendarOutlined,
    SettingOutlined,
    UserOutlined,
    BarChartOutlined,
    DatabaseOutlined
} from '@ant-design/icons'
import { usePathname, useRouter } from 'next/navigation'

const { Header, Sider, Content } = Layout
const { Title } = Typography

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()

    const menuItems = [
        {
            key: '/admin/institutions',
            icon: <BankOutlined />,
            label: 'Institutions',
        },
        {
            key: '/admin/events',
            icon: <CalendarOutlined />,
            label: 'Events',
        },
        {
            key: '/admin/config',
            icon: <SettingOutlined />,
            label: 'Configuration',
        },
        {
            key: '/admin/coordinators',
            icon: <UserOutlined />,
            label: 'Coordinators',
        },
        {
            key: '/admin/stats',
            icon: <BarChartOutlined />,
            label: 'Statistics',
        },
        {
            key: '/admin/master-data',
            icon: <DatabaseOutlined />,
            label: 'Master Data',
        }
    ]

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={220}>
                <div style={{ padding: 16, textAlign: 'center' }}>
                    <Title level={4} style={{ color: '#fff', margin: 0 }}>
                        MES Youth Fest 2026
                    </Title>
                </div>

                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[pathname]}
                    items={menuItems}
                    onClick={({ key }) => router.push(key)}
                />
            </Sider>

            <Layout>
                <Header
                    style={{
                        background: '#fff',
                        padding: '0 24px',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                >
                    <Title level={4} style={{ margin: 0 }}>
                        Admin Panel
                    </Title>
                </Header>

                <Content style={{ margin: 24 }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    )
}
