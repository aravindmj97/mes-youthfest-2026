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

    const isEditing = (r: any) => r.id === editingKey

    /* ---------------- Initial Fetch ---------------- */

    useEffect(() => {
        fetchCoordinator()
        fetchEvents()
        fetchLimits()
        fetchStudents()
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

    const fetchStudents = async () => {
        const { data } = await supabase
            .from('students')
            .select('*')
            .eq('created_by', coordinatorId)
            .order('name')

        setStudents(data || [])
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
        if (!record.name || !record.batch) {
            message.error('Name and batch are required')
            return
        }

        const studentPayload = {
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
                .insert(studentPayload)
                .select()
                .single()
            studentId = data.id
        } else {
            await supabase.from('students').update(studentPayload).eq('id', record.id)
        }

        /* Save Event Registrations */
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
        fetchStudents()
    }

    /* ---------------- Photo Upload ---------------- */

    const uploadPhoto = async (file: any, record: any) => {
        const path = `${coordinatorId}/${Date.now()}-${file.name}`

        const { data, error } = await supabase.storage
            .from('student-photos')
            .upload(path, file)

        if (error) {
            message.error(error.message)
            return false
        }

        const url = supabase.storage
            .from('student-photos')
            .getPublicUrl(data.path).data.publicUrl

        record.photo_url = url
        setStudents([...students])
        return false
    }

    const removePhoto = (record: any) => {
        record.photo_url = null
        setStudents([...students])
    }

    /* ---------------- Table Columns ---------------- */

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
            title: 'Phone',
            render: (_: any, r: any) =>
                isEditing(r) ? (
                    <Input
                        value={r.phone}
                        onChange={e => {
                            r.phone = e.target.value
                            setStudents([...students])
                        }}
                    />
                ) : (
                    r.phone
                ),
        },
        {
            title: 'Email',
            render: (_: any, r: any) =>
                isEditing(r) ? (
                    <Input
                        value={r.email}
                        onChange={e => {
                            r.email = e.target.value
                            setStudents([...students])
                        }}
                    />
                ) : (
                    r.email
                ),
        },
        {
            title: 'Individual Events',
            render: (_: any, r: any) =>
                isEditing(r) ? (
                    <Select
                        mode="multiple"
                        value={r.individual_events}
                        style={{ minWidth: 200 }}
                        onChange={v => {
                            r.individual_events = v
                            setStudents([...students])
                        }}
                        maxTagCount={limits.max_individual_events}
                    >
                        {individualEvents.map(e => (
                            <Option
                                key={e.id}
                                value={e.id}
                                disabled={
                                    r.individual_events.length >=
                                    limits.max_individual_events &&
                                    !r.individual_events.includes(e.id)
                                }
                            >
                                {e.name}
                            </Option>
                        ))}
                    </Select>
                ) : (
                    r.individual_events?.length || 0
                ),
        },
        {
            title: 'Group Events',
            render: (_: any, r: any) =>
                isEditing(r) ? (
                    <Select
                        mode="multiple"
                        value={r.group_events}
                        style={{ minWidth: 200 }}
                        onChange={v => {
                            r.group_events = v
                            setStudents([...students])
                        }}
                        maxTagCount={limits.max_group_events}
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
                    r.group_events?.length || 0
                ),
        },
        {
            title: 'Photo',
            render: (_: any, r: any) =>
                isEditing(r) ? (
                    r.photo_url ? (
                        <Space>
                            <a href={r.photo_url} target="_blank">View</a>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => removePhoto(r)}
                            />
                        </Space>
                    ) : (
                        <Upload
                            beforeUpload={file => uploadPhoto(file, r)}
                            showUploadList={false}
                        >
                            <Button icon={<UploadOutlined />}>Upload</Button>
                        </Upload>
                    )
                ) : r.photo_url ? (
                    <a href={r.photo_url} target="_blank">View</a>
                ) : (
                    '—'
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
                    <Button type="link" onClick={() => setEditingKey(r.id)}>
                        Edit
                    </Button>
                ),
        },
    ]

    return (
        <Layout>
            {/* HEADER */}
            <Header style={{ background: '#fff' }}>
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <Text>
                        Welcome, <strong>{coordinator?.name}</strong>
                    </Text>

                    <Title level={4} style={{ margin: 0 }}>
                        MES Youth Festival 2026
                    </Title>

                    <Space direction="vertical" size={0}>
                        <Text strong>{coordinator?.institutions?.name}</Text>
                        <Text type="secondary">
                            {dayjs().format('DD MMM YYYY')}
                        </Text>
                    </Space>
                </Space>
            </Header>

            <Content style={{ padding: 24 }}>
                <Card
                    title="Student Registration"
                    extra={
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={addStudent}
                        >
                            Add Student
                        </Button>
                    }
                >
                    <Table
                        rowKey="id"
                        columns={columns}
                        dataSource={students}
                        pagination={{ pageSize: 6 }}
                    />
                </Card>
            </Content>
        </Layout>
    )
}
