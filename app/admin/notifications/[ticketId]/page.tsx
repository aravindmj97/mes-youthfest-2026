'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
    Card,
    Button,
    Input,
    Space,
    Tag,
    List,
    message,
    Typography,
} from 'antd'
import { supabase } from '@/lib/supabase'
import { statusColorMap } from '@/lib/statusColors'

const { TextArea } = Input
const { Title } = Typography

export default function AdminTicketDetail() {
    const { ticketId } = useParams()
    const router = useRouter()

    const [ticket, setTicket] = useState<any>(null)
    const [comments, setComments] = useState<any[]>([])
    const [comment, setComment] = useState('')
    const [loading, setLoading] = useState(false)

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

    const handleAction = async (status: 'IN_PROGRESS' | 'CLOSED' | 'REJECTED') => {
        if ((status === 'CLOSED' || status === 'REJECTED') && !comment.trim()) {
            message.error('Comment is mandatory for closing or rejecting a ticket')
            return
        }

        try {
            setLoading(true)

            // Save comment (if any)
            if (comment.trim()) {
                await supabase.from('support_ticket_comments').insert({
                    ticket_id: ticketId,
                    commented_by: 'ADMIN',
                    message: comment.trim(),
                })
            }

            // Update ticket status
            await supabase
                .from('support_tickets')
                .update({
                    status,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', ticketId)

            message.success(`Ticket ${status.toLowerCase()}`)

            // Navigate back if final state
            if (status === 'CLOSED' || status === 'REJECTED') {
                router.push('/admin/notifications')
            } else {
                setComment('')
                fetchData()
            }
        } finally {
            setLoading(false)
        }
    }

    if (!ticket) return null

    const isFinalState =
        ticket.status === 'CLOSED' || ticket.status === 'REJECTED'

    return (
        <Card>
            <Title level={4}>Support Ticket</Title>

            <Space orientation="vertical" style={{ width: '100%' }}>
                <Tag color={statusColorMap[ticket.status]}>
                    {ticket.status.replace('_', ' ')}
                </Tag>


                <p>{ticket.message}</p>

                <Title level={5}>Conversation</Title>
                <List
                    bordered
                    dataSource={comments}
                    renderItem={c => (
                        <List.Item>
                            <strong>{c.commented_by}:</strong>&nbsp;{c.message}
                        </List.Item>
                    )}
                />

                {/* ACTIONS ONLY IF NOT FINAL */}
                {!isFinalState && (
                    <>
                        <TextArea
                            rows={3}
                            placeholder={
                                'Add comment (mandatory for Close / Reject)'
                            }
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                        />

                        <Space>
                            <Button
                                loading={loading}
                                onClick={() => handleAction('IN_PROGRESS')}
                            >
                                Mark In Progress
                            </Button>

                            <Button
                                danger
                                loading={loading}
                                onClick={() => handleAction('REJECTED')}
                            >
                                Reject
                            </Button>

                            <Button
                                type="primary"
                                loading={loading}
                                onClick={() => handleAction('CLOSED')}
                            >
                                Close
                            </Button>
                        </Space>
                    </>
                )}

                {/* FINAL STATE INFO */}
                {isFinalState && (
                    <Typography.Text type="secondary">
                        This ticket is {ticket.status.toLowerCase()}. No further actions are allowed.
                    </Typography.Text>
                )}
            </Space>
        </Card>
    )
}
