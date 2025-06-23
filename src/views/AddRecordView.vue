<template>
  <el-card class="add-record-card">
    <template #header>
      <div class="card-header">
        <span>添加记录</span>
      </div>
    </template>
    <div class="add-record-form">
      <div class="form-row">
        <span>当前用户：</span>
        <span style="font-weight:bold;">{{ username || '未登录' }}</span>
      </div>
      <div class="form-row">
        <span>测站类型：</span>
        <el-select v-model="selectedType" placeholder="请选择测站类型" style="width:200px">
          <el-option v-for="type in stationTypes" :key="type.type" :label="type.label" :value="type.type" />
        </el-select>
      </div>
      <div class="form-row">
        <el-button type="primary" :disabled="!selectedType" @click="openAddDialog">添加</el-button>
      </div>
    </div>
    <AddHydrologyStationDialog
      v-if="addDialogType === 'hydrology' && addDialogVisible"
      :visible="addDialogVisible"
      @update:visible="addDialogVisible = $event"
      @submit="handleAddHydrologyStation"
    />
    <AddWaterLevelStationDialog
      v-if="addDialogType === 'waterlevel' && addDialogVisible"
      :visible="addDialogVisible"
      @update:visible="addDialogVisible = $event"
      @submit="handleAddWaterLevelStation"
    />
  </el-card>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import WaterLevelStationDetailDialog from '../components/WaterLevelStationDetailDialog.vue';
import HydrologyStationDetailDialog from '../components/HydrologyStationDetailDialog.vue';
import RainfallStationDetailDialog from '../components/RainfallStationDetailDialog.vue';
import EvaporationStationDetailDialog from '../components/EvaporationStationDetailDialog.vue';
import WaterQualityStationDetailDialog from '../components/WaterQualityStationDetailDialog.vue';
import SoilMoistureStationDetailDialog from '../components/SoilMoistureStationDetailDialog.vue';
import AddHydrologyStationDialog from '../components/AddHydrologyStationDialog.vue';
import AddWaterLevelStationDialog from '../components/AddWaterLevelStationDialog.vue';

const username = ref('');
const stationTypes = ref([]);
const selectedType = ref('');
const addDialogVisible = ref(false);
const addDialogType = ref('');
const addFormData = ref({});

const typeToComponent = {
  is_hydrology_station: HydrologyStationDetailDialog,
  is_water_level_station: WaterLevelStationDetailDialog,
  is_rainfall_station: RainfallStationDetailDialog,
  is_evaporation_station: EvaporationStationDetailDialog,
  is_water_quality_station: WaterQualityStationDetailDialog,
  is_soil_moisture_station: SoilMoistureStationDetailDialog
};

onMounted(async () => {
  // 获取用户名
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      username.value = payload.username;
    }
  } catch {}
  // 获取测站类型
  try {
    const res = await fetch('/api/station-types');
    stationTypes.value = await res.json();
  } catch {
    ElMessage.error('获取测站类型失败');
  }
});

function openAddDialog() {
  if (selectedType.value === 'is_hydrology_station') {
    addDialogType.value = 'hydrology';
    addDialogVisible.value = true;
  } else if (selectedType.value === 'is_water_level_station') {
    addDialogType.value = 'waterlevel';
    addDialogVisible.value = true;
  } else {
    ElMessage.warning('目前仅支持添加水文站和水位站');
  }
}

async function handleAddHydrologyStation(data) {
  // 提交所有字段到 /api/hydrology_stations
  try {
    const res = await fetch('/api/hydrology_stations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || '添加失败');
    ElMessage.success('添加成功');
    addDialogVisible.value = false;
  } catch (e) {
    ElMessage.error(e.message);
  }
}

async function handleAddWaterLevelStation(data) {
  try {
    const res = await fetch('/api/water_level_stations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.message || '添加失败');
    ElMessage.success('添加成功');
    addDialogVisible.value = false;
  } catch (e) {
    ElMessage.error(e.message);
  }
}
</script>

<style scoped>
.add-record-card {
  margin: 0 40px;
  margin-top: 32px;
}
.card-header {
  font-size: 1.2rem;
  font-weight: 500;
}
.add-record-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px 0 16px 0;
  align-items: flex-start;
}
.form-row {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 16px;
}
</style> 