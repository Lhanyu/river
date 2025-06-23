import xlsx from 'xlsx';
import path from 'path';

const __dirname = path.resolve();
const filePath = path.join(__dirname, '基础信息调查表10.20.xls');
const sheetName = '附表 流域水系代码表';

try {
  const workbook = xlsx.readFile(filePath);
  
  if (!workbook.SheetNames.includes(sheetName)) {
    throw new Error(`工作表 "${sheetName}" 不存在!`);
  }

  const worksheet = workbook.Sheets[sheetName];
  const jsonData = xlsx.utils.sheet_to_json(worksheet);

  console.log(`成功从 "${sheetName}" 读取数据。`);
  console.log('前5条记录:');
  console.log(jsonData.slice(0, 5));

} catch (error) {
  console.error('读取或解析XLS文件时出错:', error);
} 