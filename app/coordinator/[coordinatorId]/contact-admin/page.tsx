'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, Input, Button, List, Tag, Space, Typography } from 'antd'
import { supabase } from '@/lib/supabase'
import { statusColorMap } from '@/lib/statusColors'

const { TextArea } = Input
const { Title } = Typography

export default function ContactAdminPage() {
    const { coordinatorId } = useParams()
    const router = useRouter()
    const [message, setMessage] = useState('')
    const [tickets, setTickets] = useState<any[]>([])

    useEffect(() => {
        fetchTickets()
    }, [])

    const fetchTickets = async () => {
        const { data } = await supabase
            .from('support_tickets')
            .select('*')
            .eq('coordinator_id', coordinatorId)
            .order('created_at', { ascending: false })

        setTickets(data || [])
    }

    const submitTicket = async () => {
        if (!message.trim()) return

        await supabase.from('support_tickets').insert({
            coordinator_id: coordinatorId,
            subject: 'Coordinator Request',
            message,
            status: 'OPEN',
        })

        setMessage('')
        fetchTickets()
    }

    return (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            <Title level={3}>Contact Admin</Title>

            <Card title="Raise a New Request">
                <TextArea
                    rows={4}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Describe your issue or request"
                />
                <Button type="primary" style={{ marginTop: 12 }} onClick={submitTicket}>
                    Submit
                </Button>
            </Card>

            <Card title="Your Requests">
                <List
                    dataSource={tickets}
                    renderItem={item => (
                        <List.Item
                            style={{ cursor: 'pointer' }}
                            onClick={() =>
                                router.push(
                                    `/coordinator/${coordinatorId}/contact-admin/${item.id}`
                                )
                            }
                        >
                            <Space>
                                <Tag color={statusColorMap[item.status]}>
                                    {item.status.replace('_', ' ')}
                                </Tag>
                                {item.message.slice(0, 60)}...
                            </Space>
                        </List.Item>
                    )}
                />
            </Card>
        </Space>
    )
}
