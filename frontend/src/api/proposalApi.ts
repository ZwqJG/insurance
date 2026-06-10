import axios from 'axios'
import { CustomerInput, ProposalResult, ProposalShareResult, SharedProposalRecord } from '../types/proposal'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

export async function generateProposal(input: CustomerInput): Promise<ProposalResult> {
  try {
    const response = await api.post<ProposalResult>('/proposals/generate', input)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data as { message?: string; error?: string; details?: string[] } | undefined
      const details = responseData?.details?.length ? `：${responseData.details.join('；')}` : ''
      const message = responseData?.message ?? responseData?.error ?? error.message
      throw new Error(`${message}${details}`)
    }
    throw error
  }
}

// 客户端编码/解码方案数据到 URL（EdgeOne Pages 无服务端持久化存储）
export function encodeShareData(data: ProposalResult): string {
  const json = JSON.stringify(data)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  bytes.forEach((b) => { binary += String.fromCharCode(b) })
  return btoa(binary)
}

export function decodeShareData(encoded: string): ProposalResult {
  const binary = atob(encoded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const json = new TextDecoder().decode(bytes)
  return JSON.parse(json)
}

// 服务端分享 API（EdgeOne 部署时不可用，保留供本地开发或后续升级）
export async function createProposalShare(proposalResult: ProposalResult): Promise<ProposalShareResult> {
  try {
    const response = await api.post<ProposalShareResult>('/proposals/share', { proposal_result: proposalResult })
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data as { message?: string; error?: string; details?: string[] } | undefined
      const details = responseData?.details?.length ? `：${responseData.details.join('；')}` : ''
      const message = responseData?.message ?? responseData?.error ?? error.message
      throw new Error(`${message}${details}`)
    }
    throw error
  }
}

export async function fetchSharedProposal(code: string): Promise<SharedProposalRecord> {
  try {
    const response = await api.get<SharedProposalRecord>('/proposals/share', { params: { code } })
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const responseData = error.response?.data as { message?: string; error?: string; details?: string[] } | undefined
      const details = responseData?.details?.length ? `：${responseData.details.join('；')}` : ''
      const message = responseData?.message ?? responseData?.error ?? error.message
      throw new Error(`${message}${details}`)
    }
    throw error
  }
}
