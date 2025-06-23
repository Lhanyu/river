<template>
  <el-card v-if="station">
    <template #header>
      <div class="card-header">
        <el-button type="text" @click="$router.back()">返回</el-button>
        <span style="font-size: 20px; margin-left: 16px;">水文站详情</span>
      </div>
    </template>
    <el-descriptions :title="station.station_name" :column="2" border>
      <el-descriptions-item label="测站编码">{{ station.station_code }}</el-descriptions-item>
      <el-descriptions-item label="流域">{{ station.basin_name }}</el-descriptions-item>
      <el-descriptions-item label="水系">{{ station.river_system_name }}</el-descriptions-item>
      <el-descriptions-item label="经度">{{ station.longitude }}</el-descriptions-item>
      <el-descriptions-item label="纬度">{{ station.latitude }}</el-descriptions-item>
      <el-descriptions-item label="水文站">{{ station.is_hydrology_station ? '是' : '否' }}</el-descriptions-item>
      <el-descriptions-item label="水位站">{{ station.is_water_level_station ? '是' : '否' }}</el-descriptions-item>
      <el-descriptions-item label="雨量站">{{ station.is_rainfall_station ? '是' : '否' }}</el-descriptions-item>
      <el-descriptions-item label="蒸发站">{{ station.is_evaporation_station ? '是' : '否' }}</el-descriptions-item>
      <el-descriptions-item label="水质站">{{ station.is_water_quality_station ? '是' : '否' }}</el-descriptions-item>
      <el-descriptions-item label="墒情站">{{ station.is_soil_moisture_station ? '是' : '否' }}</el-descriptions-item>
      <el-descriptions-item label="是否发生变更">{{ station.is_changed ? '是' : '否' }}</el-descriptions-item>
    </el-descriptions>
  </el-card>
  <div v-else class="empty-tip">未找到该测站</div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';

const route = useRoute();
const station = ref(null);

onMounted(async () => {
  try {
    const res = await fetch(`/api/stations/${route.params.id}`);
    if (!res.ok) throw new Error('not found');
    station.value = await res.json();
  } catch (e) {
    ElMessage.error('获取测站详情失败');
  }
});
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
}
.empty-tip {
  text-align: center;
  color: #888;
  padding: 32px 0;
}
</style> 