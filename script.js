// ===============================================
// Bagian 1: Mendapatkan Elemen HTML dan Logika Modal
// ===============================================

const uploadBtn = document.getElementById('uploadBtn');
const uploadModal = document.getElementById('uploadModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const uploadForm = document.getElementById('uploadForm');
const gallery = document.getElementById('gallery');

// 1. Logika untuk MENAMPILKAN modal ketika tombol "Unggah Foto" diklik
if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
        uploadModal.classList.remove('hidden');
    });
}

// 2. Logika untuk MENYEMBUNYIKAN modal ketika tombol "Batal" diklik
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        uploadModal.classList.add('hidden');
        uploadForm.reset();
    });
}

// 3. Logika untuk MENYEMBUNYIKAN modal ketika mengklik area luar modal (overlay)
if (uploadModal) {
    uploadModal.addEventListener('click', (e) => {
        if (e.target === uploadModal) {
            uploadModal.classList.add('hidden');
            uploadForm.reset();
        }
    });
}

// ===============================================
// Bagian 2: Logika Unggah ke Cloudinary via Vercel API
// ===============================================

async function uploadToCloudinaryAndFirestore(file, title) {
    return new Promise((resolve, reject) => {
        // 1. Baca file sebagai Base64
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = async () => {
            const imageBase64 = reader.result;
            
            try {
                // 2. Kirim data Base64 ke API Backend Vercel
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

                // 3. Simpan Metadata (URL Cloudinary) ke Firestore
                // Variabel 'db' dan 'firebase' harus didefinisikan di index.html
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

// --- LOGIKA UTAMA MODAL SUBMIT ---
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const titleInput = document.getElementById('photoTitle');
    const fileInput = document.getElementById('photoFile');

    const title = titleInput.value;
    const file = fileInput.files[0];

    if (file) {
        try {
            // Panggil fungsi upload
            await uploadToCloudinaryAndFirestore(file, title);
        } catch (error) {
            // Error sudah ditangani di fungsi di atas
        } finally {
            // Operasi ini selalu dijalankan (berhasil atau gagal)
            uploadForm.reset();
            uploadModal.classList.add('hidden');
        }
    }
});

// ===============================================
// Bagian 3: Logika Memuat dan Menampilkan Galeri (Real-time)
// ===============================================

// --- FUNGSI PEMBUAT KARTU GAMBAR ---
function createPhotoCard(doc) {
    const data = doc.data();
    const card = document.createElement('div');
    card.className = 'image-card bg-white rounded-xl shadow-lg overflow-hidden fade-in';
    card.id = `photo-${doc.id}`; 

    // Format waktu
    let timeText = '';
    if (data.timestamp && data.timestamp.seconds) {
        const date = new Date(data.timestamp.seconds * 1000);
        timeText = date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    card.innerHTML = `
        <div class="h-48 overflow-hidden bg-gray-200">
            <img src="${data.imageUrl}" alt="${data.title}" 
                 class="w-full h-full object-cover transform hover:scale-105 transition duration-500" 
                 loading="lazy">
        </div>
        <div class="p-4">
            <h3 class="text-lg font-bold text-gray-800">${data.title}</h3>
            ${timeText ? `<p class="text-sm text-gray-500 mt-1">${timeText}</p>` : ''}
        </div>
    `;
    return card;
}

// --- FUNGSI MEMUAT DATA FIRESTORE (Real-time) ---
function loadAndListenForPhotos() {
    db.collection('photos')
        .orderBy('timestamp', 'desc')
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const doc = change.doc;

                if (change.type === 'added') {
                    // Hanya tambahkan elemen baru
                    const newCard = createPhotoCard(doc);
                    gallery.prepend(newCard); 
                    
                } else if (change.type === 'removed') {
                    // Hapus elemen jika dokumen dihapus
                    const removedCard = document.getElementById(`photo-${doc.id}`);
                    if (removedCard) {
                        removedCard.remove();
                    }
                }
                // Logika 'modified' dapat ditambahkan di sini jika perlu
            });
        }, (error) => {
            console.error("Gagal memuat galeri dari Firestore:", error);
            gallery.innerHTML = '<p class="text-red-600">Gagal memuat galeri. Pastikan aturan database sudah diatur dan koneksi berfungsi.</p>';
        });
}

// Panggil fungsi untuk memulai tampilan galeri
loadAndListenForPhotos();
