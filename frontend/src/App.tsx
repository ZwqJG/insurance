import React, { useEffect, useState } from 'react'
import { message } from 'antd'
import InsuranceTypePage from './pages/InsuranceTypePage'
import CustomerFormPage from './pages/CustomerFormPage'
import ProposalPreviewPage from './pages/ProposalPreviewPage'
import MedicalCustomerFormPage from './pages/MedicalCustomerFormPage'
import MedicalProposalPreviewPage from './pages/MedicalProposalPreviewPage'
import { encodeShareData, decodeShareData, generateProposal, fetchSharedProposal } from './api/proposalApi'
import { generateMedicalProposal } from './api/medicalProposalApi'
import { CustomerInput, ProposalResult } from './types/proposal'
import { MedicalCustomerInput, MedicalProposalResult } from './types/medicalProposal'

type InsuranceType = 'child-ci' | 'medical' | null
type PageState = 'landing' | 'form' | 'preview'

const App: React.FC = () => {
  const [insuranceType, setInsuranceType] = useState<InsuranceType>(null)
  const [page, setPage] = useState<PageState>('landing')
  const [proposalResult, setProposalResult] = useState<ProposalResult | null>(null)
  const [medicalProposalResult, setMedicalProposalResult] = useState<MedicalProposalResult | null>(null)
  const [lastInput, setLastInput] = useState<CustomerInput | null>(null)
  const [lastMedicalInput, setLastMedicalInput] = useState<MedicalCustomerInput | null>(null)
  const [regenerating, setRegenerating] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [sharedMode, setSharedMode] = useState(false)
  const [loadingSharedProposal, setLoadingSharedProposal] = useState(false)
  const [sharedProposalError, setSharedProposalError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shareData = params.get('d')
    const type = params.get('type')

    if (shareData) {
      setSharedMode(true)
      ;(async () => {
        try {
          const result = await decodeShareData(shareData)
          const medCheck = result as unknown as MedicalProposalResult
          if (medCheck.matched_products?.[0]?.tier) {
            setMedicalProposalResult(result as unknown as MedicalProposalResult)
            setInsuranceType('medical')
          } else {
            setProposalResult(result as ProposalResult)
            setInsuranceType('child-ci')
          }
          setPage('preview')
        } catch {
          setSharedProposalError('分享链接无效或已过期')
        }
      })()
      return
    }

    // 兼容旧的 ?s= 格式
    const shareCode = params.get('s')
    if (!shareCode) {
      if (type === 'medical') {
        setInsuranceType('medical')
        setPage('form')
      }
      return
    }

    setSharedMode(true)
    setLoadingSharedProposal(true)
    fetchSharedProposal(shareCode)
      .then((record) => {
        setProposalResult(record.proposal_result)
        setInsuranceType('child-ci')
        setPage('preview')
      })
      .catch((error: unknown) => {
        const text = error instanceof Error ? error.message : '分享链接无效或已失效'
        setSharedProposalError(text)
        message.error(text)
      })
      .finally(() => {
        setLoadingSharedProposal(false)
      })
  }, [])

  const handleSelectType = (type: 'child-ci' | 'medical') => {
    setInsuranceType(type)
    setPage('form')
  }

  const handleProposalGenerated = (result: ProposalResult, input: CustomerInput) => {
    setLastInput(input)
    setProposalResult(result)
    setMedicalProposalResult(null)
    setShareUrl(null)
    setPage('preview')
  }

  const handleMedicalProposalGenerated = (result: MedicalProposalResult, input: MedicalCustomerInput) => {
    setLastMedicalInput(input)
    setMedicalProposalResult(result)
    setProposalResult(null)
    setShareUrl(null)
    setPage('preview')
  }

  const handleBack = () => {
    setPage('form')
  }

  const handleRegenerate = async () => {
    if (insuranceType === 'medical') {
      if (!lastMedicalInput) {
        setPage('form')
        return
      }
      setRegenerating(true)
      try {
        const result = await generateMedicalProposal(lastMedicalInput)
        setMedicalProposalResult(result)
        setPage('preview')
      } catch (error) {
        const text = error instanceof Error ? error.message : '重新生成方案失败，请稍后重试'
        message.error(text)
      } finally {
        setRegenerating(false)
      }
    } else {
      if (!lastInput) {
        setPage('form')
        return
      }
      setRegenerating(true)
      try {
        const result = await generateProposal(lastInput)
        setProposalResult(result)
        setPage('preview')
      } catch (error) {
        const text = error instanceof Error ? error.message : '重新生成方案失败，请稍后重试'
        message.error(text)
      } finally {
        setRegenerating(false)
      }
    }
  }

  const handleCreateShare = async () => {
    const currentResult = insuranceType === 'medical' ? medicalProposalResult : proposalResult
    if (!currentResult) {
      message.error('当前没有可分享的方案')
      return
    }

    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl)
        message.success('短链已复制到剪贴板')
      } catch {
        message.info(`短链：${shareUrl}`)
      }
      return
    }

    setSharing(true)
    try {
      const encoded = await encodeShareData(currentResult as unknown as ProposalResult)
      const url = new URL(window.location.origin)
      url.searchParams.set('d', encoded)
      if (insuranceType === 'medical') {
        url.searchParams.set('type', 'medical')
      }
      const shareLink = url.toString()
      setShareUrl(shareLink)
      try {
        await navigator.clipboard.writeText(shareLink)
        message.success('短链已生成并复制到剪贴板')
      } catch {
        message.success('短链已生成')
        message.info(`短链：${shareLink}`)
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : '生成短链失败，请稍后重试'
      message.error(text)
    } finally {
      setSharing(false)
    }
  }

  if (sharedMode && loadingSharedProposal) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#666', fontSize: 16 }}>正在加载分享方案，请稍候...</div>
      </div>
    )
  }

  if (sharedMode && sharedProposalError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 560, textAlign: 'center', color: '#666', lineHeight: 1.8 }}>
          <h2 style={{ marginBottom: 12 }}>分享链接不可用</h2>
          <div>{sharedProposalError}</div>
        </div>
      </div>
    )
  }

  // Landing page
  if (page === 'landing') {
    return <InsuranceTypePage onSelectType={handleSelectType} />
  }

  // Form pages
  if (page === 'form') {
    if (insuranceType === 'medical') {
      return (
        <MedicalCustomerFormPage
          onProposalGenerated={handleMedicalProposalGenerated}
          initialValues={lastMedicalInput ?? undefined}
        />
      )
    }
    return (
      <CustomerFormPage
        onProposalGenerated={handleProposalGenerated}
        initialValues={lastInput ?? undefined}
      />
    )
  }

  // Preview pages
  if (page === 'preview') {
    if (insuranceType === 'medical' && medicalProposalResult) {
      return (
        <MedicalProposalPreviewPage
          proposalResult={medicalProposalResult}
          onBack={handleBack}
          onRegenerate={handleRegenerate}
          regenerating={regenerating}
          readOnly={sharedMode}
          onCreateShare={handleCreateShare}
          sharing={sharing}
          shareUrl={shareUrl}
        />
      )
    }
    if (proposalResult) {
      return (
        <ProposalPreviewPage
          proposalResult={proposalResult}
          onBack={handleBack}
          onRegenerate={handleRegenerate}
          regenerating={regenerating}
          readOnly={sharedMode}
          onCreateShare={handleCreateShare}
          sharing={sharing}
          shareUrl={shareUrl}
        />
      )
    }
  }

  // Fallback: go to landing
  return <InsuranceTypePage onSelectType={handleSelectType} />
}

export default App
