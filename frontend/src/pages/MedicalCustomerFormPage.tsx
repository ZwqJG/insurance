import React, { useState } from 'react'
import {
  Form, Input, Select, InputNumber, Checkbox, Radio, Button,
  message, Spin, Row, Col,
} from 'antd'
import { generateMedicalProposal } from '../api/medicalProposalApi'
import {
  MedicalCustomerInput, MedicalFocusTag,
  MedicalProposalResult,
} from '../types/medicalProposal'

const { Option } = Select

interface Props {
  onProposalGenerated: (result: MedicalProposalResult, input: MedicalCustomerInput) => void
  initialValues?: Partial<MedicalCustomerInput>
}

const DEDUCTIBLE_OPTIONS = [
  { value: 0, label: '0免赔' },
  { value: 5000, label: '5,000元' },
  { value: 10000, label: '1万元' },
  { value: 15000, label: '1.5万元' },
  { value: 20000, label: '2万元' },
  { value: 30000, label: '3万元' },
  { value: 50000, label: '5万元' },
]

const FOCUS_OPTIONS: { value: MedicalFocusTag; label: string; desc: string }[] = [
  { value: '预算可控', label: '预算可控', desc: '希望保费尽量低' },
  { value: '0免赔/低免赔', label: '0免赔/低免赔', desc: '不想承担高免赔额' },
  { value: '特需/国际部', label: '特需/国际部', desc: '希望看公立特需、国际部、VIP部' },
  { value: '私立医院', label: '私立医院', desc: '希望覆盖私立医院' },
  { value: '门诊直付', label: '门诊直付', desc: '经常门诊，希望少垫钱' },
  { value: '既往症友好', label: '既往症友好', desc: '有既往症或既往理赔记录' },
  { value: '外购药/特药', label: '外购药/特药', desc: '关注肿瘤药、院外药、器械' },
  { value: '儿童单独投保', label: '儿童单独投保', desc: '给孩子单独配置' },
  { value: '海外/港澳台就医', label: '海外/港澳台就医', desc: '需要海外治疗或全球紧急' },
  { value: '生育/家庭计划', label: '生育/家庭计划', desc: '有孕产或新生儿加保需求' },
]

