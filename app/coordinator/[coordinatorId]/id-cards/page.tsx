'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
    Card,
    Space,
    Typography,
    Button,
    Input,
    List,
    message,
    Row,
    Col,
} from 'antd'
import { DownloadOutlined, SearchOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabase'
import { PDFDocument } from 'pdf-lib'
import QRCode from 'qrcode'

const { Title, Text } = Typography

export default function IdCardsPage() {
    const { coordinatorId } = useParams()

    const [students, setStudents] = useState<any[]>([])
    const [filtered, setFiltered] = useState<any[]>([])
    const [selectedStudent, setSelectedStudent] = useState<any>(null)
    const [institutionId, setInstitutionId] = useState<string | null>(null)
    const [idConfig, setIdConfig] = useState<any>(null)

    useEffect(() => {
        fetchCoordinator()
        fetchIdConfig()
    }, [])

    useEffect(() => {
        if (institutionId) {
            fetchStudents()
        }
    }, [institutionId])

    /* ---------------- Fetch Data ---------------- */

    const fetchCoordinator = async () => {
        const { data } = await supabase
            .from('coordinators')
            .select('institution_id')
            .eq('id', coordinatorId)
            .single()

        setInstitutionId(data?.institution_id)
    }

    const fetchStudents = async () => {
        const { data } = await supabase
            .from('students')
            .select('*')
            .eq('institution_id', institutionId)
            .order('name')

        setStudents(data || [])
        setFiltered(data || [])
    }

    const fetchIdConfig = async () => {
        const { data } = await supabase
            .from('id_card_config')
            .select('*')
            .single()

        setIdConfig(data)
    }

    /* ---------------- Search ---------------- */

    const onSearch = (value: string) => {
        const v = value.toLowerCase()
        const res = students.filter(s =>
            s.name.toLowerCase().includes(v)
        )
        setFiltered(res)
        setSelectedStudent(null)
    }

    /* ---------------- PDF Helpers ---------------- */

    const generateStudentPdf = async (student: any) => {
        if (!idConfig) {
            message.error('ID card configuration missing')
            return
        }

        const pdf = await PDFDocument.create()
        const page = pdf.addPage([300, 450])

        // Background
        if (idConfig.background_url) {
            const bgBytes = await fetch(idConfig.background_url).then(r =>
                r.arrayBuffer()
            )
            const bgImage = await pdf.embedPng(bgBytes)
            page.drawImage(bgImage, {
                x: 0,
                y: 0,
                width: 300,
                height: 450,
            })
        }

        // Student name
        page.drawText(student.name, {
            x: idConfig.name_x || 40,
            y: idConfig.name_y || 120,
            size: 12,
        })

        // QR Code
        const qrDataUrl = await QRCode.toDataURL(student.id)
        const qrBytes = await fetch(qrDataUrl).then(r => r.arrayBuffer())
        const qrImage = await pdf.embedPng(qrBytes)

        page.drawImage(qrImage, {
            x: idConfig.qr_x || 200,
            y: idConfig.qr_y || 120,
            width: 60,
            height: 60,
        })

        const bytes = await pdf.save()
        downloadPdf(bytes, `${student.name}-ID.pdf`)
    }

    const generateBulkPdf = async () => {
        if (!idConfig || !students.length) {
            message.error('No data available')
            return
        }

        const pdf = await PDFDocument.create()

        for (const student of students) {
            const page = pdf.addPage([300, 450])

            if (idConfig.background_url) {
                const bgBytes = await fetch(idConfig.background_url).then(r =>
                    r.arrayBuffer()
                )
                const bgImage = await pdf.embedPng(bgBytes)
                page.drawImage(bgImage, {
                    x: 0,
                    y: 0,
                    width: 300,
                    height: 450,
                })
            }

            page.drawText(student.name, {
                x: idConfig.name_x || 40,
                y: idConfig.name_y || 120,
                size: 12,
            })

            const qrDataUrl = await QRCode.toDataURL(student.id)
            const qrBytes = await fetch(qrDataUrl).then(r => r.arrayBuffer())
            const qrImage = await pdf.embedPng(qrBytes)

            page.drawImage(qrImage, {
                x: idConfig.qr_x || 200,
                y: idConfig.qr_y || 120,
                width: 60,
                height: 60,
            })
        }

        const bytes = await pdf.save()
        downloadPdf(bytes, `Institute-ID-Cards.pdf`)
    }

    const downloadPdf = (bytes: Uint8Array, filename: string) => {
        const blob = new Blob([bytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Title level={3}>ID Card Generation</Title>

            {/* BULK DOWNLOAD */}
            <Card title="Bulk Download">
                <Text>
                    Download ID cards for <strong>all students</strong> from
                    your institute.
                </Text>
                <br />
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={generateBulkPdf}
                    style={{ marginTop: 16 }}
                >
                    Download All ID Cards (PDF)
                </Button>
            </Card>

            {/* INDIVIDUAL */}
            <Card title="Search & Download Individual ID">
                <Input
                    placeholder="Search student by name"
                    prefix={<SearchOutlined />}
                    onChange={e => onSearch(e.target.value)}
                />

                <Row gutter={16} style={{ marginTop: 16 }}>
                    <Col span={10}>
                        <List
                            bordered
                            dataSource={filtered}
                            renderItem={item => (
                                <List.Item
                                    onClick={() => setSelectedStudent(item)}
                                    style={{
                                        cursor: 'pointer',
                                        background:
                                            selectedStudent?.id === item.id
                                                ? '#e6f4ff'
                                                : undefined,
                                    }}
                                >
                                    {item.name}
                                </List.Item>
                            )}
                        />
                    </Col>

                    <Col span={14}>
                        {selectedStudent ? (
                            <Card title="ID Card Preview">
                                <Text strong>{selectedStudent.name}</Text>
                                <br />
                                <Text type="secondary">
                                    {selectedStudent.batch}
                                </Text>

                                <br />
                                <br />

                                <Button
                                    type="primary"
                                    icon={<DownloadOutlined />}
                                    onClick={() =>
                                        generateStudentPdf(selectedStudent)
                                    }
                                >
                                    Download ID Card
                                </Button>
                            </Card>
                        ) : (
                            <Text type="secondary">
                                Select a student to preview & download ID card
                            </Text>
                        )}
                    </Col>
                </Row>
            </Card>
        </Space>
    )
}
