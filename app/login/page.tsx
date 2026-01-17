'use client'

import { Layout, Card, Form, Input, Button, Typography, message } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'

const { Content } = Layout
const { Title, Text } = Typography

export default function LoginPage() {
    const [form] = Form.useForm()

    const onFinish = async (values: { email: string }) => {
        const { error } = await supabase.auth.signInWithOtp({
            email: values.email,
            options: {
                emailRedirectTo: window.location.origin,
            },
        })

        if (error) {
            message.error(error.message)
        } else {
            message.success('Magic link sent! Check your email.')
        }
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Content
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Card
                    style={{ width: 380 }}
                    bordered
                >
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <Title level={3}>MBS Youth Festival</Title>
                        <Text type="secondary">
                            Coordinator / Admin Login
                        </Text>
                    </div>

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                    >
                        <Form.Item
                            label="Email Address"
                            name="email"
                            rules={[
                                { required: true, message: 'Please enter your email' },
                                { type: 'email', message: 'Invalid email address' },
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined />}
                                placeholder="faculty@college.edu"
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                size="large"
                                block
                            >
                                Send Login Link
                            </Button>
                        </Form.Item>
                    </Form>

                    <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Only registered faculty & admins can access the system
                        </Text>
                    </div>
                </Card>
            </Content>
        </Layout>
    )
}
