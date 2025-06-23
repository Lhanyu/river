<template>
  <div class="cascade-root">
    <el-card class="selection-card">
      <template #header>
        <div class="card-header">
          <span>选择流域以查看其水系</span>
        </div>
      </template>
      <el-select 
        v-model="selectedBasin" 
        placeholder="请选择流域"
        @change="onBasinChange"
        style="width: 100%;"
        size="large"
        filterable
      >
        <el-option
          v-for="basin in basins"
          :key="basin.basin_code"
          :label="`${basin.basin_name} (${basin.basin_code})`"
          :value="basin.basin_code"
        />
      </el-select>
    </el-card>

    <el-card class="table-card" v-if="riverSystems.length > 0">
      <template #header>
        <div class="card-header">
          <span>水系列表</span>
        </div>
      </template>
      <el-table :data="riverSystems" style="width: 100%" height="300px" stripe border @row-click="onSystemRowClick" highlight-current-row>
        <el-table-column prop="river_system_name" label="水系名称">
          <template #default="scope">
            {{ scope.row.river_system_name || '（无）' }}
          </template>
        </el-table-column>
        <el-table-column prop="river_system_code" label="水系代码" width="180"></el-table-column>
        <el-table-column prop="stations_count" label="测站数量" width="100"></el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button size="small" @click.stop="onSystemRowClick(scope.row)">查看测站</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <StationTable
      v-if="selectedSystem && (stations.length > 0 || stations.length === 0)"
      :stations="stations"
      :columns="columns"
      @show-water-level-detail="showWaterLevelDetail"
      @show-hydrology-detail="showHydrologyDetail"
      @show-rainfall-detail="showRainfallDetail"
      @show-evaporation-detail="showEvaporationDetail"
      @show-water-quality-detail="showWaterQualityDetail"
      @show-soil-moisture-detail="showSoilMoistureDetail"
    >
      <template #title>
        测站列表（{{ selectedSystem ? (selectedSystem.river_system_name || '无水系') : '' }}）
      </template>
    </StationTable>
    <WaterLevelStationDetailDialog
      v-if="waterLevelDialogVisible"
      :stationId="currentWaterLevelId"
      v-model:visible="waterLevelDialogVisible"
    />
    <HydrologyStationDetailDialog
      v-if="hydrologyDialogVisible"
      :stationId="currentHydrologyId"
      v-model:visible="hydrologyDialogVisible"
    />
    <RainfallStationDetailDialog
      v-if="rainfallDialogVisible"
      :stationId="currentRainfallId"
      v-model:visible="rainfallDialogVisible"
    />
    <EvaporationStationDetailDialog
      v-if="evaporationDialogVisible"
      :stationId="currentEvaporationId"
      v-model:visible="evaporationDialogVisible"
    />
    <WaterQualityStationDetailDialog
      v-if="waterQualityDialogVisible"
      :stationId="currentWaterQualityId"
      v-model:visible="waterQualityDialogVisible"
    />
    <SoilMoistureStationDetailDialog
      v-if="soilMoistureDialogVisible"
      :stationId="currentSoilMoistureId"
      v-model:visible="soilMoistureDialogVisible"
    />
    <el-card v-if="!selectedBasin || !selectedSystem" class="table-card" style="width: 100%">
      <template #header>
        <div class="card-header">
          <span>{{ emptyTitle || '请先选择流域和水系' }}</span>
        </div>
      </template>
      <div class="empty-tip">{{ emptyTitle || '请先选择流域和水系' }}</div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import axios from 'axios';
import { ElMessage } from 'element-plus';
import StationTable from './StationTable.vue';
import WaterLevelStationDetailDialog from './WaterLevelStationDetailDialog.vue';
import HydrologyStationDetailDialog from './HydrologyStationDetailDialog.vue';
import RainfallStationDetailDialog from './RainfallStationDetailDialog.vue';
import EvaporationStationDetailDialog from './EvaporationStationDetailDialog.vue';
import WaterQualityStationDetailDialog from './WaterQualityStationDetailDialog.vue';
import SoilMoistureStationDetailDialog from './SoilMoistureStationDetailDialog.vue';

