document.addEventListener('DOMContentLoaded', () => {
    // Pastikan variabel db dan storage sudah diinisialisasi di index.html
    // Jika ada error "db is not defined", pastikan script inisialisasi di index.html sudah benar.

    const uploadBtn = document.getElementById('uploadBtn');
    const uploadModal = document.getElementById('uploadModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const uploadForm = document.getElementById('uploadForm');
    const gallery = document.getElementById('gallery');

    // --- FUNGSI TAMPILAN ---

    /**
     * Membuat elemen card foto untuk ditampilkan di galeri.
     */
    function createPhotoCard(title, imageUrl) {
        const card = document.createElement('div');
        // Tambahkan animasi fade-in dan efek hover/transisi
        card.className = 'image-card bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl cursor-pointer fade-in';

        const image = document.createElement('img');
        image.src = imageUrl;
        image.alt = title;
        image.className = 'w-full h-48 object-cover';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'p-4';

        const titleElement = document.createElement('h3');
        titleElement.className = 'text-lg font-semibold text-gray-800 truncate mb-2';
        titleElement.textContent = title;

        const downloadLink = document.createElement('a');
        downloadLink.href = imageUrl; // URL dari Firebase Storage
        downloadLink.download = `${title.replace(/ /g, '_')}_design.png`;
        downloadLink.className = 'block w-full text-center bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 rounded-lg transition duration-300 mt-3';
        downloadLink.textContent = '⬇️ Unduh Gambar';

        contentDiv.appendChild(titleElement);
        contentDiv.appendChild(downloadLink);

        card.appendChild(image);
        card.appendChild(contentDiv);

        return card;
    }


    // --- FUNGSI FIREBASE (UPLOAD) ---

    /**
     * Mengunggah file ke Firebase Storage dan data ke Firestore.
     */
    async function uploadPhoto(file, title) {
        // Tentukan path unik di Firebase Storage
        const filePath = `designs/${Date.now()}_${file.name}`;
        const storageRef = storage.ref(filePath);

        try {
            // 1. Unggah File ke Storage
            const snapshot = await storageRef.put(file);
            console.log('Upload berhasil!');

            // 2. Dapatkan URL publik untuk ditampilkan/diunduh
            const downloadURL = await snapshot.ref.getDownloadURL();

            // 3. Simpan data (judul & URL) ke Firestore
            await db.collection('photos').add({
                title: title,
                imageUrl: downloadURL,
                timestamp: firebase.firestore.FieldValue.serverTimestamp() // Gunakan timestamp server untuk urutan
            });

            console.log('Data metadata tersimpan di Firestore!');

        } catch (error) {
            console.error("Gagal mengunggah foto:", error);
            alert("Gagal mengunggah foto. Pastikan koneksi dan aturan Firebase Anda benar.");
        }
    }


    /**
     * Memuat semua foto dari Firestore saat halaman dimuat.
     */
    function loadAndListenForPhotos() {
        // Gunakan onSnapshot untuk memuat data awal dan mendengarkan perubahan (realtime)
        db.collection('photos')
            .orderBy('timestamp', 'desc') // Urutkan dari yang terbaru
            .onSnapshot((snapshot) => {
                // Hapus galeri lama untuk pembaruan
                gallery.innerHTML = '';

                snapshot.forEach(doc => {
                    const data = doc.data();
                    const card = createPhotoCard(data.title, data.imageUrl);
                    gallery.appendChild(card);
                });
            }, error => {
                console.error("Gagal memuat data dari Firestore:", error);
                gallery.innerHTML = '<p class="text-red-500">Gagal memuat galeri. Pastikan aturan database sudah diatur.</p>';
            });
    }

    // --- EVENT LISTENERS ---

    // Tampil/Sembunyi Modal
    uploadBtn.addEventListener('click', () => {
        uploadModal.classList.remove('hidden');
    });
    closeModalBtn.addEventListener('click', () => {
        uploadModal.classList.add('hidden');
    });
    uploadModal.addEventListener('click', (e) => {
        if (e.target === uploadModal) {
            uploadModal.classList.add('hidden');
        }
    });

    // Logika Unggah Foto
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const titleInput = document.getElementById('photoTitle');
        const fileInput = document.getElementById('photoFile');

        const title = titleInput.value;
        const file = fileInput.files[0];

        if (file) {
            // Panggil fungsi upload Firebase
            await uploadPhoto(file, title);

            // Reset form dan sembunyikan modal
            uploadForm.reset();
            uploadModal.classList.add('hidden');
        }
    });

    // Panggil fungsi inisialisasi dan dengarkan perubahan
    loadAndListenForPhotos();
});
