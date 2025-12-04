// --- FUNGSI BARU UNTUK UPLOAD KE CLOUDINARY VIA VERCEL API ---
async function uploadToCloudinaryAndFirestore(file, title) {
    return new Promise((resolve, reject) => {
        // 1. Baca file sebagai Base64 (untuk dikirim ke API Vercel)
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = async () => {
            const imageBase64 = reader.result;
            
            try {
                // 2. Kirim data ke API Backend (Vercel Serverless Function)
                const apiResponse = await fetch('/api/upload-to-cloud', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, imageBase64 })
                });

                if (!apiResponse.ok) {
                    const errorData = await apiResponse.json();
                    throw new Error(errorData.message || 'Gagal mengunggah melalui API Vercel.');
                }

                const result = await apiResponse.json();
                const finalImageUrl = result.imageUrl;

                // 3. Simpan Metadata ke Firestore (Menggunakan SDK klien yang sudah ada)
                // PASTIKAN VARIABEL 'db' DAN 'firebase' SUDAH DIDEFINISIKAN SECARA GLOBAL DI index.html
                await db.collection('photos').add({
                    title: title,
                    imageUrl: finalImageUrl,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                
                console.log('Upload Cloudinary & Simpan Firestore Berhasil!');
                resolve(finalImageUrl);

            } catch (error) {
                console.error("Proses Upload Gagal Total:", error);
                alert("Gagal mengunggah foto. Pastikan API Vercel, Cloudinary, dan Aturan Firestore berfungsi.");
                reject(error);
            }
        };
        reader.onerror = error => reject(error);
    });
}

// --- LOGIKA UNGGAH FOTO (MODAL SUBMIT) ---
// Mendapatkan elemen HTML yang diperlukan
const uploadBtn = document.getElementById('uploadBtn');
const uploadModal = document.getElementById('uploadModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const uploadForm = document.getElementById('uploadForm');
const gallery = document.getElementById('gallery');

// 1. Logika untuk MENAMPILKAN modal ketika tombol "Unggah Foto" diklik
if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
        // Menghapus kelas 'hidden' untuk menampilkan modal
        uploadModal.classList.remove('hidden');
    });
}

// 2. Logika untuk MENYEMBUNYIKAN modal ketika tombol "Batal" diklik
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        // Menambahkan kembali kelas 'hidden' untuk menyembunyikan modal
        uploadModal.classList.add('hidden');
        uploadForm.reset(); // Mereset form jika dibatalkan
    });
}

// 3. Logika untuk MENYEMBUNYIKAN modal ketika mengklik area luar modal (overlay)
if (uploadModal) {
    uploadModal.addEventListener('click', (e) => {
        // Memastikan klik dilakukan langsung pada overlay (bukan di dalam kotak modal)
        if (e.target === uploadModal) {
            uploadModal.classList.add('hidden');
            uploadForm.reset(); // Mereset form
        }
    });
}

// ... (Di bawah kode ini baru diikuti oleh kode inisialisasi Firebase dan fungsi uploadToCloudinaryAndFirestore));

