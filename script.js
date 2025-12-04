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
                    await db.collection('photos').add({
                        title: title,
                        imageUrl: finalImageUrl,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    
                    console.log('Upload Cloudinary & Simpan Firestore Berhasil!');
                    resolve(finalImageUrl);

                } catch (error) {
                    console.error("Proses Upload Gagal Total:", error);
                    alert("Gagal mengunggah foto. Pastikan API Vercel dan Firestore berfungsi.");
                    reject(error);
                }
            };
            reader.onerror = error => reject(error);
        });
    }

    // --- LOGIKA UNGGAH FOTO (MODAL SUBMIT) ---
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const titleInput = document.getElementById('photoTitle');
        const fileInput = document.getElementById('photoFile');

        const title = titleInput.value;
        const file = fileInput.files[0];

        if (file) {
            await uploadToCloudinaryAndFirestore(file, title);

            // Reset form dan sembunyikan modal
            uploadForm.reset();
            uploadModal.classList.add('hidden');
        }
    });

    // ... (Fungsi loadAndListenForPhotos tetap sama)
