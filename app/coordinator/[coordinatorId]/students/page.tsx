'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import dayjs from 'dayjs'
import {
    Layout,
    Typography,
    Card,
    Table,
    Input,
    Select,
    Button,
    Space,
    Upload,
    message,
    Tag,
    Row,
    Col,
    Alert,
} from 'antd'
import {
    PlusOutlined,
    UploadOutlined,
    ReloadOutlined,
} from '@ant-design/icons'
import { supabase } from '@/lib/supabase'

const { Header, Content } = Layout
const { Title, Text } = Typography
const { Option } = Select

const BATCH_OPTIONS = [
    'First Year',
    'Second Year',
    'Third Year',
    'Fourth Year',
    'Fifth Year',
]

export default function StudentsPage() {
    const { coordinatorId } = useParams()

    const [coordinator, setCoordinator] = useState<any>(null)
    const [students, setStudents] = useState<any[]>([])
    const [editingKey, setEditingKey] = useState<string | null>(null)

    const [individualEvents, setIndividualEvents] = useState<any[]>([])
    const [groupEvents, setGroupEvents] = useState<any[]>([])
    const [limits, setLimits] = useState<any>({
        max_individual_events: 0,
        max_group_events: 0,
    })
    const [searchText, setSearchText] = useState('')
    const [isLocked, setIsLocked] = useState(false)

    const isEditing = (r: any) => r.id === editingKey

    /* ---------------- Initial Fetch ---------------- */

    useEffect(() => {
        fetchCoordinator()
        fetchEvents()
        fetchLimits()
        fetchStudentsWithEvents()
    }, [])

    const fetchCoordinator = async () => {
        const { data } = await supabase
            .from('coordinators')
            .select('*, institutions(name)')
            .eq('id', coordinatorId)
            .single()

        setCoordinator(data)
    }

    const fetchEvents = async () => {
        const { data } = await supabase
            .from('events')
            .select('*')
            .eq('is_active', true)

        setIndividualEvents(data?.filter(e => e.type === 'INDIVIDUAL') || [])
        setGroupEvents(data?.filter(e => e.type === 'GROUP') || [])
    }

    const fetchLimits = async () => {
        const { data } = await supabase
            .from('festival_config')
            .select('*')
            .in('key', ['max_individual_events', 'max_group_events'])

        const obj: any = {}
        data?.forEach(r => (obj[r.key] = r.value))
        setLimits(obj)
    }

    const fetchLockStatus = async () => {
        const { data } = await supabase
            .from('festival_config')
            .select('value')
            .eq('key', 'lock_coordinator_edit')
            .single()

        setIsLocked(Boolean(data?.value))
    }

    useEffect(() => {
        fetchLockStatus()
    }, [])



    /**
     * ✅ FIX: Fetch students WITH event registrations
     */
    const fetchStudentsWithEvents = async () => {
        const { data: studentsData } = await supabase
            .from('students')
            .select('*')
            .eq('created_by', coordinatorId)
            .order('name')

        if (!studentsData?.length) {
            setStudents([])
            return
        }

        const studentIds = studentsData.map(s => s.id)

        const { data: registrations } = await supabase
            .from('student_event_registrations')
            .select('student_id, event_id, events(type)')
            .in('student_id', studentIds)

        const eventMap: Record<string, any> = {}

        registrations?.forEach(r => {
            if (!eventMap[r.student_id]) {
                eventMap[r.student_id] = {
                    individual_events: [],
                    group_events: [],
                }
            }

            if (r.events.type === 'INDIVIDUAL') {
                eventMap[r.student_id].individual_events.push(r.event_id)
            } else {
                eventMap[r.student_id].group_events.push(r.event_id)
            }
        })

        const merged = studentsData.map(s => ({
            ...s,
            individual_events: eventMap[s.id]?.individual_events || [],
            group_events: eventMap[s.id]?.group_events || [],
        }))

        setStudents(merged)
    }

    /* ---------------- Student CRUD ---------------- */

    const addStudent = () => {
        setStudents([
            {
                id: 'NEW',
                name: '',
                batch: '',
                phone: '',
                email: '',
                individual_events: [],
                group_events: [],
                photo_url: null,
                isNew: true,
            },
            ...students,
        ])
        setEditingKey('NEW')
    }

    const saveStudent = async (record: any) => {

        if (isLocked) {
            message.error('Editing is disabled by admin')
            return
        }

        if (!record.name || !record.batch) {
            message.error('Name and batch are required')
            return
        }

        const payload = {
            name: record.name,
            batch: record.batch,
            phone: record.phone,
            email: record.email,
            photo_url: record.photo_url,
            created_by: coordinatorId,
            institution_id: coordinator.institution_id,
        }

        let studentId = record.id

        if (record.isNew) {
            const { data } = await supabase
                .from('students')
                .insert(payload)
                .select()
                .single()
            studentId = data.id
        } else {
            await supabase.from('students').update(payload).eq('id', record.id)
        }

        await supabase
            .from('student_event_registrations')
            .delete()
            .eq('student_id', studentId)

        const registrations = [
            ...record.individual_events,
            ...record.group_events,
        ].map((eventId: string) => ({
            student_id: studentId,
            event_id: eventId,
        }))

        if (registrations.length) {
            await supabase.from('student_event_registrations').insert(registrations)
        }

        message.success('Student saved')
        setEditingKey(null)
        fetchStudentsWithEvents()
    }

    /* ---------------- Table Columns ---------------- */

    const renderEventTags = (eventIds: string[], allEvents: any[]) => (
        <Space wrap>
            {eventIds.map(id => {
                const ev = allEvents.find(e => e.id === id)
                return ev ? <Tag key={id}>{ev.name}</Tag> : null
            })}
        </Space>
    )


    const columns = [
        {
            title: 'Name',
            render: (_: any, r: any) =>
                isEditing(r) ? (
                    <Input
                        value={r.name}
                        onChange={e => {
                            r.name = e.target.value
                            setStudents([...students])
                        }}
                    />
                ) : (
                    r.name
                ),
        },
        {
            title: 'Batch',
            render: (_: any, r: any) =>
                isEditing(r) ? (
                    <Select
                        value={r.batch}
                        style={{ width: 140 }}
                        onChange={v => {
                            r.batch = v
                            setStudents([...students])
                        }}
                    >
                        {BATCH_OPTIONS.map(b => (
                            <Option key={b} value={b}>
                                {b}
                            </Option>
                        ))}
                    </Select>
                ) : (
                    <Tag>{r.batch}</Tag>
                ),
        },
        {
            title: 'Individual Events',
            render: (_: any, r: any) =>
                isEditing(r) ? (
                    <Select
                        mode="multiple"
                        value={r.individual_events}
                        style={{ minWidth: 220 }}
                        onChange={v => {
                            r.individual_events = v
                            setStudents([...students])
                        }}
                    >
                        {individualEvents.map(e => (
                            <Option
                                key={e.id}
                                value={e.id}
                                disabled={
                                    r.individual_events.length >= limits.max_individual_events &&
                                    !r.individual_events.includes(e.id)
                                }
                            >
                                {e.name}
                            </Option>
                        ))}
                    </Select>
                ) : (
                    renderEventTags(r.individual_events, individualEvents)
                ),
        },
        {
            title: 'Group Events',
            render: (_: any, r: any) =>
                isEditing(r) ? (
                    <Select
                        mode="multiple"
                        value={r.group_events}
                        style={{ minWidth: 220 }}
                        onChange={v => {
                            r.group_events = v
                            setStudents([...students])
                        }}
                    >
                        {groupEvents.map(e => (
                            <Option
                                key={e.id}
                                value={e.id}
                                disabled={
                                    r.group_events.length >= limits.max_group_events &&
                                    !r.group_events.includes(e.id)
                                }
                            >
                                {e.name}
                            </Option>
                        ))}
                    </Select>
                ) : (
                    renderEventTags(r.group_events, groupEvents)
                ),
        },
        {
            title: 'Actions',
            render: (_: any, r: any) =>
                isEditing(r) ? (
                    <Button type="link" onClick={() => saveStudent(r)}>
                        Save
                    </Button>
                ) : (
                    !isLocked && (
                        <Button type="link" onClick={() => setEditingKey(r.id)}>
                            Edit
                        </Button>
                    )

                ),
        },
    ]

    return (
        <Layout>
            <Header
                style={{
                    background: '#f5f7fa',
                    padding: '16px 24px',
                    height: 'auto',
                }}
            >
                <Card bordered={false} style={{ borderBottom: '1px solid #f0f0f0' }}>

                    <Row align="middle">
                        {/* LEFT: Welcome */}
                        <Col span={8}>
                            <Space orientation="vertical" size={0}>
                                <Text type="secondary">👋 Welcome</Text>
                                <Text strong style={{ fontSize: 16 }}>
                                    {coordinator?.name}
                                </Text>
                                <Text type="secondary">
                                    {coordinator?.institutions?.name}
                                </Text>
                            </Space>
                        </Col>

                        {/* CENTER: FEST */}
                        <Col span={8} style={{ textAlign: 'center' }}>
                            <Title level={3} style={{ margin: 0 }}>
                                MES Youth Festival 2026
                            </Title>
                            <Text type="secondary">
                                Student Registration Portal
                            </Text>
                        </Col>

                        {/* RIGHT: DATE */}
                        <Col span={8} style={{ textAlign: 'right' }}>
                            <Space orientation="vertical" size={0}>
                                <Text type="secondary">Today</Text>
                                <Text strong>
                                    {dayjs().format('dddd')}
                                </Text>
                                <Text type="secondary">
                                    {dayjs().format('DD MMM YYYY')}
                                </Text>
                            </Space>
                        </Col>
                    </Row>
                </Card>
            </Header>


            <Content style={{ padding: 24 }}>
                <Card
                    title="Student Registration"
                    extra={
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            disabled={isLocked}
                            onClick={addStudent}
                        >
                            Add Student
                        </Button>

                    }
                >
                    <Input
                        placeholder="Search student by name"
                        allowClear
                        style={{ width: 300, marginBottom: 16 }}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                    />
                    {isLocked && (
                        <Alert
                            type="warning"
                            showIcon
                            message="Editing Disabled"
                            description="Student editing is currently locked by the admin. Please contact the admin for any changes."
                            style={{ marginBottom: 16 }}
                        />
                    )}

                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={students.filter(s =>
                            s.name.toLowerCase().includes(searchText.toLowerCase())
                        )}
                        pagination={{ pageSize: 6 }}
                    />

                </Card>
            </Content>
        </Layout>
    )
}
