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

// Variabel BARU untuk Slideshow
const nextBtn = document.getElementById('nextBtn');
const prevBtn = document.getElementById('prevBtn');
const slideIndicator = document.getElementById('slideIndicator');

let currentSlideIndex = 0;
let currentImageUrls = []; // Array untuk menyimpan URL gambar yang sedang ditampilkan


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

// 4. Logika untuk MENYEMBUNYIKAN modal DETAIL
if (closeDetailModalBtn) {
    closeDetailModalBtn.addEventListener('click', () => {
        detailModal.classList.add('hidden');
    });
}

// 5. Logika untuk MENYEMBUNYIKAN modal DETAIL ketika mengklik area luar
if (detailModal) {
    detailModal.addEventListener('click', (e) => {
        // Hanya sembunyikan jika yang diklik adalah latar belakang modal
        if (e.target.id === 'detailModal') {
            detailModal.classList.add('hidden');
        }
    });
}


// ===============================================
// Bagian 2: Logika Unggah Multi-File ke Cloudinary via Vercel API
// ===============================================

async function uploadToCloudinaryAndFirestore(files, title) {
    if (files.length === 0 || files.length > 3) {
        alert("Harap pilih 1 hingga 3 file foto.");
        return;
    }

    const uploadedUrls = [];
    
    // Perulangan untuk setiap file
    for (const file of files) {
        const imageBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });

        try {
            // Panggil API Vercel untuk setiap file
            const apiResponse = await fetch('/api/upload-to-cloud', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: file.name, imageBase64: imageBase64 }) 
            });

            if (!apiResponse.ok) {
                const errorData = await apiResponse.json();
                throw new Error(errorData.message || `Gagal mengunggah file ${file.name}.`);
            }

            const result = await apiResponse.json();
            uploadedUrls.push(result.imageUrl);
        } catch (error) {
            console.error("Proses Upload Gagal Total:", error);
            alert(`Gagal mengunggah foto: ${error.message}`);
            return;
        }
    }

    // Simpan semua URL dalam satu dokumen Firestore
    await db.collection('photos').add({
        title: title,
        imageUrls: uploadedUrls, // DISIMPAN SEBAGAI ARRAY
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    console.log('Upload Cloudinary (Multiple) & Simpan Firestore Berhasil!');
}

// --- LOGIKA UTAMA MODAL SUBMIT (Diubah untuk Multi-File) ---
uploadForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const titleInput = document.getElementById('photoTitle');
    // UBAH ID INPUT FILE
    const fileInput = document.getElementById('photoFiles'); 

    const title = titleInput.value;
    const files = Array.from(fileInput.files);

    if (files.length > 0) {
        try {
            await uploadToCloudinaryAndFirestore(files, title);
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

// --- FUNGSI HAPUS FOTO DARI FIRESTORE ---
async function deletePhoto(docId, title) {
    if (confirm(`Anda yakin ingin menghapus proyek "${title}" secara permanen?`)) {
        try {
            await db.collection('photos').doc(docId).delete();
            alert("Proyek berhasil dihapus dari galeri!");
        } catch (error) {
            console.error("Gagal menghapus foto:", error);
            alert("Terjadi kesalahan saat mencoba menghapus foto. Pastikan Anda memiliki izin Firestore.");
        }
    }
}


// --- FUNGSI PEMBUAT KARTU GAMBAR (Multi-Image Support) ---
function createPhotoCard(doc) {
    const data = doc.data();
    const docId = doc.id; 
    
    // Periksa apakah data berisi array imageUrls (untuk entri baru) 
    // atau string imageUrl (untuk entri lama, jika ada)
    const imageUrls = Array.isArray(data.imageUrls) ? data.imageUrls : [data.imageUrl].filter(Boolean);
    const firstImageUrl = imageUrls[0] || ''; 
    
    const card = document.createElement('div');
    card.className = 'image-card bg-white rounded-xl shadow-lg overflow-hidden fade-in';
    card.id = `photo-${docId}`; 

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
        <div class="h-48 bg-gray-200 overflow-hidden cursor-pointer" id="imageContainer-${docId}">
            <img src="${firstImageUrl}" alt="${data.title}" 
                 class="w-full h-full object-cover transform hover:scale-105 transition duration-500" 
                 loading="lazy">
        </div>
        <div class="p-4">
            <h3 class="text-lg font-bold text-gray-800">${data.title} ${imageUrls.length > 1 ? `(${imageUrls.length} Foto)` : ''}</h3>
            ${timeText ? `<p class="text-sm text-gray-500 mt-1">${timeText}</p>` : ''}
            
            <div class="mt-3 flex space-x-2">
                <a href="${firstImageUrl}" download="${data.title || 'gambar'}.jpg" 
                   class="inline-flex items-center justify-center w-2/3 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition duration-300">
                    ⬇️ Download
                </a>

                <button data-id="${docId}" 
                        class="delete-btn w-1/3 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2 px-4 rounded-lg transition duration-300">
                    🗑️ Hapus
                </button>
            </div>
            
        </div>
    `;

    // --- LOGIKA KLIK MEMBUKA MODAL DETAIL (Sekarang Memanggil Slideshow) ---
    const imageContainer = card.querySelector(`#imageContainer-${docId}`);
    imageContainer.addEventListener('click', () => {
        // Panggil fungsi slideshow dengan array URL
        openSlideshowModal(imageUrls, data.title);
    });
    
    // --- LOGIKA KLIK HAPUS ---
    const deleteButton = card.querySelector('.delete-btn');
    deleteButton.addEventListener('click', () => {
        deletePhoto(docId, data.title); 
    });

    return card;
}

// --- FUNGSI MEMUAT DATA FIRESTORE (Real-time, Diurutkan Terbaru) ---
function loadAndListenForPhotos() {
    db.collection('photos')
        .orderBy('timestamp', 'desc') 
        .onSnapshot((snapshot) => {
            
            // 1. Hapus elemen yang dihapus
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'removed') {
                    const removedCard = document.getElementById(`photo-${change.doc.id}`);
                    if (removedCard) {
                        removedCard.remove();
                    }
                }
            });

            // 2. Gambar ulang GALERI untuk memastikan urutan benar saat refresh/pemuatan awal
            gallery.innerHTML = ''; 
            
            // 3. Ambil semua dokumen yang ada di snapshot dan gambar ulang
            snapshot.docs.forEach(doc => {
                const newCard = createPhotoCard(doc);
                gallery.appendChild(newCard);
            });


        }, (error) => {
            console.error("Gagal memuat galeri dari Firestore:", error);
            gallery.innerHTML = '<p class="text-red-600">Gagal memuat galeri. Pastikan aturan database sudah diatur dan koneksi berfungsi.</p>';
        });
}


