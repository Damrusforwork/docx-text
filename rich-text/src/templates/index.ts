import blaze01 from '../assets/picture/blaze01.png?inline'

export interface Template {
  name: string
  description: string
  content: string
}

export const templates: Record<string, Template> = {
  internalMemo: {
    name: 'หนังสือภายใน (Internal Memorandum)',
    description: 'หนังสือติดต่อภายในองค์กร',
    content: `
<img src="${blaze01}" alt="ตราสัญลักษณ์" width="80" data-text-align="center">
<h1 style="text-align: center;">หนังสือภายใน</h1>
<h2 style="text-align: center;">Internal Memorandum</h2>

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

<p style="text-align: right;">ขอแสดงความนับถือ</p>

<p>&nbsp;</p>
<p>&nbsp;</p>
<p>&nbsp;</p>
<p style="text-align: right;">..............................</p>
<p style="text-align: right;">(นายสมชาย ใจดี)</p>
<p style="text-align: right;">ผู้อำนวยการกองนโยบายและแผน</p>
`,
  },

  officialLetter: {
    name: 'หนังสือประทับตรา (Official Sealed Letter)',
    description: 'หนังสือราชการภายนอกประทับตรา',
    content: `
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

  memoNote: {
    name: 'บันทึกข้อความ (Internal Note)',
    description: 'บันทึกข้อความภายในสำหรับสั่งการ/เสนอความเห็น',
    content: `
<h1 style="text-align: center;">บันทึกข้อความ</h1>

<p>&nbsp;</p>

<table>
  <tbody>
    <tr>
      <td style="width: 20%;"><strong>ส่วนราชการ</strong></td>
      <td>กองนิติการ</td>
      <td style="width: 20%;"><strong>ที่</strong></td>
      <td>นย 001/2567</td>
    </tr>
    <tr>
      <td><strong>วันที่</strong></td>
      <td>๑๓ กรกฎาคม ๒๕๖๗</td>
      <td><strong>โทรศัพท์</strong></td>
      <td>0-2XXX-XXXX</td>
    </tr>
  </tbody>
</table>

<p>&nbsp;</p>

<p><strong>เรื่อง</strong> ขอความเห็นเรื่องร่างระเบียบว่าด้วยการปฏิบัติงาน</p>
<p><strong>เสนอ</strong> ผู้อำนวยการกองนิติการ</p>
<p><strong>จาก</strong> กลุ่มวิชาการ</p>

<p>&nbsp;</p>

<p style="text-align: justify;">
  ๑. <strong>ความเป็นมา</strong>
</p>

<p style="text-align: justify; padding-left: 32px;">
  เนื่องจากปัจจุบันมีระเบียบว่าด้วยการปฏิบัติงานบางฉบับที่ยังไม่สอดคล้องกับสถานการณ์ปัจจุบัน
  จึงมีความจำเป็นต้องปรับปรุงระเบียบให้ทันสมัยและสอดรับกับพระราชบัญญัติที่ประกาศใช้ใหม่
</p>

<p>&nbsp;</p>

<p style="text-align: justify;">
  ๒. <strong>วัตถุประสงค์</strong>
</p>

<p style="text-align: justify; padding-left: 32px;">
  เพื่อปรับปรุงระเบียบว่าด้วยการปฏิบัติงานให้สอดคล้องกับพระราชบัญญัติการบริหารงานภาครัฐ
  แบบดิจิทัล พ.ศ. ๒๕๖๖ และพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. ๒๕๖๒
</p>

<p>&nbsp;</p>

<p style="text-align: justify;">
  ๓. <strong>แนวทางการแก้ไข</strong>
</p>

<p style="text-align: justify; padding-left: 32px;">
  ๓.๑ ปรับปรุงเนื้อหาให้สอดคล้องกับกฎหมายที่เกี่ยวข้อง<br />
  ๓.๒ เพิ่มเติมขั้นตอนการดำเนินงานแบบดิจิทัล<br />
  ๓.๓ กำหนดอำนาจหน้าที่ของเจ้าหน้าที่แต่ละระดับชัดเจน
</p>

<p>&nbsp;</p>

<p style="text-align: justify;">
  ๔. <strong>ข้อเสนอแนะ</strong>
</p>

<p style="text-align: justify; padding-left: 32px;">
  ขอให้ผู้อำนวยการกองนิติการพิจารณาให้ความเห็นชอบในหลักการ
  เพื่อดำเนินการจัดทำร่างระเบียบต่อไป
</p>

<p>&nbsp;</p>

<p style="text-align: right;">เคารพอย่างสูง</p>

<p>&nbsp;</p>
<p>&nbsp;</p>

<p style="text-align: right;">(นางสาวมาลี รักษ์ธรรม)</p>
<p style="text-align: right;">นักกฎหมายปฏิบัติการ</p>
`,
  },
}
