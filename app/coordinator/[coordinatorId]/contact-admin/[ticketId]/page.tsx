'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, Tag, Typography, List } from 'antd'
import { supabase } from '@/lib/supabase'
import { statusColorMap } from '@/lib/statusColors'

const { Title } = Typography

export default function TicketDetail() {
    const { ticketId } = useParams()
    const [ticket, setTicket] = useState<any>(null)
    const [comments, setComments] = useState<any[]>([])

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        const { data: ticket } = await supabase
            .from('support_tickets')
            .select('*')
            .eq('id', ticketId)
            .single()

        const { data: comments } = await supabase
            .from('support_ticket_comments')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at')

        setTicket(ticket)
        setComments(comments || [])
    }

    if (!ticket) return null

    return (
        <Card>
            <Title level={4}>Request</Title>
            <Tag color={statusColorMap[ticket.status]}>
                {ticket.status.replace('_', ' ')}
            </Tag>

            <p>{ticket.message}</p>

            <Title level={5}>Comments</Title>
            <List
                dataSource={comments}
                renderItem={c => (
                    <List.Item>
                        <strong>{c.commented_by}:</strong> {c.message}
                    </List.Item>
                )}
            />
        </Card>
    )
}
