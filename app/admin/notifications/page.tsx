'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Table, Tag, Typography } from 'antd'
import { supabase } from '@/lib/supabase'
import { statusColorMap } from '@/lib/statusColors'

const { Title } = Typography

export default function AdminNotifications() {
    const router = useRouter()
    const [tickets, setTickets] = useState<any[]>([])

    useEffect(() => {
        supabase
            .from('support_tickets')
            .select(`
        *,
        coordinators(name, institutions(name))
      `)
            .order('created_at', { ascending: false })
            .then(({ data }) => setTickets(data || []))
    }, [])

    return (
        <>
            <Title level={3}>Notifications</Title>
            <Table
                rowKey="id"
                dataSource={tickets}
                columns={[
                    { title: 'Coordinator', render: (_, r) => r.coordinators?.name },
                    { title: 'Institute', render: (_, r) => r.coordinators?.institutions?.name },
                    {
                        title: 'Status',
                        render: (_, r) => (
                            <Tag color={statusColorMap[r.status]}>
                                {r.status.replace('_', ' ')}
                            </Tag>
                        ),
                    },
                    {
                        title: 'Action',
                        render: (_, r) => (
                            <a onClick={() => router.push(`/admin/notifications/${r.id}`)}>
                                View
                            </a>
                        ),
                    },
                ]}
            />
        </>
    )
}
