// /api/upload-to-cloud.js
// Catatan: Anda perlu menginstal paket 'cloudinary' di proyek Vercel Anda (npm install cloudinary)

const cloudinary = require('cloudinary').v2;

// Konfigurasi Cloudinary menggunakan Environment Variables Vercel
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, // Direkomendasikan untuk URL HTTPS
});

// Gunakan module.exports karena Anda menggunakan require di atas (CommonJS)
module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        // Menggunakan header Allow yang baik
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Memastikan body sudah tersedia
    if (!req.body) {
        return res.status(400).json({ message: 'Request body is missing.' });
    }

    const { title, imageBase64 } = req.body; // Menerima base64 dari frontend

    if (!title || !imageBase64) {
        return res.status(400).json({ message: 'Title and imageBase64 are required.' });
    }

    try {
        // Unggah Base64 ke Cloudinary
        const cloudinaryResponse = await cloudinary.uploader.upload(imageBase64, {
            folder: 'vercel-gallery',
            // Membuat ID unik dari timestamp dan judul
            public_id: `${Date.now()}_${title.replace(/[^a-zA-Z0-9]/g, '_')}`, 
        });

        const imageUrl = cloudinaryResponse.secure_url;

        // Mengembalikan URL ke frontend
        res.status(200).json({ message: 'Upload success', title, imageUrl });

    } catch (error) {
        console.error("Cloudinary Upload Error:", error.message || error);
        // Mengirim error 500
        res.status(500).json({ message: 'Failed to upload photo to Cloudinary.', error: error.message });
    }
};
