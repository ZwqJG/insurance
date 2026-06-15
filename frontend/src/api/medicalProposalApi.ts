import axios from 'axios'
import { MedicalCustomerInput, MedicalProposalResult } from '../types/medicalProposal'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

export async function generateMedicalProposal(input: MedicalCustomerInput): Promise<MedicalProposalResult> {
  try {
    const response = await api.post<MedicalProposalResult>('/medical-proposals/generate', input)
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
