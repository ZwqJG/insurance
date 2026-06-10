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

const SHARE_DATA_PREFIX = 'z1.'

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromBase64Url(encoded: string): Uint8Array {
  const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function collectStream(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    if (value) {
      chunks.push(value)
      total += value.length
    }
  }

  const merged = new Uint8Array(total)
  let offset = 0
  chunks.forEach((chunk) => {
    merged.set(chunk, offset)
    offset += chunk.length
  })
  return merged
}

async function compressText(text: string): Promise<Uint8Array> {
  if (typeof CompressionStream === 'undefined') {
    return new TextEncoder().encode(text)
  }

  const compressed = new Blob([text])
    .stream()
    .pipeThrough(new CompressionStream('deflate'))

  return collectStream(compressed)
}

async function decompressText(bytes: Uint8Array): Promise<string> {
  if (typeof DecompressionStream === 'undefined') {
    return new TextDecoder().decode(bytes)
  }

  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer
  const decompressed = new Blob([buffer])
    .stream()
    .pipeThrough(new DecompressionStream('deflate'))

  const output = await collectStream(decompressed)
  return new TextDecoder().decode(output)
}

// 客户端编码/解码方案数据到 URL（EdgeOne Pages 无服务端持久化存储）
// 新格式使用 deflate 压缩 + base64url，尽量把链接长度压到可复制、可分享的范围内。
export async function encodeShareData(data: ProposalResult): Promise<string> {
  const json = JSON.stringify(data)
  const bytes = await compressText(json)
  return `${SHARE_DATA_PREFIX}${toBase64Url(bytes)}`
}

export async function decodeShareData(encoded: string): Promise<ProposalResult> {
  if (encoded.startsWith(SHARE_DATA_PREFIX)) {
    const payload = encoded.slice(SHARE_DATA_PREFIX.length)
    const bytes = fromBase64Url(payload)
    const json = await decompressText(bytes)
    return JSON.parse(json)
  }

  try {
    const binary = atob(encoded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i)
    }
    const json = new TextDecoder().decode(bytes)
    return JSON.parse(json)
  } catch {
    const bytes = fromBase64Url(encoded)
    const json = new TextDecoder().decode(bytes)
    return JSON.parse(json)
  }
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
