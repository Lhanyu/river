import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 数据库初始化
const dbPath = path.join(__dirname, 'river_data.db');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('旧数据库文件已删除。');
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('数据库连接错误:', err.message);
  } else {
    console.log('已连接到SQLite数据库。');
  }
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS systems (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    basin_name TEXT NOT NULL,
    basin_code TEXT NOT NULL,
    river_system_name TEXT,
    river_system_code TEXT UNIQUE
  )`);
  console.log('`systems` 表已创建或已存在。');

  db.run(`CREATE TABLE IF NOT EXISTS stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_name TEXT NOT NULL,
    station_code TEXT NOT NULL UNIQUE,
    system_id INTEGER,
    longitude REAL,
    latitude REAL,
    is_hydrology_station INTEGER DEFAULT 0,
    is_water_level_station INTEGER DEFAULT 0,
    is_rainfall_station INTEGER DEFAULT 0,
    is_evaporation_station INTEGER DEFAULT 0,
    is_water_quality_station INTEGER DEFAULT 0,
    is_soil_moisture_station INTEGER DEFAULT 0,
    has_changed INTEGER DEFAULT 0,
    FOREIGN KEY (system_id) REFERENCES systems(id)
  )`);
  console.log('`stations` 表已创建或已存在。');

  db.run(`CREATE TABLE IF NOT EXISTS hydrology_stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER UNIQUE,
    catchment_area REAL,
    setup_year INTEGER,
    setup_month INTEGER,
    province TEXT,
    city TEXT,
    county TEXT,
    town TEXT,
    village TEXT,
    river_name TEXT,
    construction_unit TEXT,
    management_unit TEXT,
    survey_team TEXT,
    elevation REAL,
    datum_name TEXT,
    datum_correction REAL,
    annual_runoff REAL,
    max_flow REAL,
    max_flow_time TEXT,
    min_flow REAL,
    min_flow_time TEXT,
    remark TEXT,
    FOREIGN KEY (station_id) REFERENCES stations(id)
  )`);
  console.log('`hydrology_stations` 表已创建或已存在。');

  db.run(`CREATE TABLE IF NOT EXISTS water_level_stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER UNIQUE,
    station_name TEXT,
    station_code TEXT,
    basin_name TEXT,
    river_system_name TEXT,
    river_name TEXT,
    catchment_area REAL,
    setup_year INTEGER,
    setup_month INTEGER,
    station_type TEXT,
    province TEXT,
    city TEXT,
    county TEXT,
    town TEXT,
    village TEXT,
    longitude REAL,
    latitude REAL,
    elevation REAL,
    datum_name TEXT,
    datum_correction REAL,
    construction_unit TEXT,
    management_unit TEXT,
    survey_team TEXT,
    is_boundary_section INTEGER,
    water_level_feature TEXT,
    observation_method TEXT,
    record_method TEXT,
    remark TEXT,
    FOREIGN KEY (station_id) REFERENCES stations(id)
  )`);
  console.log('`water_level_stations` 表已创建或已存在。');

  db.run(`CREATE TABLE IF NOT EXISTS rainfall_stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER UNIQUE,
    station_name TEXT,
    station_code TEXT,
    basin_name TEXT,
    longitude REAL,
    latitude REAL,
    management_unit TEXT,
    orifice_height REAL,
    avg_rainfall REAL,
    max_rainfall REAL,
    max_rainfall_year INTEGER,
    remark TEXT,
    FOREIGN KEY (station_id) REFERENCES stations(id)
  )`);
  console.log('`rainfall_stations` 表已创建或已存在。');

  db.run(`CREATE TABLE IF NOT EXISTS evaporation_stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER UNIQUE,
    station_name TEXT,
    station_code TEXT,
    basin_name TEXT,
    setup_year INTEGER,
    setup_month INTEGER,
    province TEXT,
    city TEXT,
    county TEXT,
    town TEXT,
    village TEXT,
    management_unit TEXT,
    longitude REAL,
    latitude REAL,
    avg_evaporation REAL,
    evaporator_type TEXT,
    remark TEXT,
    FOREIGN KEY (station_id) REFERENCES stations(id)
  )`);
  console.log('`evaporation_stations` 表已创建或已存在。');

  db.run(`CREATE TABLE IF NOT EXISTS water_quality_stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER UNIQUE,
    station_name TEXT,
    station_code TEXT,
    section_name TEXT,
    basin_name TEXT,
    river_system_name TEXT,
    river_name TEXT,
    setup_year INTEGER,
    setup_month INTEGER,
    func_area1 TEXT,
    func_area2 TEXT,
    province TEXT,
    city TEXT,
    county TEXT,
    town TEXT,
    village TEXT,
    longitude REAL,
    latitude REAL,
    management_unit TEXT,
    remark TEXT,
    FOREIGN KEY (station_id) REFERENCES stations(id)
  )`);
  console.log('`water_quality_stations` 表已创建或已存在。');

  db.run(`CREATE TABLE IF NOT EXISTS soil_moisture_stations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    station_id INTEGER UNIQUE,
    station_name TEXT,
    station_code TEXT,
    basin_name TEXT,
    setup_year INTEGER,
    setup_month INTEGER,
    province TEXT,
    city TEXT,
    county TEXT,
    town TEXT,
    village TEXT,
    management_unit TEXT,
    longitude REAL,
    latitude REAL,
    remark TEXT,
    FOREIGN KEY (station_id) REFERENCES stations(id)
  )`);
  console.log('`soil_moisture_stations` 表已创建或已存在。');

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
  console.log('`users` 表已创建或已存在。');
});

const getAsync = (sql, params) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row));
});
const runAsync = (sql, params) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) { err ? reject(err) : resolve(this); });
});

const JWT_SECRET = 'river_secret_key';

// 注册接口
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: '用户名和密码不能为空' });
  try {
    const hash = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, hash], function(err) {
      if (err) {
        console.error('注册失败:', err);
        return res.status(400).json({ message: '用户名已存在或数据库错误' });
      }
      res.json({ message: '注册成功' });
    });
  } catch (e) {
    console.error('注册异常:', e);
    res.status(500).json({ message: '服务器错误' });
  }
});

// 登录接口
app.post('/api/login', (req, res) => {
  const { username, password, remember } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err || !user) return res.status(400).json({ message: '用户名或密码错误' });
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ message: '用户名或密码错误' });
    const expiresIn = remember ? '7d' : '2h';
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn });
    res.json({ token, expiresIn });
  });
});

// JWT 校验中间件
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ message: '未登录' });
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ message: '登录已过期，请重新登录' });
  }
}

// 需要保护的接口示例
app.get('/api/protected', authMiddleware, (req, res) => {
  res.json({ message: '已登录', user: req.user });
});

async function importXlsData() {
  const filePath = path.join(__dirname, '../基础信息调查表10.20.xls');
  const sheetName = '附表 流域水系代码表';
  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
    console.log(`正在从 "${sheetName}" 导入数据...`);
    let currentBasinName = '';
    let currentBasinCode = '';
    // 1. 先插入所有唯一流域（无水系）
    const basinSet = new Set();
    for (let i = 2; i < jsonData.length; i++) {
      const row = jsonData[i];
      const basinName = row[0];
      const basinCode = row[1];
      if (basinName && basinCode && !basinSet.has(basinCode)) {
        await runAsync(
          'INSERT OR IGNORE INTO systems (basin_name, basin_code, river_system_name, river_system_code) VALUES (?, ?, NULL, NULL)',
          [basinName, basinCode]
        );
        basinSet.add(basinCode);
      }
    }
    // 2. 再插入流域+水系组合
    for (let i = 2; i < jsonData.length; i++) {
      const row = jsonData[i];
      const basinName = row[0];
      const basinCode = row[1];
      const riverSystemName = row[2];
      const riverSystemCode = row[3];
      if (basinName && basinCode) {
        currentBasinName = basinName;
        currentBasinCode = basinCode;
      }
      if (riverSystemName && riverSystemCode) {
        await runAsync(
          'INSERT OR IGNORE INTO systems (basin_name, basin_code, river_system_name, river_system_code) VALUES (?, ?, ?, ?)',
          [currentBasinName, currentBasinCode, riverSystemName, riverSystemCode]
        );
      }
    }
    console.log('XLS数据已成功导入数据库。');
  } catch (error) {
    console.error('从XLS导入数据时出错:', error);
  }
}

async function printHydrologySheetSample() {
  const filePath = path.join(__dirname, '../基础信息调查表10.20.xls');
  const sheetName = '表1 水文站 ';
  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      console.log('未找到水文站表格');
      return;
    }
    const jsonData = xlsx.utils.sheet_to_json(worksheet);
    console.log('水文站表格前10行:', JSON.stringify(jsonData.slice(0, 10), null, 2));
  } catch (e) {
    console.error('读取水文站表格出错:', e);
  }
}

async function importHydrologyStations() {
  const filePath = path.join(__dirname, '../基础信息调查表10.20.xls');
  const sheetName = '表1 水文站 ';
  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      console.log('未找到水文站表格');
      return;
    }
    // 读取前3行为表头
    const headerRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 0, blankrows: false });
    const header1 = headerRows[0];
    const header2 = headerRows[1];
    const header3 = headerRows[2];
    // 合并表头
    const mergedHeader = header1.map((h1, i) => {
      let h2 = header2[i] ? header2[i].toString().trim() : '';
      let h3 = header3[i] ? header3[i].toString().trim() : '';
      return [h1, h2, h3].filter(Boolean).join('-');
    });
    // 过滤空项后查找 key
    const filteredHeader = mergedHeader.filter(Boolean);
    const maxRainfallKey = filteredHeader.find(h => h.includes('实测年最大降雨量'));
    const maxRainfallYearKey = filteredHeader.find(h => h.includes('出现年份'));
    // 读取数据部分
    const dataRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 3, blankrows: false });
    const jsonData = dataRows.map(row => {
      const obj = {};
      mergedHeader.forEach((key, idx) => {
        obj[key] = row[idx];
      });
      return obj;
    });
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const name = row['测站名称-测站名称-测站名称']?.toString().trim();
      const code = row['测站编码-测站编码-测站编码']?.toString().trim();
      if (!name || !code) {
        console.log(`[水文站] 第${i+4}行缺少必须字段，已跳过：`, row);
        continue;
      }
      // 经纬度
      const lon = parseFloat(row['经度-经度-度'] || 0) + (parseFloat(row['经度-经度-分'] || 0)/60) + (parseFloat(row['经度-经度-秒'] || 0)/3600);
      const lat = parseFloat(row['纬度-纬度-度'] || 0) + (parseFloat(row['纬度-纬度-分'] || 0)/60) + (parseFloat(row['纬度-纬度-秒'] || 0)/3600);
      // system_id
      const systemCode = row['水系-水系-水系']?.toString().trim();
      let system = null;
      if (systemCode) {
        system = await getAsync('SELECT id FROM systems WHERE river_system_code = ?', [systemCode]);
      }
      // stations表插入或查找
      let station = await getAsync('SELECT id FROM stations WHERE station_code = ?', [code]);
      if (!station) {
        await runAsync(
          'INSERT INTO stations (station_name, station_code, system_id, longitude, latitude, is_hydrology_station) VALUES (?, ?, ?, ?, ?, 1)',
          [name, code, system?.id || null, lon || null, lat || null]
        );
        station = await getAsync('SELECT id FROM stations WHERE station_code = ?', [code]);
      }
      // hydrology_stations表插入
      await runAsync(
        `INSERT OR REPLACE INTO hydrology_stations (
          station_id, catchment_area, setup_year, setup_month, province, city, county, town, village, river_name, construction_unit, management_unit, survey_team, elevation, datum_name, datum_correction, annual_runoff, max_flow, max_flow_time, min_flow, min_flow_time, remark
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          station.id,
          row['集水面积-集水面积-集水面积'] || null,
          row['设站日期-年-年'] || null,
          row['设站日期-月-月'] || null,
          row['测站地址-测站地址-所在省、自治区、直辖市'] || null,
          row['所在市、区-所在市、区-所在市、区'] || null,
          row['所在县、市-所在县、市-所在县、市'] || null,
          row['所在乡、镇-所在乡、镇-所在乡、镇'] || null,
          row['所在村、街道-所在村、街道-所在村、街道'] || null,
          row['河流-河流-河流'] || null,
          row['建设单位-建设单位-建设单位'] || null,
          row['管理单位-水文部门-单位名称'] || null,
          row['所属勘测队-所属勘测队-所属勘测队'] || null,
          row['高程信息-高程信息-测站高程'] || null,
          row['高程信息-高程信息-基面名称'] || null,
          row['高程信息-高程信息-基面修正值'] || null,
          row['水文特征值-多年平均径流量(亿m3)-多年平均径流量(亿m3)'] || null,
          row['水文特征值-实测最大流量-流量'] || null,
          row['水文特征值-实测最大流量-时间'] || null,
          row['水文特征值-实测最小流量-流量'] || null,
          row['水文特征值-实测最小流量-时间'] || null,
          row['备注-备注-备注'] || null
        ]
      );
    }
    console.log('水文站数据已导入 hydrology_stations 表。');
  } catch (e) {
    console.error('导入水文站数据出错:', e);
  }
}

