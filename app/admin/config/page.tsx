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
} from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'

const { Title, Text } = Typography

export default function ConfigPage() {
    /* ---------------- Participation Limits ---------------- */
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
