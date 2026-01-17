'use client'

import { useEffect, useState } from 'react'
import { useParams, usePathname, useRouter } from 'next/navigation'
import {
    Layout,
    Menu,
    Typography,
    Button,
    Space,
} from 'antd'
import {
    TeamOutlined,
    BarChartOutlined,
    IdcardOutlined,
    LogoutOutlined,
} from '@ant-design/icons'
import { supabase } from '@/lib/supabase'

const { Sider, Content } = Layout
const { Text } = Typography

export default function CoordinatorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { coordinatorId } = useParams()
    const pathname = usePathname()
    const router = useRouter()

    const [coordinator, setCoordinator] = useState<any>(null)

    useEffect(() => {
        fetchCoordinator()
    }, [])

    const fetchCoordinator = async () => {
        const { data } = await supabase
            .from('coordinators')
            .select('name, institutions(name)')
            .eq('id', coordinatorId)
            .single()

        setCoordinator(data)
    }

    const menuItems = [
        {
            key: `/coordinator/${coordinatorId}/students`,
            icon: <TeamOutlined />,
            label: 'Student Registration',
        },
        {
            key: `/coordinator/${coordinatorId}/stats`,
            icon: <BarChartOutlined />,
            label: 'Statistics',
        },
        {
            key: `/coordinator/${coordinatorId}/id-cards`,
            icon: <IdcardOutlined />,
            label: 'ID Cards',
        },
    ]

    const logout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                width={260}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* SIDEBAR HEADER */}
                <div style={{ padding: 16 }}>
                    <Space direction="vertical" size={0}>
                        <Text strong style={{ color: '#fff' }}>
                            {coordinator?.name}
                        </Text>
                        <Text type="secondary" style={{ color: '#ccc' }}>
                            {coordinator?.institutions?.name}
                        </Text>
                    </Space>
                </div>

                {/* MENU */}
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[pathname]}
                    items={menuItems}
                    onClick={({ key }) => router.push(key)}
                />

                {/* LOGOUT */}
                <div
                    style={{
                        marginTop: 'auto',
                        padding: 16,
                    }}
                >
                    <Button
                        danger
                        block
                        icon={<LogoutOutlined />}
                        onClick={logout}
                    >
                        Logout
                    </Button>
                </div>
            </Sider>

            {/* CONTENT */}
            <Layout>
                <Content style={{ padding: 24 }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    )
}
