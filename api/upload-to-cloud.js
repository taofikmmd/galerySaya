// /api/upload-to-cloud.js
// Catatan: Anda perlu menginstal paket 'cloudinary' di proyek Vercel Anda (npm install cloudinary)

const cloudinary = require('cloudinary').v2;

// Konfigurasi Firebase Firestore (asumsi db adalah variabel Firestore yang sudah terinisialisasi)
// Anda perlu membuat koneksi Firestore di sini atau di file terpisah.
// Untuk Vercel Serverless, Anda harus mengimpor admin SDK atau menggunakan metode yang berbeda.

// Karena Anda menggunakan JavaScript klien (web SDK) di frontend, mari kita ubah fokus
// dan asumsikan fungsi API ini hanya mengunggah ke Cloudinary dan mengembalikan URL.

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { title, imageBase64 } = req.body; // Menerima base64 dari frontend

    if (!title || !imageBase64) {
        return res.status(400).json({ message: 'Title and imageBase64 are required.' });
    }

    try {
        // Unggah Base64 ke Cloudinary
        const cloudinaryResponse = await cloudinary.uploader.upload(imageBase64, {
            folder: 'vercel-gallery',
            public_id: `${Date.now()}_${title.replace(/ /g, '_')}`,
        });

        const imageUrl = cloudinaryResponse.secure_url;

        // KARENA KITA TIDAK BISA MEMBUAT KONEKSI FIRESTORE DI SINI SECARA MUDAH,
        // KITA AKAN MENGEMBALIKAN URL KE FRONTEND, DAN FRONTEND YANG AKAN MENYIMPANNYA KE FIRESTORE.

        res.status(200).json({ message: 'Upload success', title, imageUrl });

    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        res.status(500).json({ message: 'Failed to upload photo to Cloudinary.' });
    }
}