const MedicalCustomerFormPage: React.FC<Props> = ({ onProposalGenerated, initialValues }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: Record<string, unknown>) => {
    setLoading(true)
    try {
      const input: MedicalCustomerInput = {
        customer_name: values.customer_name as string,
        insured_age: values.insured_age as number,
        insured_gender: values.insured_gender as '男' | '女' | undefined,
        customer_type: values.customer_type as MedicalCustomerInput['customer_type'],
        city: values.city as string,
        regions: values.regions as MedicalCustomerInput['regions'],
        hospitals: values.hospitals as MedicalCustomerInput['hospitals'],
        outpatient_need: values.outpatient_need as MedicalCustomerInput['outpatient_need'],
        pre_existing_condition: values.pre_existing_condition as MedicalCustomerInput['pre_existing_condition'],
        pre_existing_note: values.pre_existing_note as string | undefined,
        has_social_insurance: values.has_social_insurance as MedicalCustomerInput['has_social_insurance'],
        annual_budget: values.annual_budget as number,
        acceptable_deductibles: values.acceptable_deductibles as number[],
        concern_outpatient_drug_device: values.concern_outpatient_drug_device as MedicalCustomerInput['concern_outpatient_drug_device'],
        concern_inpatient_direct_billing: values.concern_inpatient_direct_billing as MedicalCustomerInput['concern_inpatient_direct_billing'],
        concern_overseas_medical: values.concern_overseas_medical as MedicalCustomerInput['concern_overseas_medical'],
        concern_maternity: values.concern_maternity as MedicalCustomerInput['concern_maternity'],
        focus_tags: values.focus_tags as MedicalFocusTag[],
        health_note: values.health_note as string | undefined,
      }
      const result = await generateMedicalProposal(input)
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
          <h1>🏥 中高端医疗险智能推荐系统</h1>
          <p>填写客户就医需求，系统自动从中高端医疗险产品库匹配最合适的 2-4 款产品，生成专业对比方案</p>
        </div>

        <Spin spinning={loading} tip="正在匹配产品并生成方案，请稍候...">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              insured_gender: '男',
              has_social_insurance: '是',
              concern_outpatient_drug_device: '是',
              concern_inpatient_direct_billing: '是',
              concern_overseas_medical: '否',
              concern_maternity: '否',
              ...initialValues,
            }}
          >
            {/* 客户基本信息 */}
            <div className="section-title">客户基本信息</div>

            <Row gutter={16}>
              <Col span={8}>
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
                    min={0} max={100} style={{ width: '100%' }}
                    placeholder="年龄" addonAfter="岁"
                  />
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item label="性别" name="insured_gender">
                  <Select allowClear>
                    <Option value="男">男</Option>
                    <Option value="女">女</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={5}>
                <Form.Item
                  label="客户类型"
                  name="customer_type"
                  rules={[{ required: true, message: '请选择客户类型' }]}
                >
                  <Select placeholder="成人/儿童/家庭">
                    <Option value="成人">成人</Option>
                    <Option value="儿童">儿童</Option>
                    <Option value="家庭">家庭</Option>
                    <Option value="孕产需求">孕产需求</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="所在城市"
                  name="city"
                  rules={[{ required: true, message: '请输入所在城市' }]}
                >
                  <Input placeholder="例如：北京、上海、深圳" />
                </Form.Item>
              </Col>
            </Row>

            {/* 就医需求 */}
            <div className="section-title">就医需求</div>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="期望就医区域"
                  name="regions"
                  rules={[{ required: true, message: '请至少选择一个区域' }]}
                >
                  <Select mode="multiple" placeholder="可多选">
                    <Option value="中国大陆">中国大陆</Option>
                    <Option value="港澳台">含港澳台</Option>
                    <Option value="全球除美加">全球除美加</Option>
                    <Option value="全球">全球</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="希望覆盖医院"
                  name="hospitals"
                  rules={[{ required: true, message: '请至少选择一项' }]}
                >
                  <Select mode="multiple" placeholder="可多选">
                    <Option value="公立普通部">公立普通部</Option>
                    <Option value="特需部">特需部</Option>
                    <Option value="国际部">国际部</Option>
                    <Option value="VIP部">VIP部</Option>
                    <Option value="私立医院">私立医院</Option>
                    <Option value="昂贵医院">昂贵医院</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="是否需要门诊"
                  name="outpatient_need"
                  rules={[{ required: true, message: '请选择门诊需求' }]}
                >
                  <Radio.Group>
                    <Radio value="不需要">不需要</Radio>
                    <Radio value="需要普通门诊">需要普通门诊</Radio>
                    <Radio value="需要门诊直付">需要门诊直付</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="是否有社保"
                  name="has_social_insurance"
                  rules={[{ required: true }]}
                >
                  <Radio.Group>
                    <Radio value="是">是</Radio>
                    <Radio value="否">否</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="年预算（元）"
                  name="annual_budget"
                  rules={[{ required: true, message: '请输入年预算' }]}
                >
                  <InputNumber
                    min={500} max={1000000} step={1000}
                    style={{ width: '100%' }}
                    placeholder="例如：10000"
                    formatter={(value: string | number | undefined) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value: string | undefined) => value ? parseFloat(value.replace(/,/g, '')) : 0}
                    addonAfter="元/年"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="可接受免赔额"
                  name="acceptable_deductibles"
                  rules={[{ required: true, message: '请至少选择一个免赔额选项' }]}
                >
                  <Select mode="multiple" placeholder="可多选">
                    {DEDUCTIBLE_OPTIONS.map((o) => (
                      <Option key={o.value} value={o.value}>{o.label}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            {/* 健康状况 */}
            <div className="section-title">健康状况</div>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="是否有既往症"
                  name="pre_existing_condition"
                  rules={[{ required: true, message: '请选择既往症情况' }]}
                >
                  <Select placeholder="请选择">
                    <Option value="无">无</Option>
                    <Option value="轻微异常">轻微异常（如结节、高血压等）</Option>
                    <Option value="明确既往症">明确既往症</Option>
                    <Option value="既往理赔记录">既往理赔记录</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="既往症说明（选填）" name="pre_existing_note">
                  <Input placeholder="如：甲状腺结节2级、高血压（收缩压140-159）" />
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

            {/* 其他关注 */}
            <div className="section-title">其他关注</div>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="是否关注外购药/器械" name="concern_outpatient_drug_device">
                  <Radio.Group>
                    <Radio value="是">是</Radio>
                    <Radio value="否">否</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="是否关注住院直付" name="concern_inpatient_direct_billing">
                  <Radio.Group>
                    <Radio value="是">是</Radio>
                    <Radio value="否">否</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="是否关注海外就医" name="concern_overseas_medical">
                  <Radio.Group>
                    <Radio value="是">是</Radio>
                    <Radio value="否">否</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="是否关注生育责任" name="concern_maternity">
                  <Radio.Group>
                    <Radio value="是">是</Radio>
                    <Radio value="否">否</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>

            {/* 健康备注 */}
            <div className="section-title">其他备注（选填）</div>

            <Form.Item name="health_note">
              <Input.TextArea
                rows={3}
                placeholder="如客户有其他特殊需求或说明，请在此填写"
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

export default MedicalCustomerFormPage
