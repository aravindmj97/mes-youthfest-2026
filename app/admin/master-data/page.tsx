'use client'

import { useEffect, useMemo, useState } from 'react'
import {
    Card,
    Table,
    Typography,
    Select,
    Space,
    Button,
    Input,
    Tag,
    message,
} from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

const { Title } = Typography
const { Option } = Select

const BATCHES = [
    'First Year',
    'Second Year',
    'Third Year',
    'Fourth Year',
    'Fifth Year',
]

export default function AdminMasterDataPage() {
    /* ---------------- State ---------------- */
    const [students, setStudents] = useState<any[]>([])
    const [events, setEvents] = useState<any[]>([])
    const [institutes, setInstitutes] = useState<any[]>([])
    const [limits, setLimits] = useState<any>({
        max_individual_events: 0,
        max_group_events: 0,
    })

    const [editingKey, setEditingKey] = useState<string | null>(null)
    const [selectedEvent, setSelectedEvent] = useState<string | null>(null)

    const isEditing = (record: any) => record.id === editingKey

    /* ---------------- Initial Fetch ---------------- */
    useEffect(() => {
        fetchAll()
    }, [])

    const fetchAll = async () => {
        const [
            { data: studentsData },
            { data: eventsData },
            { data: institutesData },
            { data: configData },
            { data: registrations },
        ] = await Promise.all([
            supabase.from('students').select('*, institutions(name)'),
            supabase.from('events').select('*'),
            supabase.from('institutions').select('*'),
            supabase.from('festival_config').select('*'),
            supabase
                .from('student_event_registrations')
                .select('student_id, event_id, events(type, name)'),
        ])

        const limitMap: any = {}
        configData?.forEach(c => (limitMap[c.key] = c.value))
        setLimits(limitMap)

        const regMap: any = {}
        registrations?.forEach(r => {
            if (!regMap[r.student_id]) {
                regMap[r.student_id] = { individual: [], group: [] }
            }
            if (r.events.type === 'INDIVIDUAL') {
                regMap[r.student_id].individual.push(r.event_id)
            } else {
                regMap[r.student_id].group.push(r.event_id)
            }
        })

        setStudents(
            studentsData?.map(s => ({
                ...s,
                individual_events: regMap[s.id]?.individual || [],
                group_events: regMap[s.id]?.group || [],
            })) || []
        )

        setEvents(eventsData || [])
        setInstitutes(institutesData || [])
    }

    /* ---------------- Save Student ---------------- */
    const saveStudent = async (record: any) => {
        if (!record.name || !record.batch || !record.institution_id) {
            message.error('Name, batch and institute are required')
            return
        }

        if (
            record.individual_events.length > limits.max_individual_events ||
            record.group_events.length > limits.max_group_events
        ) {
            message.error('Event participation limits exceeded')
            return
        }

        await supabase
            .from('students')
            .update({
                name: record.name,
                batch: record.batch,
                phone: record.phone,
                email: record.email,
                institution_id: record.institution_id,
            })
            .eq('id', record.id)

        await supabase
            .from('student_event_registrations')
            .delete()
            .eq('student_id', record.id)

        const registrations = [
            ...record.individual_events,
            ...record.group_events,
        ].map((eventId: string) => ({
            student_id: record.id,
            event_id: eventId,
        }))

        if (registrations.length) {
            await supabase.from('student_event_registrations').insert(registrations)
        }

        message.success('Student updated')
        setEditingKey(null)
        fetchAll()
    }

    /* ---------------- Export ---------------- */
    const exportToExcel = (rows: any[], filename: string) => {
        const sheet = XLSX.utils.json_to_sheet(rows)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, sheet, 'Data')
        const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
        saveAs(new Blob([buf]), `${filename}.xlsx`)
    }

    /* ---------------- Global Student Columns ---------------- */
    const studentColumns = [
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
            sorter: (a: any, b: any) => a.name.localeCompare(b.name),
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
                        {BATCHES.map(b => (
                            <Option key={b} value={b}>
                                {b}
                            </Option>
                        ))}
                    </Select>
                ) : (
                    r.batch
                ),
            filters: BATCHES.map(b => ({ text: b, value: b })),
            onFilter: (v: any, r: any) => r.batch === v,
        },
        {
            title: 'Institute',
            render: (_: any, r: any) =>
                isEditing(r) ? (
                    <Select
                        value={r.institution_id}
                        style={{ width: 220 }}
                        onChange={v => {
                            r.institution_id = v
                            setStudents([...students])
                        }}
                    >
                        {institutes.map(i => (
                            <Option key={i.id} value={i.id}>
                                {i.name}
                            </Option>
                        ))}
                    </Select>
                ) : (
                    r.institutions?.name
                ),
            filters: institutes.map(i => ({ text: i.name, value: i.name })),
            onFilter: (v: any, r: any) => r.institutions?.name === v,
        },
        {
            title: 'Individual Events',
            render: (_: any, r: any) =>
                isEditing(r) ? (
                    <Select
                        mode="multiple"
                        value={r.individual_events}
                        style={{ minWidth: 240 }}
                        onChange={v => {
                            r.individual_events = v
                            setStudents([...students])
                        }}
                    >
                        {events
                            .filter(e => e.type === 'INDIVIDUAL')
                            .map(e => (
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
                    r.individual_events.map((id: string) => {
                        const ev = events.find(e => e.id === id)
                        return ev ? <Tag key={id}>{ev.name}</Tag> : null
                    })
                ),
        },
        {
            title: 'Group Events',
            render: (_: any, r: any) =>
                isEditing(r) ? (
                    <Select
                        mode="multiple"
                        value={r.group_events}
                        style={{ minWidth: 240 }}
                        onChange={v => {
                            r.group_events = v
                            setStudents([...students])
                        }}
                    >
                        {events
                            .filter(e => e.type === 'GROUP')
                            .map(e => (
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
                    r.group_events.map((id: string) => {
                        const ev = events.find(e => e.id === id)
                        return ev ? <Tag key={id}>{ev.name}</Tag> : null
                    })
                ),
        },
        {
            title: 'Actions',
            render: (_: any, r: any) =>
                isEditing(r) ? (
                    <Space>
                        <Button type="link" onClick={() => saveStudent(r)}>
                            Save
                        </Button>
                        <Button type="link" onClick={() => setEditingKey(null)}>
                            Cancel
                        </Button>
                    </Space>
                ) : (
                    <Button type="link" onClick={() => setEditingKey(r.id)}>
                        Edit
                    </Button>
                ),
        },
    ]

    /* ---------------- Event-based Table ---------------- */
    const eventStudents = useMemo(() => {
        if (!selectedEvent) return []
        return students.filter(s =>
            [...s.individual_events, ...s.group_events].includes(selectedEvent)
        )
    }, [selectedEvent, students])

    const eventColumns = [
        {
            title: 'Student Name',
            dataIndex: 'name',
            sorter: (a: any, b: any) => a.name.localeCompare(b.name),
        },
        { title: 'Phone', dataIndex: 'phone' },
        { title: 'Email', dataIndex: 'email' },
        {
            title: 'Institute',
            render: (_: any, r: any) => r.institutions?.name,
            filters: institutes.map(i => ({ text: i.name, value: i.name })),
            onFilter: (v: any, r: any) => r.institutions?.name === v,
        },
    ]

    return (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            <Title level={3}>Master Data</Title>

            {/* GLOBAL STUDENTS */}
            <Card
                title="All Students (Global)"
                extra={
                    <Button
                        icon={<DownloadOutlined />}
                        onClick={() =>
                            exportToExcel(
                                students.map(s => ({
                                    name: s.name,
                                    batch: s.batch,
                                    phone: s.phone,
                                    email: s.email,
                                    institute: s.institutions?.name,
                                })),
                                'all-students'
                            )
                        }
                    >
                        Export
                    </Button>
                }
            >
                <Table
                    rowKey="id"
                    columns={studentColumns}
                    dataSource={students}
                    pagination={{ pageSize: 10 }}
                />
            </Card>

            {/* EVENT BASED */}
            <Card
                title="Event-wise Student Details"
                extra={
                    <Select
                        placeholder="Select Event"
                        style={{ width: 260 }}
                        allowClear
                        onChange={setSelectedEvent}
                    >
                        {events.map(e => (
                            <Option key={e.id} value={e.id}>
                                {e.name}
                            </Option>
                        ))}
                    </Select>
                }
            >
                <Space orientation="vertical" style={{ width: '100%' }}>
                    <Button
                        icon={<DownloadOutlined />}
                        disabled={!selectedEvent}
                        onClick={() =>
                            exportToExcel(
                                eventStudents.map(s => ({
                                    name: s.name,
                                    phone: s.phone,
                                    email: s.email,
                                    institute: s.institutions?.name,
                                })),
                                'event-students'
                            )
                        }
                    >
                        Export
                    </Button>

                    <Table
                        rowKey="id"
                        columns={eventColumns}
                        dataSource={eventStudents}
                        pagination={{ pageSize: 8 }}
                    />
                </Space>
            </Card>
        </Space>
    )
}
