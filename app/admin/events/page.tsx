'use client'

import { useEffect, useState } from 'react'
import {
    Table,
    Input,
    Select,
    Switch,
    Button,
    Space,
    Typography,
    message,
    Popconfirm,
    Checkbox,
} from 'antd'
import { PlusOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'
import { hardDelete, softDelete } from '@/lib/service'

const { Title } = Typography
const { Option } = Select

export default function EventsPage() {
    const [data, setData] = useState<any[]>([])
    const [editingKey, setEditingKey] = useState<string | null>(null)

    const isEditing = (record: any) => record.id === editingKey

    const fetchEvents = async () => {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('name')

        if (error) {
            message.error(error.message)
        } else {
            setData(data || [])
        }
    }

    useEffect(() => {
        fetchEvents()
    }, [])

    const addNewRow = () => {
        const newRow = {
            id: 'NEW',
            name: '',
            type: 'INDIVIDUAL',
            is_on_stage: false,
            is_active: true,
            isNew: true,
        }
        setData([newRow, ...data])
        setEditingKey('NEW')
    }

    const saveRow = async (record: any) => {
        if (!record.name || !record.type) {
            message.error('Event name and type are required')
            return
        }

        let error
        if (record.isNew) {
            ; ({ error } = await supabase.from('events').insert({
                name: record.name,
                type: record.type,
                is_on_stage: record.is_on_stage,
                is_active: record.is_active,
            }))
        } else {
            ; ({ error } = await supabase
                .from('events')
                .update({
                    name: record.name,
                    type: record.type,
                    is_on_stage: record.is_on_stage,
                    is_active: record.is_active,
                })
                .eq('id', record.id))
        }

        if (error) {
            message.error(error.message)
        } else {
            message.success('Event saved')
            setEditingKey(null)
            fetchEvents()
        }
    }

    const cancelEdit = () => {
        setEditingKey(null)
        fetchEvents()
    }

    const columns = [
        {
            title: 'Event Name',
            dataIndex: 'name',
            render: (_: any, record: any) =>
                isEditing(record) ? (
                    <Input
                        value={record.name}
                        onChange={e => {
                            record.name = e.target.value
                            setData([...data])
                        }}
                    />
                ) : (
                    record.name
                ),
        },
        {
            title: 'Event Type',
            dataIndex: 'type',
            render: (_: any, record: any) =>
                isEditing(record) ? (
                    <Select
                        value={record.type}
                        style={{ width: 140 }}
                        onChange={value => {
                            record.type = value
                            setData([...data])
                        }}
                    >
                        <Option value="INDIVIDUAL">Individual</Option>
                        <Option value="GROUP">Group</Option>
                    </Select>
                ) : (
                    record.type
            ),
            filters: [
                { text: 'Individual', value: 'INDIVIDUAL' },
                { text: 'Group', value: 'GROUP' },
            ],
            onFilter: (v: any, r: any) => r.type === v,
        },
        {
            title: 'On-Stage',
            dataIndex: 'is_on_stage',
            width: 120,
            render: (v: boolean, r: any) =>
                isEditing(r) ? (
                    <Checkbox
                        checked={v}
                        onChange={e => {
                            r.is_on_stage = e.target.checked
                            setData([...data])
                        }}
                    >
                        On-Stage
                    </Checkbox>
                ) : (
                    <span>{v ? 'Yes' : 'No'}</span>
                ),
            filters: [
                { text: 'On-Stage', value: true },
                { text: 'Off-Stage', value: false },
            ],
            onFilter: (v: any, r:any) => r.is_on_stage === v,
        },
        {
            title: 'Active',
            dataIndex: 'is_active',
            render: (_: any, record: any) =>
                isEditing(record) ? (
                    <Switch
                        checked={record.is_active}
                        onChange={checked => {
                            record.is_active = checked
                            setData([...data])
                        }}
                    />
                ) : record.is_active ? (
                    'Yes'
                ) : (
                    'No'
                ),
        },
        {
            title: 'Actions',
            render: (_: any, record: any) =>
                isEditing(record) ? (
                    <Space>
                        <Button
                            type="link"
                            icon={<SaveOutlined />}
                            onClick={() => saveRow(record)}
                        >
                            Save
                        </Button>
                        <Button
                            type="link"
                            icon={<CloseOutlined />}
                            onClick={cancelEdit}
                        >
                            Cancel
                        </Button>
                    </Space>
                ) : (

                    <Space>
                        <Button
                            type="link"
                            onClick={() => setEditingKey(record.id)}
                        >
                            Edit
                        </Button>

                        <Popconfirm
                            title="Delete this event?"
                            description="This will remove the event from future selections."
                            onConfirm={async () => {
                                await hardDelete('events', record.id);
                                fetchEvents();
                            }}
                        >
                            <Button type="link" danger>
                                Delete
                            </Button>
                        </Popconfirm>
                    </Space>
                ),
        },
    ]

    return (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            <Title level={3}>Events</Title>

            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addNewRow}
                style={{ width: 'fit-content' }}
            >
                Add Event
            </Button>

            <Table
                rowKey="id"
                columns={columns}
                dataSource={data}
                pagination={{ pageSize: 10 }}
            />
        </Space>
    )
}
