// /api/upload-to-cloud.js (MENGGUNAKAN ES MODULES)

// 1. Ubah require menjadi import
import { v2 as cloudinary } from 'cloudinary';

// Konfigurasi Cloudinary menggunakan Environment Variables Vercel
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, 
});

// 2. Ubah module.exports menjadi export default
export default async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Vercel seringkali memerlukan parser JSON eksplisit
    const { title, imageBase64 } = req.body; 

    if (!title || !imageBase64) {
        return res.status(400).json({ message: 'Title and imageBase64 are required.' });
    }

    try {
        // Unggah Base64 ke Cloudinary
        const cloudinaryResponse = await cloudinary.uploader.upload(imageBase64, {
            folder: 'vercel-gallery',
            // Membuat ID unik
            public_id: `${Date.now()}_${title.replace(/[^a-zA-Z0-9]/g, '_')}`, 
            // TIDAK PERLU menggunakan timestamp atau signature manual di sini.
        });

        const imageUrl = cloudinaryResponse.secure_url;

        res.status(200).json({ message: 'Upload success', title, imageUrl });

    } catch (error) {
        console.error("Cloudinary Upload Error:", error.message || error);
        res.status(500).json({ message: 'Failed to upload photo to Cloudinary.', error: error.message });
    }
};
