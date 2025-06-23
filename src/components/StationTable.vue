<template>
  <el-card class="table-card" style="width: 100%">
    <template #header>
      <div class="card-header">
        <slot name="title">测站列表</slot>
      </div>
    </template>
    <el-table :data="pagedStations" stripe border v-if="stations.length > 0" table-layout="fixed">
      <template v-for="col in columnsToShow" :key="col.prop">
        <el-table-column v-if="!col.slot" :prop="col.prop" :label="col.label" :width="col.width || 100" />
        <el-table-column v-else :prop="col.prop" :label="col.label" :width="col.width" align="center">
          <template #default="scope">
            <template v-if="col.prop === 'is_hydrology_station'">
              <el-tag v-if="scope.row.is_hydrology_station" type="success" class="detail-tag" @click.stop="$emit('show-hydrology-detail', scope.row.id)">查看详情</el-tag>
              <el-tag v-else type="info">否</el-tag>
            </template>
            <template v-else-if="col.prop === 'is_water_level_station'">
              <el-tag v-if="scope.row.is_water_level_station" type="success" class="detail-tag" @click.stop="$emit('show-water-level-detail', scope.row.id)">查看详情</el-tag>
              <el-tag v-else type="info">否</el-tag>
            </template>
            <template v-else-if="col.prop === 'is_rainfall_station'">
              <el-tag v-if="scope.row.is_rainfall_station" type="success" class="detail-tag" @click.stop="$emit('show-rainfall-detail', scope.row.id)">查看详情</el-tag>
              <el-tag v-else type="info">否</el-tag>
            </template>
            <template v-else-if="col.prop === 'is_evaporation_station'">
              <el-tag v-if="scope.row.is_evaporation_station" type="success" class="detail-tag" @click.stop="$emit('show-evaporation-detail', scope.row.id)">查看详情</el-tag>
              <el-tag v-else type="info">否</el-tag>
            </template>
            <template v-else-if="col.prop === 'is_water_quality_station'">
              <el-tag v-if="scope.row.is_water_quality_station" type="success" class="detail-tag" @click.stop="$emit('show-water-quality-detail', scope.row.id)">查看详情</el-tag>
              <el-tag v-else type="info">否</el-tag>
            </template>
            <template v-else-if="col.prop === 'is_soil_moisture_station'">
              <el-tag v-if="scope.row.is_soil_moisture_station" type="success" class="detail-tag" @click.stop="$emit('show-soil-moisture-detail', scope.row.id)">查看详情</el-tag>
              <el-tag v-else type="info">否</el-tag>
            </template>
            <template v-else-if="col.prop === 'longitude' || col.prop === 'latitude'">
              {{ typeof scope.row[col.prop] === 'number' ? scope.row[col.prop].toFixed(2) : scope.row[col.prop] }}
            </template>
            <template v-else>
              <el-tag v-if="scope.row[col.prop]">是</el-tag>
              <el-tag v-else type="info">否</el-tag>
            </template>
          </template>
        </el-table-column>
      </template>
    </el-table>
    <el-pagination
      v-if="stations.length > pageSize"
      style="margin: 16px 0; text-align: right;"
      background
      layout="prev, pager, next, jumper, ->, total"
      :total="stations.length"
      :page-size="pageSize"
      v-model:current-page="currentPage"
    />
    <div v-else class="empty-tip">暂无测站数据</div>
  </el-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
const props = defineProps({
  stations: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    default: undefined // undefined 时用默认列
  }
});

const pageSize = 20;
const currentPage = ref(1);
watch(() => props.stations, () => { currentPage.value = 1; });
const pagedStations = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return props.stations.slice(start, start + pageSize);
});

const router = useRouter();
const goDetail = (id) => {
  router.push(`/station/${id}`);
};

const defaultColumns = [
  { prop: 'basin_name', label: '流域名称', width: 120 },
  { prop: 'basin_code', label: '流域代码', width: 100 },
  { prop: 'river_system_name', label: '水系名称', width: 120 },
  { prop: 'river_system_code', label: '水系代码', width: 100 },
  { prop: 'station_name', label: '测站名称', width: 100 },
  { prop: 'station_code', label: '测站编码', width: 120 },
  { prop: 'longitude', label: '经度', width: 120 },
  { prop: 'latitude', label: '纬度', width: 120 },
  { prop: 'is_hydrology_station', label: '水文站', width: 150, slot: true },
  { prop: 'is_water_level_station', label: '水位站', width: 150, slot: true },
  { prop: 'is_rainfall_station', label: '雨量站', width: 150, slot: true },
  { prop: 'is_evaporation_station', label: '蒸发站', width: 150, slot: true },
  { prop: 'is_water_quality_station', label: '水质站', width: 150, slot: true },
  { prop: 'is_soil_moisture_station', label: '墒情站', width: 150, slot: true },
  { prop: 'is_changed', label: '是否发生变更', width: 100, slot: true }
];

const columnsToShow = computed(() => props.columns ?? defaultColumns);
</script>

<style scoped>
.table-card {
  margin-top: 24px;
  width: 100%;
}
.empty-tip {
  text-align: center;
  color: #888;
  padding: 32px 0;
}
.el-tag,
.detail-tag {
  font-size: 14px !important;
  line-height: 22px !important;
  padding: 0 10px !important;
  border-radius: 8px !important;
  box-sizing: border-box;
  min-width: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.detail-tag {
  cursor: pointer;
  user-select: none;
  margin-right: 0;
}
</style> 