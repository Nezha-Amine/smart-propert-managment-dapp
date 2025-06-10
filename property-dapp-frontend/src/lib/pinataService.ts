import axios from 'axios';

const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS';

export async function uploadToPinata(file: File, jwt: string) {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(PINATA_API_URL, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${jwt}`,
      },
    });

    return response.data.IpfsHash;
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    throw new Error('Failed to upload file to IPFS');
  }
}

export function getIpfsUrl(hash: string) {
  return `https://violet-faithful-unicorn-946.mypinata.cloud/ipfs/${hash}`;
} 