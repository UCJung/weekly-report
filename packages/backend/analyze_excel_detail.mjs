import ExcelJS from 'exceljs';

function getCellValue(cell) {
  if (!cell || !cell.value) return '';
  
  if (typeof cell.value === 'string') return cell.value;
  if (typeof cell.value === 'number') return cell.value.toString();
  if (typeof cell.value === 'object' && cell.value.richText) {
    return cell.value.richText.map(rt => rt.text).join('');
  }
  if (typeof cell.value === 'object' && cell.value.formula) {
    return `[Formula: ${cell.value.formula}]`;
  }
  return cell.value.toString ? cell.value.toString() : '';
}

async function analyzeExcel() {
  const filePath = '../../docs/선행연구개발팀_주간업무.xlsx';
  
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    console.log('\n========================================');
    console.log('엑셀 파일 상세 분석: 선행연구개발팀_주간업무.xlsx');
    console.log('========================================\n');
    
    console.log(`총 시트 수: ${workbook.worksheets.length}\n`);
    
    workbook.worksheets.forEach((sheet, sheetIndex) => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Sheet ${sheetIndex + 1}: "${sheet.name}"`);
      console.log(`${'='.repeat(60)}`);
      console.log(`행 수: ${sheet.rowCount}, 열 수: ${sheet.columnCount}\n`);
      
      // 헤더 행
      console.log('【헤더 행】');
      const headerRow = sheet.getRow(1);
      const headers = [];
      headerRow.eachCell((cell, colNum) => {
        const value = getCellValue(cell);
        headers.push(value);
        console.log(`  Col ${colNum}: "${value}"`);
      });
      console.log('');
      
      // 처음 10행의 데이터
      console.log('【데이터 샘플 (처음 10행)】');
      for (let row = 2; row <= Math.min(11, sheet.rowCount); row++) {
        const sheetRow = sheet.getRow(row);
        console.log(`\n  Row ${row}:`);
        let hasData = false;
        sheetRow.eachCell((cell, colNum) => {
          const value = getCellValue(cell);
          if (value) {
            hasData = true;
            const displayValue = value.length > 60 
              ? value.substring(0, 57) + '...' 
              : value;
            console.log(`    [${colNum}] ${headers[colNum - 1]}: "${displayValue}"`);
          }
        });
        if (!hasData) {
          console.log('    (빈 행)');
        }
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('분석 완료');
    console.log('='.repeat(60) + '\n');
    
  } catch (error) {
    console.error('오류:', error.message);
    process.exit(1);
  }
}

analyzeExcel();
