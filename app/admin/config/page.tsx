'use client'

import { useEffect, useState } from 'react'
import {
    Card,
    Form,
    InputNumber,
    Button,
    Space,
    Typography,
    Upload,
    Row,
    Col,
    Input,
    message,
    Switch,
    Alert,
    Select
} from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'

const { Title, Text } = Typography

export default function ConfigPage() {
    /* ---------------- Participation Limits ---------------- */
    const [lockCoordinatorEdit, setLockCoordinatorEdit] = useState(false)
    useEffect(() => {
        const loadConfig = async () => {
            const { data } = await supabase
                .from('festival_config')
                .select('*')

            const map: any = {}
            data?.forEach(c => (map[c.key] = c.value))

            setLockCoordinatorEdit(Boolean(map.lock_coordinator_edit))
        }

        loadConfig()
    }, [])

    const [form] = Form.useForm()

    const loadParticipationConfig = async () => {
        const { data } = await supabase
            .from('festival_config')
            .select('*')
            .in('key', ['max_individual_events', 'max_group_events'])

        const values: any = {}
        data?.forEach(row => {
            values[row.key] = row.value
        })

        form.setFieldsValue(values)
    }

    useEffect(() => {
        loadParticipationConfig()
    }, [])

    const saveParticipationConfig = async (values: any) => {
        const updates = Object.entries(values).map(([key, value]) => ({
            key,
            value,
        }))

        await supabase
            .from('festival_config')
            .upsert(updates, { onConflict: 'key' })

        message.success('Participation limits saved')
    }

    /* ---------------- Announcement Section ---------------- */
    const [announcement, setAnnouncement] = useState({
        message: '',
        severity: 'INFO',
    })
    useEffect(() => {
        const fetchAnnouncement = async () => {
            const { data } = await supabase
                .from('global_announcements')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .single()

            if (data) {
                setAnnouncement({
                    message: data.message,
                    severity: data.severity,
                })
            }
        }

        fetchAnnouncement()
    }, [])
    const saveAnnouncement = async () => {
        if (!announcement.message.trim()) {
            message.error('Message cannot be empty')
            return
        }

        // deactivate previous
        await supabase
            .from('global_announcements')
            .update({ is_active: false })
            .eq('is_active', true)

        // insert new
        await supabase.from('global_announcements').insert({
            message: announcement.message,
            severity: announcement.severity,
            is_active: true,
        })

        message.success('Announcement published')
    }

    const clearAnnouncement = async () => {
        await supabase
            .from('global_announcements')
            .update({ is_active: false })
            .eq('is_active', true)

        setAnnouncement({
            message: '',
            severity: 'INFO',
        })

        message.success('Announcement cleared')
    }

    /* ---------------- ID Card Config ---------------- */
    const [bgUrl, setBgUrl] = useState<string | null>(null)
    const [layout, setLayout] = useState({
        name_x: 40,
        name_y: 120,
        qr_x: 200,
        qr_y: 120,
    })

    const uploadBackground = async (file: any) => {
        const { data, error } = await supabase.storage
            .from('id-cards')
            .upload(`backgrounds/${Date.now()}.png`, file)

        if (error) {
            message.error(error.message)
            return false
        }

        const url = supabase.storage
            .from('id-cards')
            .getPublicUrl(data.path).data.publicUrl

        setBgUrl(url)
        message.success('ID card template uploaded')
        return false
    }

    const saveIdCardConfig = async () => {
        await supabase.from('id_card_config').upsert({
            id: 1,
            background_url: bgUrl,
            ...layout,
        })

        message.success('ID card configuration saved')
    }

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Title level={3}>Festival Configuration</Title>

            {/* PARTICIPATION LIMITS */}
            <Card title="Participation Limits">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={saveParticipationConfig}
                >
                    <Form.Item
                        label="Maximum Individual Events per Student"
                        name="max_individual_events"
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={0} style={{ width: 200 }} />
                    </Form.Item>

                    <Form.Item
                        label="Maximum Group Events per Student"
                        name="max_group_events"
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={0} style={{ width: 200 }} />
                    </Form.Item>

                    <Button type="primary" htmlType="submit">
                        Save Participation Limits
                    </Button>
                </Form>
            </Card>

            {/* LOCK COORDINATOR EDIT */}
            <Card title="Coordinator Access Control">
                <Space orientation="vertical">
                    <Space>
                        <Switch
                            checked={lockCoordinatorEdit}
                            onChange={async checked => {
                                setLockCoordinatorEdit(checked)

                                await supabase
                                    .from('festival_config')
                                    .upsert({
                                        key: 'lock_coordinator_edit',
                                        value: checked ? 1 : 0,
                                    })

                                message.success(
                                    checked
                                        ? 'Coordinator editing disabled'
                                        : 'Coordinator editing enabled'
                                )
                            }}
                        />
                        <span>
                            Disable student editing for coordinators
                        </span>
                    </Space>

                    <Typography.Text type="secondary">
                        When enabled, coordinators can only view student data.
                        All changes must be done from Master Data.
                    </Typography.Text>
                </Space>
            </Card>

            {/* ANNOUNCEMENT SECTION */}
            <Card title="Global Announcement (For Coordinators)">
                <Space orientation="vertical" style={{ width: '100%' }}>
                    <Select
                        value={announcement.severity}
                        style={{ width: 200 }}
                        onChange={v =>
                            setAnnouncement({ ...announcement, severity: v })
                        }
                    >
                        <Select.Option value="INFO">Info</Select.Option>
                        <Select.Option value="WARNING">Warning</Select.Option>
                        <Select.Option value="CRITICAL">Critical</Select.Option>
                    </Select>

                    <Input.TextArea
                        rows={4}
                        placeholder="Enter announcement message for all coordinators"
                        value={announcement.message}
                        onChange={e =>
                            setAnnouncement({
                                ...announcement,
                                message: e.target.value,
                            })
                        }
                    />

                    <Space>
                        <Button type="primary" onClick={saveAnnouncement}>
                            Publish Announcement
                        </Button>

                        <Button danger onClick={clearAnnouncement}>
                            Clear Announcement
                        </Button>
                    </Space>

                    <Typography.Text type="secondary">
                        Clearing the announcement will immediately remove it from
                        all coordinator screens.
                    </Typography.Text>
                </Space>
            </Card>

            {/* ID CARD CONFIG */}
            <Card title="ID Card Template & Layout">
                <Row gutter={24}>
                    <Col span={12}>
                        <Upload
                            beforeUpload={uploadBackground}
                            showUploadList={false}
                        >
                            <Button icon={<UploadOutlined />}>
                                Upload ID Card Background
                            </Button>
                        </Upload>

                        {bgUrl && (
                            <img
                                src={bgUrl}
                                alt="ID Card Template"
                                style={{
                                    width: '100%',
                                    marginTop: 16,
                                    border: '1px solid #ddd',
                                }}
                            />
                        )}
                    </Col>

                    <Col span={12}>
                        <Text strong>Field Positioning (px)</Text>

                        <Space direction="vertical" style={{ width: '100%' }}>
                            <InputNumber
                                addonBefore="Name X"
                                value={layout.name_x}
                                onChange={v => setLayout({ ...layout, name_x: v! })}
                            />
                            <InputNumber
                                addonBefore="Name Y"
                                value={layout.name_y}
                                onChange={v => setLayout({ ...layout, name_y: v! })}
                            />
                            <InputNumber
                                addonBefore="QR X"
                                value={layout.qr_x}
                                onChange={v => setLayout({ ...layout, qr_x: v! })}
                            />
                            <InputNumber
                                addonBefore="QR Y"
                                value={layout.qr_y}
                                onChange={v => setLayout({ ...layout, qr_y: v! })}
                            />
                        </Space>

                        <Button
                            type="primary"
                            style={{ marginTop: 16 }}
                            onClick={saveIdCardConfig}
                        >
                            Save ID Card Layout
                        </Button>
                    </Col>
                </Row>
            </Card>
        </Space>
    )
}