async function importWaterLevelStations() {
  const filePath = path.join(__dirname, '../基础信息调查表10.20.xls');
  const sheetName = '表2 水位站';
  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      console.log('未找到水位站表格');
      return;
    }
    // 读取前3行为表头
    const headerRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 0, blankrows: false });
    const header1 = headerRows[0];
    const header2 = headerRows[1];
    const header3 = headerRows[2];
    // 合并表头
    const mergedHeader = header1.map((h1, i) => {
      let h2 = header2[i] ? header2[i].toString().trim() : '';
      let h3 = header3[i] ? header3[i].toString().trim() : '';
      return [h1, h2, h3].filter(Boolean).join('-');
    });
    // 读取数据部分
    const dataRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 3, blankrows: false });
    const jsonData = dataRows.map(row => {
      const obj = {};
      mergedHeader.forEach((key, idx) => {
        obj[key] = row[idx];
      });
      return obj;
    });
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const name = row['测站名称-测站名称-测站名称']?.toString().trim();
      const code = row['测站编码-测站编码-测站编码']?.toString().trim();
      if (!name || !code) {
        console.log(`[水位站] 第${i+4}行缺少必须字段，已跳过：`, row);
        continue;
      }
      // 经纬度
      const lon = parseFloat(row['经度-经度-度'] || 0) + (parseFloat(row['经度-经度-分'] || 0)/60) + (parseFloat(row['经度-经度-秒'] || 0)/3600);
      const lat = parseFloat(row['纬度-纬度-度'] || 0) + (parseFloat(row['纬度-纬度-分'] || 0)/60) + (parseFloat(row['纬度-纬度-秒'] || 0)/3600);
      // system_id
      const systemCode = row['水系-水系-水系']?.toString().trim();
      let system = null;
      if (systemCode) {
        system = await getAsync('SELECT id FROM systems WHERE river_system_code = ?', [systemCode]);
      }
      // stations表插入或查找
      let station = await getAsync('SELECT id FROM stations WHERE station_code = ?', [code]);
      if (!station) {
        await runAsync(
          'INSERT INTO stations (station_name, station_code, system_id, longitude, latitude, is_water_level_station) VALUES (?, ?, ?, ?, ?, 1)',
          [name, code, system?.id || null, lon || null, lat || null]
        );
        station = await getAsync('SELECT id FROM stations WHERE station_code = ?', [code]);
      } else {
        await runAsync('UPDATE stations SET system_id=?, longitude=?, latitude=?, is_water_level_station=1 WHERE id=?', [system?.id || null, lon, lat, station.id]);
      }
      // water_level_stations表插入
      const insertValues = [
        station.id,
        name,
        code,
        row['流域/区域-流域/区域-流域/区域'] || null,
        row['水系-水系-水系'] || null,
        row['河流-河流-河流'] || null,
        row['集水面积-集水面积-集水面积'] || null,
        row['设站日期-年-年'] || null,
        row['设站日期-月-月'] || null,
        row['站点类型-站点类型-站点类型'] || null,
        row['测站地址-测站地址-所在省、自治区、直辖市'] || null,
        row['测站地址-测站地址-所在市、区'] || null,
        row['测站地址-测站地址-所在县、市'] || null,
        row['测站地址-测站地址-所在乡、镇'] || null,
        row['测站地址-测站地址-所在村、街道'] || null,
        lon || null,
        lat || null,
        row['高程信息-高程信息-测站高程'] || null,
        row['高程信息-高程信息-基面名称'] || null,
        row['高程信息-高程信息-基面修正值'] || null,
        row['建设单位-建设单位-建设单位'] || null,
        row['管理单位-水文部门-单位名称'] || null,
        row['所属勘测队-所属勘测队-所属勘测队'] || null,
        null,
        row['水位特征值-实测最高水位-水位'] || null,
        null,
        null,
        row['备注-备注-备注'] || null
      ];
      await runAsync(
        `INSERT OR REPLACE INTO water_level_stations (
          station_id, station_name, station_code, basin_name, river_system_name, river_name, catchment_area, setup_year, setup_month, station_type, province, city, county, town, village, longitude, latitude, elevation, datum_name, datum_correction, construction_unit, management_unit, survey_team, is_boundary_section, water_level_feature, observation_method, record_method, remark
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        insertValues
      );
    }
    console.log('水位站数据已导入 water_level_stations 表。');
  } catch (e) {
    console.error('导入水位站数据出错:', e);
  }
}

async function importRainfallStations() {
  const filePath = path.join(__dirname, '../基础信息调查表10.20.xls');
  const sheetName = '表3 雨量站';
  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      console.log('未找到雨量站表格');
      return;
    }
    // 读取前3行为多级表头
    const headerRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 0, blankrows: false });
    const header1 = headerRows[0];
    const header2 = headerRows[1];
    const header3 = headerRows[2];
    // 合并表头
    const mergedHeader = header1.map((h1, i) => {
      let h2 = header2[i] ? header2[i].toString().trim() : '';
      let h3 = header3[i] ? header3[i].toString().trim() : '';
      return [h1, h2, h3].filter(Boolean).join('-');
    });
    // 过滤空项后查找 key
    const filteredHeader = mergedHeader.filter(Boolean);
    const maxRainfallKey = filteredHeader.find(h => h.includes('实测年最大降雨量'));
    const maxRainfallYearKey = filteredHeader.find(h => h.includes('出现年份'));
    // 读取数据部分
    const dataRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 3, blankrows: false });
    const jsonData = dataRows.map(row => {
      const obj = {};
      mergedHeader.forEach((key, idx) => {
        obj[key] = row[idx];
      });
      return obj;
    });
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const name = row['测站名称-测站名称-测站名称']?.toString().trim();
      const code = row['测站编码-测站编码-测站编码']?.toString().trim();
      if (!name || !code) {
        console.log(`[雨量站] 第${i+4}行缺少必须字段，已跳过：`, row);
        continue;
      }
      // 经纬度
      let lon = parseFloat(row['经度-经度-度'] || 0) + (parseFloat(row['经度-经度-分'] || 0)/60) + (parseFloat(row['经度-经度-秒'] || 0)/3600);
      let lat = parseFloat(row['纬度-纬度-度'] || 0) + (parseFloat(row['纬度-纬度-分'] || 0)/60) + (parseFloat(row['纬度-纬度-秒'] || 0)/3600);
      if (!isFinite(lon) || lon === 0) lon = null;
      if (!isFinite(lat) || lat === 0) lat = null;
      // system_id 匹配
      let system = null;
      const basinCode = row['流域/区域-流域/区域-流域/区域']?.toString().trim();
      const riverSystemCode = row['水系-水系-水系']?.toString().trim();
      if (basinCode && riverSystemCode) {
        system = await getAsync('SELECT id FROM systems WHERE basin_code = ? AND river_system_code = ?', [basinCode, riverSystemCode]);
      }
      if (!system && basinCode) {
        // 若无水系，尝试用"无水系"记录
        system = await getAsync('SELECT id FROM systems WHERE basin_code = ? AND river_system_code IS NULL', [basinCode]);
      }
      // stations表插入或查找
      let station = await getAsync('SELECT id, system_id FROM stations WHERE station_code = ?', [code]);
      if (!station) {
        await runAsync(
          'INSERT INTO stations (station_name, station_code, system_id, longitude, latitude, is_rainfall_station) VALUES (?, ?, ?, ?, ?, 1)',
          [name, code, system ? system.id : null, lon, lat]
        );
        station = await getAsync('SELECT id, system_id FROM stations WHERE station_code = ?', [code]);
      } else {
        if (lon !== null && lat !== null) {
          await runAsync('UPDATE stations SET longitude=?, latitude=?, is_rainfall_station=1 WHERE id=?', [lon, lat, station.id]);
        } else {
          await runAsync('UPDATE stations SET is_rainfall_station=1 WHERE id=?', [station.id]);
        }
        // 若 system_id 为空且能匹配到，补充写入
        if (!station.system_id && system && system.id) {
          await runAsync('UPDATE stations SET system_id=? WHERE id=?', [system.id, station.id]);
        }
      }
      // rainfall_stations表插入
      await runAsync(
        `INSERT OR REPLACE INTO rainfall_stations (
          station_id, station_name, station_code, basin_name, longitude, latitude, management_unit, orifice_height, avg_rainfall, max_rainfall, max_rainfall_year, remark
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          station.id,
          name,
          code,
          row['流域/区域-流域/区域-流域/区域'] || null,
          lon,
          lat,
          row['管理单位-水文部门-单位名称'] || null,
          row['器口高度\n（m）-器口高度\n（m）-器口高度\n（m）'] || null,
          row['特征值-多年平均降雨量（mm）-多年平均降雨量（mm）'] || null,
          row[maxRainfallKey] || null,
          row[maxRainfallYearKey] || null,
          row['备注-备注-备注'] || null
        ]
      );
    }
    console.log('雨量站数据已导入 rainfall_stations 表。');
  } catch (e) {
    console.error('导入雨量站数据出错:', e);
  }
}

