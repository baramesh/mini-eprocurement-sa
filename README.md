# Mini e-Procurement: ชุดเอกสารออกแบบระบบ (SA)

โจทย์สมมติ **ระบบจัดซื้อจัดจ้างขนาดย่อ** (ใบขอซื้อ → อนุมัติหลายขั้น → ขอใบเสนอราคา → เปรียบเทียบ → ใบสั่งซื้อ → รับของ) ทำเพื่อแสดงงานของนักวิเคราะห์ระบบที่ใช้ AI เป็นเครื่องมือหลัก ไม่ใช่ระบบหรือข้อมูลของหน่วยงานใด เกณฑ์วงเงินทั้งหมดเป็นค่าสมมติ

ผลงานคือเอกสารและหลักฐาน ไม่มีโค้ดแอปพลิเคชัน

## ผลที่ได้

| ชิ้นงาน | เนื้อหา | ไฟล์ |
|---|---|---|
| Requirements | FR 14, กฎธุรกิจ 12, NFR 6, สมมติฐานและขอบเขต | [docs/01-requirements.md](docs/01-requirements.md) |
| กระบวนการและ Use Case | ผังกระบวนการ 2 ผัง, สถานะเอกสาร, UC 10 รายการ, sequence diagram | [docs/02-process-and-usecases.md](docs/02-process-and-usecases.md) |
| ข้อมูล | ER diagram, ตาราง 17 ตาราง 106 คอลัมน์ (T-SQL), การตัดสินใจออกแบบ, พจนานุกรมข้อมูล | [docs/03-data-model.md](docs/03-data-model.md), [sql/schema.sql](sql/schema.sql), [docs/03a-data-dictionary.md](docs/03a-data-dictionary.md) |
| API | OpenAPI 3.0.3 จำนวน 19 operation, รหัสข้อผิดพลาด 18 รหัส, กฎต่อ operation | [api/openapi.yaml](api/openapi.yaml), [docs/04-api-spec.md](docs/04-api-spec.md), [docs/04a-endpoint-index.md](docs/04a-endpoint-index.md) |
| หน้าจอ | หน้าจอ 10 หน้า, ผังนำทาง, ฟิลด์และกติกา | [docs/05-screen-spec.md](docs/05-screen-spec.md) |
| กรณีทดสอบ | 51 กรณี ใช้การวิเคราะห์ค่าขอบกับเกณฑ์วงเงิน | [docs/06-test-cases.md](docs/06-test-cases.md) |
| ผลทดสอบฐานข้อมูล | รัน schema และทดสอบ constraint, สิทธิ์ audit, ออกเลข 1,000 เลขพร้อมกัน บน SQL Server 2022 จริง | [tests/db/RESULTS.md](tests/db/RESULTS.md), [sql/tests.sql](sql/tests.sql) |
| เมทริกซ์การสืบกลับ | FR → UC → หน้าจอ → API → กรณีทดสอบ (สร้างอัตโนมัติ) | [docs/07-traceability-matrix.md](docs/07-traceability-matrix.md) |
| PDF ฉบับรวม | ทุกอย่างข้างบนในไฟล์เดียว | [output/mini-eprocurement-sa-design.pdf](output/mini-eprocurement-sa-design.pdf) |
| การทำงานกับ AI | ขั้นตอน บทบาทคน/AI สิ่งที่ตรวจแล้วและยังไม่ได้ตรวจ | [docs/00-ai-workflow.md](docs/00-ai-workflow.md), [output/ai-workflow.pdf](output/ai-workflow.pdf) |

## ใช้ AI ทำอะไร (สรุป)

- ร่างเอกสารทุกชุดตามลำดับ requirements → process → data → API → screen → test โดยแต่ละขั้นอ่านผลของขั้นก่อนหน้า
- เขียนและรันสคริปต์ตรวจความสอดคล้องข้ามเอกสาร ซึ่งจับช่องว่างจริงได้ (operation หนึ่งไม่มีกรณีทดสอบ)
- สร้าง PDF จาก Markdown ผ่าน pandoc และ Chrome แล้วดูภาพหน้าที่สร้างเพื่อแก้ข้อบกพร่องการจัดหน้า (ผังเล็กเกินไป หัวข้อค้างท้ายหน้า)

รายละเอียด ตัวอย่างสิ่งที่ AI ทำพลาดแล้วถูกจับได้ และขอบเขตที่ยังไม่ได้ตรวจ อยู่ใน [docs/00-ai-workflow.md](docs/00-ai-workflow.md)

## ตรวจแล้วและยังไม่ได้ตรวจ

- **ตรวจแล้ว:** รหัสที่อ้างกันระหว่างเอกสารมีอยู่จริงทั้งหมด; ทุก FR และทุก API operation มีกรณีทดสอบ; `sql/schema.sql` รันผ่านบน SQL Server 2022 และชุดทดสอบฐานข้อมูลผ่านทั้งหมด (รวมออกเลขเอกสาร 1,000 เลขพร้อมกันไม่ซ้ำ); PDF สร้างจาก Markdown ด้วยสคริปต์ภายใน
- **ยังไม่ได้ตรวจ:** กรณีทดสอบระดับ API (ยังไม่มีระบบให้รัน); ประสิทธิภาพที่ 100,000 PR; เกณฑ์วงเงินไม่ได้เทียบกับระเบียบจริง

## หมายเหตุ

ไฟล์คำสั่งประจำโปรเจกต์ของ agent ไม่ได้อยู่ใน repository นี้ (อยู่ในเครื่องผู้จัดทำ) repository แสดงงานและหลักฐาน ไม่ใช่ชุดตั้งค่าสำหรับทำงานต่อด้วย AI แบบเดียวกัน

สคริปต์ที่ใช้สร้างเอกสาร ตรวจความสอดคล้อง และรันชุดทดสอบเป็นเครื่องมือภายใน ไม่ได้เผยแพร่ใน repository นี้ ผลลัพธ์ของสคริปต์เหล่านั้นคือไฟล์ที่เห็นใน `docs/`, `output/` และ `tests/db/`