// ===============================================
// Bagian 4: Logika Slideshow Detail (BARU)
// ===============================================

function updateSlideshow() {
    const totalSlides = currentImageUrls.length;
    
    // Update Gambar dan Alt
    detailImage.src = currentImageUrls[currentSlideIndex];
    detailImage.alt = `${detailTitle.textContent} - Gambar ${currentSlideIndex + 1}`;
    
    // Update Indikator
    slideIndicator.textContent = `${currentSlideIndex + 1} dari ${totalSlides}`;
    
    // Tampilkan/Sembunyikan Tombol Navigasi
    if (totalSlides > 1) {
        prevBtn.classList.remove('hidden');
        nextBtn.classList.remove('hidden');
    } else {
        prevBtn.classList.add('hidden');
        nextBtn.classList.add('hidden');
        slideIndicator.textContent = ''; // Kosongkan indikator jika hanya 1 foto
    }

    // Logika Sembunyikan Tombol di ujung
    if (currentSlideIndex === 0) {
        prevBtn.classList.add('hidden');
    }
    if (currentSlideIndex === totalSlides - 1) {
        nextBtn.classList.add('hidden');
    }
}

function openSlideshowModal(imageUrls, title) {
    currentImageUrls = imageUrls;
    currentSlideIndex = 0; // Mulai dari gambar pertama
    detailTitle.textContent = title;
    
    updateSlideshow();
    detailModal.classList.remove('hidden');
}

// Tambahkan Event Listener untuk Tombol Next/Previous
nextBtn.addEventListener('click', () => {
    if (currentSlideIndex < currentImageUrls.length - 1) {
        currentSlideIndex++;
        updateSlideshow();
    }
});

prevBtn.addEventListener('click', () => {
    if (currentSlideIndex > 0) {
        currentSlideIndex--;
        updateSlideshow();
    }
});


// Panggil fungsi untuk memulai tampilan galeri
loadAndListenForPhotos();
