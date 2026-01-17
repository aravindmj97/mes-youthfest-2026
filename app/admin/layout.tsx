'use client'

import { Badge, Layout, Menu, Typography } from 'antd'
import {
    BankOutlined,
    CalendarOutlined,
    SettingOutlined,
    UserOutlined,
    BarChartOutlined,
    DatabaseOutlined,
    BellOutlined
} from '@ant-design/icons'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

const { Header, Sider, Content } = Layout
const { Title } = Typography

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()

    const [openCount, setOpenCount] = useState(0)

    useEffect(() => {
        supabase
            .from('support_tickets')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'OPEN')
            .then(({ count }) => setOpenCount(count || 0))
    }, [])


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
        },
        {
            key: '/admin/notifications',
            icon: (
                <Badge count={openCount} size="small">
                    <BellOutlined />
                </Badge>
            ),
            label: 'Notifications',
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
