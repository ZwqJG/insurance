import React from 'react'
import { Button, Card, Row, Col } from 'antd'
import {
  SmileOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons'

interface Props {
  onSelectType: (type: 'child-ci' | 'medical') => void
}

const InsuranceTypePage: React.FC<Props> = ({ onSelectType }) => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e8f4fd 0%, #f0f9ff 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 32,
    }}>
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          color: '#1677ff',
          margin: '0 0 12px',
        }}>
          🏥 保险方案智能生成器
        </h1>
        <p style={{ fontSize: 16, color: '#666', margin: 0, maxWidth: 520, lineHeight: 1.8 }}>
          选择保险类型，系统将根据客户信息自动匹配最适合的产品，生成专业对比方案
        </p>
      </div>

      <Row gutter={[32, 32]} style={{ maxWidth: 680, width: '100%' }}>
        <Col span={12}>
          <Card
            hoverable
            className="type-card type-card-child-ci"
            styles={{
              body: {
                padding: 32,
                textAlign: 'center' as const,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              },
            }}
          >
            <SmileOutlined style={{ fontSize: 56, color: '#1677ff' }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>
              儿童重疾险
            </h2>
            <p style={{ fontSize: 14, color: '#888', margin: 0, lineHeight: 1.6 }}>
              适用于 0-17 岁儿童的重疾险智能推荐，<br />
              覆盖主流少儿重疾产品，<br />
              按保额、预算、关注点匹配推荐
            </p>
            <Button
              type="primary"
              size="large"
              style={{ borderRadius: 8, marginTop: 8 }}
              onClick={() => onSelectType('child-ci')}
            >
              进入儿童重疾险
            </Button>
          </Card>
        </Col>
        <Col span={12}>
          <Card
            hoverable
            className="type-card type-card-medical"
            styles={{
              body: {
                padding: 32,
                textAlign: 'center' as const,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              },
            }}
          >
            <MedicineBoxOutlined style={{ fontSize: 56, color: '#52c41a' }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#1a1a1a' }}>
              中高端医疗险
            </h2>
            <p style={{ fontSize: 14, color: '#888', margin: 0, lineHeight: 1.6 }}>
              适用于成人和儿童的中高端医疗险推荐，<br />
              覆盖中端/高端/既往症友好产品，<br />
              按就医区域、医院网络、门诊需求匹配
            </p>
            <Button
              type="primary"
              size="large"
              style={{ borderRadius: 8, marginTop: 8, background: '#52c41a', borderColor: '#52c41a' }}
              onClick={() => onSelectType('medical')}
            >
              进入中高端医疗险
            </Button>
          </Card>
        </Col>
      </Row>

      <div style={{ marginTop: 48, fontSize: 12, color: '#bbb', textAlign: 'center' }}>
        保险方案智能生成器 MVP · 产品信息以保险公司正式条款为准
      </div>
    </div>
  )
}

export default InsuranceTypePage
