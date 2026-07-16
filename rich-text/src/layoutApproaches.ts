export interface LayoutApproach {
  id: string
  number: number
  label: string
  title: string
  summary: string
  difference: string
  problem: string
  benefits: string[]
  limitations: string[]
  implementation: string[]
}

export const layoutApproaches: LayoutApproach[] = [
  {
    id: 'approach-document-model', number: 1, label: 'Document Model',
    title: 'Document Model เป็นศูนย์กลาง',
    summary: 'เก็บเนื้อหาและคุณสมบัติเอกสารเป็น structured data ก่อนนำไปจัดหน้าและส่งออก',
    difference: 'Home ใช้ HTML จาก TipTap เป็นข้อมูลหลัก แต่วิธีนี้เน้น model ที่ไม่ผูกกับ Browser DOM',
    problem: 'ลดความต่างระหว่าง HTML, DOCX และ PDF ที่ตีความโครงสร้างไม่เหมือนกัน',
    benefits: ['ข้อมูลต้นทางเดียว', 'ตรวจสอบและทำ versioning ง่าย', 'รองรับ renderer หลายชนิด'],
    limitations: ['ต้องสร้าง schema และ converter', 'ต้อง migrate HTML เดิม'],
    implementation: ['นิยาม document schema', 'แปลง TipTap JSON เป็น model', 'ส่ง model เข้า layout/export adapter'],
  },
  {
    id: 'approach-enter-shift-enter', number: 2, label: 'Enter / Shift+Enter',
    title: 'แยก Paragraph และ Line Break',
    summary: 'กำหนด Enter ให้สร้าง paragraph และ Shift+Enter ให้สร้าง hard break อย่างชัดเจน',
    difference: 'Home ใช้ behavior มาตรฐานของ TipTap วิธีนี้เพิ่ม contract และจุดตรวจสำหรับ keyboard semantics',
    problem: 'แก้บรรทัดว่างและระยะย่อหน้าที่ผิดเมื่อ Export',
    benefits: ['พฤติกรรมคาดเดาได้', 'HTML semantic ถูกต้อง', 'ทดสอบ keyboard ได้ตรงจุด'],
    limitations: ['ไฟล์ import อาจมีโครงสร้างต่างกัน'],
    implementation: ['Enter -> paragraph', 'Shift+Enter -> hardBreak', 'ตรวจ output p/br ก่อน Export'],
  },
  {
    id: 'approach-paragraph', number: 3, label: 'Paragraph over BR',
    title: 'ใช้ Paragraph แทน BR ซ้ำ',
    summary: 'ทุกย่อหน้าเป็น block ที่มี spacing ของตัวเอง ไม่ใช้ br สองตัวจำลองย่อหน้า',
    difference: 'Home รองรับ HTML หลายรูปแบบ วิธีนี้ normalize ให้ paragraph เป็นหน่วยหลักเพียงแบบเดียว',
    problem: 'ลด spacing ที่เปลี่ยนไปตาม HTML importer',
    benefits: ['วัดความสูงได้', 'กำหนด spacing ได้', 'รองรับ page break ราย block'],
    limitations: ['ต้อง normalize เอกสารเก่า'],
    implementation: ['ตรวจ p/div/br', 'รวม br ซ้ำเป็น paragraph', 'รักษา hard break ภายใน paragraph'],
  },
  {
    id: 'approach-spacing', number: 4, label: 'Paragraph Spacing',
    title: 'Paragraph Spacing ใน Model',
    summary: 'เก็บ spacingBefore, spacingAfter และ lineHeight เป็นค่าของแต่ละ paragraph',
    difference: 'Home พึ่ง CSS ส่วนกลาง วิธีนี้ให้แต่ละ paragraph มีค่าที่ export adapter อ่านได้โดยตรง',
    problem: 'แก้ระยะย่อหน้าที่ Browser และ LibreOffice คำนวณต่างกัน',
    benefits: ['ควบคุมละเอียด', 'รองรับ DOCX properties', 'วัด layout ซ้ำได้'],
    limitations: ['UI formatting ซับซ้อนขึ้น'],
    implementation: ['เพิ่ม paragraph attributes', 'render เป็น CSS/pt', 'map เข้า DOCX paragraph properties'],
  },
  {
    id: 'approach-virtual-a4', number: 5, label: 'Virtual A4',
    title: 'Virtual A4 Sheets',
    summary: 'แสดงกระดาษ 210 x 297 มม. พร้อม margin และเลขหน้าใน Browser',
    difference: 'Home คือ editor หลัก วิธีนี้เน้น instrumentation ของขอบกระดาษและพื้นที่พิมพ์',
    problem: 'ทำให้ผู้ใช้เห็นพื้นที่จริงก่อนกด Export',
    benefits: ['เห็นจำนวนหน้า', 'เห็น margin', 'เข้าใจ page boundary'],
    limitations: ['ยังต้องมี pagination engine เพื่อย้ายเนื้อหา'],
    implementation: ['สร้าง A4 sheet', 'วาด margin area', 'แสดง current/total pages'],
  },
  {
    id: 'approach-pagination', number: 6, label: 'Pagination Engine',
    title: 'Pagination Engine',
    summary: 'สะสมความสูงของ block และย้าย block ที่ล้นไปหน้า A4 ถัดไป',
    difference: 'Home ใช้ paginator ที่รวมอยู่ใน Editor วิธีนี้แสดงขั้นตอนและ page-break marker โดยเฉพาะ',
    problem: 'ทำให้ Browser และ Export แบ่งหน้าที่ block เดียวกัน',
    benefits: ['จุดแบ่งหน้าชัดเจน', 'ส่ง marker ไป Export ได้', 'คำนวณซ้ำเมื่อแก้ข้อความ'],
    limitations: ['block ยาวเกินหน้าอาจต้องแบ่งระดับบรรทัด'],
    implementation: ['วัด block', 'เทียบ content bottom', 'ใส่ data-page-break-before'],
  },
  {
    id: 'approach-dom-measurement', number: 7, label: 'DOM Measurement',
    title: 'วัดความสูงจาก DOM จริง',
    summary: 'ใช้ getBoundingClientRect และ ResizeObserver วัดผลหลัง Browser จัด layout แล้ว',
    difference: 'Home ซ่อนรายละเอียดการวัด วิธีนี้เน้นค่าความสูงจริงและรอบ reflow',
    problem: 'รองรับรูป ตาราง และ font ที่คำนวณความสูงล่วงหน้าได้ยาก',
    benefits: ['ตรงกับสิ่งที่ Browser render', 'รองรับ content หลายชนิด'],
    limitations: ['ขึ้นกับ Browser', 'ต้องป้องกัน reflow loop'],
    implementation: ['observe content', 'measure top-level blocks', 'schedule ผ่าน requestAnimationFrame'],
  },
  {
    id: 'approach-font-measurement', number: 8, label: 'Font Measurement',
    title: 'Canvas Font Measurement',
    summary: 'ใช้ Canvas measureText ประเมินความกว้างข้อความและตำแหน่งตัดบรรทัด',
    difference: 'Home รอ DOM layout วิธีนี้สามารถประเมิน line wrapping ก่อน render',
    problem: 'ช่วยสร้าง layout engine ที่ไม่พึ่ง DOM ทั้งหมด',
    benefits: ['เร็วสำหรับข้อความจำนวนมาก', 'ใช้ใน worker ได้บางส่วน'],
    limitations: ['ต้องจัดการภาษาไทยและ shaping', 'ตาราง/รูปยังต้องวัดแยก'],
    implementation: ['โหลด font ให้พร้อม', 'ตั้ง canvas font', 'วัด token และประกอบ line'],
  },
  {
    id: 'approach-shared-font', number: 9, label: 'Shared Font',
    title: 'ใช้ Font File เดียวกัน',
    summary: 'Browser และ conversion backend ใช้ไฟล์ font family/version เดียวกัน',
    difference: 'Home มี font fallback หลายตัว วิธีนี้ตรวจและล็อก font สำหรับเอกสารที่ต้องการ parity',
    problem: 'ลด glyph width และ line wrapping ที่ต่างกัน',
    benefits: ['ความกว้างข้อความตรงกัน', 'ภาษาไทยไม่เพี้ยน'],
    limitations: ['ต้องติดตั้งหรือ embed font ใน backend'],
    implementation: ['bundle font', 'รอ document.fonts.ready', 'ติดตั้ง font ให้ LibreOffice'],
  },
  {
    id: 'approach-fixed-a4', number: 10, label: 'Fixed A4 Width',
    title: 'จำกัดพื้นที่แก้ไขตาม A4',
    summary: 'ล็อกความกว้าง 210 มม. และหัก margin เพื่อให้ line wrapping ตรงกับกระดาษ',
    difference: 'Home responsive ตามพื้นที่แอป วิธีนี้ยืนยัน physical width ไม่ให้ editor ยืดตาม viewport',
    problem: 'ป้องกันจำนวนบรรทัดเปลี่ยนเมื่อ Export',
    benefits: ['line wrapping เสถียร', 'วัดหน้าได้ง่าย'],
    limitations: ['หน้าจอเล็กต้อง scroll/zoom'],
    implementation: ['width 210mm', 'box-sizing border-box', 'ใช้ margin จาก page settings'],
  },
  {
    id: 'approach-shared-export', number: 11, label: 'Shared Export Layout',
    title: 'Export จาก Layout เดียวกัน',
    summary: 'ส่ง typography, margins และ page-break markers จาก Browser ไป Export โดยไม่คำนวณใหม่',
    difference: 'Home เรียก export utility วิธีนี้แสดง shared contract และข้อมูลที่ถูกส่งอย่างชัดเจน',
    problem: 'ลดการตัดสินใจซ้ำระหว่าง frontend และ backend',
    benefits: ['จุดแบ่งหน้าตรงกัน', 'debug ง่าย', 'ใช้กับ DOCX/PDF ร่วมกัน'],
    limitations: ['LibreOffice ยังต้องมี compatibility adapter'],
    implementation: ['clone editor HTML', 'เก็บ break markers', 'build export HTML ชุดเดียว'],
  },
  {
    id: 'approach-css-print', number: 12, label: 'CSS Print',
    title: 'CSS Paged Media',
    summary: 'ใช้ @page, break-before และ break-inside กำหนดพฤติกรรมตอนพิมพ์',
    difference: 'Home เน้น screen editor วิธีนี้แสดงกฎเฉพาะ print/export',
    problem: 'ควบคุมขนาดกระดาษ margin และ block ที่ไม่ควรถูกตัด',
    benefits: ['มาตรฐาน CSS', 'กฎอ่านง่าย', 'ใช้กับ HTML-to-PDF ได้'],
    limitations: ['engine แต่ละตัวรองรับไม่เท่ากัน'],
    implementation: ['กำหนด @page A4', 'ใส่ forced break', 'ป้องกัน table/image split'],
  },
  {
    id: 'approach-layout-engine', number: 13, label: 'Layout Engine',
    title: 'Complete Layout Engine',
    summary: 'รวม line breaking, paragraph, pagination, font metrics และ page numbering',
    difference: 'Home กระจาย logic ใน editor/export วิธีนี้มองเป็น pipeline กลางที่ทดสอบแยกได้',
    problem: 'สร้าง WYSIWYG ที่ deterministic ระหว่าง renderer',
    benefits: ['ควบคุมครบ', 'สร้าง snapshot test ได้', 'รองรับ renderer ใหม่'],
    limitations: ['ใช้เวลาพัฒนาสูง', 'ต้องจัดการ typography ซับซ้อน'],
    implementation: ['parse model', 'measure lines/blocks', 'compose pages', 'render outputs'],
  },
  {
    id: 'approach-relayout-enter', number: 14, label: 'Re-layout on Enter',
    title: 'Re-layout ทุกครั้งที่เอกสารเปลี่ยน',
    summary: 'เมื่อ Enter หรือแก้เนื้อหา ให้ measure, paginate และ update page number ใหม่',
    difference: 'Home ทำงานนี้ภายใน effect วิธีนี้แสดง event pipeline และจังหวะ scheduling',
    problem: 'ให้ page preview ตอบสนองทันทีและไม่ค้างข้อมูลเก่า',
    benefits: ['preview สด', 'เลขหน้าอัปเดตทันที'],
    limitations: ['ต้อง debounce เอกสารขนาดใหญ่'],
    implementation: ['listen editor update', 'requestAnimationFrame', 'measure -> paginate -> number'],
  },
  {
    id: 'approach-checklist', number: 15, label: 'WYSIWYG Checklist',
    title: 'Release Checklist',
    summary: 'ตรวจ Font, Paragraph, Line Height, Table, Image, Margin, Page Break และ Header/Footer',
    difference: 'Home เป็นเครื่องมือแก้เอกสาร วิธีนี้เป็น quality gate ก่อน commit/release',
    problem: 'ป้องกัน regression ที่ build ผ่านแต่ layout เปลี่ยน',
    benefits: ['ตรวจซ้ำได้', 'สื่อสารเกณฑ์สำเร็จชัดเจน'],
    limitations: ['บางรายการยังต้อง visual review'],
    implementation: ['สร้าง fixture กลาง', 'export DOCX/PDF', 'เทียบหน้าและบันทึกผล'],
  },
]

export function getLayoutApproach(id: string): LayoutApproach | undefined {
  return layoutApproaches.find((approach) => approach.id === id)
}
