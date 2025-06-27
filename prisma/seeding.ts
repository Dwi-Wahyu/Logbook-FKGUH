import { PrismaClient } from "@/generated/prisma";
import { faker } from "@faker-js/faker/locale/id_ID";
import { hashSync } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Hapus data existing (opsional)
  await prisma.kegiatan.deleteMany();
  await prisma.profil.deleteMany();
  await prisma.pengguna.deleteMany();
  await prisma.mata_kuliah.deleteMany();

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

  const mataKuliahMap = new Map();
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
    console.log(`Seeded: ${mk.judul} (Semester ${mk.semester})`);
  }

  // 2. Buat admin
  const admin = await prisma.pengguna.create({
    data: {
      nama: "Administrator",
      username: "admin",
      password: hashSync("admin123", 10),
      peran: "ADMIN",
      avatar: faker.image.avatar(),
    },
  });

  // 3. Buat beberapa dosen (sebagai pembimbing/ko-promotor)
  const dosenList = [];
  const jumlahDosen = 5;

  for (let i = 0; i < jumlahDosen; i++) {
    const namaDosen = faker.person.fullName();
    const nip = `19${faker.number.int({ min: 70, max: 90 })}${faker.number.int({
      min: 100000,
      max: 999999,
    })}${faker.number.int({ min: 1000, max: 9999 })}`;

    const dosen = await prisma.pengguna.create({
      data: {
        nama: namaDosen,
        username: nip,
        password: hashSync(nip, 10),
        peran: "DOSEN",
        avatar: faker.image.avatar(),
        profil: {
          create: {
            tempatTanggalLahir: `${faker.location.city()}, ${faker.date
              .birthdate()
              .toLocaleDateString()}`,
            alamat: faker.location.streetAddress(),
            email: faker.internet.email({ firstName: namaDosen.split(" ")[0] }),
            nomorTelpon: faker.phone.number(),
            pekerjaan: "Dosen",
          },
        },
      },
    });
    dosenList.push(dosen);
  }

  // 4. Buat mahasiswa dengan relasi pembimbing dan ko-promotor
  const mahasiswaList = [];
  const jumlahMahasiswa = 10;

  for (let i = 0; i < jumlahMahasiswa; i++) {
    const namaMahasiswa = faker.person.fullName();
    const randomChar = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
    const nim = `${randomChar}${faker.number.int({
      min: 100000000,
      max: 999999999,
    })}`;

    // Pilih random dosen sebagai pembimbing dan ko-promotor
    const randomPembimbing =
      dosenList[Math.floor(Math.random() * dosenList.length)];
    let randomKoPromotor = null;

    // Pastikan ko-promotor berbeda dengan pembimbing
    do {
      randomKoPromotor =
        dosenList[Math.floor(Math.random() * dosenList.length)];
    } while (
      randomKoPromotor.id === randomPembimbing.id &&
      dosenList.length > 1
    );

    const mahasiswa = await prisma.pengguna.create({
      data: {
        nama: namaMahasiswa,
        username: nim,
        password: hashSync(nim, 10),
        peran: "MAHASISWA",
        avatar: faker.image.avatar(),
        pembimbingId: randomPembimbing.id, // Diperbarui dari promotorId
        koPromotorId: randomKoPromotor?.id,
        profil: {
          create: {
            angkatan: `${faker.number.int({ min: 2018, max: 2023 })}`,
            tempatTanggalLahir: `${faker.location.city()}, ${faker.date
              .birthdate({ min: 18, max: 25, mode: "age" })
              .toLocaleDateString()}`,
            alamat: faker.location.streetAddress(),
            alamatKeluarga: faker.location.streetAddress(),
            email: faker.internet.email({
              firstName: namaMahasiswa.split(" ")[0],
            }),
            nomorTelpon: faker.phone.number(),
            mulaiMasukPendidikan: faker.date.between({
              from: "2018-09-01",
              to: "2023-09-01",
            }),
          },
        },
      },
    });
    mahasiswaList.push(mahasiswa);
  }

  // 5. Seed kegiatan for each mahasiswa
  const kegiatanData = [
    {
      mataKuliah: "Seminar Progres 1 dan 2",
      activities: [
        "Diskusi topik penelitian",
        "Penyusunan rencana penelitian",
        "Konsultasi literatur",
        "Revisi rencana penelitian",
        "Penyusunan draf awal",
        "Diskusi metodologi",
        "Konsultasi dengan pembimbing",
        "Penyusunan presentasi seminar",
        "Latihan presentasi",
        "Ujian seminar pra proposal",
      ],
    },
    {
      mataKuliah: "Seminar Proposal Disertasi",
      activities: [
        "Penyusunan draf proposal",
        "Diskusi draf proposal",
        "Revisi proposal",
        "Konsultasi dengan ko-promotor",
        "Penyusunan bab pendahuluan",
        "Penyusunan bab metodologi",
        "Konsultasi literatur proposal",
        "Penyusunan presentasi proposal",
        "Latihan presentasi proposal",
        "Ujian seminar proposal",
      ],
    },
    {
      mataKuliah: "Seminar Progres 3 dan 4",
      activities: [
        "Pengumpulan data awal",
        "Analisis data pendahuluan",
        "Konsultasi metodologi",
        "Revisi metodologi",
        "Pengumpulan data tambahan",
        "Diskusi hasil awal",
        "Penyusunan laporan progres",
        "Konsultasi dengan pembimbing",
        "Latihan presentasi progres",
        "Ujian Seminar Penelitian Pendahuluan",
      ],
    },
    {
      mataKuliah: "Presentasi Makalah di Seminar Internasional",
      activities: [
        "Membuat konsep judul yang berasal dari bagian hasil penelitian disertasi",
        "Membuat abstrak makalah yang berasal dari bagian hasil penelitian disertasi",
        "Membuat makalah yang relevan dengan topik disertasinya yang akan dipresentasikan pada seminar internasional",
        "Mempresentasikan hasil penelitian yang relevan dengan topik disertasi pada seminar internasional",
      ],
    },
    {
      mataKuliah: "Seminar Progres 5",
      activities: [
        "Pengumpulan data lanjutan",
        "Analisis data tahap kedua",
        "Konsultasi hasil awal",
        "Revisi analisis data",
        "Penyusunan laporan hasil",
        "Diskusi dengan ko-promotor",
        "Penyusunan presentasi progres",
        "Konsultasi dengan pembimbing",
        "Latihan presentasi",
        "Ujian seminar hasil penelitian",
      ],
    },
    {
      mataKuliah: "Publikasi Scopus 1",
      activities: [
        "Membuat naskah hasil penelitian yang akan dipublikasikan pada jurnal internasional bereputasi yang relevan dengan topik disertasinya",
        "Mendiskusikan naskah hasil penelitian yang akan dipublikasikan pada jurnal internasional bereputasi",
        "Mengirim naskah hasil penelitian yang akan dipublikasikan",
        "Mempublikasikan penelitian yang relevan dengan topik disertasinya",
      ],
    },
    {
      mataKuliah: "Seminar Progres 6",
      activities: [
        "Analisis data lanjutan",
        "Penyusunan laporan hasil",
        "Konsultasi analisis data",
        "Revisi laporan hasil",
        "Diskusi dengan ko-promotor",
        "Penyusunan presentasi progres",
        "Konsultasi dengan pembimbing",
        "Latihan presentasi",
        "Penyusunan laporan akhir",
        "Ujian Seminar Analisis hasil penelitian",
      ],
    },
    {
      mataKuliah: "Publikasi Scopus 2",
      activities: [
        "Membuat naskah hasil penelitian yang akan dipublikasikan pada jurnal internasional bereputasi yang relevan dengan topik disertasinya",
        "Mendiskusikan naskah hasil penelitian yang akan dipublikasikan pada jurnal internasional bereputasi",
        "Mengirim naskah hasil penelitian yang akan dipublikasikan",
        "Mempublikasikan penelitian yang relevan dengan topik disertasinya",
      ],
    },
    {
      mataKuliah: "Presentasi Makalah di Seminar Internasional 2",
      activities: [
        "Membuat konsep judul yang berasal dari bagian hasil penelitian disertasi",
        "Membuat abstrak makalah yang berasal dari bagian hasil penelitian disertasi",
        "Membuat makalah yang relevan dengan topik disertasinya yang akan dipresentasikan pada seminar internasional",
        "Mempresentasikan hasil penelitian yang relevan dengan topik disertasi pada seminar internasional",
      ],
    },
    {
      mataKuliah: "Publikasi Scopus 3",
      activities: [
        "Membuat naskah hasil penelitian yang akan dipublikasikan pada jurnal internasional bereputasi yang relevan dengan topik disertasinya",
        "Mendiskusikan naskah hasil penelitian yang akan dipublikasikan pada jurnal internasional bereputasi",
        "Mengirim naskah hasil penelitian yang akan dipublikasikan",
        "Mempublikasikan penelitian yang relevan dengan topik disertasinya",
      ],
    },
    {
      mataKuliah: "Seminar Hasil Penelitian Disertasi",
      activities: [
        "Penyusunan laporan hasil penelitian",
        "Diskusi hasil penelitian",
        "Revisi laporan hasil",
        "Konsultasi dengan pembimbing",
        "Penyusunan presentasi hasil",
        "Latihan presentasi hasil",
        "Diskusi dengan ko-promotor",
        "Revisi presentasi hasil",
        "Konsultasi akhir hasil",
        "Ujian Seminar hasil penelitian",
      ],
    },
    {
      mataKuliah: "Ujian Tutup Disertasi",
      activities: [
        "Penyusunan naskah disertasi",
        "Konsultasi naskah disertasi",
        "Revisi naskah disertasi",
        "Diskusi dengan pembimbing",
        "Penyusunan presentasi disertasi",
        "Latihan presentasi disertasi",
        "Konsultasi dengan ko-promotor",
        "Revisi presentasi disertasi",
        "Persiapan ujian tertutup",
        "Ujian Disertasi Tertutup",
      ],
    },
    {
      mataKuliah: "Ujian Terbuka Disertasi",
      activities: [
        "Persiapan presentasi terbuka",
        "Latihan presentasi disertasi",
        "Konsultasi presentasi",
        "Revisi presentasi terbuka",
        "Diskusi dengan pembimbing",
        "Penyusunan materi presentasi",
        "Konsultasi dengan ko-promotor",
        "Persiapan dokumen ujian",
        "Latihan presentasi akhir",
        "Ujian Disertasi Terbuka",
      ],
    },
    {
      mataKuliah: "Seminar Topik",
      activities: [
        "Literatur review",
        "Systematic review",
        "Meta analysis",
        "Diskusi topik seminar",
        "Penyusunan materi seminar",
        "Konsultasi topik seminar",
        "Revisi materi seminar",
        "Latihan presentasi seminar",
        "Konsultasi dengan pembimbing",
        "Presentasi topik seminar",
      ],
    },
  ];

  // 6. Assign kegiatan to each mahasiswa
  for (const mahasiswa of mahasiswaList) {
    for (const { mataKuliah, activities } of kegiatanData) {
      const mataKuliahId = mataKuliahMap.get(mataKuliah);
      if (!mataKuliahId) {
        console.error(`Mata kuliah ${mataKuliah} not found`);
        continue;
      }

      for (const judul of activities) {
        await prisma.kegiatan.create({
          data: {
            judul,
            tanggalMulai: null,
            tanggalSelesai: null,
            status: "DIAJUKAN",
            pengajuId: mahasiswa.id,
            mata_kuliahId: mataKuliahId,
          },
        });
      }
      console.log(`Seeded kegiatan for ${mahasiswa.nama} in ${mataKuliah}`);
    }
  }

  console.log("Seed data berhasil dibuat:");
  console.log(`- 1 admin (username: admin)`);
  console.log(`- ${dosenList.length} dosen`);
  console.log(`- ${mahasiswaList.length} mahasiswa`);
  console.log(`- Kegiatan seeded for all mahasiswa`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
