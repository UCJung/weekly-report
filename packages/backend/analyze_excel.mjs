import ExcelJS from 'exceljs';

async function analyzeExcel() {
  const filePath = '../../docs/선행연구개발팀_주간업무.xlsx';
  
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    console.log('\n========================================');
    console.log('엑셀 파일 분석: 선행연구개발팀_주간업무.xlsx');
    console.log('========================================\n');
    
    console.log(`총 시트 수: ${workbook.worksheets.length}\n`);
    
    // 각 시트 정보 출력
    workbook.worksheets.forEach((sheet, index) => {
      console.log(`\n--- Sheet ${index + 1}: "${sheet.name}" ---`);
      console.log(`행 수: ${sheet.rowCount}`);
      console.log(`열 수: ${sheet.columnCount}`);
      
      // 첫 번째 행(헤더) 출력
      console.log('\n헤더 행:');
      const headerRow = sheet.getRow(1);
      headerRow.eachCell((cell, colNum) => {
        process.stdout.write(`  [${colNum}] ${cell.value} | `);
      });
      console.log('\n');
      
      // 처음 5행의 데이터 샘플 출력
      console.log('데이터 샘플 (처음 5행):');
      for (let row = 2; row <= Math.min(6, sheet.rowCount); row++) {
        const sheetRow = sheet.getRow(row);
        process.stdout.write(`  Row ${row}: `);
        let cellCount = 0;
        sheetRow.eachCell((cell, colNum) => {
          if (cell.value) {
            cellCount++;
            const cellValue = typeof cell.value === 'string' 
              ? cell.value.substring(0, 30) 
              : String(cell.value).substring(0, 30);
            process.stdout.write(`[${colNum}]="${cellValue}" `);
          }
        });
        console.log(cellCount === 0 ? '(빈 행)' : '');
      }
      
      console.log('\n');
    });
    
  } catch (error) {
    console.error('오류:', error.message);
    process.exit(1);
  }
}

analyzeExcel();
