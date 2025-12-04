// ===============================================
// Bagian 1: Mendapatkan Elemen HTML dan Logika Modal
// ===============================================

const uploadBtn = document.getElementById('uploadBtn');
const uploadModal = document.getElementById('uploadModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const uploadForm = document.getElementById('uploadForm');
const gallery = document.getElementById('gallery');

// Variabel BARU untuk Modal Detail
const detailModal = document.getElementById('detailModal'); 
const detailImage = document.getElementById('detailImage');
const closeDetailModalBtn = document.getElementById('closeDetailModalBtn');
const detailTitle = document.getElementById('detailTitle');


// 1. Logika untuk MENAMPILKAN modal UNGGAH
if (uploadBtn) {
    uploadBtn.addEventListener('click', () => {
        uploadModal.classList.remove('hidden');
    });
}

// 2. Logika untuk MENYEMBUNYIKAN modal UNGGAH
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        uploadModal.classList.add('hidden');
        uploadForm.reset();
    });
}

// 3. Logika untuk MENYEMBUNYIKAN modal UNGGAH ketika mengklik area luar
if (uploadModal) {
    uploadModal.addEventListener('click', (e) => {
        if (e.target === uploadModal) {
            uploadModal.classList.add('hidden');
            uploadForm.reset();
        }
    });
}

// 4. Logika untuk MENYEMBUNYIKAN modal DETAIL (BARU)
if (closeDetailModalBtn) {
    closeDetailModalBtn.addEventListener('click', () => {
        detailModal.classList.add('hidden');
    });
}

// 5. Logika untuk MENYEMBUNYIKAN modal DETAIL ketika mengklik area luar (BARU)
if (detailModal) {
    detailModal.addEventListener('click', (e) => {
        // Hanya sembunyikan jika yang diklik adalah latar belakang modal atau gambar
        if (e.target.id === 'detailModal' || e.target.id === 'detailImage') {
            detailModal.classList.add('hidden');
        }
    });
}


// ===============================================
// Bagian 2: Logika Unggah ke Cloudinary via Vercel API
// ===============================================

async function uploadToCloudinaryAndFirestore(file, title) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = async () => {
            const imageBase64 = reader.result;
            
            try {
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
            await uploadToCloudinaryAndFirestore(file, title);
        } catch (error) {
            // Error sudah ditangani di fungsi di atas
        } finally {
            uploadForm.reset();
            uploadModal.classList.add('hidden');
        }
    }
});

// ===============================================
// Bagian 3: Logika Memuat dan Menampilkan Galeri (Real-time)
// ===============================================

// --- FUNGSI PEMBUAT KARTU GAMBAR (DENGAN LOGIKA KLIK DETAIL) ---
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

    // --- STRUKTUR HTML KARTU ---
    card.innerHTML = `
        <div class="h-48 bg-gray-200 overflow-hidden cursor-pointer" id="imageContainer-${doc.id}">
            <img src="${data.imageUrl}" alt="${data.title}" 
                 class="w-full h-full object-cover transform hover:scale-105 transition duration-500" 
                 loading="lazy">
        </div>
        <div class="p-4">
            <h3 class="text-lg font-bold text-gray-800">${data.title}</h3>
            ${timeText ? `<p class="text-sm text-gray-500 mt-1">${timeText}</p>` : ''}
            
            <div class="mt-3">
                <a href="${data.imageUrl}" download="${data.title || 'gambar'}.jpg" 
                   class="inline-flex items-center justify-center w-full bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition duration-300">
                    ⬇️ Download Foto
                </a>
            </div>
            
        </div>
    `;

    // --- LOGIKA KLIK BARU: MEMBUKA MODAL DETAIL ---
    const imageContainer = card.querySelector(`#imageContainer-${doc.id}`);
    imageContainer.addEventListener('click', () => {
        // Atur sumber gambar, judul, dan tampilkan modal
        detailImage.src = data.imageUrl;
        detailImage.alt = data.title;
        detailTitle.textContent = data.title;
        detailModal.classList.remove('hidden');
    });

    return card;
}

// --- FUNGSI MEMUAT DATA FIRESTORE (Real-time, Diurutkan Terbaru) ---
function loadAndListenForPhotos() {
    db.collection('photos')
        // Pengurutan berdasarkan timestamp secara descending (terbaru di atas)
        .orderBy('timestamp', 'desc') 
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                const doc = change.doc;

                if (change.type === 'added') {
                    // Tambahkan elemen baru (prepend untuk menempatkan yang terbaru di awal)
                    const newCard = createPhotoCard(doc);
                    gallery.prepend(newCard);  
                    
                } else if (change.type === 'removed') {
                    const removedCard = document.getElementById(`photo-${doc.id}`);
                    if (removedCard) {
                        removedCard.remove();
                    }
                }
            });
        }, (error) => {
            console.error("Gagal memuat galeri dari Firestore:", error);
            gallery.innerHTML = '<p class="text-red-600">Gagal memuat galeri. Pastikan aturan database sudah diatur dan koneksi berfungsi.</p>';
        });
}

// Panggil fungsi untuk memulai tampilan galeri
loadAndListenForPhotos();
