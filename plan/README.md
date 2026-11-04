# plan/ — การ์ดงานสำหรับทีมพัฒนา

`plan/` เก็บแผนการ์ดงานที่ SA เขียนให้ dev ใช้โครงแบบ Journey-first: การ์ดหนึ่งใบต่อหนึ่งหน้าจอ จัดเป็น Journey และตรวจ gate ก่อนขึ้น Sprint ทุกการ์ดสร้างจากไฟล์ย่อยใน [`design/`](../design) ซึ่งเป็นแหล่งจริงของ requirement, กระบวนการ, ข้อมูล, API, หน้าจอ และกรณีทดสอบ

## สถานะ

การ์ดทั้ง 13 ใบเป็น `draft` ที่ AI ร่างจาก `design/` ยังไม่ผ่านการตรวจรับของทีม ผล gate ของทุก Journey จึงเป็น `REFINING` ไม่ใช่ `READY FOR SPRINT` story point เป็นค่าตั้งต้นที่ต้องปรับเทียบกับความเร็วจริงของทีม

## โครงสร้าง

```text
plan/
├── README.md              (ไฟล์นี้ เขียนด้วยมือ)
├── CARD-SLICING.md        สร้างอัตโนมัติ: หนึ่งแถวต่อการ์ด พร้อมเหตุผลการตัด
├── JOURNEY-SPRINT.md      สร้างอัตโนมัติ: Journey × Phase × การ์ด × Sprint และผล gate
├── backlog.csv            สร้างอัตโนมัติ: backlog สำหรับนำเข้าเครื่องมือจัดการงาน
└── cards/
    └── prc-NN-{outcome}.md   การ์ดหน้าจอ 10 ใบ และ prc-sN-{outcome}.md การ์ดสนับสนุน 3 ใบ
```

ไฟล์ที่สร้างอัตโนมัติห้ามแก้ด้วยมือ แก้ที่การ์ดต้นทางแล้วสร้างใหม่ ตารางใน `cards/` ระหว่างเครื่องหมาย `<!-- generated:... -->` (Acceptance Criteria, Source Refs, Touchpoints) เติมจากรหัสในหัวไฟล์ ห้ามเขียนพาธซ้ำด้วยมือ

## Journey และ Sprint

| Journey | เนื้อหา | Sprint |
|---|---|---|
| JNY-01 | ขอซื้อและอนุมัติ (พร้อมการ์ดสนับสนุน 3 ใบที่ทุก Journey ใช้) | 1 |
| JNY-02 | จัดหาและเลือกผู้ชนะ (ทะเบียนผู้ขาย, RFQ, เปรียบเทียบราคา) | 2 |
| JNY-03 | สั่งซื้อและรับของ | 3 |
| JNY-04 | รายงานและตรวจสอบ | 4 |

## เนื้อหาของการ์ด

หัวไฟล์: `code`, `module`, `card_type`, `journey`, `journey_phase`, `screen_ref`, `supports_journeys`, `status`, `sprint`, `priority`, `estimate`, `depends_on`, `acceptance_refs`, `source_refs`, `owned_touchpoints`, `consumed_touchpoints`, `tables`, `slicing_reason`

เนื้อหา: Value, Scope, Acceptance Criteria, Dependency / Assumption, Out of Scope, Source Refs, Implementation Touchpoints, Change History

## กติกาที่ตรวจ

- ทุกหน้าจอมีการ์ดเจ้าของใบเดียว ทุก API operation มีเจ้าของการ์ดใบเดียว
- การ์ดหน้าจอครอบคลุม API operation ของหน้าจอนั้นพอดี (ที่ใช้ร่วมระบุเป็น `consumed_touchpoints`)
- การ์ดไม่ขึ้นกับการ์ดที่วางไว้ใน Sprint หลังกว่า และ dependency ไม่วนรอบ
- การ์ดหน้าจอของ Journey เดียวกันจบใน Sprint เดียว
- ทุกกรณีทดสอบเป็นเกณฑ์ตรวจรับของการ์ดอย่างน้อยหนึ่งใบ และทุกข้อกำหนดเชิงหน้าที่อยู่ในการ์ดอย่างน้อยหนึ่งใบ
