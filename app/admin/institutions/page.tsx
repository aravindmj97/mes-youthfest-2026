'use client'

import { useEffect, useState } from 'react'
import {
    Table,
    Button,
    Modal,
    Form,
    Input,
    Switch,
    Space,
    message,
    Typography,
} from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'

const { Title } = Typography

export default function InstitutionsPage() {
    const [data, setData] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const [editing, setEditing] = useState<any>(null)
    const [form] = Form.useForm()

    const fetchInstitutions = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('institutions')
            .select('*')
            .order('name')

        if (error) {
            message.error(error.message)
        } else {
            setData(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchInstitutions()
    }, [])

    const openModal = (record?: any) => {
        setEditing(record || null)
        setOpen(true)
        form.setFieldsValue(
            record || { is_active: true }
        )
    }

    const closeModal = () => {
        setOpen(false)
        form.resetFields()
    }

    const saveInstitution = async () => {
        const values = await form.validateFields()

        const payload = {
            name: values.name,
            code: values.code,
            is_active: values.is_active,
        }

        let error
        if (editing) {
            ; ({ error } = await supabase
                .from('institutions')
                .update(payload)
                .eq('id', editing.id))
        } else {
            ; ({ error } = await supabase
                .from('institutions')
                .insert(payload))
        }

        if (error) {
            message.error(error.message)
        } else {
            message.success('Institution saved')
            closeModal()
            fetchInstitutions()
        }
    }

    const columns = [
        {
            title: 'Institution Name',
            dataIndex: 'name',
        },
        {
            title: 'Code',
            dataIndex: 'code',
        },
        {
            title: 'Active',
            dataIndex: 'is_active',
            render: (v: boolean) => (v ? 'Yes' : 'No'),
        },
        {
            title: 'Actions',
            render: (_: any, record: any) => (
                <Button type="link" onClick={() => openModal(record)}>
                    Edit
                </Button>
            ),
        },
    ]

    return (
        <Space orientation="vertical" size="large" style={{ width: '100%' }}>
            <Title level={3}>Institutions</Title>

            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openModal()}
                style={{ width: 'fit-content' }}
            >
                Add Institution
            </Button>

            <Table
                rowKey="id"
                columns={columns}
                dataSource={data}
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={editing ? 'Edit Institution' : 'Add Institution'}
                open={open}
                onCancel={closeModal}
                onOk={saveInstitution}
                okText="Save"
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ is_active: true }}
                >
                    <Form.Item
                        label="Institution Name"
                        name="name"
                        rules={[{ required: true }]}
                    >
                        <Input placeholder="MES College of Engineering" />
                    </Form.Item>

                    <Form.Item
                        label="Institution Code"
                        name="code"
                        rules={[{ required: true }]}
                    >
                        <Input placeholder="MESCE" />
                    </Form.Item>

                    <Form.Item
                        label="Active"
                        name="is_active"
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>
                </Form>
            </Modal>
        </Space>
    )
}