// 新增：导入蒸发站数据
async function importEvaporationStations() {
  const filePath = path.join(__dirname, '../基础信息调查表10.20.xls');
  const sheetName = '表4 蒸发站';
  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      console.log('未找到蒸发站表格');
      return;
    }
    // 读取前3行为多级表头
    const headerRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 0, blankrows: false });
    const header1 = headerRows[0];
    const header2 = headerRows[1];
    const header3 = headerRows[2];
    // 合并表头
    const mergedHeader = header1.map((h1, i) => {
      let h2 = header2[i] ? header2[i].toString().trim() : '';
      let h3 = header3[i] ? header3[i].toString().trim() : '';
      return [h1, h2, h3].filter(Boolean).join('-');
    });
    // 读取数据部分
    const dataRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 3, blankrows: false });
    const jsonData = dataRows.map(row => {
      const obj = {};
      mergedHeader.forEach((key, idx) => {
        obj[key] = row[idx];
      });
      return obj;
    });
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const name = row['测站名称-测站名称-测站名称']?.toString().trim();
      const code = row['测站编码-测站编码-测站编码']?.toString().trim();
      if (!name || !code) {
        console.log(`[蒸发站] 第${i+4}行缺少必须字段，已跳过：`, row);
        continue;
      }
      // 经纬度
      let lon = parseFloat(row['经度-度-度'] || 0) + (parseFloat(row['经度-分-分'] || 0)/60) + (parseFloat(row['经度-秒-秒'] || 0)/3600);
      let lat = parseFloat(row['纬度-度-度'] || 0) + (parseFloat(row['纬度-分-分'] || 0)/60) + (parseFloat(row['纬度-秒-秒'] || 0)/3600);
      if (!isFinite(lon) || lon === 0) lon = null;
      if (!isFinite(lat) || lat === 0) lat = null;
      // system_id 匹配
      let system = null;
      const basinCode = row['流域/区域-流域/区域-流域/区域']?.toString().trim();
      const riverSystemCode = null; // 蒸发站表无水系字段
      if (basinCode) {
        system = await getAsync('SELECT id FROM systems WHERE basin_code = ? AND river_system_code IS NULL', [basinCode]);
      }
      // stations表插入或查找
      let station = await getAsync('SELECT id, system_id FROM stations WHERE station_code = ?', [code]);
      if (!station) {
        await runAsync(
          'INSERT INTO stations (station_name, station_code, system_id, longitude, latitude, is_evaporation_station) VALUES (?, ?, ?, ?, ?, 1)',
          [name, code, system ? system.id : null, lon, lat]
        );
        station = await getAsync('SELECT id, system_id FROM stations WHERE station_code = ?', [code]);
      } else {
        if (lon !== null && lat !== null) {
          await runAsync('UPDATE stations SET longitude=?, latitude=?, is_evaporation_station=1 WHERE id=?', [lon, lat, station.id]);
        } else {
          await runAsync('UPDATE stations SET is_evaporation_station=1 WHERE id=?', [station.id]);
        }
        // 若 system_id 为空且能匹配到，补充写入
        if (!station.system_id && system && system.id) {
          await runAsync('UPDATE stations SET system_id=? WHERE id=?', [system.id, station.id]);
        }
      }
      // evaporation_stations表插入
      await runAsync(
        `INSERT OR REPLACE INTO evaporation_stations (
          station_id, station_name, station_code, basin_name, setup_year, setup_month, province, city, county, town, village, management_unit, longitude, latitude, avg_evaporation, evaporator_type, remark
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          station.id,
          name,
          code,
          row['流域/区域-流域/区域-流域/区域'] || null,
          row['设站日期-年-年'] || null,
          row['设站日期-月-月'] || null,
          row['测站地址-所在省、自治区、直辖市-所在省、自治区、直辖市'] || null,
          row['测站地址-所在市、区-所在市、区'] || null,
          row['测站地址-所在县、市-所在县、市'] || null,
          row['测站地址-所在乡、镇-所在乡、镇'] || null,
          row['测站地址-所在村、街道-所在村、街道'] || null,
          row['管理单位-单位名称-单位名称'] || null,
          lon,
          lat,
          row['多年平均蒸发量（mm）-多年平均蒸发量（mm）-多年平均蒸发量（mm）'] || null,
          row['蒸发器型号-蒸发器型号-蒸发器型号'] || null,
          row['备注-备注-备注'] || null
        ]
      );
    }
    console.log('蒸发站数据已导入 evaporation_stations 表。');
  } catch (e) {
    console.error('导入蒸发站数据出错:', e);
  }
}

// 导入水质站数据
async function importWaterQualityStations() {
  const filePath = path.join(__dirname, '../基础信息调查表10.20.xls');
  const sheetName = '表5 水质站';
  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      console.log('未找到水质站表格');
      return;
    }
    // 读取前3行为多级表头
    const headerRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 0, blankrows: false });
    const header1 = headerRows[0];
    const header2 = headerRows[1];
    const header3 = headerRows[2];
    // 合并表头
    const mergedHeader = header1.map((h1, i) => {
      let h2 = header2[i] ? header2[i].toString().trim() : '';
      let h3 = header3[i] ? header3[i].toString().trim() : '';
      return [h1, h2, h3].filter(Boolean).join('-');
    });
    // 读取数据部分
    const dataRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 3, blankrows: false });
    const jsonData = dataRows.map(row => {
      const obj = {};
      mergedHeader.forEach((key, idx) => {
        obj[key] = row[idx];
      });
      return obj;
    });
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const name = row['测站名称-测站名称-测站名称']?.toString().trim();
      const code = row['测站编码-测站编码-测站编码']?.toString().trim();
      if (!name || !code) {
        console.log(`[水质站] 第${i+4}行缺少必须字段，已跳过：`, row);
        continue;
      }
      // 经纬度
      let lon = parseFloat(row['经度-度-度'] || 0) + (parseFloat(row['经度-分-分'] || 0)/60) + (parseFloat(row['经度-秒-秒'] || 0)/3600);
      let lat = parseFloat(row['纬度-度-度'] || 0) + (parseFloat(row['纬度-分-分'] || 0)/60) + (parseFloat(row['纬度-秒-秒'] || 0)/3600);
      if (!isFinite(lon) || lon === 0) lon = null;
      if (!isFinite(lat) || lat === 0) lat = null;
      // system_id 匹配
      let system = null;
      const basinCode = row['流域/区域-流域/区域-流域/区域']?.toString().trim();
      const riverSystemCode = row['水系-水系-水系']?.toString().trim();
      if (basinCode && riverSystemCode) {
        system = await getAsync('SELECT id FROM systems WHERE basin_code = ? AND river_system_code = ?', [basinCode, riverSystemCode]);
      }
      if (!system && basinCode) {
        system = await getAsync('SELECT id FROM systems WHERE basin_code = ? AND river_system_code IS NULL', [basinCode]);
      }
      // stations表插入或查找
      let station = await getAsync('SELECT id, system_id FROM stations WHERE station_code = ?', [code]);
      if (!station) {
        await runAsync(
          'INSERT INTO stations (station_name, station_code, system_id, longitude, latitude, is_water_quality_station) VALUES (?, ?, ?, ?, ?, 1)',
          [name, code, system ? system.id : null, lon, lat]
        );
        station = await getAsync('SELECT id, system_id FROM stations WHERE station_code = ?', [code]);
      } else {
        if (lon !== null && lat !== null) {
          await runAsync('UPDATE stations SET longitude=?, latitude=?, is_water_quality_station=1 WHERE id=?', [lon, lat, station.id]);
        } else {
          await runAsync('UPDATE stations SET is_water_quality_station=1 WHERE id=?', [station.id]);
        }
        if (!station.system_id && system && system.id) {
          await runAsync('UPDATE stations SET system_id=? WHERE id=?', [system.id, station.id]);
        }
      }
      // water_quality_stations表插入
      await runAsync(
        `INSERT OR REPLACE INTO water_quality_stations (
          station_id, station_name, station_code, section_name, basin_name, river_system_name, river_name, setup_year, setup_month, func_area1, func_area2, province, city, county, town, village, longitude, latitude, management_unit, remark
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          station.id,
          name,
          code,
          row['断面名称-断面名称-断面名称'] || null,
          row['流域/区域-流域/区域-流域/区域'] || null,
          row['水系-水系-水系'] || null,
          row['河流-河流-河流'] || null,
          row['设站日期-年-年'] || null,
          row['设站日期-月-月'] || null,
          row['一级水功能区名称-一级水功能区名称-一级水功能区名称'] || null,
          row['二级水功能区名称-二级水功能区名称-二级水功能区名称'] || null,
          row['测站地址-所在省、自治区、直辖市-所在省、自治区、直辖市'] || null,
          row['测站地址-所在市、区-所在市、区'] || null,
          row['测站地址-所在县、市-所在县、市'] || null,
          row['测站地址-所在乡、镇-所在乡、镇'] || null,
          row['测站地址-所在村、街道-所在村、街道'] || null,
          lon,
          lat,
          row['管理单位-水文部门-单位名称'] || row['管理单位-单位名称-单位名称'] || null,
          row['备注-备注-备注'] || null
        ]
      );
    }
    console.log('水质站数据已导入 water_quality_stations 表。');
  } catch (e) {
    console.error('导入水质站数据出错:', e);
  }
}

