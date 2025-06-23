<template>
  <div class="station-list-root">
    <div class="search-bar">
      <el-input v-model="search.nameOrCode" placeholder="测站名称/编码" clearable style="width: 200px; margin-right: 8px;" />
      <el-select v-model="search.basin" placeholder="流域" clearable style="width: 150px; margin-right: 8px;">
        <el-option v-for="b in basinOptions" :key="b" :label="b" :value="b" />
      </el-select>
      <el-select v-model="search.system" placeholder="水系" clearable style="width: 150px; margin-right: 8px;">
        <el-option v-for="s in systemOptions" :key="s" :label="s" :value="s" />
      </el-select>
      <el-checkbox-group v-model="search.stationTypes" style="margin-right: 8px;">
        <el-checkbox label="is_hydrology_station">水文站</el-checkbox>
        <el-checkbox label="is_water_level_station">水位站</el-checkbox>
        <el-checkbox label="is_rainfall_station">雨量站</el-checkbox>
        <el-checkbox label="is_evaporation_station">蒸发站</el-checkbox>
        <el-checkbox label="is_water_quality_station">水质站</el-checkbox>
        <el-checkbox label="is_soil_moisture_station">墒情站</el-checkbox>
      </el-checkbox-group>
      <el-button @click="clearSearch" type="default">重置</el-button>
    </div>
    <StationTable 
      :stations="filteredStations" 
      :columns="columns" 
      @show-water-level-detail="showWaterLevelDetail"
      @show-hydrology-detail="showHydrologyDetail"
      @show-rainfall-detail="showRainfallDetail"
      @show-evaporation-detail="showEvaporationDetail"
      @show-water-quality-detail="showWaterQualityDetail"
      @show-soil-moisture-detail="showSoilMoistureDetail"
    />
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import StationTable from './StationTable.vue';
import { ElMessage } from 'element-plus';
import WaterLevelStationDetailDialog from './WaterLevelStationDetailDialog.vue';
import HydrologyStationDetailDialog from './HydrologyStationDetailDialog.vue';
import RainfallStationDetailDialog from './RainfallStationDetailDialog.vue';
import EvaporationStationDetailDialog from './EvaporationStationDetailDialog.vue';
import WaterQualityStationDetailDialog from './WaterQualityStationDetailDialog.vue';
import SoilMoistureStationDetailDialog from './SoilMoistureStationDetailDialog.vue';

const stations = ref([]);
const search = ref({ nameOrCode: '', basin: '', system: '', stationTypes: [] });
const basinOptions = ref([]);
const systemOptions = ref([]);

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

const columns = [
  { prop: 'basin_name', label: '流域名称', width: 120 },
  { prop: 'basin_code', label: '流域代码', width: 100 },
  { prop: 'river_system_name', label: '水系名称', width: 120 },
  { prop: 'river_system_code', label: '水系代码', width: 100 },
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

const fetchStations = async () => {
  try {
    const res = await fetch('/api/stations/all', { cache: 'no-store' });
    const data = await res.json();
    stations.value = data;
    basinOptions.value = [...new Set(data.map(s => s.basin_name).filter(Boolean))];
    systemOptions.value = [...new Set(data.map(s => s.river_system_name).filter(Boolean))];
  } catch (e) {
    ElMessage.error('获取测站数据失败');
  }
};

const clearSearch = () => {
  search.value = { nameOrCode: '', basin: '', system: '', stationTypes: [] };
};

const filteredStations = computed(() => {
  return stations.value.filter(s => {
    const matchNameOrCode = !search.value.nameOrCode ||
      (s.station_name && s.station_name.includes(search.value.nameOrCode)) ||
      (s.station_code && s.station_code.includes(search.value.nameOrCode));
    const matchBasin = !search.value.basin || s.basin_name === search.value.basin;
    const matchSystem = !search.value.system || s.river_system_name === search.value.system;
    const matchTypes = !search.value.stationTypes.length ||
      search.value.stationTypes.every(type => s[type]);
    return matchNameOrCode && matchBasin && matchSystem && matchTypes;
  });
});

onMounted(fetchStations);
</script>

<style scoped>
.table-card {
  border-radius: 8px;
  margin-bottom: 20px;
}
.card-header {
  font-size: 1.1rem;
  font-weight: 500;
}
.search-bar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
}
.station-list-root {
  margin: 0 40px;
}
</style> 