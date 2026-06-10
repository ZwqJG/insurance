import React, { useState } from 'react'
import {
  Form, Input, Select, InputNumber, Checkbox, Button,
  message, Spin, Row, Col,
} from 'antd'
import { generateProposal } from '../api/proposalApi'
import { CustomerInput, FocusTag, CoveragePreference, PaymentPreference, ProposalResult } from '../types/proposal'

const { Option } = Select

interface Props {
  onProposalGenerated: (result: ProposalResult, input: CustomerInput) => void
  initialValues?: Partial<CustomerInput>
}

const FOCUS_OPTIONS: { value: FocusTag; label: string; desc: string }[] = [
  { value: '保费便宜',    label: '💰 保费便宜',    desc: '预算有限，优先控制年缴保费' },
  { value: '保障全面',    label: '🛡️ 保障全面',    desc: '重疾、轻症、中症责任完整覆盖' },
  { value: '儿童特疾',    label: '👶 儿童特疾',    desc: '关注少儿特定疾病及罕见病保障' },
  { value: '癌症多次赔付', label: '🔬 癌症多次赔付', desc: '关注癌症复发、转移等长期风险' },
  { value: '现金价值',    label: '📈 现金价值',    desc: '关注长期现金价值或后期退保利益' },
]

const SUM_ASSURED_OPTIONS = [
  { value: 100000,  label: '10万元' },
  { value: 200000,  label: '20万元' },
  { value: 300000,  label: '30万元' },
  { value: 500000,  label: '50万元' },
  { value: 700000,  label: '70万元' },
  { value: 1000000, label: '100万元' },
]

const CustomerFormPage: React.FC<Props> = ({ onProposalGenerated, initialValues }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const defaultInitialValues = {
    insured_gender: '男' as const,
    coverage_preference: '终身' as const,
    payment_preference: '20年' as const,
    sum_assured: 500000,
  }
  const formInitialValues = {
    ...defaultInitialValues,
    ...initialValues,
  }

  const handleSubmit = async (values: {
    customer_name: string
    insured_age: number
    insured_gender: '男' | '女'
    sum_assured: number
    annual_budget: number
    coverage_preference: CoveragePreference
    payment_preference: PaymentPreference
    focus_tags: FocusTag[]
    health_note?: string
  }) => {
    setLoading(true)
    try {
      const input: CustomerInput = {
        customer_name: values.customer_name,
        insured_age: values.insured_age,
        insured_gender: values.insured_gender,
        sum_assured: values.sum_assured,
        annual_budget: values.annual_budget,
        coverage_preference: values.coverage_preference,
        payment_preference: values.payment_preference || '不确定',
        focus_tags: values.focus_tags,
        health_note: values.health_note,
      }
      const result = await generateProposal(input)
      onProposalGenerated(result, input)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '生成方案失败，请检查网络连接或稍后重试'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-page">
      <div className="form-card">
        <div className="form-header">
          <h1>👶 儿童重疾险智能方案生成器</h1>
          <p>填写客户基本信息，系统自动匹配最合适的儿童重疾险产品，生成专业对比方案</p>
        </div>

        <Spin spinning={loading} tip="正在匹配产品并生成方案，请稍候...">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={formInitialValues}
          >
            {/* 客户基本信息 */}
            <div className="section-title">客户基本信息</div>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="客户称呼"
                  name="customer_name"
                  rules={[{ required: true, message: '请输入客户称呼' }]}
                >
                  <Input placeholder="例如：王女士、李先生" />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  label="被保人年龄"
                  name="insured_age"
                  rules={[{ required: true, message: '请输入年龄' }]}
                >
                  <InputNumber
                    min={0} max={17} style={{ width: '100%' }}
                    placeholder="0~17岁" addonAfter="岁"
                  />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  label="被保人性别"
                  name="insured_gender"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value="男">男</Option>
                    <Option value="女">女</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* 保障需求 */}
            <div className="section-title">保障需求</div>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="期望保额"
                  name="sum_assured"
                  rules={[{ required: true, message: '请选择期望保额' }]}
                >
                  <Select placeholder="请选择期望保额">
                    {SUM_ASSURED_OPTIONS.map((o) => (
                      <Option key={o.value} value={o.value}>{o.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="年预算（元）"
                  name="annual_budget"
                  rules={[{ required: true, message: '请输入年预算' }]}
                >
                  <InputNumber
                    min={1000} max={200000} step={1000}
                    style={{ width: '100%' }}
                    placeholder="例如：10000"
                    formatter={(value: string | number | undefined) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value: string | undefined) => value ? parseFloat(value.replace(/,/g, '')) : 0}
                    addonAfter="元/年"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="保障期间偏好"
                  name="coverage_preference"
                  rules={[{ required: true }]}
                >
                  <Select>
                    <Option value="终身">终身</Option>
                    <Option value="至70岁">至70岁</Option>
                    <Option value="30年">30年</Option>
                    <Option value="不确定">不确定</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="缴费期间偏好" name="payment_preference">
                  <Select>
                    <Option value="10年">10年</Option>
                    <Option value="20年">20年</Option>
                    <Option value="30年">30年</Option>
                    <Option value="不确定">不确定</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* 重点关注 */}
            <div className="section-title">重点关注方向（可多选）</div>

            <Form.Item
              name="focus_tags"
              rules={[{ required: true, message: '请至少选择一个关注方向' }]}
            >
              <Checkbox.Group style={{ width: '100%' }}>
                <Row gutter={[12, 12]}>
                  {FOCUS_OPTIONS.map((opt) => (
                    <Col span={12} key={opt.value}>
                      <div style={{
                        border: '1px solid #e8e8e8',
                        borderRadius: 8,
                        padding: '10px 14px',
                        cursor: 'pointer',
                        background: '#fafafa',
                      }}>
                        <Checkbox value={opt.value}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{opt.label}</span>
                          <br />
                          <span style={{ fontSize: 12, color: '#888' }}>{opt.desc}</span>
                        </Checkbox>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Checkbox.Group>
            </Form.Item>

            {/* 健康情况备注 */}
            <div className="section-title">健康情况备注（选填）</div>

            <Form.Item name="health_note">
              <Input.TextArea
                rows={3}
                placeholder="如宝宝目前身体健康，无住院史；或如有早产、住院史等情况请在此说明"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="submit-btn"
                loading={loading}
                size="large"
              >
                {loading ? '生成中...' : '🚀 生成保险方案'}
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </div>
    </div>
  )
}

export default CustomerFormPage