// 导入墒情站数据
async function importSoilMoistureStations() {
  const filePath = path.join(__dirname, '../基础信息调查表10.20.xls');
  const sheetName = '表6 墒情站';
  try {
    const workbook = xlsx.readFile(filePath);
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      console.log('未找到墒情站表格');
      return;
    }
    // 读取前3行为多级表头
    const headerRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 0, blankrows: false });
    const header1 = headerRows[0];
    const header2 = headerRows[1];
    const header3 = headerRows[2];
    // 合并表头
    const mergedHeader = header1.map((h1, i) => {
      let h2 = header2[i] ? header2[i].toString().trim() : '';
      let h3 = header3[i] ? header3[i].toString().trim() : '';
      return [h1, h2, h3].filter(Boolean).join('-');
    });
    // 读取数据部分
    const dataRows = xlsx.utils.sheet_to_json(worksheet, { header: 1, range: 3, blankrows: false });
    const jsonData = dataRows.map(row => {
      const obj = {};
      mergedHeader.forEach((key, idx) => {
        obj[key] = row[idx];
      });
      return obj;
    });
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      const name = row['测站名称-测站名称-测站名称']?.toString().trim();
      const code = row['测站编码-测站编码-测站编码']?.toString().trim();
      if (!name || !code) {
        console.log(`[墒情站] 第${i+4}行缺少必须字段，已跳过：`, row);
        continue;
      }
      // 经纬度
      let lon = parseFloat(row['经度-度-度'] || 0) + (parseFloat(row['经度-分-分'] || 0)/60) + (parseFloat(row['经度-秒-秒'] || 0)/3600);
      let lat = parseFloat(row['纬度-度-度'] || 0) + (parseFloat(row['纬度-分-分'] || 0)/60) + (parseFloat(row['纬度-秒-秒'] || 0)/3600);
      if (!isFinite(lon) || lon === 0) lon = null;
      if (!isFinite(lat) || lat === 0) lat = null;
      // system_id 匹配
      let system = null;
      const basinCode = row['流域/区域-流域/区域-流域/区域']?.toString().trim();
      if (basinCode) {
        system = await getAsync('SELECT id FROM systems WHERE basin_code = ? AND river_system_code IS NULL', [basinCode]);
      }
      // stations表插入或查找
      let station = await getAsync('SELECT id, system_id FROM stations WHERE station_code = ?', [code]);
      if (!station) {
        await runAsync(
          'INSERT INTO stations (station_name, station_code, system_id, longitude, latitude, is_soil_moisture_station) VALUES (?, ?, ?, ?, ?, 1)',
          [name, code, system ? system.id : null, lon, lat]
        );
        station = await getAsync('SELECT id, system_id FROM stations WHERE station_code = ?', [code]);
      } else {
        if (lon !== null && lat !== null) {
          await runAsync('UPDATE stations SET longitude=?, latitude=?, is_soil_moisture_station=1 WHERE id=?', [lon, lat, station.id]);
        } else {
          await runAsync('UPDATE stations SET is_soil_moisture_station=1 WHERE id=?', [station.id]);
        }
        if (!station.system_id && system && system.id) {
          await runAsync('UPDATE stations SET system_id=? WHERE id=?', [system.id, station.id]);
        }
      }
      // soil_moisture_stations表插入
      await runAsync(
        `INSERT OR REPLACE INTO soil_moisture_stations (
          station_id, station_name, station_code, basin_name, setup_year, setup_month, province, city, county, town, village, management_unit, longitude, latitude, remark
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          station.id,
          name,
          code,
          row['流域/区域-流域/区域-流域/区域'] || null,
          row['设站日期-年-年'] || null,
          row['设站日期-月-月'] || null,
          row['测站地址-所在省、自治区、直辖市-所在省、自治区、直辖市'] || null,
          row['测站地址-所在市、区-所在市、区'] || null,
          row['测站地址-所在县、市-所在县、市'] || null,
          row['测站地址-所在乡、镇-所在乡、镇'] || null,
          row['测站地址-所在村、街道-所在村、街道'] || null,
          row['管理单位-管理单位-管理单位'] || null,
          lon,
          lat,
          row['备注-备注-备注'] || null
        ]
      );
    }
    console.log('墒情站数据已导入 soil_moisture_stations 表。');
  } catch (e) {
    console.error('导入墒情站数据出错:', e);
  }
}

// API路由: 获取所有唯一的流域
app.get('/api/basins', (req, res) => {
  db.all('SELECT DISTINCT basin_name, basin_code FROM systems ORDER BY basin_code', (err, rows) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json(rows);
  });
});

// API路由: 根据流域代码获取其下的所有水系（带测站数量）
app.get('/api/basins/:basinCode/systems', (req, res) => {
  const { basinCode } = req.params;
  db.all(`
    SELECT s.river_system_name, s.river_system_code, COUNT(st.id) as stations_count
    FROM systems s
    LEFT JOIN stations st ON st.system_id = s.id
    WHERE s.basin_code = ?
    GROUP BY s.id
    ORDER BY s.river_system_code
  `, [basinCode], (err, rows) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json(rows);
  });
});

// API路由: 根据水系代码获取其下所有测站基本信息
app.get('/api/systems/:systemCode/stations', (req, res) => {
  const { systemCode } = req.params;
  db.all(
    `SELECT s.* FROM stations s
     JOIN systems sys ON s.system_id = sys.id
     WHERE sys.river_system_code = ?
     ORDER BY s.station_code`,
    [systemCode],
    (err, rows) => {
      if (err) res.status(500).json({ error: err.message });
      else res.json(rows);
    }
  );
});

// API路由: 获取所有测站基本信息（带流域和水系信息）
app.get('/api/stations/all', (req, res) => {
  db.all(`
    SELECT s.*, sys.basin_name, sys.basin_code, sys.river_system_name, sys.river_system_code
    FROM stations s
    LEFT JOIN systems sys ON s.system_id = sys.id
    ORDER BY s.station_code
  `, (err, rows) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json(rows);
  });
});

// 获取单个测站详情（带流域/水系信息）
app.get('/api/stations/:id', (req, res) => {
  const id = req.params.id;
  db.get(`
    SELECT s.*, sys.basin_name, sys.basin_code, sys.river_system_name, sys.river_system_code
    FROM stations s
    LEFT JOIN systems sys ON s.system_id = sys.id
    WHERE s.id = ?
  `, [id], (err, row) => {
    if (err) res.status(500).json({ error: err.message });
    else if (!row) res.status(404).json({ error: 'Not found' });
    else res.json(row);
  });
});

// API路由: 获取水位站详情（含经纬度、流域、水系等信息）
app.get('/api/water_level_stations/:stationId', (req, res) => {
  const stationId = req.params.stationId;
  db.get(
    `SELECT wls.*, s.longitude, s.latitude, sys.basin_name, sys.river_system_name
     FROM water_level_stations wls
     LEFT JOIN stations s ON wls.station_id = s.id
     LEFT JOIN systems sys ON s.system_id = sys.id
     WHERE wls.station_id = ?`,
    [stationId],
    (err, row) => {
      if (err) res.status(500).json({ error: err.message });
      else if (!row) res.status(404).json({ error: 'Not found' });
      else res.json(row);
    }
  );
});

// API路由: 获取水文站详情（含经纬度、流域、水系等信息）
app.get('/api/hydrology_stations/:stationId', (req, res) => {
  const stationId = req.params.stationId;
  db.get(
    `SELECT hs.*, s.station_code, s.longitude, s.latitude, sys.basin_name, sys.river_system_name
     FROM hydrology_stations hs
     LEFT JOIN stations s ON hs.station_id = s.id
     LEFT JOIN systems sys ON s.system_id = sys.id
     WHERE hs.station_id = ?`,
    [stationId],
    (err, row) => {
      if (err) res.status(500).json({ error: err.message });
      else if (!row) res.status(404).json({ error: 'Not found' });
      else res.json(row);
    }
  );
});

// API路由: 获取雨量站详情（含主要字段）
app.get('/api/rainfall_stations/:stationId', (req, res) => {
  const stationId = req.params.stationId;
  db.get(
    `SELECT * FROM rainfall_stations WHERE station_id = ?`,
    [stationId],
    (err, row) => {
      if (err) res.status(500).json({ error: err.message });
      else if (!row) res.status(404).json({ error: 'Not found' });
      else res.json(row);
    }
  );
});

// 新增：获取无水系的测站
app.get('/api/basins/:basinCode/no-system/stations', (req, res) => {
  const { basinCode } = req.params;
  db.all(
    `SELECT s.* FROM stations s
     JOIN systems sys ON s.system_id = sys.id
     WHERE sys.basin_code = ? AND sys.river_system_code IS NULL
     ORDER BY s.station_code`,
    [basinCode],
    (err, rows) => {
      if (err) res.status(500).json({ error: err.message });
      else res.json(rows);
    }
  );
});

// API路由: 获取蒸发站详情（含经纬度、流域等信息）
app.get('/api/evaporation_stations/:stationId', (req, res) => {
  const stationId = req.params.stationId;
  db.get(
    `SELECT es.*, s.longitude, s.latitude, sys.basin_name
     FROM evaporation_stations es
     LEFT JOIN stations s ON es.station_id = s.id
     LEFT JOIN systems sys ON s.system_id = sys.id
     WHERE es.station_id = ?`,
    [stationId],
    (err, row) => {
      if (err) res.status(500).json({ error: err.message });
      else if (!row) res.status(404).json({ error: 'Not found' });
      else res.json(row);
    }
  );
});

// API路由: 获取水质站详情
app.get('/api/water_quality_stations/:stationId', (req, res) => {
  const stationId = req.params.stationId;
  db.get(
    `SELECT wqs.*, s.longitude, s.latitude, sys.basin_name, sys.river_system_name
     FROM water_quality_stations wqs
     LEFT JOIN stations s ON wqs.station_id = s.id
     LEFT JOIN systems sys ON s.system_id = sys.id
     WHERE wqs.station_id = ?`,
    [stationId],
    (err, row) => {
      if (err) res.status(500).json({ error: err.message });
      else if (!row) res.status(404).json({ error: 'Not found' });
      else res.json(row);
    }
  );
});

// API路由: 获取墒情站详情
app.get('/api/soil_moisture_stations/:stationId', (req, res) => {
  const stationId = req.params.stationId;
  db.get(
    `SELECT sms.*, s.longitude, s.latitude, sys.basin_name
     FROM soil_moisture_stations sms
     LEFT JOIN stations s ON sms.station_id = s.id
     LEFT JOIN systems sys ON s.system_id = sys.id
     WHERE sms.station_id = ?`,
    [stationId],
    (err, row) => {
      if (err) res.status(500).json({ error: err.message });
      else if (!row) res.status(404).json({ error: 'Not found' });
      else res.json(row);
    }
  );
});

// 获取所有测站类型
app.get('/api/station-types', (req, res) => {
  res.json([
    { type: 'is_hydrology_station', label: '水文站' },
    { type: 'is_water_level_station', label: '水位站' },
    { type: 'is_rainfall_station', label: '雨量站' },
    { type: 'is_evaporation_station', label: '蒸发站' },
    { type: 'is_water_quality_station', label: '水质站' },
    { type: 'is_soil_moisture_station', label: '墒情站' }
  ]);
});

// 添加水文站
app.post('/api/hydrology_stations', async (req, res) => {
  const {
    station_name, station_code, longitude, latitude,
    catchment_area, setup_year, setup_month, province, city, county, town, village,
    river_name, construction_unit, management_unit, survey_team, elevation, datum_name, datum_correction,
    annual_runoff, max_flow, max_flow_time, min_flow, min_flow_time, remark
  } = req.body;
  if (!station_name || !station_code) {
    return res.status(400).json({ message: '测站名称和编码为必填' });
  }
  try {
    // 1. 插入 stations
    await runAsync(
      'INSERT INTO stations (station_name, station_code, longitude, latitude, is_hydrology_station) VALUES (?, ?, ?, ?, 1)',
      [station_name, station_code, longitude || null, latitude || null]
    );
    const station = await getAsync('SELECT id FROM stations WHERE station_code = ?', [station_code]);
    // 2. 插入 hydrology_stations
    await runAsync(
      `INSERT INTO hydrology_stations (
        station_id, catchment_area, setup_year, setup_month, province, city, county, town, village, river_name, construction_unit, management_unit, survey_team, elevation, datum_name, datum_correction, annual_runoff, max_flow, max_flow_time, min_flow, min_flow_time, remark
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
      [
        station.id, catchment_area, setup_year, setup_month, province, city, county, town, village, river_name, construction_unit, management_unit, survey_team, elevation, datum_name, datum_correction, annual_runoff, max_flow, max_flow_time, min_flow, min_flow_time, remark
      ]
    );
    res.json({ message: '添加成功' });
  } catch (e) {
    console.error('添加水文站失败:', e);
    res.status(500).json({ message: '添加失败', error: e.message });
  }
});

