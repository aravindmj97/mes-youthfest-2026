'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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

export default function CoordinatorStatsPage() {
    const { coordinatorId } = useParams()

    const [stats, setStats] = useState<any>({
        totalStudents: 0,
        totalParticipations: 0,
        individualCount: 0,
        groupCount: 0,
    })

    const [eventStats, setEventStats] = useState<any[]>([])
    const [studentStats, setStudentStats] = useState<any[]>([])
    const [institutionId, setInstitutionId] = useState<string | null>(null)

    useEffect(() => {
        fetchInstitution()
    }, [])

    useEffect(() => {
        if (institutionId) {
            fetchStats()
        }
    }, [institutionId])

    /* ---------------- Fetch Institution ---------------- */
    const fetchInstitution = async () => {
        const { data } = await supabase
            .from('coordinators')
            .select('institution_id')
            .eq('id', coordinatorId)
            .single()

        setInstitutionId(data?.institution_id)
    }

    /* ---------------- Fetch Stats ---------------- */
    const fetchStats = async () => {
        /* Students */
        const { data: students } = await supabase
            .from('students')
            .select('id, name')
            .eq('institution_id', institutionId)

        /* Registrations */
        const { data: registrations } = await supabase
            .from('student_event_registrations')
            .select('student_id, events(id, name, type)')
            .in(
                'student_id',
                students?.map(s => s.id) || []
            )

        const totalStudents = students?.length || 0
        const totalParticipations = registrations?.length || 0

        const individualCount =
            registrations?.filter(r => r.events.type === 'INDIVIDUAL').length || 0
        const groupCount =
            registrations?.filter(r => r.events.type === 'GROUP').length || 0

        /* Event-wise aggregation */
        const eventMap: any = {}
        registrations?.forEach(r => {
            const name = r.events.name
            eventMap[name] = (eventMap[name] || 0) + 1
        })

        const eventData = Object.entries(eventMap).map(([name, count]) => ({
            event: name,
            participants: count,
        }))

        /* Student-wise aggregation */
        const studentMap: any = {}
        registrations?.forEach(r => {
            studentMap[r.student_id] = (studentMap[r.student_id] || 0) + 1
        })

        const studentData =
            students?.map(s => ({
                name: s.name,
                events: studentMap[s.id] || 0,
            })) || []

        setStats({
            totalStudents,
            totalParticipations,
            individualCount,
            groupCount,
        })

        setEventStats(eventData)
        setStudentStats(studentData)
    }

    /* ---------------- Charts ---------------- */
    const barConfig = {
        data: eventStats,
        xField: 'event',
        yField: 'participants',
        color: '#1677ff',
        height: 300,
    }

    const pieConfig = {
        data: [
            { type: 'Individual', value: stats.individualCount },
            { type: 'Group', value: stats.groupCount },
        ],
        angleField: 'value',
        colorField: 'type',
        height: 300,
    }

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Title level={3}>Participation Statistics</Title>

            {/* SUMMARY */}
            <Row gutter={16}>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Total Students"
                            value={stats.totalStudents}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Total Participations"
                            value={stats.totalParticipations}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Individual Events"
                            value={stats.individualCount}
                        />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic
                            title="Group Events"
                            value={stats.groupCount}
                        />
                    </Card>
                </Col>
            </Row>

            {/* CHARTS */}
            <Row gutter={16}>
                <Col span={14}>
                    <Card title="Event-wise Participation">
                        <Bar {...barConfig} />
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
                    <Card title="Event Participation Table">
                        <Table
                            rowKey="event"
                            dataSource={eventStats}
                            pagination={false}
                            columns={[
                                { title: 'Event', dataIndex: 'event' },
                                {
                                    title: 'Participants',
                                    dataIndex: 'participants',
                                },
                            ]}
                        />
                    </Card>
                </Col>

                <Col span={12}>
                    <Card title="Student Participation Summary">
                        <Table
                            rowKey="name"
                            dataSource={studentStats}
                            pagination={{ pageSize: 5 }}
                            columns={[
                                { title: 'Student Name', dataIndex: 'name' },
                                {
                                    title: 'Events Participated',
                                    dataIndex: 'events',
                                },
                            ]}
                        />
                    </Card>
                </Col>
            </Row>
        </Space>
    )
}