const basins = ref([]);
const riverSystems = ref([]);
const selectedBasin = ref(null);
const stations = ref([]);
const selectedSystem = ref(null);

const props = defineProps({
  emptyTitle: {
    type: String,
    default: ''
  }
});

const columns = [
  { prop: 'station_name', label: '测站名称' },
  { prop: 'station_code', label: '测站编码', width: 120 },
  { prop: 'longitude', label: '经度', width: 120, slot: true },
  { prop: 'latitude', label: '纬度', width: 120, slot: true },
  { prop: 'is_hydrology_station', label: '水文站', width: 110, slot: true },
  { prop: 'is_water_level_station', label: '水位站', width: 110, slot: true },
  { prop: 'is_rainfall_station', label: '雨量站', width: 110, slot: true },
  { prop: 'is_evaporation_station', label: '蒸发站', width: 110, slot: true },
  { prop: 'is_water_quality_station', label: '水质站', width: 110, slot: true },
  { prop: 'is_soil_moisture_station', label: '墒情站', width: 110, slot: true },
];

const fetchBasins = async () => {
  try {
    const response = await axios.get('http://localhost:3001/api/basins');
    basins.value = response.data;
  } catch (error) {
    ElMessage.error('获取流域列表失败');
    console.error('获取流域列表失败:', error);
  }
};

const fetchRiverSystems = async (basinCode) => {
  try {
    const response = await axios.get(`http://localhost:3001/api/basins/${basinCode}/systems`);
    riverSystems.value = response.data;
  } catch (error) {
    ElMessage.error('获取水系列表失败');
    console.error('获取水系列表失败:', error);
  }
};

const fetchStations = async (systemCode) => {
  try {
    let url;
    if (!systemCode) {
      // 查询无水系的测站
      url = `http://localhost:3001/api/basins/${selectedBasin.value}/no-system/stations`;
    } else {
      url = `http://localhost:3001/api/systems/${systemCode}/stations`;
    }
    const response = await axios.get(url);
    stations.value = response.data;
  } catch (error) {
    ElMessage.error('获取测站列表失败');
    console.error('获取测站列表失败:', error);
  }
};

const onBasinChange = (basinCode) => {
  if (basinCode) {
    fetchRiverSystems(basinCode);
    selectedSystem.value = null;
    stations.value = [];
  } else {
    riverSystems.value = [];
    selectedSystem.value = null;
    stations.value = [];
  }
};

const onSystemRowClick = (row) => {
  selectedSystem.value = row;
  fetchStations(row.river_system_code);
};

// 弹窗相关
const waterLevelDialogVisible = ref(false);
const currentWaterLevelId = ref(null);
function showWaterLevelDetail(id) {
  currentWaterLevelId.value = id;
  waterLevelDialogVisible.value = true;
}
const hydrologyDialogVisible = ref(false);
const currentHydrologyId = ref(null);
function showHydrologyDetail(id) {
  currentHydrologyId.value = id;
  hydrologyDialogVisible.value = true;
}
const rainfallDialogVisible = ref(false);
const currentRainfallId = ref(null);
function showRainfallDetail(id) {
  currentRainfallId.value = id;
  rainfallDialogVisible.value = true;
}
const evaporationDialogVisible = ref(false);
const currentEvaporationId = ref(null);
function showEvaporationDetail(id) {
  currentEvaporationId.value = id;
  evaporationDialogVisible.value = true;
}
const waterQualityDialogVisible = ref(false);
const currentWaterQualityId = ref(null);
function showWaterQualityDetail(id) {
  currentWaterQualityId.value = id;
  waterQualityDialogVisible.value = true;
}
const soilMoistureDialogVisible = ref(false);
const currentSoilMoistureId = ref(null);
function showSoilMoistureDetail(id) {
  currentSoilMoistureId.value = id;
  soilMoistureDialogVisible.value = true;
}

onMounted(() => {
  fetchBasins();
});
</script>

<style scoped>
.selection-card, .table-card {
  border-radius: 8px;
  margin-bottom: 20px;
}
.card-header {
  font-size: 1.1rem;
  font-weight: 500;
}
.cascade-root {
  margin: 0 40px;
}
</style> 