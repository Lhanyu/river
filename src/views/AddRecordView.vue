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
    <HydrologyStationEditDialog
      v-if="addDialogType === 'hydrology' && addDialogVisible"
      :visible="addDialogVisible"
      :stationData="{}"
      v-model:visible="addDialogVisible"
      :isAdd="true"
      @saved="handleAddHydrologyStationSaved"
    />
    <WaterLevelStationEditDialog
      v-if="addDialogType === 'waterlevel' && addDialogVisible"
      :visible="addDialogVisible"
      :stationData="{}"
      v-model:visible="addDialogVisible"
      :isAdd="true"
      @saved="handleAddWaterLevelStationSaved"
    />
    <RainfallStationEditDialog
      v-if="addDialogType === 'rainfall' && addDialogVisible"
      :visible="addDialogVisible"
      :stationData="{}"
      v-model:visible="addDialogVisible"
      :isAdd="true"
      @saved="handleAddRainfallStationSaved"
    />
    <EvaporationStationEditDialog
      v-if="addDialogType === 'evaporation' && addDialogVisible"
      :visible="addDialogVisible"
      :stationData="{}"
      v-model:visible="addDialogVisible"
      :isAdd="true"
      @saved="handleAddEvaporationStationSaved"
    />
    <WaterQualityStationEditDialog
      v-if="addDialogType === 'waterquality' && addDialogVisible"
      :visible="addDialogVisible"
      :stationData="{}"
      v-model:visible="addDialogVisible"
      :isAdd="true"
      @saved="handleAddWaterQualityStationSaved"
    />
    <SoilMoistureStationEditDialog
      v-if="addDialogType === 'soilmoisture' && addDialogVisible"
      :visible="addDialogVisible"
      :stationData="{}"
      v-model:visible="addDialogVisible"
      :isAdd="true"
      @saved="handleAddSoilMoistureStationSaved"
    />
  </el-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import HydrologyStationEditDialog from '../components/hydrology/HydrologyStationEditDialog.vue';
import WaterLevelStationEditDialog from '../components/waterlevel/WaterLevelStationEditDialog.vue';
import RainfallStationEditDialog from '../components/rainfall/RainfallStationEditDialog.vue';
import EvaporationStationEditDialog from '../components/evaporation/EvaporationStationEditDialog.vue';
import WaterQualityStationEditDialog from '../components/waterquality/WaterQualityStationEditDialog.vue';
import SoilMoistureStationEditDialog from '../components/soilmoisture/SoilMoistureStationEditDialog.vue';

const username = ref('');
const stationTypes = ref([]);
const selectedType = ref('');
const addDialogVisible = ref(false);
const addDialogType = ref('');

onMounted(async () => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      username.value = payload.username;
    }
  } catch {}
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
  } else if (selectedType.value === 'is_rainfall_station') {
    addDialogType.value = 'rainfall';
    addDialogVisible.value = true;
  } else if (selectedType.value === 'is_evaporation_station') {
    addDialogType.value = 'evaporation';
    addDialogVisible.value = true;
  } else if (selectedType.value === 'is_water_quality_station') {
    addDialogType.value = 'waterquality';
    addDialogVisible.value = true;
  } else if (selectedType.value === 'is_soil_moisture_station') {
    addDialogType.value = 'soilmoisture';
    addDialogVisible.value = true;
  } else {
    ElMessage.warning('请选择有效的测站类型');
  }
}

async function handleAddHydrologyStationSaved() {
  addDialogVisible.value = false;
}

async function handleAddWaterLevelStationSaved() {
  addDialogVisible.value = false;
}

async function handleAddRainfallStationSaved() {
  addDialogVisible.value = false;
}

async function handleAddEvaporationStationSaved() {
  addDialogVisible.value = false;
}

async function handleAddWaterQualityStationSaved() {
  addDialogVisible.value = false;
}

async function handleAddSoilMoistureStationSaved() {
  addDialogVisible.value = false;
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