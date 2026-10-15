# HR Management API Document

> สถานะ: **API contract สำหรับโจทย์ HR Management**  
> เอกสารนี้เป็นแบบออกแบบ เนื่องจากใน workspace ไม่มีเอกสารโจทย์, database schema หรือ backend implementation เดิมให้ตรวจสอบ ณ วันที่จัดทำ จึงยังไม่ใช่หลักฐานว่า endpoint ใดถูก implement แล้ว

## 1. ขอบเขตระบบ

ระบบจัดการบุคลากรประกอบด้วยการเข้าสู่ระบบ, ข้อมูลพนักงาน, แผนก, การลงเวลา และคำขอลางาน

### บทบาทผู้ใช้

| Role | สิทธิ์หลัก |
| --- | --- |
| `admin` | จัดการบัญชีพนักงาน, แผนก, ดูข้อมูลและคำขอลาทุกคน |
| `manager` | ดูทีมในแผนกของตน และอนุมัติ/ปฏิเสธคำลาของผู้ใต้บังคับบัญชา |
| `employee` | ดู/แก้ไขโปรไฟล์ที่อนุญาต, ลงเวลา และจัดการคำลาของตน |

> ต้องยืนยันจากโจทย์: ความสัมพันธ์ manager กับ employee, ประเภทการลา, วันหยุดบริษัท, OT และ payroll ไม่ได้ถูกกำหนดใน workspace จึงไม่รวมเป็น endpoint หลักในเวอร์ชันนี้

## 2. การเชื่อมต่อ

- Base URL: `http://<host>:<PORT>` (ค่าเริ่มต้นเสนอเป็น `3000`)
- Content type: `application/json`
- Protected route ใช้ header: `Authorization: Bearer <JWT_TOKEN>`
- ค่าที่เป็นวันที่ส่งรูปแบบ ISO 8601 เช่น `2026-10-15` หรือ `2026-10-15T08:30:00.000Z`

### รูปแบบ response มาตรฐาน

