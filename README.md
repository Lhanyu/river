# river 测站信息管理系统

## 项目简介

本项目是一个基于 Vue3 + Element Plus + Express + SQLite3 的流域测站信息管理系统，支持多类型测站的录入、查询、地图分布展示和详细信息查看。适用于水利、环境等相关行业的数据管理和可视化需求。

---

## 主要功能

- **测站列表检索**：支持按名称/编码、流域、水系、测站类型（多选"与"关系）等多条件筛选。
- **测站类型支持**：水文站、水位站、雨量站、蒸发站、水质站、墒情站。
- **测站详情弹窗**：点击"查看详情"可弹窗展示各类型测站的详细信息。
- **地图分布**：基于 ECharts 展示测站地理分布热力图。
- **数据导入**：支持通过脚本导入 Excel（xls）数据。
- **后端 API**：基于 Express，数据存储采用 SQLite3，接口丰富。

---

## 目录结构

```
river/
├── src/                    # 前端源码
│   ├── assets/             # 静态资源
│   ├── components/         # 业务组件（测站表、详情弹窗等）
│   ├── views/              # 页面视图（列表、地图、详情等）
│   ├── router/             # 路由配置
│   └── main.js             # 入口文件
├── server/                 # 后端 Express 服务
│   ├── index.js            # 主服务端代码
│   └── river_data.db       # SQLite3 数据库
├── scripts/                # 辅助脚本
│   └── import_xls.js       # Excel 数据导入脚本
├── package.json            # 依赖与脚本
├── vite.config.js          # Vite 配置
└── README.md               # 项目说明
```

---

## 安装与运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动后端服务

```bash
npm run server
```

### 3. 启动前端开发环境

```bash
npm run dev
```

### 4. 构建生产环境

```bash
npm run build
```

### 5. 数据导入

将 Excel 数据（如 `基础信息调查表10.20.xls`）放在根目录，运行：

```bash
node scripts/import_xls.js
```

---

## 主要依赖

- [Vue 3](https://vuejs.org/)
- [Element Plus](https://element-plus.org/)
- [ECharts](https://echarts.apache.org/)
- [Express](https://expressjs.com/)
- [SQLite3](https://www.sqlite.org/index.html)
- [xlsx](https://github.com/SheetJS/sheetjs)

---

## 联系与贡献

如需反馈问题或贡献代码，请提交 Issue 或 Pull Request。

---

## 数据库定义

本项目使用 SQLite3 作为数据存储，主要表结构如下：

### 1. systems
- id: INTEGER, 主键，自增
- basin_name: TEXT, 流域名称
- basin_code: TEXT, 流域代码
- river_system_name: TEXT, 水系名称
- river_system_code: TEXT, 水系代码（唯一）

### 2. stations
- id: INTEGER, 主键，自增
- station_name: TEXT, 测站名称
- station_code: TEXT, 测站编码（唯一）
- system_id: INTEGER, 所属水系ID（外键）
- longitude: REAL, 经度
- latitude: REAL, 纬度
- is_hydrology_station: INTEGER, 是否水文站
- is_water_level_station: INTEGER, 是否水位站
- is_rainfall_station: INTEGER, 是否雨量站
- is_evaporation_station: INTEGER, 是否蒸发站
- is_water_quality_station: INTEGER, 是否水质站
- is_soil_moisture_station: INTEGER, 是否墒情站
- has_changed: INTEGER, 是否发生变更

### 3. hydrology_stations
- id: INTEGER, 主键，自增
- station_id: INTEGER, 测站ID（唯一，外键）
- catchment_area: REAL, 集水面积
- setup_year: INTEGER, 设站年份
- setup_month: INTEGER, 设站月份
- ...（省、市、县、乡镇、村、河流、单位、勘测队、高程、基面、流量、备注等）

### 4. water_level_stations
- id: INTEGER, 主键，自增
- station_id: INTEGER, 测站ID（唯一，外键）
- station_name, station_code, basin_name, river_system_name, river_name, ...
- catchment_area, setup_year, setup_month, station_type, ...
- longitude, latitude, elevation, datum_name, datum_correction, ...
- 其它水位站相关字段

### 5. rainfall_stations
- id: INTEGER, 主键，自增
- station_id: INTEGER, 测站ID（唯一，外键）
- station_name, station_code, basin_name, longitude, latitude, ...
- management_unit, orifice_height, avg_rainfall, max_rainfall, max_rainfall_year, remark

### 6. evaporation_stations
- id: INTEGER, 主键，自增
- station_id: INTEGER, 测站ID（唯一，外键）
- station_name, station_code, basin_name, setup_year, setup_month, ...
- province, city, county, town, village, management_unit, longitude, latitude, ...
- avg_evaporation, evaporator_type, remark

### 7. water_quality_stations
- id: INTEGER, 主键，自增
- station_id: INTEGER, 测站ID（唯一，外键）
- station_name, station_code, section_name, basin_name, river_system_name, river_name, ...
- setup_year, setup_month, func_area1, func_area2, ...
- longitude, latitude, management_unit, remark

### 8. soil_moisture_stations
- id: INTEGER, 主键，自增
- station_id: INTEGER, 测站ID（唯一，外键）
- station_name, station_code, basin_name, setup_year, setup_month, ...
- province, city, county, town, village, management_unit, longitude, latitude, remark

各测站类型表均通过 station_id 与 stations 主表关联，便于扩展和维护。

## 用户系统

- 支持用户注册与登录，密码加密存储（bcryptjs）。
- 登录后颁发 JWT，支持"记住我"自动延长有效期。
- 所有页面均有全局路由守卫，未登录自动跳转登录页，已登录用户无法访问登录页。
- 登录状态自动过期，需重新登录。

## 添加记录功能

- 顶栏有"添加记录"按钮，点击进入添加页面。
- 可选择测站类型（目前支持水文站和水位站），点击"添加"弹出美观的表单卡片。
- 表单字段与数据库结构完全一致，支持所有基础信息填写。
- 水文站表单备注项位于最后，水位站表单去除了"是否边界断面""水位特征""观测方法""记录方法"四项。
- 表单填写后直接写入数据库，添加成功有提示。
- 支持后续扩展更多测站类型。