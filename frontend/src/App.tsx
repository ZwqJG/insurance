import React, { useEffect, useState } from 'react'
import { message } from 'antd'
import CustomerFormPage from './pages/CustomerFormPage'
import ProposalPreviewPage from './pages/ProposalPreviewPage'
import { encodeShareData, decodeShareData, generateProposal } from './api/proposalApi'
import { CustomerInput, ProposalResult } from './types/proposal'

type PageState = 'form' | 'preview'

const App: React.FC = () => {
  const [page, setPage] = useState<PageState>('form')
  const [proposalResult, setProposalResult] = useState<ProposalResult | null>(null)
  const [lastInput, setLastInput] = useState<CustomerInput | null>(null)
  const [regenerating, setRegenerating] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [sharedMode, setSharedMode] = useState(false)
  const [loadingSharedProposal, setLoadingSharedProposal] = useState(false)
  const [sharedProposalError, setSharedProposalError] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const shareData = params.get('d')

    if (shareData) {
      // 自包含分享链接（方案数据直接编码在 URL 中）
      setSharedMode(true)
      try {
        const result = decodeShareData(shareData)
        setProposalResult(result)
        setPage('preview')
      } catch {
        setSharedProposalError('分享链接无效或已过期')
      }
      return
    }

    // 兼容旧的 ?s= 格式（依赖服务端存储，EdgeOne 部署可能不可用）
    const shareCode = params.get('s')
    if (!shareCode) {
      return
    }

    setSharedMode(true)
    setLoadingSharedProposal(true)
    import('./api/proposalApi').then(({ fetchSharedProposal }) =>
      fetchSharedProposal(shareCode)
        .then((record) => {
          setProposalResult(record.proposal_result)
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
    )
  }, [])

  const handleProposalGenerated = (result: ProposalResult, input: CustomerInput) => {
    setLastInput(input)
    setProposalResult(result)
    setShareUrl(null)
    setPage('preview')
  }

  const handleBack = () => {
    setPage('form')
  }

  const handleRegenerate = async () => {
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

  const handleCreateShare = async () => {
    if (!proposalResult) {
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
      const encoded = encodeShareData(proposalResult)
      const url = new URL(`/?d=${encoded}`, window.location.origin).toString()
      setShareUrl(url)
      try {
        await navigator.clipboard.writeText(url)
        message.success('短链已生成并复制到剪贴板')
      } catch {
        message.success('短链已生成')
        message.info(`短链：${url}`)
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

  return (
    <div>
      {page === 'form' && (
        <CustomerFormPage
          onProposalGenerated={handleProposalGenerated}
          initialValues={lastInput ?? undefined}
        />
      )}
      {page === 'preview' && proposalResult && (
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
      )}
    </div>
  )
}

export default App
