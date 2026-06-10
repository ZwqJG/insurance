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
    const response = await api.get<SharedProposalRecord>(`/proposals/share/${code}`)
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
