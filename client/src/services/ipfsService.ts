export interface PinataUploadResult {
  cid: string;
  gatewayUrl: string;
  name: string;
  size: number;
}

/**
 * Uploads a task completion report or proof document to IPFS via Pinata.
 * Returns the immutable IPFS CID and gateway URL.
 */
export async function uploadFileToPinata(file: File): Promise<PinataUploadResult> {
  const jwt = import.meta.env.VITE_PINATA_JWT;

  if (!jwt || jwt.trim() === '') {
    console.warn('VITE_PINATA_JWT not found in env, falling back to local simulation CID');
    const mockHash = `bafybei${Math.random().toString(36).substring(2, 12)}proof`;
    return {
      cid: `ipfs://${mockHash}`,
      gatewayUrl: `https://ipfs.io/ipfs/${mockHash}`,
      name: file.name,
      size: file.size,
    };
  }

  const formData = new FormData();
  formData.append('file', file);

  const metadata = JSON.stringify({
    name: `TrueLedger_Proof_${Date.now()}_${file.name}`,
    keyvalues: {
      platform: 'TrueLedger',
      timestamp: Date.now().toString(),
    },
  });
  formData.append('pinataMetadata', metadata);

  const options = JSON.stringify({
    cidVersion: 1,
  });
  formData.append('pinataOptions', options);

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwt.trim()}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pinata IPFS pinning failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const cid = data.IpfsHash;

  return {
    cid: `ipfs://${cid}`,
    gatewayUrl: `https://gateway.pinata.cloud/ipfs/${cid}`,
    name: file.name,
    size: data.PinSize || file.size,
  };
}
