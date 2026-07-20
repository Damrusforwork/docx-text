import blaze01 from '../assets/picture/blaze01.png?inline'

export interface Template {
  name: string
  description: string
  html: string
}

export const templates: Record<string, Template> = {
  internalMemo: {
    name: 'หนังสือภายใน (Internal Memorandum)',
    description: 'หนังสือติดต่อภายในองค์กร',
    html: `
<img src="${blaze01}" alt="ตราสัญลักษณ์" width="80" data-text-align="center">
<p style="text-align: center; line-height: 1;"><strong><span style="font-size: 24pt;">หนังสือภายใน</span></strong></p>
<p style="text-align: center; line-height: 1;"><strong><span style="font-size: 20pt;">Internal Memorandum</span></strong></p>

<p style="text-align: right;">ส่วนราชการ: สำนักงานปลัดกระทรวง</p>
<p style="text-align: right;">ที่: กธ 001/2567</p>
<p style="text-align: right;">วันที่: 13 กรกฎาคม 2567</p>

<p>&nbsp;</p>

<p><strong>เรื่อง</strong> การประเมินผลการปฏิบัติงานประจำปีงบประมาณ พ.ศ. 2567</p>
<p><strong>เรียน</strong> ผู้อำนวยการกองบริหารงานบุคคล</p>

<p>&nbsp;</p>

<p style="text-align: justify;">
  ด้วยกองนโยบายและแผน มีความประสงค์จะขอความเห็นชอบในเรื่องการจัดทำแผนปฏิบัติงานประจำปีงบประมาณ
  พ.ศ. 2567 ซึ่งได้ดำเนินการจัดทำขึ้นตามพระราชกฤษฎีกาว่าด้วยหลักเกณฑ์และวิธีการบริหารกิจการบ้านเมืองที่ดี
  อาศัยอำนาจตามความในมาตรา ๓๓ แห่งพระราชบัญญัติระเบียบบริหารราชการแผ่นดิน พ.ศ. ๒๕๓๔
  จึงเรียนมาเพื่อโปรดพิจารณา
</p>

<p>&nbsp;</p>

<p style="text-align: center; margin-left: 50%;">ขอแสดงความนับถือ</p>

<p style="margin-left: 50%;">&nbsp;</p>
<p style="margin-left: 50%;">&nbsp;</p>
<p style="margin-left: 50%;">&nbsp;</p>
<p style="text-align: center; margin-left: 50%;">..............................</p>
<p style="text-align: center; margin-left: 50%;">(นายสมชาย ใจดี)</p>
<p style="text-align: center; margin-left: 50%;">ผู้อำนวยการกองนโยบายและแผน</p>
`,
  },

  officialLetter: {
    name: 'หนังสือประทับตรา (Official Sealed Letter)',
    description: 'หนังสือราชการภายนอกประทับตรา',
    html: `
<h1 style="text-align: center;">หนังสือราชการ</h1>

<p style="text-align: right;">ส่วนราชการ: กรมการปกครอง</p>
<p style="text-align: right;">ที่: กท 001/2567</p>
<p style="text-align: right;">วันที่ ๑๓ กรกฎาคม ๒๕๖๗</p>

<p>&nbsp;</p>

<p style="text-align: right;">สิ่งที่ส่งมาด้วย ๑ ฉบับ</p>

<p>&nbsp;</p>

<p style="text-align: center;"><strong>เรื่อง</strong> ขอให้ดำเนินการตรวจสอบข้อมูลทะเบียนราษฎร</p>

<p>&nbsp;</p>

<p style="text-align: justify;">
  อาศัยอำนาจตามความในมาตรา ๗๘ แห่งพระราชบัญญัติทะเบียนราษฎร พ.ศ. ๒๕๓๔
  อธิบดีกรมการปกครองสั่งว่า เพื่อให้การปฏิบัติงานทะเบียนราษฎรเป็นไปด้วยความเรียบร้อย
  มีความถูกต้องและเป็นปัจจุบัน จึงสั่งให้เจ้าพนักงานทะเบียนดำเนินการตรวจสอบข้อมูล
  ทะเบียนราษฎรในเขตพื้นที่รับผิดชอบ ดังนี้
</p>

<p>&nbsp;</p>

<p style="text-align: justify;">
  ๑. ตรวจสอบรายการข้อมูลในทะเบียนบ้าน ว่ามีรายการใดที่ยังไม่ถูกต้องหรือยังไม่เป็นปัจจุบัน
</p>

<p style="text-align: justify;">
  ๒. ตรวจสอบรายการบุคคลที่ย้ายเข้า - ย้ายออก ว่าได้ดำเนินการถูกต้องตามขั้นตอนแล้ว
</p>

<p style="text-align: justify;">
  ๓. ตรวจสอบรายการบุคคลที่ถึงแก่ความตาย ว่าได้นำออกจากระบบแล้ว
</p>

<p>&nbsp;</p>

<p style="text-align: justify;">
  ทั้งนี้ ให้ดำเนินการแล้วเสร็จภายในวันที่ ๓๑ สิงหาคม ๒๕๖๗ และให้รายงานผลการตรวจสอบ
  มายังกรมการปกครอง ภายในวันที่ ๑๕ กันยายน ๒๕๖๗
</p>

<p>&nbsp;</p>

<p style="text-align: right;">ขอแสดงความนับถือ</p>

<p>&nbsp;</p>
<p>&nbsp;</p>

<p style="text-align: right;">(นายประเสริฐ รักชาติ)</p>
<p style="text-align: right;">อธิบดีกรมการปกครอง</p>
`,
  },
}
