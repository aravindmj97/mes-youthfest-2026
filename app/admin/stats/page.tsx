'use client'

import { useEffect, useState } from 'react'
import {
    Card,
    Row,
    Col,
    Typography,
    Table,
    Statistic,
    Space,
} from 'antd'
import { Bar, Pie } from '@ant-design/charts'
import { supabase } from '@/lib/supabase'

const { Title } = Typography

export default function AdminStatsPage() {
    const [summary, setSummary] = useState<any>({
        institutions: 0,
        coordinators: 0,
        students: 0,
        participations: 0,
        individual: 0,
        group: 0,
    })

    const [eventStats, setEventStats] = useState<any[]>([])
    const [institutionStats, setInstitutionStats] = useState<any[]>([])

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        /* Institutions */
        const { data: institutions } = await supabase
            .from('institutions')
            .select('id, name')

        /* Coordinators */
        const { data: coordinators } = await supabase
            .from('coordinators')
            .select('id')

        /* Students */
        const { data: students } = await supabase
            .from('students')
            .select('id, institution_id')

        /* Registrations */
        const { data: registrations } = await supabase
            .from('student_event_registrations')
            .select('student_id, events(type, name)')

        /* Summary */
        const individual =
            registrations?.filter(r => 
                //  @ts-expect-error: Its ok
                r.events.type === 'INDIVIDUAL').length || 0
        const group =
            registrations?.filter(r => 
                //  @ts-expect-error: Its ok
                r.events.type === 'GROUP').length || 0

        setSummary({
            institutions: institutions?.length || 0,
            coordinators: coordinators?.length || 0,
            students: students?.length || 0,
            participations: registrations?.length || 0,
            individual,
            group,
        })

        /* Event-wise */
        const eventMap: any = {}
        registrations?.forEach(r => {
            //  @ts-expect-error: Its ok
            eventMap[r.events.name] = (eventMap[r.events.name] || 0) + 1
        })

        setEventStats(
            Object.entries(eventMap).map(([event, count]) => ({
                event,
                participants: count,
            }))
        )

        /* Institution-wise */
        const instMap: any = {}
        students?.forEach(s => {
            instMap[s.institution_id] = (instMap[s.institution_id] || 0) + 1
        })

        setInstitutionStats(
            institutions?.map(i => ({
                institute: i.name,
                students: instMap[i.id] || 0,
            })) || []
        )
    }

    /* Charts */
    const eventBarConfig = {
        data: eventStats,
        xField: 'event',
        yField: 'participants',
        height: 280,
    }

    const pieConfig = {
        data: [
            { type: 'Individual', value: summary.individual },
            { type: 'Group', value: summary.group },
        ],
        angleField: 'value',
        colorField: 'type',
    }

    return (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            <Title level={3}>Festival Statistics (Admin)</Title>

            {/* SUMMARY */}
            <Row gutter={16}>
                <Col span={6}><Card><Statistic title="Institutions" value={summary.institutions} /></Card></Col>
                <Col span={6}><Card><Statistic title="Coordinators" value={summary.coordinators} /></Card></Col>
                <Col span={6}><Card><Statistic title="Students" value={summary.students} /></Card></Col>
                <Col span={6}><Card><Statistic title="Participations" value={summary.participations} /></Card></Col>
            </Row>

            {/* CHARTS */}
            <Row gutter={16}>
                <Col span={14}>
                    <Card title="Event-wise Participation">
                        <Bar {...eventBarConfig} />
                    </Card>
                </Col>
                <Col span={10}>
                    <Card title="Individual vs Group">
                        <Pie {...pieConfig} />
                    </Card>
                </Col>
            </Row>

            {/* TABLES */}
            <Row gutter={16}>
                <Col span={12}>
                    <Card title="Institute-wise Student Count">
                        <Table
                            rowKey="institute"
                            dataSource={institutionStats}
                            pagination={false}
                            columns={[
                                { title: 'Institute', dataIndex: 'institute' },
                                { title: 'Students', dataIndex: 'students' },
                            ]}
                        />
                    </Card>
                </Col>

                <Col span={12}>
                    <Card title="Event Participation Table">
                        <Table
                            rowKey="event"
                            dataSource={eventStats}
                            pagination={false}
                            columns={[
                                { title: 'Event', dataIndex: 'event' },
                                { title: 'Participants', dataIndex: 'participants' },
                            ]}
                        />
                    </Card>
                </Col>
            </Row>
        </Space>
    )
}
