<template>
  <el-dialog :model-value="visible" title="水位站详情" width="600px" @close="onClose" @update:model-value="onDialogUpdate">
    <el-descriptions v-if="detail" :title="detail.station_name" :column="2" border>
      <el-descriptions-item label="测站编码">{{ detail.station_code }}</el-descriptions-item>
      <el-descriptions-item label="流域">{{ detail.basin_name }}</el-descriptions-item>
      <el-descriptions-item label="水系">{{ detail.river_system_name }}</el-descriptions-item>
      <el-descriptions-item label="经度">{{ detail.longitude }}</el-descriptions-item>
      <el-descriptions-item label="纬度">{{ detail.latitude }}</el-descriptions-item>
      <el-descriptions-item label="站点类型" v-if="false">{{ detail.station_type }}</el-descriptions-item>
      <el-descriptions-item label="集水面积">{{ detail.catchment_area }}</el-descriptions-item>
      <el-descriptions-item label="设站年份">{{ detail.setup_year }}</el-descriptions-item>
      <el-descriptions-item label="设站月份">{{ detail.setup_month }}</el-descriptions-item>
      <el-descriptions-item label="河流">{{ detail.river_name }}</el-descriptions-item>
      <el-descriptions-item label="测站高程">{{ detail.elevation }}</el-descriptions-item>
      <el-descriptions-item label="基面名称">{{ detail.datum_name }}</el-descriptions-item>
      <el-descriptions-item label="基面修正值">{{ detail.datum_correction }}</el-descriptions-item>
      <el-descriptions-item label="建设单位">{{ detail.construction_unit }}</el-descriptions-item>
      <el-descriptions-item label="管理单位">{{ detail.management_unit }}</el-descriptions-item>
      <el-descriptions-item label="所属勘测队">{{ detail.survey_team }}</el-descriptions-item>
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
      const res = await fetch(`/api/water_level_stations/${id}`);
      detail.value = await res.json();
    } catch {
      ElMessage.error('获取水位站详情失败');
    }
  }
}, { immediate: true });
const onClose = () => emit('update:visible', false);
const onDialogUpdate = (val) => emit('update:visible', val);
</script> 