```json
{
  "success": true,
  "message": "Optional description",
  "data": {}
}
```

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "field_name": "Reason for validation failure"
  }
}
```

สถานะที่ใช้: `200` สำเร็จ, `201` สร้างสำเร็จ, `400` ข้อมูลไม่ถูกต้อง, `401` ไม่ได้ยืนยันตัวตน, `403` ไม่มีสิทธิ์, `404` ไม่พบข้อมูล, `409` ข้อมูลซ้ำ, `500` ข้อผิดพลาดภายในระบบ

## 3. Authentication — `/api/auth`

| Method | Endpoint | Access | คำอธิบาย |
| --- | --- | --- | --- |
| `POST` | `/login` | Public | เข้าสู่ระบบด้วยอีเมลและรหัสผ่าน |
| `GET` | `/me` | ทุก role | ดึงข้อมูลผู้ใช้ปัจจุบัน |
| `PUT` | `/change-password` | ทุก role | เปลี่ยนรหัสผ่านของตนเอง |

### `POST /api/auth/login`

```json
{
  "email": "somchai@company.com",
  "password": "example-password"
}
```

Response `200`:

```json
{
  "success": true,
  "data": {
    "token": "<JWT_TOKEN>",
    "user": {
      "employee_id": "EMP-0001",
      "email": "somchai@company.com",
      "role": "employee"
    }
  }
}
```

## 4. Departments — `/api/departments`

| Method | Endpoint | Access | คำอธิบาย |
| --- | --- | --- | --- |
| `GET` | `/` | authenticated | รายการแผนก |
| `POST` | `/` | admin | สร้างแผนก |
| `PUT` | `/:departmentId` | admin | แก้ไขแผนก |
| `DELETE` | `/:departmentId` | admin | ลบแผนกเมื่อไม่มีพนักงานสังกัด |

Body สำหรับสร้าง/แก้ไข:

```json
{
  "name": "Human Resources",
  "code": "HR",
  "manager_employee_id": "EMP-0001"
}
```

ฟิลด์ `name` และ `code` ต้องไม่ซ้ำกัน; `manager_employee_id` เป็น optional และต้องอ้างถึงพนักงานที่มีอยู่

## 5. Employees — `/api/employees`

| Method | Endpoint | Access | คำอธิบาย |
| --- | --- | --- | --- |
| `GET` | `/` | admin, manager | รายชื่อพนักงาน; manager เห็นเฉพาะแผนกของตน |
| `GET` | `/salary-clusters` | Public / All | วิเคราะห์กลุ่มเงินเดือนด้วย 1D K-Means (k=3) |
| `POST` | `/` | admin | สร้างบัญชีและโปรไฟล์พนักงาน |
| `GET` | `/:employeeId` | admin, manager, owner | รายละเอียดพนักงาน |
| `PUT` | `/:employeeId` | admin, owner (เฉพาะฟิลด์ส่วนตัว) | แก้ไขข้อมูล |
| `PATCH` | `/:employeeId/status` | admin | เปลี่ยนสถานะ `active`/`inactive` |

### `GET /api/employees/salary-clusters`
วิเคราะห์จัดกลุ่มโครงสร้างฐานเงินเดือนของพนักงาน active ด้วยอัลกอริทึม 1D K-Means ($k=3$) เรียงจากน้อยไปมาก

Response `200`:
```json
{
  "success": true,
  "clusters": [
    { "group": "Tier 1", "centroid": 20250.00, "count": 2 },
    { "group": "Tier 2", "centroid": 51666.67, "count": 3 },
    { "group": "Tier 3", "centroid": 87500.00, "count": 2 }
  ]
}
```

Query ของ `GET /api/employees`: `page` (default `1`), `limit` (default `10`), `search`, `department_id`, `status`.

Body สำหรับ `POST /api/employees`:

```json
{
  "first_name": "Somchai",
  "last_name": "Jaidee",
  "email": "somchai@company.com",
  "password": "temporary-password",
  "phone": "0812345678",
  "department_id": "DEP-0001",
  "position": "HR Officer",
  "role": "employee",
  "start_date": "2026-10-15"
}
```

`email` ต้องไม่ซ้ำ, รหัสผ่านต้องถูก hash ก่อนจัดเก็บ และ response ห้ามส่ง `password` หรือ password hash กลับมา

## 6. Attendance — `/api/attendance`

| Method | Endpoint | Access | คำอธิบาย |
| --- | --- | --- | --- |
| `POST` | `/check-in` | employee, manager, admin | บันทึกเวลาเข้างานของตน |
| `POST` | `/check-out` | employee, manager, admin | บันทึกเวลาออกงานของตน |
| `GET` | `/me` | ทุก role | ประวัติลงเวลาของตน |
| `GET` | `/` | admin, manager | ประวัติพนักงาน; manager จำกัดเฉพาะทีม |

Body สำหรับ `check-in` และ `check-out` (เวลาอาจให้ server เป็นผู้บันทึก):

```json
{
  "recorded_at": "2026-10-15T01:30:00.000Z"
}
```

กติกาที่เสนอ: หนึ่งคนมี check-in ที่ยังไม่ check-out ได้เพียงหนึ่งรายการ และ check-out ต้องเกิดหลัง check-in. ต้องยืนยันว่าโจทย์อนุญาตให้แก้ไขเวลา, แนบพิกัด หรือแนบหลักฐานหรือไม่

## 7. Leave Requests — `/api/leave-requests`

| Method | Endpoint | Access | คำอธิบาย |
| --- | --- | --- | --- |
| `GET` | `/me` | ทุก role | คำลาของตน |
| `POST` | `/` | employee, manager, admin | สร้างคำลา |
| `GET` | `/` | admin, manager | รายการคำลา; manager เห็นทีมของตน |
| `GET` | `/:leaveId` | admin, manager, owner | รายละเอียดคำลา |
| `PUT` | `/:leaveId` | owner | แก้ไขเมื่อสถานะเป็น `pending` |
| `PATCH` | `/:leaveId/cancel` | owner | ยกเลิกเมื่อสถานะเป็น `pending` |
| `PATCH` | `/:leaveId/decision` | admin, manager | อนุมัติหรือปฏิเสธ |

Body สำหรับสร้างหรือแก้ไข:

```json
{
  "leave_type": "annual",
  "start_date": "2026-10-20",
  "end_date": "2026-10-21",
  "reason": "Personal leave"
}
```

Body สำหรับตัดสินคำขอ:

```json
{
  "status": "approved",
  "comment": "Approved"
}
```

สถานะคำลา: `pending`, `approved`, `rejected`, `cancelled`. ระบบต้องไม่อนุญาตช่วงวันลาที่ทับซ้อนกันสำหรับพนักงานคนเดิม และผู้อนุมัติต้องไม่อนุมัติคำขอของตนเอง เว้นแต่โจทย์กำหนดไว้เป็นอย่างอื่น

## 8. Health check

| Method | Endpoint | Access | Response |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | `{ "status": "UP", "timestamp": "<ISO datetime>" }` |

## 9. Project structure

โครงสร้างนี้ตั้งใจให้สอดคล้องกับ `D:\part-time\web-api-express`: แยก route, controller, service, config, database และ utility ออกจากกัน

```text
backend/
├── config/
│   └── db.js
├── controllers/
│   ├── auth_controller.js
│   ├── department_controller.js
│   ├── employee_controller.js
│   ├── attendance_controller.js
│   └── leave_request_controller.js
├── database/
│   └── hr_management.sql
├── docs/
│   └── hr-management.md
├── routes/
│   ├── index.js
│   ├── auth.js
│   ├── departments.js
│   ├── employees.js
│   ├── attendance.js
│   ├── leave_requests.js
│   └── health.js
├── services/
│   ├── auth_service.js
│   ├── department_service.js
│   ├── employee_service.js
│   ├── attendance_service.js
│   └── leave_request_service.js
├── uploads/
├── utils/
│   ├── auth_middleware.js
│   ├── role_middleware.js
│   └── generate_id.js
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

### หน้าที่ของแต่ละชั้น

- `routes`: ระบุ HTTP method, URL และ middleware แล้วส่งต่อไป controller
- `controllers`: รับ request, validate รูปแบบข้อมูลระดับ HTTP และกำหนด response/status code
- `services`: business rules และการเรียกฐานข้อมูลผ่าน `config/db.js`
- `utils`: JWT authentication, authorization ตาม role และ helper ที่ใช้ร่วมกัน
- `database`: DDL/seed สำหรับ MySQL ซึ่งต้องออกแบบหลังยืนยัน field และความสัมพันธ์จากโจทย์

## 10. สิ่งที่ต้องยืนยันก่อนเริ่ม implement

1. ระบบต้องมี payroll, OT, วันหยุดบริษัท, เอกสารแนบ หรือการอัปโหลดรูปหรือไม่
2. manager ดูแลพนักงานด้วย `department_id` เท่านั้น หรือมี reporting line รายบุคคล
3. leave type, quota, half-day, วันลาซ้อนวันหยุด และเงื่อนไขการอนุมัติ
4. ใช้ MySQL และ JWT ตาม project ตัวอย่างได้หรือไม่ รวมถึงชื่อ table/primary key ที่โจทย์กำหนด
5. สิทธิ์ของ `admin`, `manager`, `employee` ที่เป็นข้อกำหนดจริงของโจทย์
