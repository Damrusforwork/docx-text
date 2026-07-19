const PNG_1X1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlJ8AAAAASUVORK5CYII='

export const GOLDEN_EXPORT_FIXTURES = [
  {
    id: 'thai-text',
    html: `
      <h1 style="text-align:center">เอกสารทดสอบภาษาไทย</h1>
      <p>บรรทัดแรกสำหรับตรวจลำดับข้อความ</p>
      <p>บรรทัดที่สองสำหรับตรวจระยะบรรทัด</p>
    `,
    expected: {
      pageCount: 1,
      textOrder: ['เอกสารทดสอบภาษาไทย', 'บรรทัดแรก', 'บรรทัดที่สอง'],
      baselinePt: 24,
    },
  },
  {
    id: 'table',
    html: `
      <p>ก่อนตาราง</p>
      <table><tbody>
        <tr><th>หัวข้อ</th><th>จำนวน</th></tr>
        <tr><td>รายการหนึ่ง</td><td>10</td></tr>
        <tr><td>รายการสอง</td><td>20</td></tr>
      </tbody></table>
      <p>หลังตาราง</p>
    `,
    expected: {
      pageCount: 1,
      textOrder: ['ก่อนตาราง', 'หัวข้อ', 'จำนวน', 'รายการหนึ่ง', '10', 'รายการสอง', '20', 'หลังตาราง'],
    },
  },
  {
    id: 'image-bounds',
    html: `
      <p>ก่อนรูป</p>
      <div class="image-export" style="text-align:center">
        <img src="data:image/png;base64,${PNG_1X1}" width="80" height="40" style="width:80px;height:40px">
      </div>
      <p>หลังรูป</p>
    `,
    expected: {
      pageCount: 1,
      textOrder: ['ก่อนรูป', 'หลังรูป'],
      imageBoundsPt: { width: 60, height: 30 },
    },
  },
  {
    id: 'page-break',
    html: `
      <p>ข้อความหน้าที่หนึ่ง</p>
      <p data-page-break-before="true">ข้อความหน้าที่สอง</p>
    `,
    expected: {
      pageCount: 2,
      textOrder: ['ข้อความหน้าที่หนึ่ง', 'ข้อความหน้าที่สอง'],
      marker: { text: 'ข้อความหน้าที่สอง', page: 2 },
    },
  },
  {
    id: 'tracked-change-markers',
    html: `
      <p>ผลการตรวจ <del data-change-id="change-1">ข้อความเดิม</del>
      <ins data-change-id="change-1">ข้อความใหม่</ins></p>
    `,
    expected: {
      pageCount: 1,
      textOrder: ['ผลการตรวจ', 'ข้อความเดิม', 'ข้อความใหม่'],
    },
  },
]
