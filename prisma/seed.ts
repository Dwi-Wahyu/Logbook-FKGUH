import { PrismaClient } from "@/generated/prisma"; // Baris ini mungkin perlu disesuaikan jika PrismaClient ada di tempat lain
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Memulai proses seeding hanya untuk ADMIN dan Mata Kuliah...");

  // Hapus data existing yang relevan (opsional, tergantung kebutuhan Anda)
  // Anda mungkin ingin lebih selektif dalam menghapus data.
  // Untuk tujuan seed ulang hanya admin dan mata_kuliah, menghapus semua pengguna dan mata_kuliah adalah yang paling aman.
  await prisma.kegiatan.deleteMany(); // Hapus kegiatan yang mungkin terhubung ke pengguna
  await prisma.profil.deleteMany(); // Hapus profil yang mungkin terhubung ke pengguna
  await prisma.logbook.deleteMany(); // Hapus logbook yang mungkin terhubung ke pengguna
  await prisma.permohonan_bimbingan.deleteMany(); // Hapus permohonan bimbingan
  await prisma.notifikasi.deleteMany(); // Hapus notifikasi
  await prisma.pengguna.deleteMany(); // Hapus semua pengguna (termasuk dosen, mahasiswa, admin lama jika ada)
  await prisma.mata_kuliah.deleteMany(); // Hapus semua mata_kuliah lama

  console.log("Data lama berhasil dibersihkan.");

  // 1. Seed mata_kuliah
  const mataKuliahData = [
    { judul: "Seminar Progres 1 dan 2", semester: 1 },
    { judul: "Seminar Proposal Disertasi", semester: 1 },
    { judul: "Seminar Progres 3 dan 4", semester: 2 },
    { judul: "Presentasi Makalah di Seminar Internasional", semester: 2 },
    { judul: "Seminar Progres 5", semester: 3 },
    { judul: "Publikasi Scopus 1", semester: 3 },
    { judul: "Seminar Progres 6", semester: 4 },
    { judul: "Publikasi Scopus 2", semester: 4 },
    { judul: "Presentasi Makalah di Seminar Internasional 2", semester: 4 },
    { judul: "Publikasi Scopus 3", semester: 5 },
    { judul: "Seminar Hasil Penelitian Disertasi", semester: 5 },
    { judul: "Ujian Tutup Disertasi", semester: 6 },
    { judul: "Ujian Terbuka Disertasi", semester: 6 },
    { judul: "Seminar Topik", semester: 6 },
  ];

  const mataKuliahMap = new Map(); // Tetap berguna jika nanti ada logika yang butuh ID
  for (const mk of mataKuliahData) {
    const createdMk = await prisma.mata_kuliah.upsert({
      where: { judul: mk.judul },
      update: { semester: mk.semester },
      create: {
        judul: mk.judul,
        semester: mk.semester,
      },
    });
    mataKuliahMap.set(mk.judul, createdMk.id);
    console.log(`Seeded Mata Kuliah: ${mk.judul} (Semester ${mk.semester})`);
  }

  // 2. Buat admin
  const admin = await prisma.pengguna.create({
    data: {
      nama: "Administrator",
      username: "admin",
      password: hashSync("admin123", 10), // Kata sandi default
      peran: "ADMIN",
      avatar: null, // Atur ke null atau path default jika tidak menggunakan faker
    },
  });
  console.log(`Seeded Admin: ${admin.nama} (username: ${admin.username})`);

  // --- Bagian di bawah ini telah dihapus atau dikomentari sesuai permintaan ---
  // Kode untuk membuat dosen telah dihapus
  // Kode untuk membuat mahasiswa telah dihapus
  // Kode untuk membuat kegiatan default untuk mahasiswa telah dihapus

  console.log("\nProses seeding berhasil:");
  console.log(`- 1 admin (username: ${admin.username}, password: admin123)`);
  console.log(`- ${mataKuliahData.length} mata kuliah telah ditambahkan.`);
  console.log("Database telah diisi dengan data dasar.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Koneksi database terputus.");
  })
  .catch(async (e) => {
    console.error("Terjadi kesalahan saat proses seeding:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
