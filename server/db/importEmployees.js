import db from "./database.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawData = `
1	KRY-001	CEPI	Internal	Penjahit
2	KRY-002	ASEP	Internal	Penjahit
3	KRY-003	ROBI	Internal	Penjahit
4	KRY-004	HADI	Internal	Penjahit
5	KRY-005	SUGIONO	Internal	Penjahit
6	KRY-006	MUSLIHIN	Internal	Penjahit
7	KRY-007	ABDUL ROHIM	Internal	Penjahit
8	KRY-008	AZIZ	Internal	Penjahit
9	KRY-009	MUHLISIN	Internal	Penjahit
10	KRY-010	ARIF	Internal	Penjahit
11	KRY-011	YANTO	Internal	Penjahit
12	KRY-012	WAWAN	Internal	Penjahit
13	KRY-013	AIP	Internal	Penjahit
14	KRY-014	IRWAN	Internal	Penjahit
15	KRY-015	RIDWAN	Internal	Penjahit
16	KRY-016	FALAH	Internal	Penjahit
17	KRY-017	DANI	Internal	Penjahit
18	KRY-018	RIKI	Internal	Penjahit
19	KRY-019	MAMAN	Internal	Penjahit
20	MKL-020	WARDIANTO	Makloon	Penjahit
21	MKL-021	PARMAN	Makloon	Penjahit
22	MKL-022	IHSAN	Makloon	Penjahit
23	MKL-023	YAYAT	Makloon	Penjahit
24	MKL-024	NANANG	Makloon	Penjahit
25	MKL-025	FADIL	Makloon	Penjahit
26	MKL-026	ENDI	Makloon	Penjahit
27	MKL-027	ELAN MANGKUBUMI	Makloon	Penjahit
28	MKL-028	AOS	Makloon	Penjahit
29	MKL-029	HENDRIK	Makloon	Penjahit
30	MKL-030	ALI	Makloon	Penjahit
31	MKL-031	HANI	Makloon	Penjahit
32	MKL-032	IRWAN MAKLOON	Makloon	Penjahit
33	MKL-033	AAM	Makloon	Penjahit
34	KRY-034	HARUN	Internal	Penjahit
`;

const lines = rawData.trim().split("\n").map(l => l.trim()).filter(Boolean);

const parsedEmployees = [];

for (const line of lines) {
  const parts = line.split("\t");
  if (parts.length < 5) continue;
  const no = parts[0].trim();
  const nik = parts[1].trim();
  const nama = parts[2].trim();
  const kategori = parts[3].trim();
  const bagian = parts[4].trim();

  parsedEmployees.push({
    id: parseInt(no, 10),
    nik,
    nama,
    kategori,
    bagian,
    status: "Aktif",
    telepon: null,
    tanggalMasuk: new Date().toISOString().slice(0, 10)
  });
}

console.log(`Parsed ${parsedEmployees.length} employees.`);

// 1. UPDATE SQLITE DATABASE
db.exec("BEGIN");
try {
  db.exec("DELETE FROM employees;");

  const insertEmp = db.prepare(`
    INSERT INTO employees (id, nik, nama, kategori, bagian, status, telepon, tanggal_masuk)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const e of parsedEmployees) {
    insertEmp.run(
      e.id,
      e.nik,
      e.nama,
      e.kategori,
      e.bagian,
      e.status,
      e.telepon,
      e.tanggalMasuk
    );
  }

  db.exec("COMMIT");
  console.log("✅ Successfully committed employees to SQLite konveksi.db!");
} catch (err) {
  db.exec("ROLLBACK");
  console.error("❌ Transaction failed:", err);
  process.exit(1);
}

// 2. UPDATE initialData.js
const initialDataPath = path.resolve(__dirname, "initialData.js");
let initialContent = fs.readFileSync(initialDataPath, "utf8");

const newInitialEmployeesStr = `export const initialEmployees = ${JSON.stringify(parsedEmployees, null, 2)};\n`;
initialContent = initialContent.replace(/export const initialEmployees = \[[\s\S]*?\];/m, newInitialEmployeesStr.trim());
fs.writeFileSync(initialDataPath, initialContent, "utf8");
console.log("✅ Successfully updated server/db/initialData.js!");