// 添加水位站
app.post('/api/water_level_stations', async (req, res) => {
  const {
    station_name, station_code, basin_name, river_system_name, longitude, latitude, station_type, catchment_area, setup_year, setup_month, province, city, county, town, village, river_name, elevation, datum_name, datum_correction, construction_unit, management_unit, survey_team, remark, is_boundary_section, water_level_feature, observation_method, record_method
  } = req.body;
  if (!station_name || !station_code) {
    return res.status(400).json({ message: '测站名称和编码为必填' });
  }
  try {
    // 1. 插入 stations
    await runAsync(
      'INSERT INTO stations (station_name, station_code, longitude, latitude, is_water_level_station) VALUES (?, ?, ?, ?, 1)',
      [station_name, station_code, longitude || null, latitude || null]
    );
    const station = await getAsync('SELECT id FROM stations WHERE station_code = ?', [station_code]);
    // 2. 插入 water_level_stations
    await runAsync(
      `INSERT INTO water_level_stations (
        station_id, station_name, station_code, basin_name, river_system_name, river_name, catchment_area, setup_year, setup_month, station_type, province, city, county, town, village, longitude, latitude, elevation, datum_name, datum_correction, construction_unit, management_unit, survey_team, is_boundary_section, water_level_feature, observation_method, record_method, remark
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        station.id, station_name, station_code, basin_name, river_system_name, river_name, catchment_area, setup_year, setup_month, station_type, province, city, county, town, village, longitude, latitude, elevation, datum_name, datum_correction, construction_unit, management_unit, survey_team, is_boundary_section, water_level_feature, observation_method, record_method, remark
      ]
    );
    res.json({ message: '添加成功' });
  } catch (e) {
    console.error('添加水位站失败:', e);
    res.status(500).json({ message: '添加失败', error: e.message });
  }
});

// 启动服务器
app.listen(PORT, async () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  await importXlsData();
  await importHydrologyStations();
  await importWaterLevelStations();
  await importRainfallStations();
  await importEvaporationStations();
  await importWaterQualityStations();
  await importSoilMoistureStations();
});