'use client'

import { useEffect, useState } from 'react'
import {
    Table,
    Input,
    Select,
    Button,
    Space,
    Typography,
    message,
    Popconfirm,
    Tooltip,
} from 'antd'
import {
    PlusOutlined,
    SaveOutlined,
    CloseOutlined,
    EyeOutlined,
} from '@ant-design/icons'
import { supabase } from '@/lib/supabase'
import { hardDelete, softDelete } from '@/lib/service'

const { Title } = Typography
const { Option } = Select

export default function CoordinatorsPage() {
    const [coordinators, setCoordinators] = useState<any[]>([])
    const [institutions, setInstitutions] = useState<any[]>([])
    const [editingKey, setEditingKey] = useState<string | null>(null)

    const isEditing = (record: any) => record.id === editingKey

    const fetchCoordinators = async () => {
        const { data, error } = await supabase
            .from('coordinators')
            .select('*')
            .order('name')

        if (error) message.error(error.message)
        else setCoordinators(data || [])
    }

    const fetchInstitutions = async () => {
        const { data } = await supabase
            .from('institutions')
            .select('id, name')
            .order('name')

        setInstitutions(data || [])
    }

    useEffect(() => {
        fetchCoordinators()
        fetchInstitutions()
    }, [])

    const addCoordinator = () => {
        setCoordinators([
            {
                id: 'NEW',
                name: '',
                email: '',
                phone: '',
                institution_id: null,
                isNew: true,
            },
            ...coordinators,
        ])
        setEditingKey('NEW')
    }

    const saveCoordinator = async (record: any) => {
        if (!record.name || !record.email || !record.institution_id) {
            message.error('Name, email, and institution are required')
            return
        }

        const payload = {
            name: record.name,
            email: record.email,
            phone: record.phone,
            institution_id: record.institution_id,
        }

        let error
        if (record.isNew) {
            ; ({ error } = await supabase.from('coordinators').insert(payload))
        } else {
            ; ({ error } = await supabase
                .from('coordinators')
                .update(payload)
                .eq('id', record.id))
        }

        if (error) {
            message.error(error.message)
        } else {
            message.success('Coordinator saved')
            setEditingKey(null)
            fetchCoordinators()
        }
    }

    const columns = [
        {
            title: 'Name',
            render: (_: any, record: any) =>
                isEditing(record) ? (
                    <Input
                        value={record.name}
                        onChange={e => {
                            record.name = e.target.value
                            setCoordinators([...coordinators])
                        }}
                    />
                ) : (
                    record.name
                ),
        },
        {
            title: 'Email',
            render: (_: any, record: any) =>
                isEditing(record) ? (
                    <Input
                        value={record.email}
                        onChange={e => {
                            record.email = e.target.value
                            setCoordinators([...coordinators])
                        }}
                    />
                ) : (
                    record.email
                ),
        },
        {
            title: 'Phone',
            render: (_: any, record: any) =>
                isEditing(record) ? (
                    <Input
                        value={record.phone}
                        onChange={e => {
                            record.phone = e.target.value
                            setCoordinators([...coordinators])
                        }}
                    />
                ) : (
                    record.phone
                ),
        },
        {
            title: 'Institution',
            render: (_: any, record: any) =>
                isEditing(record) ? (
                    <Select
                        value={record.institution_id}
                        style={{ width: 180 }}
                        onChange={v => {
                            record.institution_id = v
                            setCoordinators([...coordinators])
                        }}
                    >
                        {institutions.map(i => (
                            <Option key={i.id} value={i.id}>
                                {i.name}
                            </Option>
                        ))}
                    </Select>
                ) : (
                    institutions.find(i => i.id === record.institution_id)?.name
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
                            onClick={() => saveCoordinator(record)}
                        />
                        <Button
                            type="link"
                            icon={<CloseOutlined />}
                            onClick={() => setEditingKey(null)}
                        />
                    </Space>
                ) : (
                    <Space>
                        <Button type="link" onClick={() => setEditingKey(record.id)}>
                            Edit
                        </Button>
                        <Popconfirm
                            title="Delete this coordinator?"
                            description="Coordinator will no longer be able to login."
                                onConfirm={async () => {
                                    await hardDelete('coordinators', record.id);
                                    fetchCoordinators();
                                }}
                        >
                            <Button type="link" danger>Delete</Button>
                        </Popconfirm>

                            {/* NEW: Open Coordinator Students Page */}
                            <Tooltip title="Open Coordinator Student Page">
                                <Button
                                    type="link"
                                    icon={<EyeOutlined />}
                                    onClick={() =>
                                        window.open(
                                            `/coordinator/${record.id}/students`,
                                            '_blank',
                                            'noopener,noreferrer'
                                        )
                                    }
                                >
                                    View Students
                                </Button>
                            </Tooltip>
                    </Space>
                ),
        },
    ]

    return (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            <Title level={3}>Coordinators</Title>

            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addCoordinator}
                style={{ width: 'fit-content' }}
            >
                Add Coordinator
            </Button>

            <Table
                rowKey="id"
                columns={columns}
                dataSource={coordinators}
                pagination={{ pageSize: 8 }}
            />
        </Space>
    )
}
