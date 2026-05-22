import QRCode from 'qrcode'

export async function generateQR(data: string): Promise<string> {
  return QRCode.toDataURL(data, { margin: 2, width: 300 })
}
