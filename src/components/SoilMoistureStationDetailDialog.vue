<template>
  <el-dialog :model-value="visible" title="墒情站详情" width="600px" @close="onClose" @update:model-value="onDialogUpdate">
    <el-descriptions v-if="detail" :title="detail.station_name" :column="2" border>
      <el-descriptions-item label="测站编码">{{ detail.station_code }}</el-descriptions-item>
      <el-descriptions-item label="流域">{{ detail.basin_name }}</el-descriptions-item>
      <el-descriptions-item label="经度">{{ detail.longitude }}</el-descriptions-item>
      <el-descriptions-item label="纬度">{{ detail.latitude }}</el-descriptions-item>
      <el-descriptions-item label="管理单位">{{ detail.management_unit }}</el-descriptions-item>
      <el-descriptions-item label="设站年份">{{ detail.setup_year }}</el-descriptions-item>
      <el-descriptions-item label="设站月份">{{ detail.setup_month }}</el-descriptions-item>
      <el-descriptions-item label="省">{{ detail.province }}</el-descriptions-item>
      <el-descriptions-item label="市">{{ detail.city }}</el-descriptions-item>
      <el-descriptions-item label="县">{{ detail.county }}</el-descriptions-item>
      <el-descriptions-item label="乡镇">{{ detail.town }}</el-descriptions-item>
      <el-descriptions-item label="村街道">{{ detail.village }}</el-descriptions-item>
      <el-descriptions-item label="备注">{{ detail.remark }}</el-descriptions-item>
    </el-descriptions>
    <div v-else>加载中...</div>
  </el-dialog>
</template>
<script setup>
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
const props = defineProps({ stationId: Number, visible: Boolean });
const emit = defineEmits(['update:visible']);
const detail = ref(null);
watch(() => props.stationId, async (id) => {
  if (id) {
    try {
      const res = await fetch(`/api/soil_moisture_stations/${id}`);
      detail.value = await res.json();
    } catch {
      ElMessage.error('获取墒情站详情失败');
    }
  }
}, { immediate: true });
const onClose = () => emit('update:visible', false);
const onDialogUpdate = (val) => emit('update:visible', val);
</script> 